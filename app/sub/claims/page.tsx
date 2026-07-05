import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { formatDate, formatMonth, won } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Claim, Site } from "@/lib/types";

export default async function SubClaimsPage() {
  const session = (await getSession())!;
  const supabase = getSupabase();

  const [{ data: claims }, { data: sites }] = await Promise.all([
    supabase
      .from("claims")
      .select("*")
      .eq("sub_company_id", session.entityId)
      .order("created_at", { ascending: false }),
    supabase.from("sites").select("*"),
  ]);

  const siteMap = new Map((sites as Site[] | null)?.map((s) => [s.id, s]) ?? []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">청구서 관리</h1>
        <Link
          href="/sub/claims/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 청구서 작성
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">현장</th>
              <th className="px-4 py-3">청구월</th>
              <th className="px-4 py-3 text-right">노무비</th>
              <th className="px-4 py-3 text-right">총액</th>
              <th className="px-4 py-3">제출일</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {((claims as Claim[] | null) ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {siteMap.get(c.site_id)?.name}
                </td>
                <td className="px-4 py-3">{formatMonth(c.claim_month)}</td>
                <td className="px-4 py-3 text-right">{won(c.labor_amount)}</td>
                <td className="px-4 py-3 text-right font-semibold">{won(c.total_amount)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(c.submitted_at)}</td>
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
    </div>
  );
}
