import { NextResponse } from "next/server";
import {
  getSessionCookieName,
  getSessionCookieOptions
} from "@/lib/auth";
import {
  authenticateUser,
  createSession
} from "@/lib/users";

export async function POST(request) {
  try {
    const body = await request.json();
    const user = authenticateUser(body.email, body.password);

    if (!user) {
      return Response.json(
        { error: "Невірний email або пароль" },
        { status: 401 }
      );
    }

    const token = createSession(user.id);
    const response = NextResponse.json({ user });

    response.cookies.set(
      getSessionCookieName(),
      token,
      getSessionCookieOptions()
    );

    return response;
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
