import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { currentMonth, formatDate, formatMonth, won, wonShort } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Claim, Company, Site } from "@/lib/types";

export default async function PrimeDashboard() {
  const session = (await getSession())!;
  const supabase = getSupabase();

  const [{ data: sites }, { data: claims }, { data: companies }] = await Promise.all([
    supabase.from("sites").select("*").eq("prime_company_id", session.entityId),
    supabase.from("claims").select("*").order("created_at", { ascending: false }),
    supabase.from("companies").select("*"),
  ]);

  const siteMap = new Map((sites as Site[] | null)?.map((s) => [s.id, s]) ?? []);
  const companyMap = new Map((companies as Company[] | null)?.map((c) => [c.id, c]) ?? []);
  const allClaims = ((claims as Claim[] | null) ?? []).filter((c) => siteMap.has(c.site_id));

  const pending = allClaims.filter((c) => c.status === "submitted");
  const approved = allClaims.filter((c) => c.status === "approved");
  const paidThisMonth = allClaims
    .filter((c) => c.status === "paid" && c.paid_at?.slice(0, 7) === currentMonth())
    .reduce((sum, c) => sum + c.total_amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">원청사 대시보드</h1>
      <p className="mt-1 text-sm text-gray-500">{session.name} · 현장 대금지급 현황</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <KpiCard label="진행 중 현장" value={`${(sites ?? []).length}개`} />
        <KpiCard label="승인 대기 청구" value={`${pending.length}건`} accent={pending.length > 0} />
        <KpiCard label="지급 대기 (승인완료)" value={`${approved.length}건`} />
        <KpiCard label="이번 달 지급액" value={wonShort(paidThisMonth)} sub="체불 0건" />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">처리 대기 청구서</h2>
          <Link href="/prime/claims" className="text-sm font-medium text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {[...pending, ...approved].length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">처리할 청구서가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">현장</th>
                  <th className="px-4 py-3">협력사</th>
                  <th className="px-4 py-3">청구월</th>
                  <th className="px-4 py-3 text-right">청구금액</th>
                  <th className="px-4 py-3">제출일</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...pending, ...approved].map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {siteMap.get(c.site_id)?.name}
                    </td>
                    <td className="px-4 py-3">{companyMap.get(c.sub_company_id)?.name}</td>
                    <td className="px-4 py-3">{formatMonth(c.claim_month)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{won(c.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/prime/claims/${c.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        검토
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
