import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const clientDirectory = fileURLToPath(new URL(".", import.meta.url));

function validateProductionEnvironment(values) {
  const required = ["VITE_API_BASE_URL", "VITE_SOCKET_URL", "VITE_AGORA_APP_ID"];
  const missing = required.filter((key) => !values[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing production client environment variables: ${missing.join(", ")}.`);
  }

  for (const key of ["VITE_API_BASE_URL", "VITE_SOCKET_URL"]) {
    let url;
    try {
      url = new URL(values[key]);
    } catch {
      throw new Error(`${key} must be a valid HTTPS URL.`);
    }

    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error(`${key} must be a valid HTTPS URL without embedded credentials.`);
    }
    if (key === "VITE_SOCKET_URL" && (url.pathname !== "/" || url.search || url.hash)) {
      throw new Error("VITE_SOCKET_URL must be an origin without a path, query, or fragment.");
    }
    if (key === "VITE_API_BASE_URL" && !url.pathname.replace(/\/+$/, "").endsWith("/api")) {
      throw new Error("VITE_API_BASE_URL must end with /api.");
    }
  }

  if (/^your_agora_app_id$/i.test(values.VITE_AGORA_APP_ID.trim())) {
    throw new Error("VITE_AGORA_APP_ID must contain the public Agora App ID.");
  }
}

export default defineConfig(({ mode }) => {
  if (mode === "production" && process.env.VERCEL_ENV === "production") {
    validateProductionEnvironment(loadEnv(mode, clientDirectory, "VITE_"));
  }

  return {
    plugins: [react()],
  };
});