import { z } from "zod";

export const recordingRoomParamsSchema = z.object({
  roomId: z.string().min(1),
});

export const uploadRecordingFieldsSchema = z.object({
  roomId: z.string().min(1),
  durationSeconds: z.coerce.number().nonnegative(),
  title: z.string().trim().max(200).optional(),
});
