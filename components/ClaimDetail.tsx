import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatMonth, won } from "@/lib/format";
import type { Claim, ClaimLaborItem, Company, Site, Worker } from "@/lib/types";

export default function ClaimDetail({
  claim,
  site,
  subCompany,
  items,
  workerMap,
}: {
  claim: Claim;
  site: Site;
  subCompany: Company;
  items: ClaimLaborItem[];
  workerMap: Map<string, Worker>;
}) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formatMonth(claim.claim_month)} 청구서
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {site.name} · {subCompany.name}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {claim.status === "rejected" && claim.reject_reason && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>반려 사유:</strong> {claim.reject_reason}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-blue-600">노무비 (구분관리)</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{won(claim.labor_amount)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">자재비</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{won(claim.material_amount)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">장비비</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{won(claim.equipment_amount)}</p>
        </div>
        <div className="rounded-xl border border-gray-900 bg-gray-900 p-5">
          <p className="text-sm text-gray-300">청구 총액</p>
          <p className="mt-1 text-xl font-bold text-white">{won(claim.total_amount)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-6 text-xs text-gray-400">
        <span>제출: {formatDate(claim.submitted_at)}</span>
        <span>승인: {formatDate(claim.approved_at)}</span>
        <span>지급: {formatDate(claim.paid_at)}</span>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">근로자별 노무비 상세</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {items.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">
              해당 월 출역 기록이 없어 노무비 상세가 비어 있습니다.
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
                {items.map((item) => {
                  const w = workerMap.get(item.worker_id);
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{w?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{w?.trade}</td>
                      <td className="px-4 py-3 text-right">{Number(item.man_days).toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">{won(item.daily_wage)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{won(item.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td className="px-4 py-3" colSpan={4}>
                    노무비 합계
                  </td>
                  <td className="px-4 py-3 text-right text-blue-700">
                    {won(claim.labor_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
