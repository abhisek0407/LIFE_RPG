import express from "express";
import { connectDB } from "./config/db.js";

const app = express();

const PORT = process.env.PORT || 5000;

const db = await connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "Life RPG API is running",
    database: "MongoDB connected"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});