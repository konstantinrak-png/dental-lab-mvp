import Database from "better-sqlite3";
import crypto from "crypto";
import fs from "fs";
import path from "path";

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

const dbPath = path.join(process.cwd(), "orders.db");
const db = new Database(dbPath);
const uploadsDir = path.join(process.cwd(), "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

db.exec(`
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

db.exec(`
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

export function getStatuses() {
  return STATUSES;
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

export function listOrderFiles(orderId) {
  return db
    .prepare(
      `SELECT id, order_id, original_name, stored_name, file_path, mime_type, created_at
       FROM order_files
       WHERE order_id = ?
       ORDER BY id DESC`
    )
    .all(orderId);
}

export function listOrders() {
  return db
    .prepare(
      `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at
       FROM orders
       ORDER BY datetime(created_at) DESC, id DESC`
    )
    .all();
}

export function getOrderById(id) {
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return null;
  }

  const order = db
    .prepare(
      `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at
       FROM orders
       WHERE id = ?`
    )
    .get(orderId);

  if (!order) {
    return null;
  }

  return {
    ...order,
    files: listOrderFiles(order.id)
  };
}

export function createOrder(input) {
  const order = {
    clinic_name: String(input.clinic_name || "").trim(),
    doctor_name: String(input.doctor_name || "").trim(),
    patient_name: String(input.patient_name || "").trim(),
    work_type: String(input.work_type || "").trim(),
    material: String(input.material || "").trim(),
    comment: String(input.comment || "").trim(),
    due_date: String(input.due_date || "").trim(),
    status: String(input.status || "new").trim()
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

  const result = db
    .prepare(
      `INSERT INTO orders (
        clinic_name,
        doctor_name,
        patient_name,
        work_type,
        material,
        comment,
        due_date,
        status
      ) VALUES (
        @clinic_name,
        @doctor_name,
        @patient_name,
        @work_type,
        @material,
        @comment,
        @due_date,
        @status
      )`
    )
    .run(order);

  return db
    .prepare(
      `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at
       FROM orders
       WHERE id = ?`
    )
    .get(result.lastInsertRowid);
}

export async function createOrderWithFiles(input, files) {
  for (const file of files) {
    validateUpload(file);
  }

  const order = createOrder(input);

  for (const file of files) {
    const { originalName, extension } = validateUpload(file);
    const storedName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadsDir, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    db.prepare(
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

  return getOrderById(order.id);
}

export function getOrderFileById(id) {
  const fileId = Number(id);

  if (!Number.isInteger(fileId) || fileId <= 0) {
    return null;
  }

  return db
    .prepare(
      `SELECT id, order_id, original_name, stored_name, file_path, mime_type, created_at
       FROM order_files
       WHERE id = ?`
    )
    .get(fileId);
}

export function updateOrderStatus(id, status) {
  const orderId = Number(id);
  const nextStatus = String(status || "").trim();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('Field "id" is invalid');
  }

  if (!STATUSES.includes(nextStatus)) {
    throw new Error('Field "status" is invalid');
  }

  const result = db
    .prepare(`UPDATE orders SET status = ? WHERE id = ?`)
    .run(nextStatus, orderId);

  if (result.changes === 0) {
    throw new Error("Order not found");
  }

  return db
    .prepare(
      `SELECT id, clinic_name, doctor_name, patient_name, work_type, material, comment, due_date, status, created_at
       FROM orders
       WHERE id = ?`
    )
    .get(orderId);
}
