import crypto from "crypto";
import fs from "fs";
import Database from "better-sqlite3";
import path from "path";
import { ensureRuntimeDataPaths } from "@/lib/data-paths";

const STATUSES = ["new", "in_progress", "ready", "shipped"];
const ALLOWED_FILE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".zip",
  ".html",
  ".ply"
]);

let db;

function getDb() {
  if (!db) {
    const { dbPath } = ensureRuntimeDataPaths();
    db = new Database(dbPath);
    initializeDb(db);
  }

  return db;
}

function getUploadsDir() {
  return ensureRuntimeDataPaths().uploadsDir;
}

function initializeDb(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinic_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      work_type TEXT NOT NULL,
      material TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS order_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  ensureColumn(database, "orders", "owner_user_id", "INTEGER");
}

function ensureColumn(database, tableName, columnName, definition) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();

  if (!columns.some((column) => column.name === columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function isAdmin(user) {
  return user?.role === "admin";
}

function sanitizeFileName(fileName) {
  return path
    .basename(String(fileName || ""))
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function validateUpload(file) {
  const originalName = sanitizeFileName(file?.name || "");
  const extension = path.extname(originalName).toLowerCase();

  if (!originalName) {
    throw new Error("Файл має містити назву");
  }

  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    throw new Error("Непідтримуваний тип файлу");
  }

  return { originalName, extension };
}

function getOrderRecordById(orderId) {
  return getDb()
    .prepare(
      `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at, owner_user_id
       FROM orders
       WHERE id = ?`
    )
    .get(orderId);
}

function canAccessOrder(user, order) {
  if (!user || !order) {
    return false;
  }

  return isAdmin(user) || order.owner_user_id === user.id;
}

function mapOrder(order) {
  if (!order) {
    return null;
  }

  return {
    ...order,
    files: listOrderFiles(order.id)
  };
}

export function getStatuses() {
  return STATUSES;
}

export function listOrderFiles(orderId) {
  return getDb()
    .prepare(
      `SELECT id, order_id, original_name, stored_name, file_path, mime_type, created_at
       FROM order_files
       WHERE order_id = ?
       ORDER BY id DESC`
    )
    .all(orderId);
}

export function listOrders(user) {
  if (!user) {
    return [];
  }

  const query = isAdmin(user)
    ? `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at, owner_user_id
       FROM orders
       ORDER BY datetime(created_at) DESC, id DESC`
    : `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at, owner_user_id
       FROM orders
       WHERE owner_user_id = ?
       ORDER BY datetime(created_at) DESC, id DESC`;

  return isAdmin(user)
    ? getDb().prepare(query).all()
    : getDb().prepare(query).all(user.id);
}

export function getOrderById(id, user) {
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return null;
  }

  const order = getOrderRecordById(orderId);

  if (!canAccessOrder(user, order)) {
    return null;
  }

  return mapOrder(order);
}

export function createOrder(input, user) {
  if (!user) {
    throw new Error("Необхідна авторизація");
  }

  const order = {
    clinic_name: isAdmin(user)
      ? String(input.clinic_name || "").trim()
      : String(user.clinic_name || "").trim(),
    doctor_name: String(input.doctor_name || "").trim(),
    patient_name: String(input.patient_name || "").trim(),
    work_type: String(input.work_type || "").trim(),
    material: String(input.material || "").trim(),
    comment: String(input.comment || "").trim(),
    due_date: String(input.due_date || "").trim(),
    status: String(input.status || "new").trim(),
    owner_user_id: user.id
  };

  for (const field of [
    "clinic_name",
    "doctor_name",
    "patient_name",
    "work_type",
    "material",
    "due_date"
  ]) {
    if (!order[field]) {
      throw new Error(`Field "${field}" is required`);
    }
  }

  if (!STATUSES.includes(order.status)) {
    throw new Error('Field "status" is invalid');
  }

  const result = getDb()
    .prepare(
      `INSERT INTO orders (
        clinic_name,
        doctor_name,
        patient_name,
        work_type,
        material,
        comment,
        due_date,
        status,
        owner_user_id
      ) VALUES (
        @clinic_name,
        @doctor_name,
        @patient_name,
        @work_type,
        @material,
        @comment,
        @due_date,
        @status,
        @owner_user_id
      )`
    )
    .run(order);

  return getOrderById(result.lastInsertRowid, user);
}

export async function createOrderWithFiles(input, files, user) {
  for (const file of files) {
    validateUpload(file);
  }

  const order = createOrder(input, user);

  for (const file of files) {
    const { originalName, extension } = validateUpload(file);
    const storedName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(getUploadsDir(), storedName);
    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    getDb().prepare(
      `INSERT INTO order_files (
        order_id,
        original_name,
        stored_name,
        file_path,
        mime_type
      ) VALUES (?, ?, ?, ?, ?)`
    ).run(
      order.id,
      originalName,
      storedName,
      filePath,
      String(file.type || "")
    );
  }

  return getOrderById(order.id, user);
}

export function getOrderFileById(id, user) {
  const fileId = Number(id);

  if (!Number.isInteger(fileId) || fileId <= 0) {
    return null;
  }

  const file = getDb()
    .prepare(
      `SELECT id, order_id, original_name, stored_name, file_path, mime_type, created_at
       FROM order_files
       WHERE id = ?`
    )
    .get(fileId);

  if (!file) {
    return null;
  }

  const order = getOrderRecordById(file.order_id);

  if (!canAccessOrder(user, order)) {
    return null;
  }

  return file;
}

export function updateOrderStatus(id, status, user) {
  const orderId = Number(id);
  const nextStatus = String(status || "").trim();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('Field "id" is invalid');
  }

  if (!STATUSES.includes(nextStatus)) {
    throw new Error('Field "status" is invalid');
  }

  const currentOrder = getOrderRecordById(orderId);

  if (!canAccessOrder(user, currentOrder)) {
    throw new Error("Order not found");
  }

  const result = getDb()
    .prepare(`UPDATE orders SET status = ? WHERE id = ?`)
    .run(nextStatus, orderId);

  if (result.changes === 0) {
    throw new Error("Order not found");
  }

  return getOrderById(orderId, user);
}
