import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { Audit } from '../../shared/interfaces/index';

function mapAudit(row: any): Audit {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    isValid: row.is_valid,
    reportFile: row.report_file || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAuditByProposal(proposalId: string): Promise<Audit | null> {
  const result = await pool.query(
    'SELECT * FROM audits WHERE proposal_id = $1 ORDER BY created_at DESC LIMIT 1',
    [proposalId]
  );
  if (result.rows.length === 0) return null;
  return mapAudit(result.rows[0]);
}

export async function createOrUpdateAudit(
  proposalId: string,
  data: { isValid: boolean; reportFile?: any }
): Promise<Audit> {
  const existing = await pool.query(
    'SELECT id FROM audits WHERE proposal_id = $1',
    [proposalId]
  );

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE audits SET is_valid = $1, report_file = $2, updated_at = NOW()
       WHERE proposal_id = $3 RETURNING *`,
      [data.isValid, data.reportFile || null, proposalId]
    );
    return mapAudit(result.rows[0]);
  }

  const result = await pool.query(
    `INSERT INTO audits (proposal_id, is_valid, report_file)
     VALUES ($1, $2, $3) RETURNING *`,
    [proposalId, data.isValid, data.reportFile || null]
  );
  return mapAudit(result.rows[0]);
}

export async function runAudit(proposalId: string): Promise<Audit> {
  const proposalCheck = await pool.query(
    `SELECT p.id, p.state, p.score, p.tender_id
     FROM proposals p
     WHERE p.id = $1`,
    [proposalId]
  );

  if (proposalCheck.rows.length === 0) {
    throw new AppError('Propuesta no encontrada', 404);
  }

  const proposal = proposalCheck.rows[0];

  const hasScore = proposal.score !== null && parseFloat(proposal.score) > 0;
  const hasDocuments = await checkProposalDocuments(proposalId);
  const isComplete = proposal.state !== 'BORRADOR';

  const isValid = hasScore && hasDocuments && isComplete;

  const reportFile = {
    hasScore,
    hasDocuments,
    isComplete,
    state: proposal.state,
    score: proposal.score,
    checkedAt: new Date().toISOString(),
  };

  return createOrUpdateAudit(proposalId, {
    isValid,
    reportFile,
  });
}

async function checkProposalDocuments(proposalId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM proposal_documents WHERE proposal_id = $1',
    [proposalId]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}
