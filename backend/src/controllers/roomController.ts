import type { Request, Response } from "express";

import {
  createRoom,
  getRoomForUser,
  joinRoom,
  listRoomsForUser,
} from "../services/roomService";
import { asyncHandler } from "../utils/asyncHandler";

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    });
    return;
  }
  const rooms = await listRoomsForUser(req.user.id);
  res.json({ rooms });
});

export const createRoomHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      });
      return;
    }
    const room = await createRoom({
      title: req.body.title,
      hostId: req.user.id,
    });
    res.status(201).json({ room });
  }
);

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    });
    return;
  }
  const room = await getRoomForUser({
    userId: req.user.id,
    roomId: req.params.id,
  });
  res.json({ room });
});

export const joinRoomHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      });
      return;
    }
    const room = await joinRoom({
      userId: req.user.id,
      roomId: req.params.id,
    });
    res.json({ room });
  }
);
