import { createClaim } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { currentMonth, formatMonth, won } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Attendance, Site, SiteContract, Worker } from "@/lib/types";

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; month?: string }>;
}) {
  const session = (await getSession())!;
  const sp = await searchParams;
  const supabase = getSupabase();

  const [{ data: contracts }, { data: sites }, { data: workers }] = await Promise.all([
    supabase.from("site_contracts").select("*").eq("sub_company_id", session.entityId),
    supabase.from("sites").select("*"),
    supabase.from("workers").select("*").eq("sub_company_id", session.entityId),
  ]);

  const mySiteIds = ((contracts as SiteContract[] | null) ?? []).map((c) => c.site_id);
  const mySites = ((sites as Site[] | null) ?? []).filter((s) => mySiteIds.includes(s.id));
  const myWorkers = (workers as Worker[] | null) ?? [];
  const workerMap = new Map(myWorkers.map((w) => [w.id, w]));

  const siteId = sp.site && mySiteIds.includes(sp.site) ? sp.site : mySiteIds[0];
  const claimMonth = sp.month ?? currentMonth();

  // 미리보기: 해당 월 출역 집계
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("site_id", siteId)
    .gte("work_date", `${claimMonth}-01`)
    .lte("work_date", `${claimMonth}-31`)
    .in(
      "worker_id",
      myWorkers.length ? myWorkers.map((w) => w.id) : ["00000000-0000-0000-0000-000000000000"]
    );

  const byWorker = new Map<string, number>();
  for (const a of (attendances as Attendance[] | null) ?? []) {
    byWorker.set(a.worker_id, (byWorker.get(a.worker_id) ?? 0) + Number(a.man_day));
  }
  const preview = [...byWorker.entries()].map(([workerId, manDays]) => {
    const w = workerMap.get(workerId)!;
    return { worker: w, manDays, amount: Math.round(manDays * w.daily_wage) };
  });
  const laborTotal = preview.reduce((sum, p) => sum + p.amount, 0);

  // 월 선택 옵션 (최근 3개월)
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">청구서 작성</h1>
      <p className="mt-1 text-sm text-gray-500">
        선택한 월의 출역 기록으로 노무비가 자동 집계됩니다.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">현장</label>
          <select
            name="site"
            defaultValue={siteId}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {mySites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">청구월</label>
          <select
            name="month"
            defaultValue={claimMonth}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          집계 미리보기
        </button>
      </form>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-gray-900">
          노무비 자동 집계 — {formatMonth(claimMonth)}
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {preview.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">
              해당 월 출역 기록이 없습니다. 출역 관리에서 먼저 출역을 입력하세요.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">근로자</th>
                  <th className="px-4 py-3">직종</th>
                  <th className="px-4 py-3 text-right">공수</th>
                  <th className="px-4 py-3 text-right">일당</th>
                  <th className="px-4 py-3 text-right">노무비</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((p) => (
                  <tr key={p.worker.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.worker.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.worker.trade}</td>
                    <td className="px-4 py-3 text-right">{p.manDays.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">{won(p.worker.daily_wage)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{won(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td className="px-4 py-3" colSpan={4}>
                    노무비 합계
                  </td>
                  <td className="px-4 py-3 text-right text-blue-700">{won(laborTotal)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </section>

      <form action={createClaim} className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <input type="hidden" name="site_id" value={siteId} />
        <input type="hidden" name="claim_month" value={claimMonth} />
        <h3 className="font-bold text-gray-900">자재비·장비비 입력 (선택)</h3>
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">자재비 (원)</label>
            <input
              type="number"
              name="material_amount"
              defaultValue={0}
              min={0}
              step={10000}
              className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">장비비 (원)</label>
            <input
              type="number"
              name="equipment_amount"
              defaultValue={0}
              min={0}
              step={10000}
              className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
          청구서 생성 (작성중 상태로 저장)
        </button>
      </form>
    </div>
  );
}
