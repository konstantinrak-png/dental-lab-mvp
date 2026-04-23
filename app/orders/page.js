import Link from "next/link";
import { listOrders } from "@/lib/orders";
import StatusSelect from "./status-select";

export const dynamic = "force-dynamic";

const statusLabels = {
  all: "усі статуси",
  new: "новий",
  in_progress: "в роботі",
  ready: "готово",
  shipped: "відправлено"
};

function normalizeSearch(value) {
  return String(value || "").trim().toLocaleLowerCase("uk-UA");
}

function sortByDueDate(orders) {
  return [...orders].sort((left, right) => {
    const leftTime = new Date(left.due_date).getTime();
    const rightTime = new Date(right.due_date).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return right.id - left.id;
  });
}

function filterOrders(orders, filters) {
  const clinicQuery = normalizeSearch(filters.clinic);
  const doctorQuery = normalizeSearch(filters.doctor);
  const patientQuery = normalizeSearch(filters.patient);
  const statusQuery = String(filters.status || "").trim();

  return sortByDueDate(orders).filter((order) => {
    const matchesClinic =
      !clinicQuery ||
      normalizeSearch(order.clinic_name).includes(clinicQuery);
    const matchesDoctor =
      !doctorQuery ||
      normalizeSearch(order.doctor_name).includes(doctorQuery);
    const matchesPatient =
      !patientQuery ||
      normalizeSearch(order.patient_name).includes(patientQuery);
    const matchesStatus = !statusQuery || order.status === statusQuery;

    return matchesClinic && matchesDoctor && matchesPatient && matchesStatus;
  });
}

export default async function OrdersPage({ searchParams }) {
  const params = (await searchParams) || {};
  const filters = {
    clinic: String(params.clinic || ""),
    doctor: String(params.doctor || ""),
    patient: String(params.patient || ""),
    status: String(params.status || "")
  };
  const orders = filterOrders(listOrders(), filters);

  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Замовлення</h1>
          <p>Список усіх замовлень лабораторії.</p>
        </div>
        <div className="actions">
          <Link href="/orders/new" className="button">
            Створити замовлення
          </Link>
        </div>
      </div>

      <form className="filters-card" method="GET">
        <div className="filters-grid">
          <label className="field">
            <span>Пошук за назвою клініки</span>
            <input
              type="search"
              name="clinic"
              defaultValue={filters.clinic}
              placeholder="Введіть назву клініки"
            />
          </label>

          <label className="field">
            <span>Пошук за іменем лікаря</span>
            <input
              type="search"
              name="doctor"
              defaultValue={filters.doctor}
              placeholder="Введіть ім'я лікаря"
            />
          </label>

          <label className="field">
            <span>Пошук за іменем пацієнта</span>
            <input
              type="search"
              name="patient"
              defaultValue={filters.patient}
              placeholder="Введіть ім'я пацієнта"
            />
          </label>

          <label className="field">
            <span>Фільтр за статусом</span>
            <select name="status" defaultValue={filters.status}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value === "all" ? "" : value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filters-actions">
          <button type="submit" className="button">
            Застосувати
          </button>
          <Link href="/orders" className="button secondary">
            Скинути
          </Link>
        </div>
      </form>

      {orders.length === 0 ? (
        <div className="empty">
          {filters.clinic || filters.doctor || filters.patient || filters.status
            ? "Немає замовлень за вибраними фільтрами."
            : "Замовлень ще немає."}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клініка</th>
                <th>Лікар</th>
                <th>Пацієнт</th>
                <th>Тип роботи</th>
                <th>Матеріал</th>
                <th>Термін</th>
                <th>Статус</th>
                <th>Коментар</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.clinic_name}</td>
                  <td>{order.doctor_name}</td>
                  <td>{order.patient_name}</td>
                  <td>{order.work_type}</td>
                  <td>{order.material}</td>
                  <td>{order.due_date}</td>
                  <td>
                    <StatusSelect orderId={order.id} initialStatus={order.status} />
                  </td>
                  <td>{order.comment || "-"}</td>
                  <td>
                    <Link href={`/orders/${order.id}`} className="button secondary table-action">
                      Детальніше
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
