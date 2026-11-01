import { createServer } from "node:http";
import "./config/env.js";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env, getAllowedClientOrigins, validateProductionEnvironment } from "./config/env.js";
import { initializeSocketServer } from "./socket/index.js";

const httpServer = createServer(app);
const io = initializeSocketServer(httpServer, { clientUrl: getAllowedClientOrigins() });
app.set("io", io);

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    validateProductionEnvironment();
  }

  const databaseConnected = await connectDatabase();
  if (process.env.NODE_ENV === "production" && !databaseConnected) {
    throw new Error("MongoDB connection is required before starting the production server.");
  }

  httpServer.listen(env.port, () => {
    console.log(`MMM API and Socket.IO listening on port ${env.port}`);
    if (!env.agoraConfigured) {
      console.error("Agora RTC token service is not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE.");
    }
  });
}

startServer().catch((error) => {
  console.error("MMM server startup failed.", { message: error.message });
  process.exitCode = 1;
});