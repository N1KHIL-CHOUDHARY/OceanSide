import type { Request, Response } from "express";

import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshSession(req.body.refreshToken);
  res.json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    });
    return;
  }
  await logoutUser(req.user.id);
  res.status(204).send();
});
