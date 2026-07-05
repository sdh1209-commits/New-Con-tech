import Link from "next/link";
import { notFound } from "next/navigation";
import ClaimDetail from "@/components/ClaimDetail";
import { approveClaim, payClaim, rejectClaim } from "@/app/actions";
import { getSupabase } from "@/lib/supabase";
import type { Claim, ClaimLaborItem, Company, Site, Worker } from "@/lib/types";

export default async function PrimeClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: claim } = await supabase.from("claims").select("*").eq("id", id).maybeSingle();
  if (!claim) notFound();
  const c = claim as Claim;

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
      <Link href="/prime/claims" className="text-sm text-gray-400 hover:text-gray-600">
        ← 청구 목록
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

      {c.status === "submitted" && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-gray-900">청구서 검토</h3>
          <p className="mt-1 text-sm text-gray-600">
            내역을 확인한 뒤 승인하거나 사유를 입력해 반려하세요.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={approveClaim}>
              <input type="hidden" name="claim_id" value={c.id} />
              <button className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700">
                승인
              </button>
            </form>
            <form action={rejectClaim} className="flex items-center gap-2">
              <input type="hidden" name="claim_id" value={c.id} />
              <input
                name="reason"
                placeholder="반려 사유"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                반려
              </button>
            </form>
          </div>
        </div>
      )}

      {c.status === "approved" && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-bold text-gray-900">대금 지급</h3>
          <p className="mt-1 text-sm text-gray-600">
            에스크로 전용계좌를 통해 노무비가 근로자에게 직접 지급됩니다. (데모 — 가상 처리)
          </p>
          <form action={payClaim} className="mt-4">
            <input type="hidden" name="claim_id" value={c.id} />
            <button className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700">
              지급 실행
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
