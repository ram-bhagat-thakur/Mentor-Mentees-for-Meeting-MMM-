import { createServer } from "node:http";
import "./config/env.js";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocketServer } from "./socket/index.js";

const httpServer = createServer(app);
initializeSocketServer(httpServer, { clientUrl: env.clientUrl });

httpServer.listen(env.port, () => {
  console.log(`MMM API and Socket.IO listening on port ${env.port}`);
  void connectDatabase();
});