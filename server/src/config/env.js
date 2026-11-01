import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export const env = Object.freeze({
	port: Number(process.env.PORT) || 5000,
	clientUrl: (process.env.CLIENT_URL || "http://127.0.0.1:5173").trim().replace(/\/+$/, ""),
	agoraAppId: process.env.AGORA_APP_ID?.trim() || "",
	agoraAppCertificate: process.env.AGORA_APP_CERTIFICATE?.trim() || "",
	agoraConfigured: Boolean(
		process.env.AGORA_APP_ID?.trim() &&
		process.env.AGORA_APP_ID.trim() !== "your_agora_app_id" &&
		process.env.AGORA_APP_CERTIFICATE?.trim() &&
		process.env.AGORA_APP_CERTIFICATE.trim() !== "your_agora_app_certificate",
	),
});

export function getAllowedClientOrigins(clientUrl = env.clientUrl) {
	const configuredOrigins = clientUrl
		.split(",")
		.map((origin) => origin.trim().replace(/\/+$/, ""))
		.filter(Boolean);
	const origins = [...configuredOrigins];
	if (process.env.NODE_ENV !== "production") {
		for (const configuredOrigin of configuredOrigins) {
			const clientOrigin = new URL(configuredOrigin);
			const port = clientOrigin.port ? `:${clientOrigin.port}` : "";
			origins.push(
				`${clientOrigin.protocol}//localhost${port}`,
				`${clientOrigin.protocol}//127.0.0.1${port}`,
			);
		}
	}
	return [...new Set(origins)];
}

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

export function validateProductionEnvironment() {
	const missing = ["MONGODB_URI", "JWT_SECRET", "CLIENT_URL"].filter(
		(key) => !process.env[key]?.trim(),
	);
	if (missing.length > 0) {
		throw new Error(`Production server configuration is incomplete. Missing: ${missing.join(", ")}.`);
	}

	const jwtSecret = process.env.JWT_SECRET.trim();
	if (
		Buffer.byteLength(jwtSecret) < 32 ||
		/your_jwt_super_secret|change_in_production/i.test(jwtSecret)
	) {
		throw new Error("JWT_SECRET must be a non-placeholder value of at least 32 bytes in production.");
	}

	const clientUrls = process.env.CLIENT_URL.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	if (clientUrls.length === 0) {
		throw new Error("CLIENT_URL must include at least one HTTPS origin in production.");
	}
	for (const clientUrl of clientUrls) {
		let clientOrigin;
		try {
			clientOrigin = new URL(clientUrl);
		} catch {
			throw new Error("CLIENT_URL entries must be valid HTTPS origins in production.");
		}
		if (
			clientOrigin.protocol !== "https:" ||
			clientOrigin.origin !== clientUrl.replace(/\/+$/, "") ||
			clientOrigin.pathname !== "/"
		) {
			throw new Error("CLIENT_URL entries must be HTTPS origins without a path, query, or fragment.");
		}
	}

	if (!/^(mongodb|mongodb\+srv):\/\//.test(process.env.MONGODB_URI.trim())) {
		throw new Error("MONGODB_URI must use the MongoDB connection URI scheme.");
	}

	if (process.env.PORT && (!Number.isInteger(Number(process.env.PORT)) || Number(process.env.PORT) < 1)) {
		throw new Error("PORT must be a positive integer when provided.");
	}

	getAgoraCredentials();
}