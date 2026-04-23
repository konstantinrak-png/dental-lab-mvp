import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getDefaultDataDir() {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFilePath), "..");
}

export function getConfiguredDataDir() {
  const configuredPath = String(process.env.DATA_DIR || "").trim();
  return configuredPath ? path.resolve(configuredPath) : null;
}

export function getDataDir() {
  return getConfiguredDataDir() || getDefaultDataDir();
}

export function getDataPaths() {
  const dataDir = getDataDir();

  return {
    dataDir,
    dbPath: path.join(dataDir, "orders.db"),
    uploadsDir: path.join(dataDir, "uploads")
  };
}

export function ensureRuntimeDataPaths() {
  const configuredDataDir = getConfiguredDataDir();

  if (configuredDataDir) {
    fs.mkdirSync(configuredDataDir, { recursive: true });

    return {
      dataDir: configuredDataDir,
      dbPath: path.join(configuredDataDir, "orders.db"),
      uploadsDir: ensureUploadsDir(configuredDataDir)
    };
  }

  const fallbackDir = getDefaultDataDir();

  return {
    dataDir: fallbackDir,
    dbPath: path.join(fallbackDir, "orders.db"),
    uploadsDir: ensureUploadsDir(fallbackDir)
  };
}

function ensureUploadsDir(dataDir) {
  const uploadsDir = path.join(dataDir, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
}
