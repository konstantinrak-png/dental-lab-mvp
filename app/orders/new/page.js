import Link from "next/link";
import { getStatuses } from "@/lib/orders";
import OrderForm from "./order-form";

export default function NewOrderPage() {
  const statuses = getStatuses();

  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Створення замовлення</h1>
          <p>Створіть нове замовлення для лабораторії.</p>
        </div>
        <div className="actions">
          <Link href="/orders" className="button secondary">
            Список замовлень
          </Link>
        </div>
      </div>

      <div className="card">
        <OrderForm statuses={statuses} />
      </div>
    </main>
  );
}
