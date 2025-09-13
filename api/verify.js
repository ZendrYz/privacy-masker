// api/verify.js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("privacyMasker");
  }
  return db;
}

export default async function handler(req, res) {
  const { key } = req.query;
  if (!key) return res.status(400).json({ valid: false });

  try {
    const db = await connectDB();
    const found = await db.collection("keys").findOne({ key });

    if (found) {
      return res.status(200).json({ valid: true });
    }
    return res.status(200).json({ valid: false });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ valid: false, error: "DB error" });
  }
}