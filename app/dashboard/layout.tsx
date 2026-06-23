import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await getUserBySessionToken(token);
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}

