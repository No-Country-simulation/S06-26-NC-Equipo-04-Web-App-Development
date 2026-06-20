import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { User } from '../../shared/interfaces/index';

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    ruc: row.ruc,
    dni: row.dni || undefined,
    role: row.role,
    providerStatus: row.provider_status || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUsers(options: {
  page?: number;
  limit?: number;
  role?: string;
}): Promise<{ data: User[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (options.role) {
    whereClause += ` AND role = $${paramIndex++}`;
    params.push(options.role);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await pool.query(
    `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    data: dataResult.rows.map(mapUser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: string): Promise<User> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return mapUser(result.rows[0]);
}

export async function updateUser(
  id: string,
  dto: { name?: string; email?: string; dni?: string },
  requesterId: string
): Promise<User> {
  if (id !== requesterId) {
    throw new AppError('No tienes permisos para modificar este usuario', 403);
  }

  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (dto.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(dto.name);
  }
  if (dto.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    params.push(dto.email);
  }
  if (dto.dni !== undefined) {
    fields.push(`dni = $${paramIndex++}`);
    params.push(dto.dni);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  fields.push('updated_at = NOW()');
  params.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return mapUser(result.rows[0]);
}
