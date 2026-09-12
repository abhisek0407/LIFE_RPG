import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dns from "node:dns";
import http from "node:http";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";


import questRoutes from "./routes/questRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dailyQuestRoutes from "./routes/dailyQuestRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import { attachSarvamSttProxy } from "./services/sarvamSttProxy.js";


dns.setServers(["8.8.8.8", "8.8.4.4"]);


dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;


await connectDB();


const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/quests", protect, questRoutes);
app.use("/api/daily-quests", protect, dailyQuestRoutes);
app.use("/api/store", protect, storeRoutes);
app.use("/api/streaks", protect, streakRoutes);
app.use("/api/activity-logs", protect, activityLogRoutes);
app.use("/api/ai", protect, aiRoutes);


app.get("/", (req, res) => {
  res.json({ message: "⚔️ Life RPG API is running" });
});



app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});



app.use((err, req, res, next) => {
  console.error("💥", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
});



const server = http.createServer(app);

// Sarvam AI realtime STT — browser connects to ws(s)://<host>/ws/stt?token=<jwt>
attachSarvamSttProxy(server);

server.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
  console.log(`🎙️  Voice STT proxy listening on ws://localhost:${PORT}/ws/stt`);
});