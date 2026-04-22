import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../utils/jwt";
import { unauthorized } from "../utils/errors";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const match = req.header("Authorization")?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) {
    next(unauthorized("Missing Bearer token"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
};
