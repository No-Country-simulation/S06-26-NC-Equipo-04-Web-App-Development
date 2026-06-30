import { describe, it, expect } from 'vitest';
import { AppError, asyncHandler, errorHandler } from '../error.middleware';
import { Request, Response } from 'express';

describe('Error Middleware', () => {
  describe('AppError', () => {
    it('should create an operational error with status code', () => {
      const error = new AppError('Not found', 404);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should default to 500', () => {
      const error = new AppError('Server error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('errorHandler', () => {
    it('should return proper error response for AppError', () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(400);
          return { json: (data: any) => {
            expect(data.success).toBe(false);
            expect(data.error).toBe('Bad request');
          }};
        },
      } as Response;
      const mockNext = () => {};

      const error = new AppError('Bad request', 400);
      errorHandler(error, mockReq, mockRes, mockNext);
    });
  });

  describe('asyncHandler', () => {
    it('should catch errors and pass to next', async () => {
      const fn = async () => { throw new AppError('Async error', 500); };
      const handler = asyncHandler(fn as any);
      const mockNext = (err: any) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toBe('Async error');
      };
      await handler({} as Request, {} as Response, mockNext);
    });
  });
});
