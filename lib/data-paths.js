import fs from "fs";
import path from "path";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.cwd();

fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, "orders.db");
export const uploadsDir = path.join(dataDir, "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });
