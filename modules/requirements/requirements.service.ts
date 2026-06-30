import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { TenderRequirement, CreateRequirementDTO } from '../../shared/interfaces/index';

function mapReq(row: any): TenderRequirement {
  return {
    id: row.id,
    tenderId: row.tender_id,
    name: row.name,
    description: row.description || undefined,
    sortOrder: row.sort_order,
  };
}

export async function addRequirement(tenderId: string, dto: CreateRequirementDTO, userId: string): Promise<TenderRequirement> {
  const tenderCheck = await pool.query(
    'SELECT state, state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);
  if (tenderCheck.rows[0].state !== 'BORRADOR') throw new AppError('Solo se pueden modificar licitaciones en BORRADOR', 400);

  const maxOrder = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM tender_requirements WHERE tender_id = $1',
    [tenderId]
  );

  const result = await pool.query(
    `INSERT INTO tender_requirements (tender_id, name, description, sort_order)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenderId, dto.name, dto.description || '', maxOrder.rows[0].next]
  );

  return mapReq(result.rows[0]);
}

export async function getRequirements(tenderId: string): Promise<TenderRequirement[]> {
  const result = await pool.query(
    'SELECT * FROM tender_requirements WHERE tender_id = $1 ORDER BY sort_order ASC',
    [tenderId]
  );
  return result.rows.map(mapReq);
}

export async function deleteRequirement(tenderId: string, reqId: string, userId: string): Promise<void> {
  const tenderCheck = await pool.query(
    'SELECT state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  const result = await pool.query(
    'DELETE FROM tender_requirements WHERE id = $1 AND tender_id = $2 RETURNING id',
    [reqId, tenderId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Requisito no encontrado', 404);
  }
}
