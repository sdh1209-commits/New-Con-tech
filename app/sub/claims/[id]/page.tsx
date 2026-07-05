import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ClaimDetail from "@/components/ClaimDetail";
import { submitClaim } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { Claim, ClaimLaborItem, Company, Site, Worker } from "@/lib/types";

export default async function SubClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getSession())!;
  const { id } = await params;
  const supabase = getSupabase();

  const { data: claim } = await supabase.from("claims").select("*").eq("id", id).maybeSingle();
  if (!claim) notFound();
  const c = claim as Claim;
  if (c.sub_company_id !== session.entityId) redirect("/sub/claims");

  const [{ data: site }, { data: company }, { data: items }, { data: workers }] =
    await Promise.all([
      supabase.from("sites").select("*").eq("id", c.site_id).single(),
      supabase.from("companies").select("*").eq("id", c.sub_company_id).single(),
      supabase.from("claim_labor_items").select("*").eq("claim_id", id),
      supabase.from("workers").select("*"),
    ]);

  const workerMap = new Map((workers as Worker[] | null)?.map((w) => [w.id, w]) ?? []);

  return (
    <div>
      <Link href="/sub/claims" className="text-sm text-gray-400 hover:text-gray-600">
        ← 청구서 목록
      </Link>
      <div className="mt-2">
        <ClaimDetail
          claim={c}
          site={site as Site}
          subCompany={company as Company}
          items={(items as ClaimLaborItem[] | null) ?? []}
          workerMap={workerMap}
        />
      </div>

      {(c.status === "draft" || c.status === "rejected") && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="font-bold text-gray-900">
            {c.status === "rejected" ? "재제출" : "청구서 제출"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            제출하면 원청사({site ? (site as Site).name : ""} 발주처)가 검토 후 승인·지급합니다.
          </p>
          <form action={submitClaim} className="mt-4">
            <input type="hidden" name="claim_id" value={c.id} />
            <button className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700">
              원청사에 제출
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
