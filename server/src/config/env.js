import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export const env = Object.freeze({
	port: Number(process.env.PORT) || 5000,
	clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:5173",
});