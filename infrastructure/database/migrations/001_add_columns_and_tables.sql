-- Migration 001: Add missing columns and tables for MVP
-- Based on plan-implementacion.md

-- 1. New ENUMs
CREATE TYPE provider_status AS ENUM ('REGISTRADO', 'EN_VERIFICACION', 'VALIDADO', 'RECHAZADO', 'SUSPENDIDO');
CREATE TYPE tender_stage_type AS ENUM ('CONVOCATORIA', 'CONSULTAS', 'POSTULACION', 'EVALUACION', 'RESULTADOS');
CREATE TYPE contract_status AS ENUM ('BORRADOR', 'ACTIVO', 'FINALIZADO', 'RESUELTO');

-- 2. Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'PROVEEDOR' CHECK (role IN ('ENTE_PUBLICO', 'PROVEEDOR', 'ADMIN'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_status provider_status;

-- 3. Add description to tenders
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Create tender_stages
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

-- 5. Create tender_requirements
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

-- 6. Create tender_documents
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

-- 7. Add columns to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS score DECIMAL(5,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS score_experience DECIMAL(5,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS score_price DECIMAL(5,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS award_reason TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS years_experience DECIMAL(5,2) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- 8. Create proposal_documents
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

-- 9. Create contracts (prepared for post-MVP)
CREATE TABLE IF NOT EXISTS contracts(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL,
    state contract_status NOT NULL DEFAULT 'BORRADOR',
    contract_number TEXT,
    signed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(id),
    FOREIGN KEY(proposal_id) REFERENCES proposals(id)
);
