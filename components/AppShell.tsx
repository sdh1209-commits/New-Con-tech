import Link from "next/link";
import { logout } from "@/app/actions";
import type { DemoSession } from "@/lib/auth";

const NAV: Record<DemoSession["role"], { href: string; label: string }[]> = {
  prime: [
    { href: "/prime", label: "대시보드" },
    { href: "/prime/sites", label: "현장 관리" },
    { href: "/prime/claims", label: "청구/지급 관리" },
  ],
  sub: [
    { href: "/sub", label: "대시보드" },
    { href: "/sub/attendance", label: "출역 관리" },
    { href: "/sub/claims", label: "청구서 관리" },
  ],
  worker: [{ href: "/worker", label: "내 출역/임금" }],
};

const ROLE_LABEL: Record<DemoSession["role"], string> = {
  prime: "원청사",
  sub: "협력사",
  worker: "근로자",
};

export default function AppShell({
  session,
  children,
}: {
  session: DemoSession;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-extrabold text-blue-700">
              New Con-tech
            </Link>
            <nav className="flex gap-1">
              {NAV[session.role].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              <span className="mr-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                {ROLE_LABEL[session.role]}
              </span>
              {session.name}
            </span>
            <form action={logout}>
              <button className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
