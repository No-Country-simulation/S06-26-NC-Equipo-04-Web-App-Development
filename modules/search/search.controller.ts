import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as searchService from './search.service';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q, entity, from, to, state, page, limit } = req.query;
  const result = await searchService.searchTenders({
    q: q as string,
    entity: entity as string,
    from: from as string,
    to: to as string,
    state: state as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  res.status(200).json({ success: true, ...result });
});

export const suggestions = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || (q as string).length < 2) {
    res.status(200).json({ success: true, data: { suggestions: [] } });
    return;
  }
  const result = await searchService.searchSuggestions(q as string);
  res.status(200).json({ success: true, data: result });
});
