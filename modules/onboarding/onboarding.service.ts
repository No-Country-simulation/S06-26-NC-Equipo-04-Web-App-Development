import { OnboardingResult } from '../../shared/interfaces/index';
import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';

// ─── Mock Databases ─────────────────────────────────────────────
const MOCK_RUC_DB: Record<string, { razonSocial: string; estado: string; condicion: string }> = {
  '20123456789': { razonSocial: 'EMPRESA DE PRUEBA SAC', estado: 'ACTIVO', condicion: 'HABIDO' },
  '20999999999': { razonSocial: 'EMPRESA INACTIVA SAC', estado: 'BAJA', condicion: 'NO HABIDO' },
};

const MOCK_DNI_DB: Record<string, { nombres: string; apellidos: string; estado: string }> = {
  '12345678': { nombres: 'JUAN CARLOS', apellidos: 'PEREZ GARCIA', estado: 'VIGENTE' },
  '87654321': { nombres: 'MARIA ROSA', apellidos: 'LOPEZ CASTRO', estado: 'VIGENTE' },
  '11111111': { nombres: 'PEDRO ANTONIO', apellidos: 'RAMIREZ GONZALES', estado: 'VIGENTE' },
};

const MOCK_OSCE_DB: Record<string, { inhabilitado: boolean; causal?: string; fecha?: string }> = {
  '20123456789': { inhabilitado: false },
  '20888888888': { inhabilitado: true, causal: 'Incumplimiento contractual en obra pública', fecha: '2025-06-01' },
  '20777777777': { inhabilitado: false },
  '20555555555': { inhabilitado: false },
};

const MOCK_RNP_DB: Record<string, { inscrito: boolean; cmc: number; categoria: string }> = {
  '20123456789': { inscrito: true, cmc: 1000000, categoria: 'PROVEEDOR_BIENES' },
  '20777777777': { inscrito: true, cmc: 500000, categoria: 'PROVEEDOR_SERVICIOS' },
  '20999999999': { inscrito: false, cmc: 0, categoria: '' },
};

// ─── Mock Functions ──────────────────────────────────────────────

export interface RucResult {
  valid: boolean;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  error?: string;
}

export interface DniResult {
  valid: boolean;
  nombres?: string;
  apellidos?: string;
  estado?: string;
  error?: string;
}

export interface OsceResult {
  inhabilitado: boolean;
  causal?: string;
  fecha?: string;
  error?: string;
}

export interface RnpResult {
  inscrito: boolean;
  cmc: number;
  categoria?: string;
  error?: string;
}

export async function validateRuc(ruc: string): Promise<RucResult> {
  // Simular delay de API externa
  await new Promise((r) => setTimeout(r, 100));

  const data = MOCK_RUC_DB[ruc];
  if (!data) {
    // Para RUCs no mockeados, simular respuesta exitosa
    return {
      valid: true,
      razonSocial: `EMPRESA RUC ${ruc}`,
      estado: 'ACTIVO',
      condicion: 'HABIDO',
    };
  }
  return {
    valid: data.estado === 'ACTIVO' && data.condicion === 'HABIDO',
    razonSocial: data.razonSocial,
    estado: data.estado,
    condicion: data.condicion,
    ...(data.estado !== 'ACTIVO' && { error: 'RUC no activo o no habido. Regularice su situación ante SUNAT.' }),
  };
}

export async function validateDni(dni: string): Promise<DniResult> {
  await new Promise((r) => setTimeout(r, 100));

  const data = MOCK_DNI_DB[dni];
  if (!data) {
    return {
      valid: true,
      nombres: `NOMBRES DNI ${dni}`,
      apellidos: 'APELLIDOS',
      estado: 'VIGENTE',
    };
  }
  return {
    valid: data.estado === 'VIGENTE',
    nombres: data.nombres,
    apellidos: data.apellidos,
    estado: data.estado,
    ...(data.estado !== 'VIGENTE' && { error: 'DNI no vigente. Verifique su identidad ante RENIEC.' }),
  };
}

export async function checkOsce(ruc: string): Promise<OsceResult> {
  await new Promise((r) => setTimeout(r, 100));

  const data = MOCK_OSCE_DB[ruc];
  if (!data) {
    return { inhabilitado: false };
  }
  return data;
}

export async function checkRnp(ruc: string): Promise<RnpResult> {
  await new Promise((r) => setTimeout(r, 100));

  const data = MOCK_RNP_DB[ruc];
  if (!data) {
    return { inscrito: true, cmc: 250000, categoria: 'PROVEEDOR_SERVICIOS' };
  }
  return {
    inscrito: data.inscrito,
    cmc: data.cmc,
    categoria: data.categoria,
    ...(data.inscrito === false && { error: 'Regístrese o regularice su situación en el RNP.' }),
  };
}

export async function runFullOnboarding(ruc: string, dni: string): Promise<OnboardingResult> {
  const [rucResult, dniResult, osceResult, rnpResult] = await Promise.all([
    validateRuc(ruc),
    validateDni(dni),
    checkOsce(ruc),
    checkRnp(ruc),
  ]);

  const isApto =
    rucResult.valid &&
    dniResult.valid &&
    !osceResult.inhabilitado &&
    rnpResult.inscrito;

  return {
    rucValid: rucResult.valid,
    dniValid: dniResult.valid,
    osceClear: !osceResult.inhabilitado,
    rnpValid: rnpResult.inscrito,
    rucDetail: rucResult.razonSocial,
    dniDetail: dniResult.nombres ? `${dniResult.nombres} ${dniResult.apellidos}` : undefined,
    osceDetail: osceResult.causal,
    rnpDetail: rnpResult.inscrito ? `CMC: S/. ${rnpResult.cmc?.toLocaleString('es-PE')}` : undefined,
    isApto,
  };
}

export async function completeOnboarding(userId: string): Promise<void> {
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404);
  }
  const user = userResult.rows[0];
  if (user.role !== 'PROVEEDOR') {
    throw new AppError('Solo los proveedores pueden completar el onboarding', 403);
  }

  await pool.query(
    `UPDATE users SET provider_status = 'VALIDADO', updated_at = NOW() WHERE id = $1`,
    [userId]
  );
}
