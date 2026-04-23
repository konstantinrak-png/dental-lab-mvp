import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

const statusLabels = {
  new: "новий",
  in_progress: "в роботі",
  ready: "готово",
  shipped: "відправлено"
};

const fieldLabels = {
  clinic_name: "Назва клініки",
  doctor_name: "Лікар",
  patient_name: "Пацієнт",
  work_type: "Тип роботи",
  material: "Матеріал",
  comment: "Коментар",
  due_date: "Термін",
  status: "Статус",
  created_at: "Створено"
};

function formatValue(field, value) {
  if (field === "status") {
    return statusLabels[value] || value;
  }

  if (field === "comment") {
    return value || "-";
  }

  return value;
}

export default async function OrderDetailsPage({ params }) {
  const user = await requireUser();
  const { id } = await params;
  const order = getOrderById(id, user);

  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Деталі замовлення</h1>
          <p>
            {order
              ? `Перегляд замовлення №${order.id}.`
              : "Замовлення не знайдено."}
          </p>
        </div>
        <div className="actions">
          <span className="session-badge">
            {user.role === "admin" ? "admin" : user.clinic_name}
          </span>
          <Link href="/logout" className="button secondary">
            Вийти
          </Link>
          <Link href="/orders" className="button secondary">
            До списку
          </Link>
        </div>
      </div>

      {order ? (
        <section className="card details-card">
          <div className="details-grid">
            {Object.entries(fieldLabels).map(([field, label]) => (
              <div key={field} className="detail-item">
                <span className="detail-label">{label}</span>
                <strong className="detail-value">
                  {formatValue(field, order[field])}
                </strong>
              </div>
            ))}
          </div>

          <div className="attachments-section">
            <h2>Файли</h2>
            {order.files.length > 0 ? (
              <div className="file-links">
                {order.files.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/files/${file.id}`}
                    className="file-link"
                  >
                    {file.original_name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="attachments-empty">Файли не завантажувалися.</p>
            )}
          </div>
        </section>
      ) : (
        <section className="empty">
          Замовлення з таким ID не знайдено. Перевірте посилання або поверніться
          до списку замовлень.
        </section>
      )}
    </main>
  );
}
