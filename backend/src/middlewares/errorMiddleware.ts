import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError, zodErrorToAppError } from "../utils/errors";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    const appErr = zodErrorToAppError(err);
    return res.status(appErr.statusCode).json({
      error: {
        code: appErr.code,
        message: appErr.message,
        details: appErr.details,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
};
