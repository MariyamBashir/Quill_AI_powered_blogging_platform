import express from "express";
import dotenv from "dotenv";
import "./db/migrate.js";
import { db } from "./db/database.js";
import authRouter from "./routes/auth.js";
import apiKeysRouter from "./routes/apiKeys.js";
import postsRouter from "./routes/posts.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(express.json());


app.get("/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

app.use("/auth", authRouter);
app.use("/auth/api-keys", apiKeysRouter);
app.use("/posts", postsRouter);

app.listen(PORT, () => {
  console.log(`Quill server running on http://localhost:${PORT}`);
});