import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";

export default async function SubLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "sub") redirect("/login");
  return <AppShell session={session}>{children}</AppShell>;
}
