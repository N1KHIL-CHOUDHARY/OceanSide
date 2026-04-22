import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { AppError } from "../utils/errors";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export const rateLimitMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const max = env.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  if (!max || !windowMs) return next();

  const key = req.ip ?? "unknown";
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  const nextCount = existing.count + 1;
  buckets.set(key, { ...existing, count: nextCount });

  if (nextCount > max) {
    return next(
      new AppError({
        message: "Too many requests",
        statusCode: 429,
        code: "RATE_LIMITED",
      })
    );
  }

  return next();
};
