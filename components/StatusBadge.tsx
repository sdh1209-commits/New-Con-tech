import type { ClaimStatus } from "@/lib/types";

const CONFIG: Record<ClaimStatus, { label: string; className: string }> = {
  draft: { label: "작성중", className: "bg-gray-100 text-gray-600" },
  submitted: { label: "승인대기", className: "bg-amber-100 text-amber-700" },
  approved: { label: "승인완료", className: "bg-blue-100 text-blue-700" },
  rejected: { label: "반려", className: "bg-red-100 text-red-700" },
  paid: { label: "지급완료", className: "bg-emerald-100 text-emerald-700" },
};

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
