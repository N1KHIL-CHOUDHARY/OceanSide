import { Router } from "express";

import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController";
import { authenticate } from "../middlewares/authenticateMiddleware";
import { validateBody } from "../middlewares/validateMiddleware";
import {
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "../validations/authValidation";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerBodySchema), register);
authRouter.post("/login", validateBody(loginBodySchema), login);
authRouter.post("/refresh", validateBody(refreshBodySchema), refresh);
authRouter.post("/logout", authenticate, logout);
