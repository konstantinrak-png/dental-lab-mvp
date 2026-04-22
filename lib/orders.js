import Database from "better-sqlite3";
import path from "path";

const STATUSES = ["new", "in_progress", "ready", "shipped"];

const dbPath = path.join(process.cwd(), "orders.db");
const db = new Database(dbPath);

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

export function getStatuses() {
  return STATUSES;
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
