import { NextResponse } from "next/server";
import {
  getSessionCookieName,
  getSessionCookieOptions
} from "@/lib/auth";
import { deleteSession } from "@/lib/users";

export async function GET(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;

  deleteSession(token);

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0
  });

  return response;
}
