import mongoose from "mongoose";
import dotenv from "dotenv";
// import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI");
}

const client = new MongoClient(uri);

export async function connectDB() {
  await client.connect();

  console.log("✅ MongoDB connected successfully");

  return client.db("life_rpg");
}