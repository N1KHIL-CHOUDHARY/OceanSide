import type { ZodIssue, ZodError } from "zod";
import { z } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    statusCode?: number;
    code?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "AppError";
    this.statusCode = params.statusCode ?? 500;
    this.code = params.code ?? "INTERNAL_SERVER_ERROR";
    this.details = params.details;
  }
}

export const toZodIssues = (err: ZodError<unknown>): ZodIssue[] => err.issues;

export const zodErrorToAppError = (err: ZodError<unknown>) =>
  new AppError({
    message: "Invalid request payload",
    statusCode: 400,
    code: "BAD_REQUEST",
    details: {
      issues: toZodIssues(err).map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });

export const assertDefined = <T>(
  value: T | undefined | null,
  message: string
): T => {
  if (value === undefined || value === null) throw new AppError({ message, statusCode: 500 });
  return value;
};

export const badRequest = (message: string, details?: unknown) =>
  new AppError({ message, statusCode: 400, code: "BAD_REQUEST", details });

export const unauthorized = (message: string) =>
  new AppError({ message, statusCode: 401, code: "UNAUTHORIZED" });

export const forbidden = (message: string) =>
  new AppError({ message, statusCode: 403, code: "FORBIDDEN" });

export const notFound = (message: string) =>
  new AppError({ message, statusCode: 404, code: "NOT_FOUND" });

export const conflict = (message: string, details?: unknown) =>
  new AppError({ message, statusCode: 409, code: "CONFLICT", details });

