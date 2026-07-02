-- ============================================================
-- Schema completo: LicitacionesPerú — GovTech Platform
-- ============================================================

-- 1. Tipos ENUM
CREATE TYPE tender_status AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');
CREATE TYPE proposal_status AS ENUM ('BORRADOR', 'ENVIADO', 'VALIDADO_CON_ALERTAS', 'VALIDADO_COMPLETO', 'DESCALIFICADA', 'ADJUDICADA');
CREATE TYPE user_role AS ENUM ('ENTE_PUBLICO', 'PROVEEDOR', 'ADMIN');
CREATE TYPE provider_status AS ENUM ('REGISTRADO', 'EN_VERIFICACION', 'VALIDADO', 'RECHAZADO', 'SUSPENDIDO');
CREATE TYPE tender_stage_type AS ENUM ('CONVOCATORIA', 'CONSULTAS', 'POSTULACION', 'EVALUACION', 'RESULTADOS');
CREATE TYPE document_type AS ENUM ('BASE', 'TDR', 'ADICIONAL');

-- 2. Tabla Principal (Usuarios)
CREATE TABLE users(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    ruc TEXT NOT NULL,
    dni TEXT,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'PROVEEDOR',
    provider_status provider_status DEFAULT 'REGISTRADO',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id)
);

-- 3. Tablas de Herencia (Roles)
CREATE TABLE state_entities(
    id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE providers(
    id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Licitaciones (Tenders)
CREATE TABLE tenders(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    nomenclatura TEXT,
    description TEXT,
    state tender_status NOT NULL DEFAULT 'BORRADOR',
    rules JSONB NOT NULL DEFAULT '{}',
    state_entity_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(state_entity_id) REFERENCES state_entities(id)
);

-- 5. Cronograma de Licitación (Tender Stages)
CREATE TABLE tender_stages(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL,
    stage_type tender_stage_type NOT NULL,
    name TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- 6. Requisitos de Licitación (Tender Requirements)
CREATE TABLE tender_requirements(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- 7. Documentos de Licitación (Tender Documents)
CREATE TABLE tender_documents(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    document_type document_type NOT NULL DEFAULT 'ADICIONAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- 8. Propuestas (Proposals)
CREATE TABLE proposals(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    state proposal_status NOT NULL DEFAULT 'BORRADOR',
    answer_file JSONB NOT NULL DEFAULT '{}',
    tender_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    score NUMERIC(5,2),
    score_experience NUMERIC(5,2),
    score_price NUMERIC(5,2),
    years_experience NUMERIC(5,1) DEFAULT 0,
    submitted_at TIMESTAMP,
    award_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id),
    FOREIGN KEY(provider_id) REFERENCES providers(id)
);

-- 9. Documentos de Propuesta (Proposal Documents)
CREATE TABLE proposal_documents(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL,
    requirement_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY(requirement_id) REFERENCES tender_requirements(id) ON DELETE CASCADE
);

-- 10. Auditorías (Reports)
CREATE TABLE audits(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_valid BOOLEAN NOT NULL,
    report_file JSONB NOT NULL DEFAULT '{}',
    proposal_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_tenders_state ON tenders(state);
CREATE INDEX idx_tenders_state_entity ON tenders(state_entity_id);
CREATE INDEX idx_tenders_created_at ON tenders(created_at DESC);
CREATE INDEX idx_proposals_tender ON proposals(tender_id);
CREATE INDEX idx_proposals_provider ON proposals(provider_id);
CREATE INDEX idx_proposals_state ON proposals(state);
CREATE INDEX idx_tender_stages_tender ON tender_stages(tender_id);
CREATE INDEX idx_tender_requirements_tender ON tender_requirements(tender_id);
CREATE INDEX idx_tender_documents_tender ON tender_documents(tender_id);
CREATE INDEX idx_proposal_documents_proposal ON proposal_documents(proposal_id);
CREATE INDEX idx_audits_proposal ON audits(proposal_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
