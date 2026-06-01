import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../../utils/logger.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'query' ? req.query : req.body;
      const validated = schema.parse(data);

      if (source === 'query') {
        req.query = validated as any;
      } else {
        req.body = validated;
      }

      next();
    } catch (error) {
      logger.warn('Validation failed', 'VALIDATION', { path: req.path, source });

      if (error instanceof ZodError) {
        const formatted = error.flatten();
        return res.status(400).json({
          error: 'Validation failed',
          details: formatted.fieldErrors,
        });
      }

      next(error);
    }
  };
}
