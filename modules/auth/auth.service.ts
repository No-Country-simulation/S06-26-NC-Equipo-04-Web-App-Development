import pool from '../../infrastructure/database/index';
import { hashPassword, comparePassword } from '../../core/utils/password';
import { generateToken } from '../../core/utils/jwt';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { RegisterDTO, LoginDTO, AuthResponse, User } from '../../shared/interfaces/index';

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    ruc: row.ruc,
    dni: row.dni,
    role: row.role,
    providerStatus: row.provider_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function registerUser(dto: RegisterDTO): Promise<AuthResponse> {
  // Validar RUC (11 dígitos)
  if (!/^\d{11}$/.test(dto.ruc)) {
    throw new AppError('El RUC debe tener 11 dígitos', 400);
  }

  // Validar DNI (8 dígitos)
  if (!/^\d{8}$/.test(dto.dni)) {
    throw new AppError('El DNI debe tener 8 dígitos', 400);
  }

  // Validar email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
    throw new AppError('Email inválido', 400);
  }

  // Validar password mínimo 6 caracteres
  if (dto.password.length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar si el email ya existe
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('El correo electrónico ya está registrado', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password);

    // Insertar usuario
    const result = await client.query(
      `INSERT INTO users (name, email, ruc, dni, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, ruc, dni, role, created_at, updated_at`,
      [dto.name, dto.email, dto.ruc, dto.dni, passwordHash, dto.role]
    );

    const user = result.rows[0];

    // Si es ENTE_PUBLICO, insertar en state_entities
    if (dto.role === 'ENTE_PUBLICO') {
      await client.query(
        'INSERT INTO state_entities (id) VALUES ($1)',
        [user.id]
      );
    }

    // Si es PROVEEDOR, insertar en providers
    if (dto.role === 'PROVEEDOR') {
      await client.query(
        'INSERT INTO providers (id) VALUES ($1)',
        [user.id]
      );
    }

    await client.query('COMMIT');

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
      ruc: user.ruc,
      name: user.name,
    });

    return { token, user: mapUser(user) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function loginUser(dto: LoginDTO): Promise<AuthResponse> {
  const result = await pool.query(
    `SELECT id, name, email, ruc, dni, role, password_hash, provider_status, created_at, updated_at
     FROM users WHERE email = $1`,
    [dto.email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const user = result.rows[0];

  const isValid = await comparePassword(dto.password, user.password_hash);
  if (!isValid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    ruc: user.ruc,
    name: user.name,
  });

  return { token, user: mapUser(user) };
}

export async function getMe(userId: string): Promise<User> {
  const result = await pool.query(
    `SELECT id, name, email, ruc, dni, role, provider_status, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return mapUser(result.rows[0]);
}
