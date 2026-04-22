import type { Request, Response } from "express";

import { uploadRecordingFieldsSchema } from "../validations/recordingValidation";
import {
  createRecordingFromUpload,
  listRecordingsByRoom,
} from "../services/recordingService";
import { badRequest } from "../utils/errors";
import { asyncHandler } from "../utils/asyncHandler";

export const listByRoom = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    });
    return;
  }
  const recordings = await listRecordingsByRoom(req.params.roomId, req.user.id);
  res.json({ recordings });
});

export const uploadRecording = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      });
      return;
    }

    const file = req.file;
    if (!file?.buffer) {
      throw badRequest("Missing file field");
    }

    const parsed = uploadRecordingFieldsSchema.safeParse({
      roomId: req.body.roomId,
      durationSeconds: req.body.durationSeconds,
      title: req.body.title,
    });
    if (!parsed.success) {
      throw parsed.error;
    }

    const recording = await createRecordingFromUpload({
      roomId: parsed.data.roomId,
      userId: req.user.id,
      buffer: file.buffer,
      mimeType: file.mimetype || "video/webm",
      durationSeconds: parsed.data.durationSeconds,
      title: parsed.data.title,
    });

    res.status(201).json({ recording });
  }
);
