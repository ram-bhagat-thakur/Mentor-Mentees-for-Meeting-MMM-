import mongoose from "mongoose";

mongoose.connection.on("error", () => {
  console.error("MongoDB connection error; check database connectivity and configuration.");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

export function getDatabaseStatus() {
  if (mongoose.connection.readyState === 1) {
    return "connected";
  }

  if (mongoose.connection.readyState === 2) {
    return "connecting";
  }

  return "disconnected";
}

export async function connectDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.error("MongoDB connection skipped: MONGODB_URI is not configured.");
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.info("MongoDB connected.");
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed (${error.name || "Error"}).`);
    return false;
  }
}