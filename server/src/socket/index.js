import { Server } from "socket.io";
import authSocketMiddleware from "./middleware/authSocketMiddleware.js";

export function initializeSocketServer(httpServer, { clientUrl }) {
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

    socket.on("disconnect", (reason) => {
      console.info("Socket disconnected.", { socketId: socket.id, reason });
    });
  });

  return io;
}