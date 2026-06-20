import pool from '../../infrastructure/database/index';
import { AppError } from '../../infrastructure/middleware/error.middleware';
import { TenderDocument } from '../../shared/interfaces/index';
import path from 'path';
import fs from 'fs/promises';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // directory exists
  }
}

function mapDoc(row: any): TenderDocument {
  return {
    id: row.id,
    tenderId: row.tender_id,
    name: row.name,
    filePath: row.file_path,
    fileType: row.file_type,
    fileSize: row.file_size,
    documentType: row.document_type,
    createdAt: row.created_at,
  };
}

export async function uploadDocument(
  tenderId: string,
  file: Express.Multer.File,
  documentType: string,
  userId: string
): Promise<TenderDocument> {
  const tenderCheck = await pool.query(
    'SELECT state, state_entity_id FROM tenders WHERE id = $1',
    [tenderId]
  );
  if (tenderCheck.rows.length === 0) throw new AppError('Licitación no encontrada', 404);
  if (tenderCheck.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);
  if (tenderCheck.rows[0].state !== 'BORRADOR') throw new AppError('Solo se pueden modificar licitaciones en BORRADOR', 400);

  await ensureUploadsDir();

  // Save file to disk
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  await fs.writeFile(filePath, file.buffer);

  const result = await pool.query(
    `INSERT INTO tender_documents (tender_id, name, file_path, file_type, file_size, document_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tenderId, file.originalname, `uploads/${fileName}`, file.mimetype, file.size, documentType]
  );

  return mapDoc(result.rows[0]);
}

export async function getDocuments(tenderId: string): Promise<TenderDocument[]> {
  const result = await pool.query(
    'SELECT * FROM tender_documents WHERE tender_id = $1 ORDER BY created_at DESC',
    [tenderId]
  );
  return result.rows.map(mapDoc);
}

export async function getDocumentById(docId: string): Promise<{ doc: TenderDocument; fullPath: string }> {
  const result = await pool.query(
    'SELECT * FROM tender_documents WHERE id = $1',
    [docId]
  );
  if (result.rows.length === 0) {
    throw new AppError('Documento no encontrado', 404);
  }
  const doc = mapDoc(result.rows[0]);
  const fullPath = path.join(process.cwd(), doc.filePath);
  return { doc, fullPath };
}

export async function deleteDocument(docId: string, userId: string): Promise<void> {
  const result = await pool.query(
    `SELECT td.*, t.state_entity_id
     FROM tender_documents td
     JOIN tenders t ON t.id = td.tender_id
     WHERE td.id = $1`,
    [docId]
  );

  if (result.rows.length === 0) throw new AppError('Documento no encontrado', 404);
  if (result.rows[0].state_entity_id !== userId) throw new AppError('No tienes permisos', 403);

  const doc = result.rows[0];

  // Delete file from disk
  try {
    const fullPath = path.join(process.cwd(), doc.file_path);
    await fs.unlink(fullPath);
  } catch {
    // File may not exist
  }

  await pool.query('DELETE FROM tender_documents WHERE id = $1', [docId]);
}
