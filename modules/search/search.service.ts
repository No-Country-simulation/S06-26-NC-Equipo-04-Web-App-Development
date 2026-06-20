import pool from '../../infrastructure/database/index';
import { Tender, SearchFilters, PaginatedResponse } from '../../shared/interfaces/index';

function mapTender(row: any): Tender {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    state: row.state,
    rules: typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules,
    stateEntityId: row.state_entity_id,
    entityName: row.entity_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function searchTenders(filters: SearchFilters): Promise<PaginatedResponse<Tender>> {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.state) {
    conditions.push(`t.state = $${paramIndex++}`);
    params.push(filters.state);
  } else {
    // By default, only show PUBLICADA tenders in search
    conditions.push(`t.state = 'PUBLICADA'`);
  }

  if (filters.q) {
    conditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
    params.push(`%${filters.q}%`);
    paramIndex++;
  }

  if (filters.entity) {
    conditions.push(`u.name ILIKE $${paramIndex}`);
    params.push(`%${filters.entity}%`);
    paramIndex++;
  }

  if (filters.from) {
    conditions.push(`t.created_at >= $${paramIndex++}`);
    params.push(filters.from);
  }

  if (filters.to) {
    conditions.push(`t.created_at <= $${paramIndex++}`);
    params.push(filters.to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM tenders t JOIN users u ON u.id = t.state_entity_id ${whereClause}`,
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

  return {
    data: dataResult.rows.map(mapTender),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function searchSuggestions(query: string): Promise<{ suggestions: string[] }> {
  const result = await pool.query(
    `SELECT DISTINCT title FROM tenders
     WHERE state = 'PUBLICADA' AND title ILIKE $1
     LIMIT 5`,
    [`%${query}%`]
  );

  return {
    suggestions: result.rows.map((r: any) => r.title),
  };
}
