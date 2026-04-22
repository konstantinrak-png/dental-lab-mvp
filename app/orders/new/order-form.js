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

export default function OrderForm({ statuses }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Не вдалося створити замовлення");
      }

      setForm(initialForm);
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
          value={form.clinic_name}
          onChange={updateField}
          required
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
