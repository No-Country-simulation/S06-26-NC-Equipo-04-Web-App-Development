import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { TenderStage, CreateStageDTO } from '../../shared/interfaces/index';

function mapStage(row: any): TenderStage {
  return {
    id: row.id,
    tenderId: row.tender_id,
    stageType: row.stage_type,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    sortOrder: row.sort_order,
  };
}

export async function addStage(tenderId: string, dto: CreateStageDTO, userId: string): Promise<TenderStage> {
  // Verify tender exists and user owns it
  const tenderCheck = await pool.query(
    'SELECT state, state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) {
    throw new AppError('Licitación no encontrada', 404);
  }
  if (tenderCheck.rows[0].state_entity_id !== userId) {
    throw new AppError('No tienes permisos para modificar esta licitación', 403);
  }
  if (tenderCheck.rows[0].state !== 'BORRADOR') {
    throw new AppError('Solo se pueden modificar licitaciones en BORRADOR', 400);
  }

  // Validate dates
  if (new Date(dto.endDate) <= new Date(dto.startDate)) {
    throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
  }

  // Get next sort_order
  const maxOrder = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM tender_stages WHERE tender_id = $1',
    [tenderId]
  );
  const nextOrder = maxOrder.rows[0].next;

  const result = await pool.query(
    `INSERT INTO tender_stages (tender_id, stage_type, name, start_date, end_date, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenderId, dto.stageType, dto.name, dto.startDate, dto.endDate, nextOrder]
  );

  return mapStage(result.rows[0]);
}

export async function getStages(tenderId: string): Promise<TenderStage[]> {
  const result = await pool.query(
    'SELECT * FROM tender_stages WHERE tender_id = $1 ORDER BY sort_order ASC',
    [tenderId]
  );
  return result.rows.map(mapStage);
}

export async function updateStage(
  tenderId: string,
  stageId: string,
  dto: CreateStageDTO,
  userId: string
): Promise<TenderStage> {
  // Verify ownership
  const tenderCheck = await pool.query(
    'SELECT state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  if (new Date(dto.endDate) <= new Date(dto.startDate)) {
    throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
  }

  const result = await pool.query(
    `UPDATE tender_stages SET stage_type = $1, name = $2, start_date = $3, end_date = $4, updated_at = NOW()
     WHERE id = $5 AND tender_id = $6 RETURNING *`,
    [dto.stageType, dto.name, dto.startDate, dto.endDate, stageId, tenderId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Etapa no encontrada', 404);
  }

  return mapStage(result.rows[0]);
}

export async function deleteStage(tenderId: string, stageId: string, userId: string): Promise<void> {
  const tenderCheck = await pool.query(
    'SELECT state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  const result = await pool.query(
    'DELETE FROM tender_stages WHERE id = $1 AND tender_id = $2 RETURNING id',
    [stageId, tenderId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Etapa no encontrada', 404);
  }
}
