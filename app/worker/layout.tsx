import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "worker") redirect("/login");
  return <AppShell session={session}>{children}</AppShell>;
}
