"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { DEMO_ACCOUNTS, Role, clearSession, getSession, setSession } from "@/lib/auth";

const HOME: Record<Role, string> = { prime: "/prime", sub: "/sub", worker: "/worker" };

export async function loginAs(role: Role) {
  const account = DEMO_ACCOUNTS[role];
  if (!account) redirect("/login");
  await setSession(account);
  redirect(HOME[role]);
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

/** 협력사: 특정 현장/날짜의 출역 일괄 저장 (공수 0 = 삭제) */
export async function saveAttendance(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "sub") redirect("/login");

  const siteId = String(formData.get("site_id"));
  const workDate = String(formData.get("work_date"));
  const supabase = getSupabase();

  const workerIds = formData.getAll("worker_id").map(String);
  for (const workerId of workerIds) {
    const manDay = Number(formData.get(`man_day_${workerId}`) ?? 0);
    if (manDay > 0) {
      const { error } = await supabase.from("attendances").upsert(
        {
          site_id: siteId,
          worker_id: workerId,
          work_date: workDate,
          man_day: manDay,
          check_in: "07:00",
          check_out: "17:00",
        },
        { onConflict: "site_id,worker_id,work_date" }
      );
      if (error) throw new Error(`출역 저장 실패: ${error.message}`);
    } else {
      await supabase
        .from("attendances")
        .delete()
        .eq("site_id", siteId)
        .eq("worker_id", workerId)
        .eq("work_date", workDate);
    }
  }
  revalidatePath("/sub/attendance");
  redirect(`/sub/attendance?site=${siteId}&date=${workDate}&saved=1`);
}

/** 협력사: 월별 청구서 생성 — 출역 집계로 노무비 자동 계산 */
export async function createClaim(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "sub") redirect("/login");

  const siteId = String(formData.get("site_id"));
  const claimMonth = String(formData.get("claim_month"));
  const materialAmount = Number(formData.get("material_amount") ?? 0);
  const equipmentAmount = Number(formData.get("equipment_amount") ?? 0);
  const supabase = getSupabase();

  // 이미 같은 현장/월 청구가 있으면 중복 생성 방지
  const { data: existing } = await supabase
    .from("claims")
    .select("id")
    .eq("site_id", siteId)
    .eq("sub_company_id", session.entityId)
    .eq("claim_month", claimMonth)
    .not("status", "eq", "rejected")
    .maybeSingle();
  if (existing) redirect(`/sub/claims/${existing.id}`);

  // 해당 월 출역 집계
  const { data: rows, error: attErr } = await supabase
    .from("attendances")
    .select("worker_id, man_day, workers!inner(daily_wage, sub_company_id)")
    .eq("site_id", siteId)
    .gte("work_date", `${claimMonth}-01`)
    .lte("work_date", `${claimMonth}-31`)
    .eq("workers.sub_company_id", session.entityId);
  if (attErr) throw new Error(attErr.message);

  const byWorker = new Map<string, { manDays: number; dailyWage: number }>();
  for (const r of rows ?? []) {
    const w = r.workers as unknown as { daily_wage: number };
    const cur = byWorker.get(r.worker_id) ?? { manDays: 0, dailyWage: w.daily_wage };
    cur.manDays += Number(r.man_day);
    byWorker.set(r.worker_id, cur);
  }

  const laborAmount = [...byWorker.values()].reduce(
    (sum, v) => sum + Math.round(v.manDays * v.dailyWage),
    0
  );

  const { data: claim, error: claimErr } = await supabase
    .from("claims")
    .insert({
      site_id: siteId,
      sub_company_id: session.entityId,
      claim_month: claimMonth,
      labor_amount: laborAmount,
      material_amount: materialAmount,
      equipment_amount: equipmentAmount,
      total_amount: laborAmount + materialAmount + equipmentAmount,
      status: "draft",
    })
    .select("id")
    .single();
  if (claimErr) throw new Error(claimErr.message);

  if (byWorker.size > 0) {
    const items = [...byWorker.entries()].map(([workerId, v]) => ({
      claim_id: claim.id,
      worker_id: workerId,
      man_days: v.manDays,
      daily_wage: v.dailyWage,
      amount: Math.round(v.manDays * v.dailyWage),
    }));
    const { error: itemErr } = await supabase.from("claim_labor_items").insert(items);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/sub/claims");
  redirect(`/sub/claims/${claim.id}`);
}

async function updateClaimStatus(
  claimId: string,
  requiredRole: Role,
  from: string[],
  patch: Record<string, unknown>
) {
  const session = await getSession();
  if (session?.role !== requiredRole) redirect("/login");
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("claims")
    .update(patch)
    .eq("id", claimId)
    .in("status", from)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("처리할 수 없는 상태의 청구서입니다.");
}

export async function submitClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id"));
  await updateClaimStatus(claimId, "sub", ["draft", "rejected"], {
    status: "submitted",
    submitted_at: new Date().toISOString(),
    reject_reason: null,
  });
  revalidatePath(`/sub/claims/${claimId}`);
  revalidatePath("/prime/claims");
}

export async function approveClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id"));
  await updateClaimStatus(claimId, "prime", ["submitted"], {
    status: "approved",
    approved_at: new Date().toISOString(),
  });
  revalidatePath(`/prime/claims/${claimId}`);
}

export async function rejectClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id"));
  const reason = String(formData.get("reason") ?? "").trim() || "사유 미기재";
  await updateClaimStatus(claimId, "prime", ["submitted"], {
    status: "rejected",
    reject_reason: reason,
  });
  revalidatePath(`/prime/claims/${claimId}`);
}

/** 원청사: 지급 실행 (데모 — 에스크로 이체 가상 처리) */
export async function payClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id"));
  await updateClaimStatus(claimId, "prime", ["approved"], {
    status: "paid",
    paid_at: new Date().toISOString(),
  });
  revalidatePath(`/prime/claims/${claimId}`);
  revalidatePath("/worker");
}
