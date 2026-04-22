import { z } from "zod";

export const createRoomBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
});

export const roomIdParamsSchema = z.object({
  id: z.string().min(1),
});
