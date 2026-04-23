import crypto from "crypto";
import Database from "better-sqlite3";
import { dbPath } from "@/lib/data-paths";

const db = new Database(dbPath);
const ROLES = new Set(["admin", "clinic"]);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    clinic_name TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || "").split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    clinic_name: user.clinic_name,
    created_at: user.created_at
  };
}

export function createUser({ email, password, role, clinicName = "" }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role || "").trim();
  const normalizedClinicName = String(clinicName || "").trim();

  if (!normalizedEmail || !String(password || "")) {
    throw new Error("Email та пароль є обов'язковими");
  }

  if (!ROLES.has(normalizedRole)) {
    throw new Error("Невідома роль користувача");
  }

  if (normalizedRole === "clinic" && !normalizedClinicName) {
    throw new Error("Для ролі clinic потрібна назва клініки");
  }

  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, role, clinic_name)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      normalizedEmail,
      hashPassword(password),
      normalizedRole,
      normalizedRole === "clinic" ? normalizedClinicName : ""
    );

  return getUserById(result.lastInsertRowid);
}

export function getUserById(id) {
  return sanitizeUser(
    db
      .prepare(
        `SELECT id, email, role, clinic_name, created_at
         FROM users
         WHERE id = ?`
      )
      .get(id)
  );
}

export function getUserByEmail(email) {
  return sanitizeUser(
    db
      .prepare(
        `SELECT id, email, role, clinic_name, created_at
         FROM users
         WHERE email = ?`
      )
      .get(normalizeEmail(email))
  );
}

export function authenticateUser(email, password) {
  const user = db
    .prepare(
      `SELECT id, email, password_hash, role, clinic_name, created_at
       FROM users
       WHERE email = ?`
    )
    .get(normalizeEmail(email));

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return sanitizeUser(user);
}

export function createSession(userId) {
  const token = crypto.randomUUID();

  db.prepare(
    `INSERT INTO sessions (user_id, token)
     VALUES (?, ?)`
  ).run(userId, token);

  return token;
}

export function deleteSession(token) {
  if (!token) {
    return;
  }

  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function getUserBySessionToken(token) {
  if (!token) {
    return null;
  }

  const user = db
    .prepare(
      `SELECT users.id, users.email, users.role, users.clinic_name, users.created_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`
    )
    .get(token);

  return sanitizeUser(user);
}
