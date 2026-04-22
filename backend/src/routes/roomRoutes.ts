import { Router } from "express";

import {
  createRoomHandler,
  getRoom,
  joinRoomHandler,
  listRooms,
} from "../controllers/roomController";
import { authenticate } from "../middlewares/authenticateMiddleware";
import { validateBody, validateParams } from "../middlewares/validateMiddleware";
import {
  createRoomBodySchema,
  roomIdParamsSchema,
} from "../validations/roomValidation";

export const roomRouter = Router();

roomRouter.use(authenticate);

roomRouter.get("/", listRooms);
roomRouter.post("/", validateBody(createRoomBodySchema), createRoomHandler);
roomRouter.get("/:id", validateParams(roomIdParamsSchema), getRoom);
roomRouter.post("/:id/join", validateParams(roomIdParamsSchema), joinRoomHandler);
