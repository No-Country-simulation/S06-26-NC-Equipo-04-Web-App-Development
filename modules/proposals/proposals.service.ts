import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { Proposal, PaginatedResponse } from '../../shared/interfaces/index';
import path from 'path';
import fs from 'fs/promises';

const PROPOSAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'proposals');

async function ensureDir() {
  await fs.mkdir(PROPOSAL_UPLOADS_DIR, { recursive: true });
}

async function verifyPostulationStage(tenderId: string): Promise<void> {
  const stagesResult = await pool.query(
    `SELECT start_date, end_date FROM tender_stages 
     WHERE tender_id = $1 AND stage_type = 'POSTULACION'`,
    [tenderId]
  );
  if (stagesResult.rows.length > 0) {
    const now = new Date();
    const startDate = new Date(stagesResult.rows[0].start_date);
    const endDate = new Date(stagesResult.rows[0].end_date);
    if (now < startDate || now > endDate) {
      throw new AppError('El plazo de postulación para esta licitación no está activo o ha vencido', 400);
    }
  }
}

function mapProposal(row: any): Proposal {
  return {
    id: row.id,
    state: row.state,
    answerFile: row.answer_file,
    tenderId: row.tender_id,
    providerId: row.provider_id,
    providerName: row.provider_name,
    score: row.score ? parseFloat(row.score) : undefined,
    scoreExperience: row.score_experience ? parseFloat(row.score_experience) : undefined,
    scorePrice: row.score_price ? parseFloat(row.score_price) : undefined,
    price: parseFloat(row.price) || 0,
    submittedAt: row.submitted_at,
    awardReason: row.award_reason,
  };
}

export async function createProposal(tenderId: string, userId: string): Promise<Proposal> {
  const tenderCheck = await pool.query(
    'SELECT state FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) {
    throw new AppError('Licitación no encontrada', 404);
  }
  if (tenderCheck.rows[0].state !== 'PUBLICADA') {
    throw new AppError('La licitación no está abierta para postulaciones', 400);
  }

  await verifyPostulationStage(tenderId);

  // Check for existing proposal
  const existing = await pool.query(
    'SELECT id FROM proposals WHERE tender_id = $1 AND provider_id = $2',
    [tenderId, userId]
  );
  if (existing.rows.length > 0) {
    throw new AppError('Ya existe una propuesta para esta licitación', 409);
  }

  const result = await pool.query(
    `INSERT INTO proposals (state, answer_file, tender_id, provider_id, price)
     VALUES ('BORRADOR', '{}', $1, $2, 0)
     RETURNING *`,
    [tenderId, userId]
  );

  return mapProposal(result.rows[0]);
}

