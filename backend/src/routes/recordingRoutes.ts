import { Router } from "express";
import multer from "multer";

import {
  listByRoom,
  uploadRecording,
} from "../controllers/recordingController";
import { authenticate } from "../middlewares/authenticateMiddleware";
import { validateParams } from "../middlewares/validateMiddleware";
import { recordingRoomParamsSchema } from "../validations/recordingValidation";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

export const recordingRouter = Router();

recordingRouter.use(authenticate);

recordingRouter.post(
  "/",
  upload.single("file"),
  uploadRecording
);

recordingRouter.get(
  "/:roomId",
  validateParams(recordingRoomParamsSchema),
  listByRoom
);
