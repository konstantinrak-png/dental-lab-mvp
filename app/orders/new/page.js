import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStatuses } from "@/lib/orders";
import OrderForm from "./order-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewOrderPage() {
  const user = await requireUser();
  const statuses = getStatuses();

  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Створення замовлення</h1>
          <p>Створіть нове замовлення для лабораторії.</p>
        </div>
        <div className="actions">
          <span className="session-badge">
            {user.role === "admin" ? "admin" : user.clinic_name}
          </span>
          <Link href="/logout" className="button secondary">
            Вийти
          </Link>
          <Link href="/orders" className="button secondary">
            Список замовлень
          </Link>
        </div>
      </div>

      <div className="card">
        <OrderForm statuses={statuses} currentUser={user} />
      </div>
    </main>
  );
}
