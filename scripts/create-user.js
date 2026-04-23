const crypto = require("crypto");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(process.cwd(), "orders.db");
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

function readArg(name) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : "";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function createUser({ email, password, role, clinicName = "" }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
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

  return db
    .prepare(
      `SELECT id, email, role, clinic_name, created_at
       FROM users
       WHERE id = ?`
    )
    .get(result.lastInsertRowid);
}

function main() {
  const email = readArg("email");
  const password = readArg("password");
  const role = readArg("role") || "clinic";
  const clinicName = readArg("clinic");

  if (!email || !password) {
    console.error(
      "Використання: npm run create-user -- --email=user@example.com --password=secret --role=admin"
    );
    process.exit(1);
  }

  try {
    const user = createUser({
      email,
      password,
      role,
      clinicName
    });

    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
