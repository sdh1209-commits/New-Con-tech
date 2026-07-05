import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { formatDate, formatMonth, won } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Claim, Company, Site } from "@/lib/types";

export default async function PrimeClaimsPage() {
  const session = (await getSession())!;
  const supabase = getSupabase();

  const [{ data: sites }, { data: claims }, { data: companies }] = await Promise.all([
    supabase.from("sites").select("*").eq("prime_company_id", session.entityId),
    supabase.from("claims").select("*").neq("status", "draft").order("created_at", { ascending: false }),
    supabase.from("companies").select("*"),
  ]);

  const siteMap = new Map((sites as Site[] | null)?.map((s) => [s.id, s]) ?? []);
  const companyMap = new Map((companies as Company[] | null)?.map((c) => [c.id, c]) ?? []);
  const list = ((claims as Claim[] | null) ?? []).filter((c) => siteMap.has(c.site_id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">청구/지급 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        협력사가 제출한 청구서를 검토·승인하고 대금을 지급합니다.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">현장</th>
              <th className="px-4 py-3">협력사</th>
              <th className="px-4 py-3">청구월</th>
              <th className="px-4 py-3 text-right">노무비</th>
              <th className="px-4 py-3 text-right">총액</th>
              <th className="px-4 py-3">제출일</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {siteMap.get(c.site_id)?.name}
                </td>
                <td className="px-4 py-3">{companyMap.get(c.sub_company_id)?.name}</td>
                <td className="px-4 py-3">{formatMonth(c.claim_month)}</td>
                <td className="px-4 py-3 text-right">{won(c.labor_amount)}</td>
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
