import { User } from "@clerk/nextjs/server";

const ADMIN_EMAILS = [
  "raysynergyroup@gmail.com",
  "admin2@example.com",
  "admin3@example.com",
];

export function isAdminUser(user: User | null) {
  if (!user) return false;

  const email = user.emailAddresses?.[0]?.emailAddress;
  return !!email && ADMIN_EMAILS.includes(email);
}
