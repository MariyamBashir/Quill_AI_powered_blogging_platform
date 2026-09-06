import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { db } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDirectory = path.resolve(__dirname, "../../migrations");

db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

const migrationFiles = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort();

for (const file of migrationFiles) {
    const alreadyApplied = db
        .prepare("SELECT id FROM migrations WHERE id = ?")
        .get(file);

    if (alreadyApplied) {
        continue;
    }

    console.log(`Applying migration: ${file}`);

    const migrationSql = fs.readFileSync(
        path.join(migrationsDirectory, file),
        "utf-8"
    );

    db.exec("BEGIN");

    try {
        db.exec(migrationSql);

        db.prepare(
            "INSERT INTO migrations (id) VALUES (?)"
        ).run(file);

        db.exec("COMMIT");

        console.log(`Migration applied: ${file}`);
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}

console.log("Database migrations complete.");