import "server-only";
import { cookies } from "next/headers";

const COOKIE = "insig_admin";
const SECRET = process.env.ADMIN_PASSWORD || "insigtrade-admin-2026";

export async function isLoggedIn() {
  const c = await cookies();
  return c.get(COOKIE)?.value === SECRET;
}

export async function login(password: string) {
  if (password !== SECRET) return false;
  const c = await cookies();
  c.set(COOKIE, SECRET, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logout() {
  const c = await cookies();
  c.delete(COOKIE);
}
