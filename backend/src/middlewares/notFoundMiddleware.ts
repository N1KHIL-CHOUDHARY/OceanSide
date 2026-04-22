import type { NextFunction, Request, Response } from "express";

import { notFound } from "../utils/errors";

export const notFoundMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  next(notFound("Route not found"));
};
