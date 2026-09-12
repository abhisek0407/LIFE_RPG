import mongoose from "mongoose";
import dns from "node:dns";

import "dotenv/config";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

export async function connectTestDB() {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "life_rpg",
    });
}

export async function disconnectTestDB() {
    if (mongoose.connection.readyState === 0) return;

    await mongoose.disconnect();
}