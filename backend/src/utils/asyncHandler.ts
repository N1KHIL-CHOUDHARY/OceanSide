import type { NextFunction, Request, Response } from "express";

/**
 * Wrap async route handlers so thrown/rejected errors hit the central
 * error middleware.
 */
export const asyncHandler =
  (
    fn: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };

