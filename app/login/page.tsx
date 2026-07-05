import Link from "next/link";
import { loginAs } from "@/app/actions";

const ROLES = [
  {
    role: "prime" as const,
    title: "원청사",
    name: "대한건설",
    desc: "청구서 검토·승인, 대금 지급 실행, 현장 전체 현황 관리",
    icon: "🏢",
  },
  {
    role: "sub" as const,
    title: "협력사",
    name: "한빛전기",
    desc: "근로자 출역 입력, 월별 청구서 작성·제출",
    icon: "⚡",
  },
  {
    role: "worker" as const,
    title: "근로자",
    name: "홍길동 (전기공)",
    desc: "내 출역 내역, 지급예정 임금, 지급완료 내역 조회",
    icon: "👷",
  },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-2 text-2xl font-extrabold text-blue-700">
        New Con-tech
      </Link>
      <p className="mb-10 text-gray-500">체험할 역할을 선택하세요 (데모 로그인)</p>
      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {ROLES.map((r) => (
          <form key={r.role} action={loginAs.bind(null, r.role)}>
            <button className="h-full w-full rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md">
              <div className="text-4xl">{r.icon}</div>
              <h2 className="mt-4 text-lg font-bold text-gray-900">{r.title}</h2>
              <p className="text-sm font-medium text-blue-600">{r.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{r.desc}</p>
            </button>
          </form>
        ))}
      </div>
      <p className="mt-10 text-xs text-gray-400">
        데모 프로젝트입니다. 별도의 비밀번호 없이 역할을 선택하면 로그인됩니다.
      </p>
    </div>
  );
}
