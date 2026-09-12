import mongoose from "mongoose";
import 'dotenv/config';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI in .env");
}

export async function connectDB() {
  try {
    await mongoose.connect(uri, {
      dbName: "life_rpg",
    });
    console.log("✅ MongoDB connected (Mongoose)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

// Optional: graceful shutdown
export async function disconnectDB() {
  await mongoose.disconnect();
}