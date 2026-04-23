import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/orders");
  }

  return (
    <main className="auth-page">
      <div className="page-header">
        <div>
          <h1>Вхід до системи</h1>
          <p>Увійдіть, щоб керувати замовленнями лабораторії.</p>
        </div>
      </div>

      <section className="card auth-card">
        <LoginForm />
      </section>
    </main>
  );
}
