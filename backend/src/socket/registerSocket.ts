import type { Server } from "socket.io";

import { Room } from "../models/Room";
import { verifyAccessToken } from "../utils/jwt";
import { logger } from "../utils/logger";

type SocketData = {
  userId: string;
};

export const registerSocketHandlers = (io: Server): void => {
  io.use((socket, next) => {
    const raw = socket.handshake.auth;
    const token =
      raw &&
      typeof raw === "object" &&
      "token" in raw &&
      typeof (raw as { token?: unknown }).token === "string"
        ? (raw as { token: string }).token
        : undefined;

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      (socket.data as SocketData).userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket.data as SocketData).userId;

    socket.on(
      "join-room",
      async (
        payload: { roomId: string },
        ack?: (result: { ok: boolean; error?: string }) => void
      ) => {
        try {
          const roomId = payload?.roomId;
          if (!roomId) {
            ack?.({ ok: false, error: "BAD_REQUEST" });
            return;
          }

          const room = await Room.findById(roomId).exec();
          if (!room) {
            ack?.({ ok: false, error: "NOT_FOUND" });
            return;
          }

          const allowed =
            room.hostId.toString() === userId ||
            (room.participants ?? []).some((p) => p.toString() === userId);

          if (!allowed) {
            ack?.({ ok: false, error: "FORBIDDEN" });
            return;
          }

          await socket.join(roomId);

          socket.to(roomId).emit("peer-joined", {
            socketId: socket.id,
            userId,
          });

          const peersInRoom = await io.in(roomId).fetchSockets();
          const peers = peersInRoom
            .filter((s) => s.id !== socket.id)
            .map((s) => ({
              socketId: s.id,
              userId: (s.data as SocketData).userId,
            }));

          ack?.({ ok: true });
          socket.emit("room-peers", { peers });
        } catch (err) {
          logger.error("join-room error", err);
          ack?.({ ok: false, error: "INTERNAL" });
        }
      }
    );

    socket.on("leave-room", (payload: { roomId: string }) => {
      const roomId = payload?.roomId;
      if (!roomId) return;
      void socket.leave(roomId);
      socket.to(roomId).emit("peer-left", { socketId: socket.id, userId });
    });

    socket.on(
      "signal",
      (msg: { roomId: string; to?: string; data: unknown }) => {
        if (!msg?.roomId || msg.data === undefined) return;

        const envelope = {
          from: socket.id,
          userId,
          roomId: msg.roomId,
          data: msg.data,
        };

        if (msg.to) {
          io.to(msg.to).emit("signal", envelope);
        } else {
          socket.to(msg.roomId).emit("signal", envelope);
        }
      }
    );
  });
};
