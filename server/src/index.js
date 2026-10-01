import { createServer } from "node:http";
import "./config/env.js";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocketServer } from "./socket/index.js";

const httpServer = createServer(app);
const io = initializeSocketServer(httpServer, { clientUrl: env.clientUrl });
app.set("io", io);

httpServer.listen(env.port, () => {
  console.log(`MMM API and Socket.IO listening on port ${env.port}`);
  if (!env.agoraConfigured) {
    console.error("Agora RTC token service is not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE.");
  }
  void connectDatabase();
});