import Database from "better-sqlite3";
import { ensureRuntimeDataPaths } from "@/lib/data-paths";

let database;
let storage;

export function getStorage() {
  if (!storage) {
    storage = ensureRuntimeDataPaths();
  }

  return storage;
}

export function getDatabase() {
  if (!database) {
    database = new Database(getStorage().dbPath);
  }

  return database;
}
