import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatMonth, won, wonShort } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Attendance, Claim, Company, Site, SiteContract, Worker } from "@/lib/types";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabase();

  const [{ data: site }, { data: contracts }, { data: companies }, { data: claims }, { data: attendances }, { data: workers }] =
    await Promise.all([
      supabase.from("sites").select("*").eq("id", id).maybeSingle(),
      supabase.from("site_contracts").select("*").eq("site_id", id),
      supabase.from("companies").select("*"),
      supabase.from("claims").select("*").eq("site_id", id).order("claim_month", { ascending: false }),
      supabase.from("attendances").select("*").eq("site_id", id),
      supabase.from("workers").select("*"),
    ]);

  if (!site) notFound();
  const s = site as Site;
  const companyMap = new Map((companies as Company[] | null)?.map((c) => [c.id, c]) ?? []);
  const workerMap = new Map((workers as Worker[] | null)?.map((w) => [w.id, w]) ?? []);

  const att = (attendances as Attendance[] | null) ?? [];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthAtt = att.filter((a) => a.work_date.startsWith(thisMonth));
  const monthManDays = monthAtt.reduce((sum, a) => sum + Number(a.man_day), 0);
  const activeWorkers = new Set(monthAtt.map((a) => a.worker_id));

  return (
    <div>
      <Link href="/prime/sites" className="text-sm text-gray-400 hover:text-gray-600">
        ← 현장 목록
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{s.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {s.address} · {formatDate(s.start_date)} ~ {formatDate(s.end_date)}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">하도급 계약</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">협력사</th>
                <th className="px-4 py-3">공종</th>
                <th className="px-4 py-3 text-right">계약금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {((contracts as SiteContract[] | null) ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {companyMap.get(c.sub_company_id)?.name}
                  </td>
                  <td className="px-4 py-3">{c.trade}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {wonShort(c.contract_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">이번 달 출역 인원</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{activeWorkers.size}명</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">이번 달 총 공수</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{monthManDays.toFixed(1)} 공수</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">누적 출역 기록</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{att.length}건</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">청구 이력</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {((claims as Claim[] | null) ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">청구 이력이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">청구월</th>
                  <th className="px-4 py-3">협력사</th>
                  <th className="px-4 py-3 text-right">노무비</th>
                  <th className="px-4 py-3 text-right">총액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {((claims as Claim[] | null) ?? []).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatMonth(c.claim_month)}</td>
                    <td className="px-4 py-3">{companyMap.get(c.sub_company_id)?.name}</td>
                    <td className="px-4 py-3 text-right">{won(c.labor_amount)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{won(c.total_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/prime/claims/${c.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        상세
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
