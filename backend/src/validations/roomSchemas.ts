import { z } from "zod";

export const createRoomBodySchema = z.object({
  title: z.string().min(1).max(200),
});

const objectIdString = z.string().regex(/^[a-f0-9]{24}$/i);

export const roomIdParamsSchema = z.object({
  id: objectIdString,
});
