"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const statusLabels = {
  new: "новий",
  in_progress: "в роботі",
  ready: "готово",
  shipped: "відправлено"
};

const statusClasses = {
  new: "status-new",
  in_progress: "status-progress",
  ready: "status-ready",
  shipped: "status-shipped"
};

export default function StatusSelect({ orderId, initialStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleChange(event) {
    const nextStatus = event.target.value;
    const previousStatus = status;

    setStatus(nextStatus);
    setError("");

    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      const data = await response.json();
      setStatus(previousStatus);
      setError(data.error || "Не вдалося оновити статус");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="status-control">
      <select
        aria-label={`Статус замовлення ${orderId}`}
        className={`status-select ${statusClasses[status] || ""}`.trim()}
        value={status}
        onChange={handleChange}
        disabled={isPending}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error ? <div className="status-error">{error}</div> : null}
    </div>
  );
}
