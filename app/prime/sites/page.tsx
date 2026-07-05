import Link from "next/link";
import { getSession } from "@/lib/auth";
import { formatDate, wonShort } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Company, Site, SiteContract } from "@/lib/types";

export default async function SitesPage() {
  const session = (await getSession())!;
  const supabase = getSupabase();

  const [{ data: sites }, { data: contracts }, { data: companies }] = await Promise.all([
    supabase.from("sites").select("*").eq("prime_company_id", session.entityId),
    supabase.from("site_contracts").select("*"),
    supabase.from("companies").select("*"),
  ]);

  const companyMap = new Map((companies as Company[] | null)?.map((c) => [c.id, c]) ?? []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">현장 관리</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {((sites as Site[] | null) ?? []).map((site) => {
          const siteContracts = ((contracts as SiteContract[] | null) ?? []).filter(
            (c) => c.site_id === site.id
          );
          const total = siteContracts.reduce((sum, c) => sum + c.contract_amount, 0);
          return (
            <Link
              key={site.id}
              href={`/prime/sites/${site.id}`}
              className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-gray-900">{site.name}</h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  진행중
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{site.address}</p>
              <p className="mt-1 text-xs text-gray-400">
                {formatDate(site.start_date)} ~ {formatDate(site.end_date)}
              </p>
              <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
                <p className="text-gray-500">
                  하도급 계약 {siteContracts.length}건 · 총 {wonShort(total)}
                </p>
                <p className="mt-1 text-gray-600">
                  {siteContracts
                    .map((c) => `${companyMap.get(c.sub_company_id)?.name}(${c.trade})`)
                    .join(", ")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
