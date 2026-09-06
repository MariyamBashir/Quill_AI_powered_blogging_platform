import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";

dotenv.config();

const databasePath = process.env.DATABASE_PATH || "./data/quill.db";

export const db = new DatabaseSync(databasePath);

console.log(`SQLite database connected: ${databasePath}`);