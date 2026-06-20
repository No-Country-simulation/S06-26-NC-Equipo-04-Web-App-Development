-- Schema completo S26-06 GovTech API
-- Incluye schema base + migración 001 (todo en uno para fresh start)

-- 1. ENUMs
CREATE TYPE tender_status AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');
CREATE TYPE proposal_status AS ENUM ('BORRADOR', 'VALIDADO_CON_ALERTAS', 'VALIDADO_COMPLETO', 'ENVIADO', 'DESCALIFICADA');
CREATE TYPE provider_status AS ENUM ('REGISTRADO', 'EN_VERIFICACION', 'VALIDADO', 'RECHAZADO', 'SUSPENDIDO');
CREATE TYPE tender_stage_type AS ENUM ('CONVOCATORIA', 'CONSULTAS', 'POSTULACION', 'EVALUACION', 'RESULTADOS');
CREATE TYPE contract_status AS ENUM ('BORRADOR', 'ACTIVO', 'FINALIZADO', 'RESUELTO');

-- 2. Tabla users (con dni, role y provider_status incluidos)
CREATE TABLE IF NOT EXISTS users(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    ruc TEXT NOT NULL,
    dni TEXT,
    role TEXT NOT NULL DEFAULT 'PROVEEDOR' CHECK (role IN ('ENTE_PUBLICO', 'PROVEEDOR', 'ADMIN')),
    provider_status provider_status,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id)
);

-- 3. Tablas de Herencia (Roles)
CREATE TABLE IF NOT EXISTS state_entities(
    id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS providers(
    id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tabla de Licitaciones
CREATE TABLE IF NOT EXISTS tenders(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    state tender_status NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    state_entity_id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(state_entity_id) REFERENCES state_entities(id)
);

-- 5. Tabla de Propuestas (con columnas extendidas)
CREATE TABLE IF NOT EXISTS proposals(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    state proposal_status NOT NULL,
    answer_file JSONB NOT NULL,
    tender_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    score DECIMAL(5,2),
    score_experience DECIMAL(5,2),
    score_price DECIMAL(5,2),
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    years_experience DECIMAL(5,2) DEFAULT 0,
    submitted_at TIMESTAMP,
    award_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id),
    FOREIGN KEY(provider_id) REFERENCES providers(id)
);

-- 6. Tabla de Auditorías
CREATE TABLE IF NOT EXISTS audits(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_valid BOOLEAN NOT NULL,
    report_file JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    proposal_id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- 7. Tender Stages (cronograma)
CREATE TABLE IF NOT EXISTS tender_stages(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL,
    stage_type tender_stage_type NOT NULL,
    name TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- 8. Tender Requirements (requisitos)
CREATE TABLE IF NOT EXISTS tender_requirements(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- 9. Tender Documents (documentos de la licitación)
CREATE TABLE IF NOT EXISTS tender_documents(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_size INT NOT NULL DEFAULT 0,
    document_type TEXT NOT NULL DEFAULT 'ADICIONAL' CHECK (document_type IN ('BASE', 'TDR', 'ADICIONAL')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- 10. Proposal Documents (documentos de la propuesta)
CREATE TABLE IF NOT EXISTS proposal_documents(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL,
    requirement_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY(requirement_id) REFERENCES tender_requirements(id)
);
