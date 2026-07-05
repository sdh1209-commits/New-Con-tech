import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { currentMonth, formatMonth, won, wonShort } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Attendance, Claim, Site, SiteContract, Worker } from "@/lib/types";

export default async function SubDashboard() {
  const session = (await getSession())!;
  const supabase = getSupabase();

  const [{ data: contracts }, { data: sites }, { data: claims }, { data: workers }] =
    await Promise.all([
      supabase.from("site_contracts").select("*").eq("sub_company_id", session.entityId),
      supabase.from("sites").select("*"),
      supabase
        .from("claims")
        .select("*")
        .eq("sub_company_id", session.entityId)
        .order("created_at", { ascending: false }),
      supabase.from("workers").select("*").eq("sub_company_id", session.entityId),
    ]);

  const siteMap = new Map((sites as Site[] | null)?.map((s) => [s.id, s]) ?? []);
  const myClaims = (claims as Claim[] | null) ?? [];
  const myWorkers = (workers as Worker[] | null) ?? [];

  const workerIds = myWorkers.map((w) => w.id);
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .in("worker_id", workerIds.length ? workerIds : ["00000000-0000-0000-0000-000000000000"])
    .gte("work_date", `${currentMonth()}-01`);
  const monthManDays = ((attendances as Attendance[] | null) ?? []).reduce(
    (sum, a) => sum + Number(a.man_day),
    0
  );

  const waiting = myClaims.filter((c) => c.status === "submitted" || c.status === "approved");
  const paidTotal = myClaims
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.total_amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">협력사 대시보드</h1>
      <p className="mt-1 text-sm text-gray-500">{session.name} · 청구 및 출역 현황</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <KpiCard label="계약 현장" value={`${(contracts ?? []).length}건`} />
        <KpiCard label="소속 근로자" value={`${myWorkers.length}명`} />
        <KpiCard label="이번 달 총 공수" value={`${monthManDays.toFixed(1)} 공수`} />
        <KpiCard label="누적 수령액" value={wonShort(paidTotal)} accent />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/sub/attendance"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
        >
          <h2 className="font-bold text-gray-900">📅 출역 입력</h2>
          <p className="mt-1 text-sm text-gray-500">
            오늘의 근로자 출역(공수)을 입력하세요.
          </p>
        </Link>
        <Link
          href="/sub/claims/new"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
        >
          <h2 className="font-bold text-gray-900">🧾 청구서 작성</h2>
          <p className="mt-1 text-sm text-gray-500">
            출역 기록으로 노무비가 자동 집계된 월별 청구서를 만드세요.
          </p>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">최근 청구서</h2>
          <Link href="/sub/claims" className="text-sm font-medium text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">현장</th>
                <th className="px-4 py-3">청구월</th>
                <th className="px-4 py-3 text-right">총액</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myClaims.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {siteMap.get(c.site_id)?.name}
                  </td>
                  <td className="px-4 py-3">{formatMonth(c.claim_month)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{won(c.total_amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sub/claims/${c.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
