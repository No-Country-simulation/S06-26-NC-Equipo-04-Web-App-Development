import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { ProviderRanking, EvaluationResult } from '../../shared/interfaces/index';

// ─── Scoring Engine ─────────────────────────────────────────────

export function calculatePriceScore(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) return 100;
  return Math.round((1 - (price - minPrice) / (maxPrice - minPrice)) * 100);
}

export function calculateExperienceScore(yearsExperience: number, maxYearsExperience: number): number {
  if (maxYearsExperience === 0) return 50;
  return Math.min(100, Math.round((yearsExperience / maxYearsExperience) * 100));
}

export function calculateFinalScore(
  experienceScore: number,
  priceScore: number,
  weightExperience: number,
  weightPrice: number
): number {
  return Math.round((experienceScore * weightExperience + priceScore * weightPrice) * 100) / 100;
}

interface RankInput {
  providerId: string;
  providerName: string;
  proposalId: string;
  experienceScore: number;
  priceScore: number;
  price: number;
}

export function rankProposals(
  proposals: RankInput[],
  weightExperience: number,
  weightPrice: number
): ProviderRanking[] {
  if (proposals.length === 0) return [];

  const ranked = proposals
    .map((p) => ({
      position: 0,
      providerId: p.providerId,
      providerName: p.providerName,
      proposalId: p.proposalId,
      totalScore: calculateFinalScore(p.experienceScore, p.priceScore, weightExperience, weightPrice),
      scoreExperience: p.experienceScore,
      scorePrice: p.priceScore,
      price: p.price,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item, index) => ({ ...item, position: index + 1 }));

  return ranked;
}

// ─── Database Operations ────────────────────────────────────────

export async function evaluateProposals(tenderId: string, userId: string): Promise<EvaluationResult> {
  // Verify tender exists and user owns it
  const tenderCheck = await pool.query(
    'SELECT state, state_entity_id, rules FROM tenders WHERE id = $1',
    [tenderId]
  );

  if (tenderCheck.rows.length === 0) {
    throw new AppError('Licitación no encontrada', 404);
  }
  if (tenderCheck.rows[0].state_entity_id !== userId) {
    throw new AppError('No tienes permisos para evaluar esta licitación', 403);
  }

  const tender = tenderCheck.rows[0];
  const rules = typeof tender.rules === 'string' ? JSON.parse(tender.rules) : tender.rules;
  const weightExperience = rules.weightExperience || 0.4;
  const weightPrice = rules.weightPrice || 0.6;

  // Get all ENVIADO proposals
  const proposalsResult = await pool.query(
    `SELECT p.id as proposal_id, p.provider_id, p.price, u.name as provider_name,
            COALESCE(p.score_experience, 0) as experience_score,
            COALESCE(p.score_price, 0) as price_score
     FROM proposals p
     JOIN users u ON u.id = p.provider_id
     WHERE p.tender_id = $1 AND p.state = 'ENVIADO'`,
    [tenderId]
  );

  if (proposalsResult.rows.length === 0) {
    throw new AppError('No hay propuestas ENVIADO para evaluar', 400);
  }

  const proposals = proposalsResult.rows;
  const prices = proposals.map((p: any) => parseFloat(p.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Calculate scores for each proposal
  const scoredProposals: any[] = [];

  for (const p of proposals) {
    const priceScore = calculatePriceScore(parseFloat(p.price), minPrice, maxPrice);
    const experienceScore = parseFloat(p.experience_score) || 50;
    const totalScore = calculateFinalScore(experienceScore, priceScore, weightExperience, weightPrice);

    // Determine new state based on score
    let newState: string;
    if (totalScore >= 70) {
      newState = 'VALIDADO_COMPLETO';
    } else if (totalScore >= 40) {
      newState = 'VALIDADO_CON_ALERTAS';
    } else {
      newState = 'ENVIADO';
    }

    await pool.query(
      `UPDATE proposals SET score = $1, score_experience = $2, score_price = $3, state = $4
       WHERE id = $5`,
      [totalScore, experienceScore, priceScore, newState, p.proposal_id]
    );

    scoredProposals.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      proposalId: p.proposal_id,
      experienceScore,
      priceScore,
      price: parseFloat(p.price),
    });
  }

  const ranking = rankProposals(scoredProposals, weightExperience, weightPrice);

  return {
    tenderId,
    evaluatedProposals: ranking.length,
    ranking,
  };
}

export async function getRanking(tenderId: string, userId: string): Promise<ProviderRanking[]> {
  // Verify tender exists and user owns it
  const tenderCheck = await pool.query(
    'SELECT state_entity_id, rules FROM tenders WHERE id = $1',
    [tenderId]
  );

  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  const rules = typeof tenderCheck.rows[0].rules === 'string'
    ? JSON.parse(tenderCheck.rows[0].rules)
    : tenderCheck.rows[0].rules;

  const weightExperience = rules.weightExperience || 0.4;
  const weightPrice = rules.weightPrice || 0.6;

  const result = await pool.query(
    `SELECT p.id as proposal_id, p.provider_id, u.name as provider_name,
            COALESCE(p.score, 0) as total_score,
            COALESCE(p.score_experience, 0) as score_experience,
            COALESCE(p.score_price, 0) as score_price,
            p.price
     FROM proposals p
     JOIN users u ON u.id = p.provider_id
     WHERE p.tender_id = $1 AND p.state IN ('ENVIADO', 'VALIDADO_CON_ALERTAS', 'VALIDADO_COMPLETO', 'ADJUDICADA')
     ORDER BY p.score DESC NULLS LAST`,
    [tenderId]
  );

  if (result.rows.length === 0) {
    return [];
  }

  // If scores are not calculated yet, calculate them now
  if (!result.rows[0].total_score || parseFloat(result.rows[0].total_score) === 0) {
    return (await evaluateProposals(tenderId, userId)).ranking;
  }

  return result.rows.map((row: any, index: number) => ({
    position: index + 1,
    providerId: row.provider_id,
    providerName: row.provider_name,
    proposalId: row.proposal_id,
    totalScore: parseFloat(row.total_score) || 0,
    scoreExperience: parseFloat(row.score_experience) || 0,
    scorePrice: parseFloat(row.score_price) || 0,
    price: parseFloat(row.price) || 0,
  }));
}

export async function awardProposal(
  tenderId: string,
  proposalId: string,
  userId: string
): Promise<{ proposalState: string; tenderState: string }> {
  // Verify tender exists and user owns it
  const tenderCheck = await pool.query(
    'SELECT state, state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );

  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);
  if (tenderCheck.rows[0].state === 'CERRADA') throw new AppError('La licitación ya está cerrada', 400);

  // Verify proposal exists and belongs to this tender
  const proposalCheck = await pool.query(
    'SELECT id, state FROM proposals WHERE id = $1 AND tender_id = $2',
    [proposalId, tenderId]
  );

  if (proposalCheck.rows.length === 0) throw new AppError('Propuesta no encontrada en esta licitación', 404);
  if (proposalCheck.rows[0].state === 'ADJUDICADA') throw new AppError('Esta propuesta ya fue adjudicada', 400);
  if (proposalCheck.rows[0].state === 'DESCALIFICADA') throw new AppError('No se puede adjudicar una propuesta descalificada', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Award the proposal
    await client.query(
      `UPDATE proposals SET state = 'ADJUDICADA', award_reason = 'Adjudicada por el ente público'
       WHERE id = $1`,
      [proposalId]
    );

    // Close the tender
    await client.query(
      `UPDATE tenders SET state = 'CERRADA', updated_at = NOW() WHERE id = $1`,
      [tenderId]
    );

    // Disqualify other proposals
    await client.query(
      `UPDATE proposals SET state = 'DESCALIFICADA', award_reason = 'Otro proveedor fue adjudicado'
       WHERE tender_id = $1 AND id != $2 AND state NOT IN ('DESCALIFICADA', 'ADJUDICADA')`,
      [tenderId, proposalId]
    );

    await client.query('COMMIT');

    return { proposalState: 'ADJUDICADA', tenderState: 'CERRADA' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function setExperienceScore(
  proposalId: string,
  yearsExperience: number,
  userId: string
): Promise<void> {
  const proposalCheck = await pool.query(
    `SELECT p.id, t.state_entity_id
     FROM proposals p
     JOIN tenders t ON t.id = p.tender_id
     WHERE p.id = $1`,
    [proposalId]
  );

  if (proposalCheck.rows.length === 0) throw new AppError('Propuesta no encontrada', 404);
  if (proposalCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  if (yearsExperience < 0) throw new AppError('Los años de experiencia no pueden ser negativos', 400);

  // Update years_experience of the selected proposal
  await pool.query(
    'UPDATE proposals SET years_experience = $1 WHERE id = $2',
    [yearsExperience, proposalId]
  );

  // Get max years of experience among all proposals for this tender
  const tenderId = (await pool.query(
    'SELECT tender_id FROM proposals WHERE id = $1',
    [proposalId]
  )).rows[0].tender_id;

  const maxYearsResult = await pool.query(
    'SELECT COALESCE(MAX(years_experience), 0) as max_years FROM proposals WHERE tender_id = $1',
    [tenderId]
  );
  const maxYears = parseFloat(maxYearsResult.rows[0].max_years) || 0;

  // Recalculate and update score_experience for ALL proposals of this tender
  const proposalsToUpdate = await pool.query(
    'SELECT id, COALESCE(years_experience, 0) as years FROM proposals WHERE tender_id = $1',
    [tenderId]
  );

  for (const row of proposalsToUpdate.rows) {
    const score = calculateExperienceScore(parseFloat(row.years), maxYears);
    await pool.query(
      'UPDATE proposals SET score_experience = $1 WHERE id = $2',
      [score, row.id]
    );
  }
}
