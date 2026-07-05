import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { currentMonth, formatDate, formatMonth, won } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Attendance, Claim, ClaimLaborItem, Site, Worker } from "@/lib/types";

export default async function WorkerPage() {
  const session = (await getSession())!;
  const supabase = getSupabase();

  const [{ data: worker }, { data: attendances }, { data: items }, { data: sites }] =
    await Promise.all([
      supabase.from("workers").select("*").eq("id", session.entityId).single(),
      supabase
        .from("attendances")
        .select("*")
        .eq("worker_id", session.entityId)
        .order("work_date", { ascending: false }),
      supabase.from("claim_labor_items").select("*").eq("worker_id", session.entityId),
      supabase.from("sites").select("*"),
    ]);

  const w = worker as Worker;
  const att = (attendances as Attendance[] | null) ?? [];
  const myItems = (items as ClaimLaborItem[] | null) ?? [];
  const siteMap = new Map((sites as Site[] | null)?.map((s) => [s.id, s]) ?? []);

  const claimIds = myItems.map((i) => i.claim_id);
  const { data: claims } = await supabase
    .from("claims")
    .select("*")
    .in("id", claimIds.length ? claimIds : ["00000000-0000-0000-0000-000000000000"])
    .order("claim_month", { ascending: false });
  const claimMap = new Map(((claims as Claim[] | null) ?? []).map((c) => [c.id, c]));

  const wageRows = myItems
    .map((i) => ({ item: i, claim: claimMap.get(i.claim_id) }))
    .filter((r): r is { item: ClaimLaborItem; claim: Claim } => !!r.claim && r.claim.status !== "draft")
    .sort((a, b) => b.claim.claim_month.localeCompare(a.claim.claim_month));

  const expected = wageRows
    .filter((r) => r.claim.status === "submitted" || r.claim.status === "approved")
    .reduce((sum, r) => sum + r.item.amount, 0);
  const received = wageRows
    .filter((r) => r.claim.status === "paid")
    .reduce((sum, r) => sum + r.item.amount, 0);

  const monthAtt = att.filter((a) => a.work_date.startsWith(currentMonth()));
  const monthManDays = monthAtt.reduce((sum, a) => sum + Number(a.man_day), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">내 출역/임금</h1>
      <p className="mt-1 text-sm text-gray-500">
        {w.name} · {w.trade} · 일당 {won(w.daily_wage)}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <KpiCard label="이번 달 출역" value={`${monthAtt.length}일`} />
        <KpiCard label="이번 달 공수" value={`${monthManDays.toFixed(1)} 공수`} />
        <KpiCard label="지급예정 임금" value={won(expected)} accent={expected > 0} sub="청구·승인 진행 중" />
        <KpiCard label="수령 완료 임금" value={won(received)} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-900">임금 지급 내역</h2>
        <p className="mt-1 text-xs text-gray-400">
          소속 협력사의 청구서에 포함된 내 노무비 기준입니다. 체불이 발생하면 즉시 신고할 수 있습니다.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {wageRows.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">지급 내역이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">대상월</th>
                  <th className="px-4 py-3">현장</th>
                  <th className="px-4 py-3 text-right">공수</th>
                  <th className="px-4 py-3 text-right">임금</th>
                  <th className="px-4 py-3">지급일</th>
                  <th className="px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wageRows.map(({ item, claim }) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{formatMonth(claim.claim_month)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {siteMap.get(claim.site_id)?.name}
                    </td>
                    <td className="px-4 py-3 text-right">{Number(item.man_days).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{won(item.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(claim.paid_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={claim.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-900">최근 출역 기록</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">작업일</th>
                <th className="px-4 py-3">현장</th>
                <th className="px-4 py-3">출퇴근</th>
                <th className="px-4 py-3 text-right">공수</th>
                <th className="px-4 py-3 text-right">일액 (공수×일당)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {att.slice(0, 15).map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{a.work_date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {siteMap.get(a.site_id)?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.check_in?.slice(0, 5)} ~ {a.check_out?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-right">{Number(a.man_day).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {won(Math.round(Number(a.man_day) * w.daily_wage))}
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
