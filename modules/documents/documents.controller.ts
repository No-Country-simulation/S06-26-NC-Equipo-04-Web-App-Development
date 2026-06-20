import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as documentsService from './documents.service';
import path from 'path';
import fs from 'fs';

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'No se ha subido ningún archivo' });
    return;
  }

  const documentType = (req.body.documentType as string) || 'ADICIONAL';
  const doc = await documentsService.uploadDocument(req.params.id, file, documentType, req.user!.id);
  res.status(201).json({ success: true, data: doc, message: 'Documento subido exitosamente' });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const docs = await documentsService.getDocuments(req.params.id);
  res.status(200).json({ success: true, data: docs });
});

export const download = asyncHandler(async (req: Request, res: Response) => {
  const { doc, fullPath } = await documentsService.getDocumentById(req.params.docId);

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ success: false, error: 'Archivo no encontrado en el servidor' });
    return;
  }

  res.download(fullPath, doc.name);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await documentsService.deleteDocument(req.params.docId, req.user!.id);
  res.status(204).json({ success: true, message: 'Documento eliminado' });
});
