import mongoose from "mongoose";

import { Room, type RoomDocument } from "../models/Room";
import { forbidden, notFound } from "../utils/errors";

const toRoomIdString = (id: mongoose.Types.ObjectId): string => id.toString();

export type RoomSummary = {
  id: string;
  title: string;
  hostId: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
};

const toSummary = (doc: RoomDocument): RoomSummary => ({
  id: doc._id.toString(),
  title: doc.title,
  hostId: toRoomIdString(doc.hostId),
  participantIds: (doc.participants ?? []).map((p) => toRoomIdString(p)),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export const createRoom = async (params: {
  hostId: string;
  title: string;
}): Promise<RoomSummary> => {
  const hostObjectId = new mongoose.Types.ObjectId(params.hostId);
  const room = await Room.create({
    title: params.title.trim(),
    hostId: hostObjectId,
    participants: [hostObjectId],
  });
  return toSummary(room);
};

export const listRoomsForUser = async (
  userId: string
): Promise<RoomSummary[]> => {
  const uid = new mongoose.Types.ObjectId(userId);
  const rooms = await Room.find({
    $or: [{ hostId: uid }, { participants: uid }],
  })
    .sort({ updatedAt: -1 })
    .exec();

  return rooms.map(toSummary);
};

export const getRoomForUser = async (params: {
  userId: string;
  roomId: string;
}): Promise<RoomSummary> => {
  if (!mongoose.isValidObjectId(params.roomId)) {
    throw notFound("Room not found");
  }

  const room = await Room.findById(params.roomId).exec();
  if (!room) {
    throw notFound("Room not found");
  }

  const uid = params.userId;
  const hostOk = room.hostId.toString() === uid;
  const inParticipants = (room.participants ?? []).some(
    (p) => p.toString() === uid
  );
  if (!hostOk && !inParticipants) {
    throw forbidden("You do not have access to this room");
  }

  return toSummary(room);
};

export const assertRoomMember = async (
  roomId: string,
  userId: string
): Promise<void> => {
  await getRoomForUser({ userId, roomId });
};

export const joinRoom = async (params: {
  userId: string;
  roomId: string;
}): Promise<RoomSummary> => {
  if (!mongoose.isValidObjectId(params.roomId)) {
    throw notFound("Room not found");
  }

  const uid = new mongoose.Types.ObjectId(params.userId);
  const room = await Room.findByIdAndUpdate(
    params.roomId,
    { $addToSet: { participants: uid } },
    { new: true }
  ).exec();

  if (!room) {
    throw notFound("Room not found");
  }

  return toSummary(room);
};
