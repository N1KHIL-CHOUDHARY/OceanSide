import express from "express";
import cors from "cors";
import helmet from "helmet";

import { authRouter } from "./routes/authRoutes";
import { recordingRouter } from "./routes/recordingRoutes";
import { roomRouter } from "./routes/roomRoutes";
import { env } from "./config/env";
import { requestLogger } from "./utils/logger";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware";
import { errorMiddleware } from "./middlewares/errorMiddleware";

export const app = express();

const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);
app.use(rateLimitMiddleware);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "oceanside-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/recordings", recordingRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
