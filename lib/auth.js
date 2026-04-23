import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getUserBySessionToken } from "@/lib/users";

const SESSION_COOKIE = "dental_lab_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function getCurrentUser() {
  noStore();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserBySessionToken(token);
}

export function getUserFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return getUserBySessionToken(token);
}

export async function requireUser() {
  noStore();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}
