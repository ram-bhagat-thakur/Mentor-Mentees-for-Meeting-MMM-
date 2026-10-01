import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export const env = Object.freeze({
	port: Number(process.env.PORT) || 5000,
	clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:5173",
	agoraAppId: process.env.AGORA_APP_ID?.trim() || "",
	agoraAppCertificate: process.env.AGORA_APP_CERTIFICATE?.trim() || "",
	agoraConfigured: Boolean(
		process.env.AGORA_APP_ID?.trim() &&
		process.env.AGORA_APP_ID.trim() !== "your_agora_app_id" &&
		process.env.AGORA_APP_CERTIFICATE?.trim() &&
		process.env.AGORA_APP_CERTIFICATE.trim() !== "your_agora_app_certificate",
	),
});

export function getAgoraCredentials() {
	const appId = process.env.AGORA_APP_ID?.trim();
	const appCertificate = process.env.AGORA_APP_CERTIFICATE?.trim();
	const missing = [];

	if (!appId || appId === "your_agora_app_id") missing.push("AGORA_APP_ID");
	if (!appCertificate || appCertificate === "your_agora_app_certificate") {
		missing.push("AGORA_APP_CERTIFICATE");
	}

	if (missing.length > 0) {
		throw new Error(`Agora RTC token service is not configured. Missing: ${missing.join(", ")}.`);
	}

	return { appId, appCertificate };
}