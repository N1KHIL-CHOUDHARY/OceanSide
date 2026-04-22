import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import "./config/cloudinary";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { registerSocketHandlers } from "./socket/registerSocket";

const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

registerSocketHandlers(io);

export const start = async (): Promise<void> => {
  await connectDatabase();
  httpServer.listen(env.PORT, () => {
    console.log(`OceanSide API + Socket.IO — http://localhost:${env.PORT}`);
  });
};
