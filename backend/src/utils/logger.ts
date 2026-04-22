import type { NextFunction, Request, Response } from "express";

export const logger = {
  info: (msg: string, meta?: unknown) => {
    if (meta !== undefined) console.log(msg, meta);
    else console.log(msg);
  },
  error: (msg: string, meta?: unknown) => {
    if (meta !== undefined) console.error(msg, meta);
    else console.error(msg);
  },
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    // Intentionally simple: works without external dependencies.
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
};

