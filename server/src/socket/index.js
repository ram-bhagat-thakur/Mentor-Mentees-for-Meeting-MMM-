import { Server } from "socket.io";
import authSocketMiddleware from "./middleware/authSocketMiddleware.js";
import { registerRoomEvents } from "./events/roomEvents.js";

export function initializeSocketServer(httpServer, { clientUrl, roomModels } = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
    },
  });

  io.use(authSocketMiddleware);
  io.on("connection", (socket) => {
    console.info("Socket connected.", { socketId: socket.id });
    socket.emit("connection:ready", { userId: socket.user.sub });
    registerRoomEvents(io, socket, roomModels);

    socket.on("disconnect", (reason) => {
      console.info("Socket disconnected.", { socketId: socket.id, reason });
    });
  });

  return io;
}