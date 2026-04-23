import fs from "fs";
import path from "path";

function getDefaultDataDir() {
  return process.cwd();
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
    try {
      fs.mkdirSync(configuredDataDir, { recursive: true });

      return {
        dataDir: configuredDataDir,
        dbPath: path.join(configuredDataDir, "orders.db"),
        uploadsDir: ensureUploadsDir(configuredDataDir)
      };
    } catch (_error) {
      // Build environments like Render may not have the persistent disk mounted yet.
      // Fall back to the local project directory so module evaluation does not fail.
    }
  }

  const fallbackDir = getDefaultDataDir();

  fs.mkdirSync(fallbackDir, { recursive: true });

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
