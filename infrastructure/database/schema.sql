-- 1. Creación de tipos ENUM
CREATE TYPE tender_status AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');
CREATE TYPE proposal_status AS ENUM ('BORRADOR', 'VALIDADO_CON_ALERTAS', 'VALIDADO_COMPLETO', 'ENVIADO', 'DESCALIFICADA');

-- 2. Creación de Tabla Principal (Usuarios)
CREATE TABLE users(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    ruc TEXT NOT NULL,
    password_hash TEXT NOT NULL,
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

-- 4. Tabla de Licitaciones (Debe ir antes que Proposals)
CREATE TABLE tenders(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    state tender_status NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    state_entity_id UUID NOT NULL, -- Corregido: de TEXT a UUID
    PRIMARY KEY(id),
    FOREIGN KEY(state_entity_id) REFERENCES state_entities(id)
);

-- 5. Tabla de Propuestas
CREATE TABLE proposals(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    state proposal_status NOT NULL,
    answer_file JSONB NOT NULL,
    tender_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(tender_id) REFERENCES tenders(id),
    FOREIGN KEY(provider_id) REFERENCES providers(id)
);

-- 6. Tabla de Auditorías (Reportes)
CREATE TABLE audits(
    id UUID NOT NULL DEFAULT gen_random_uuid(), -- Corregido: coma faltante
    is_valid BOOLEAN NOT NULL,
    report_file JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    proposal_id UUID NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);