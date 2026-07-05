import { saveAttendance } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { todayStr } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Attendance, Site, SiteContract, Worker } from "@/lib/types";

const MAN_DAY_OPTIONS = [
  { value: 0, label: "결근" },
  { value: 0.5, label: "0.5 공수" },
  { value: 1.0, label: "1.0 공수" },
  { value: 1.5, label: "1.5 공수" },
];

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; date?: string; saved?: string }>;
}) {
  const session = (await getSession())!;
  const sp = await searchParams;
  const supabase = getSupabase();

  const [{ data: contracts }, { data: sites }, { data: workers }] = await Promise.all([
    supabase.from("site_contracts").select("*").eq("sub_company_id", session.entityId),
    supabase.from("sites").select("*"),
    supabase.from("workers").select("*").eq("sub_company_id", session.entityId).order("name"),
  ]);

  const mySiteIds = ((contracts as SiteContract[] | null) ?? []).map((c) => c.site_id);
  const mySites = ((sites as Site[] | null) ?? []).filter((s) => mySiteIds.includes(s.id));

  const siteId = sp.site && mySiteIds.includes(sp.site) ? sp.site : mySiteIds[0];
  const workDate = sp.date ?? todayStr();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("site_id", siteId)
    .eq("work_date", workDate);
  const attMap = new Map(
    ((attendances as Attendance[] | null) ?? []).map((a) => [a.worker_id, Number(a.man_day)])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">출역 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        현장과 날짜를 선택하고 근로자별 공수를 입력하세요.
      </p>

      {sp.saved && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          출역이 저장되었습니다.
        </div>
      )}

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
          <label className="mb-1 block text-xs font-medium text-gray-500">작업일</label>
          <input
            type="date"
            name="date"
            defaultValue={workDate}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          조회
        </button>
      </form>

      <form action={saveAttendance} className="mt-6">
        <input type="hidden" name="site_id" value={siteId} />
        <input type="hidden" name="work_date" value={workDate} />
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">근로자</th>
                <th className="px-4 py-3">직종</th>
                <th className="px-4 py-3 text-right">일당</th>
                <th className="px-4 py-3">공수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {((workers as Worker[] | null) ?? []).map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {w.name}
                    <input type="hidden" name="worker_id" value={w.id} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{w.trade}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {w.daily_wage.toLocaleString("ko-KR")}원
                  </td>
                  <td className="px-4 py-3">
                    <select
                      name={`man_day_${w.id}`}
                      defaultValue={attMap.get(w.id) ?? 0}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
                    >
                      {MAN_DAY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
          출역 저장
        </button>
      </form>
    </div>
  );
}
