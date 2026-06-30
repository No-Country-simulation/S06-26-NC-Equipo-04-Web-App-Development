import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import {
  Tender,
  CreateTenderDTO,
  UpdateTenderDTO,
  TenderStatus,
  PaginatedResponse,
} from '../../shared/interfaces/index';

const DEFAULT_RULES = {
  weightExperience: 0.4,
  weightPrice: 0.6,
  maxYearsExperience: 10,
};

function mapTender(row: any): Tender {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    state: row.state,
    rules: typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules,
    stateEntityId: row.state_entity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTender(dto: CreateTenderDTO, userId: string): Promise<Tender> {
  const rules = { ...DEFAULT_RULES, ...dto.rules };

  const result = await pool.query(
    `INSERT INTO tenders (title, description, state, rules, state_entity_id)
     VALUES ($1, $2, 'BORRADOR', $3, $4)
     RETURNING *`,
    [dto.title, dto.description || '', JSON.stringify(rules), userId]
  );

  return mapTender(result.rows[0]);
}

export async function getTenders(
  options: { page?: number; limit?: number; state?: TenderStatus; search?: string; userId?: string }
): Promise<PaginatedResponse<Tender>> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (options.state) {
    whereClause += ` AND t.state = $${paramIndex++}`;
    params.push(options.state);
  }

  if (options.search) {
    whereClause += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
    params.push(`%${options.search}%`);
    paramIndex++;
  }

  if (options.userId) {
    whereClause += ` AND t.state_entity_id = $${paramIndex++}`;
    params.push(options.userId);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM tenders t ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await pool.query(
    `SELECT t.*, u.name as entity_name
     FROM tenders t
     JOIN users u ON u.id = t.state_entity_id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const data = dataResult.rows.map((row: any) => ({
    ...mapTender(row),
    entityName: row.entity_name,
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTenderById(id: string): Promise<Tender> {
  const result = await pool.query(
    `SELECT t.*, u.name as entity_name
     FROM tenders t
     JOIN users u ON u.id = t.state_entity_id
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Licitación no encontrada', 404);
  }

  return {
    ...mapTender(result.rows[0]),
    entityName: result.rows[0].entity_name,
  };
}

export async function updateTender(id: string, dto: UpdateTenderDTO, userId: string): Promise<Tender> {
  const tender = await getTenderById(id);

  if (tender.state !== 'BORRADOR') {
    throw new AppError('Solo se pueden editar licitaciones en estado BORRADOR', 400);
  }
  if (tender.stateEntityId !== userId) {
    throw new AppError('No tienes permisos para editar esta licitación', 403);
  }

  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (dto.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    params.push(dto.title);
  }
  if (dto.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    params.push(dto.description);
  }
  if (dto.rules !== undefined) {
    fields.push(`rules = $${paramIndex++}`);
    params.push(JSON.stringify(dto.rules));
  }

  if (fields.length === 0) {
    return tender;
  }

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query(
    `UPDATE tenders SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  return mapTender(result.rows[0]);
}

export async function publishTender(id: string, userId: string): Promise<Tender> {
  const tender = await getTenderById(id);

  if (tender.stateEntityId !== userId) {
    throw new AppError('No tienes permisos para publicar esta licitación', 403);
  }
  if (tender.state !== 'BORRADOR') {
    throw new AppError(`La licitación debe estar en BORRADOR para publicarse (estado actual: ${tender.state})`, 400);
  }

  const result = await pool.query(
    `UPDATE tenders SET state = 'PUBLICADA', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  return mapTender(result.rows[0]);
}

export async function closeTender(id: string, userId: string): Promise<Tender> {
  const tender = await getTenderById(id);

  if (tender.stateEntityId !== userId) {
    throw new AppError('No tienes permisos para cerrar esta licitación', 403);
  }
  if (tender.state !== 'PUBLICADA') {
    throw new AppError('Solo se pueden cerrar licitaciones PUBLICADAS', 400);
  }

  const result = await pool.query(
    `UPDATE tenders SET state = 'CERRADA', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  return mapTender(result.rows[0]);
}

export async function deleteTender(id: string, userId: string): Promise<void> {
  const tender = await getTenderById(id);

  if (tender.stateEntityId !== userId) {
    throw new AppError('No tienes permisos para eliminar esta licitación', 403);
  }
  if (tender.state !== 'BORRADOR') {
    throw new AppError('Solo se pueden eliminar licitaciones en estado BORRADOR', 400);
  }

  await pool.query('DELETE FROM tenders WHERE id = $1', [id]);
}