export async function getProposalById(proposalId: string, userId?: string): Promise<Proposal> {
  const result = await pool.query(
    `SELECT p.*, u.name as provider_name
     FROM proposals p
     JOIN users u ON u.id = p.provider_id
     WHERE p.id = $1`,
    [proposalId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Propuesta no encontrada', 404);
  }

  return mapProposal(result.rows[0]);
}

export async function getTenderProposals(tenderId: string, userId: string): Promise<Proposal[]> {
  // Verify user owns the tender
  const tenderCheck = await pool.query(
    'SELECT state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  const result = await pool.query(
    `SELECT p.*, u.name as provider_name
     FROM proposals p
     JOIN users u ON u.id = p.provider_id
     WHERE p.tender_id = $1
     ORDER BY p.created_at DESC`,
    [tenderId]
  );

  return result.rows.map(mapProposal);
}

export async function attachDocument(
  proposalId: string,
  requirementId: string,
  file: Express.Multer.File,
  userId: string
): Promise<any> {
  const proposal = await getProposalById(proposalId);

  if (proposal.providerId !== userId) {
    throw new AppError('No tienes permisos para modificar esta propuesta', 403);
  }
  if (proposal.state !== 'BORRADOR') {
    throw new AppError('Solo se pueden adjuntar documentos a propuestas en BORRADOR', 400);
  }

  await ensureDir();

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(PROPOSAL_UPLOADS_DIR, fileName);
  await fs.writeFile(filePath, file.buffer);

  const result = await pool.query(
    `INSERT INTO proposal_documents (proposal_id, requirement_id, file_path, file_name, file_size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [proposalId, requirementId, `uploads/proposals/${fileName}`, file.originalname, file.size]
  );

  return result.rows[0];
}

export async function submitProposal(proposalId: string, userId: string): Promise<Proposal> {
  const proposal = await getProposalById(proposalId);

  if (proposal.providerId !== userId) {
    throw new AppError('No tienes permisos para enviar esta propuesta', 403);
  }
  if (proposal.state !== 'BORRADOR') {
    throw new AppError(`La propuesta ya está en estado ${proposal.state}`, 400);
  }

  await verifyPostulationStage(proposal.tenderId);

  // Check that all requirements have documents attached
  const reqCount = await pool.query(
    'SELECT COUNT(*) FROM tender_requirements WHERE tender_id = $1',
    [proposal.tenderId]
  );
  const docCount = await pool.query(
    'SELECT COUNT(DISTINCT requirement_id) FROM proposal_documents WHERE proposal_id = $1',
    [proposalId]
  );

  const totalReqs = parseInt(reqCount.rows[0].count, 10);
  const totalDocs = parseInt(docCount.rows[0].count, 10);

  if (totalReqs > 0 && totalDocs < totalReqs) {
    throw new AppError(
      `Debe adjuntar todos los documentos requeridos (${totalDocs}/${totalReqs})`,
      400
    );
  }

  if (proposal.price <= 0) {
    throw new AppError('Debe especificar un precio válido para la propuesta', 400);
  }

  const result = await pool.query(
    `UPDATE proposals SET state = 'ENVIADO', submitted_at = NOW() WHERE id = $1 RETURNING *`,
    [proposalId]
  );

  return mapProposal(result.rows[0]);
}

export async function disqualifyProposal(
  proposalId: string,
  reason: string,
  userId: string
): Promise<Proposal> {
  const proposal = await getProposalById(proposalId);

  // Verify user owns the tender
  const tenderCheck = await pool.query(
    'SELECT state_entity_id FROM tenders WHERE id = $1',
    [proposal.tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  if (proposal.state === 'ADJUDICADA') {
    throw new AppError('No se puede descalificar una propuesta adjudicada', 400);
  }

  const result = await pool.query(
    `UPDATE proposals SET state = 'DESCALIFICADA', award_reason = $1 WHERE id = $2 RETURNING *`,
    [reason, proposalId]
  );

  return mapProposal(result.rows[0]);
}

export async function updateProposalPrice(
  proposalId: string,
  price: number,
  userId: string
): Promise<Proposal> {
  const proposal = await getProposalById(proposalId);

  if (proposal.providerId !== userId) {
    throw new AppError('No tienes permisos para modificar esta propuesta', 403);
  }
  if (proposal.state !== 'BORRADOR') {
    throw new AppError('Solo se puede modificar el precio en estado BORRADOR', 400);
  }
  if (price <= 0) {
    throw new AppError('El precio debe ser mayor a cero', 400);
  }

  const result = await pool.query(
    'UPDATE proposals SET price = $1 WHERE id = $2 RETURNING *',
    [price, proposalId]
  );

  return mapProposal(result.rows[0]);
}

export async function getMyProposals(userId: string): Promise<Proposal[]> {
  const result = await pool.query(
    `SELECT p.*, u.name as provider_name, t.title as tender_title
     FROM proposals p
     JOIN users u ON u.id = p.provider_id
     JOIN tenders t ON t.id = p.tender_id
     WHERE p.provider_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.rows.map(mapProposal);
}

export async function getProposalDocuments(proposalId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT pd.id, pd.file_name, pd.file_path, pd.file_size, tr.name as requirement_name
     FROM proposal_documents pd
     JOIN tender_requirements tr ON tr.id = pd.requirement_id
     WHERE pd.proposal_id = $1`,
    [proposalId]
  );
  return result.rows.map(row => ({
    id: row.id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    requirementName: row.requirement_name
  }));
}

export async function getProposalDocumentById(documentId: string): Promise<{ doc: any; fullPath: string }> {
  const result = await pool.query(
    'SELECT * FROM proposal_documents WHERE id = $1',
    [documentId]
  );
  if (result.rows.length === 0) {
    throw new AppError('Documento no encontrado', 404);
  }
  const doc = result.rows[0];
  const fullPath = path.join(process.cwd(), doc.file_path);
  return { doc, fullPath };
}
