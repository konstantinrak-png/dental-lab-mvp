"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const initialForm = {
  clinic_name: "",
  doctor_name: "",
  patient_name: "",
  work_type: "",
  material: "",
  comment: "",
  due_date: "",
  status: "new"
};

const statusLabels = {
  new: "новий",
  in_progress: "в роботі",
  ready: "готово",
  shipped: "відправлено"
};

export default function OrderForm({ statuses, currentUser }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateFiles(event) {
    setFiles(Array.from(event.target.files || []));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Не вдалося створити замовлення");
      }

      setForm(initialForm);
      setFiles([]);
      setFileInputKey((current) => current + 1);
      router.push("/orders");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <label className="field">
        <span>Назва клініки</span>
        <input
          name="clinic_name"
          value={
            currentUser.role === "clinic"
              ? currentUser.clinic_name
              : form.clinic_name
          }
          onChange={updateField}
          required
          readOnly={currentUser.role === "clinic"}
        />
      </label>

      <label className="field">
        <span>Лікар</span>
        <input
          name="doctor_name"
          value={form.doctor_name}
          onChange={updateField}
          required
        />
      </label>

      <label className="field">
        <span>Пацієнт</span>
        <input
          name="patient_name"
          value={form.patient_name}
          onChange={updateField}
          required
        />
      </label>

      <label className="field">
        <span>Тип роботи</span>
        <input
          name="work_type"
          value={form.work_type}
          onChange={updateField}
          required
        />
      </label>

      <label className="field">
        <span>Матеріал</span>
        <input
          name="material"
          value={form.material}
          onChange={updateField}
          required
        />
      </label>

      <label className="field">
        <span>Термін</span>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={updateField}
          required
        />
      </label>

      <label className="field">
        <span>Статус</span>
        <select name="status" value={form.status} onChange={updateField}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status] || status}
            </option>
          ))}
        </select>
      </label>

      <label className="field full">
        <span>Коментар</span>
        <textarea
          name="comment"
          value={form.comment}
          onChange={updateField}
        />
      </label>

      <label className="field full">
        <span>Файли</span>
        <input
          key={fileInputKey}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.zip,.html,.ply"
          multiple
          onChange={updateFiles}
        />
        <small className="field-hint">
          Підтримуються файли: JPG, PNG, PDF, ZIP, HTML, PLY.
        </small>
        {files.length > 0 ? (
          <div className="file-list">
            {files.map((file) => (
              <span key={`${file.name}-${file.size}`} className="file-chip">
                {file.name}
              </span>
            ))}
          </div>
        ) : null}
      </label>

      {error ? (
        <div className="field full" style={{ color: "#b00020" }}>
          {error}
        </div>
      ) : null}

      <div className="field full">
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Збереження..." : "Створити замовлення"}
        </button>
      </div>
    </form>
  );
}
