import Link from "next/link";
import { listOrders } from "@/lib/orders";
import StatusSelect from "./status-select";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  const orders = listOrders();

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

      {orders.length === 0 ? (
        <div className="empty">Замовлень ще немає.</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
