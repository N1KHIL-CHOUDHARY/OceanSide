import { z } from "zod";

const objectIdString = z.string().regex(/^[a-f0-9]{24}$/i);

export const roomIdParamSchema = z.object({
  roomId: objectIdString,
});

export const uploadRecordingFieldsSchema = z.object({
  roomId: objectIdString,
  durationSeconds: z.coerce.number().finite().nonnegative(),
});
