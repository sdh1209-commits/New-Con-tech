import Link from "next/link";

const FEATURES = [
  {
    title: "전자적 대금지급",
    desc: "원청사→협력사→근로자로 이어지는 대금 청구·승인·지급 전 과정을 투명하게 기록하여 임금 체불을 원천 차단합니다.",
    icon: "💳",
  },
  {
    title: "노무비 구분관리",
    desc: "노무비를 자재비·장비비와 분리해 관리하고, 근로자별 공수와 지급 내역까지 상세하게 추적합니다.",
    icon: "📋",
  },
  {
    title: "출역(근태) 관리",
    desc: "현장별 근로자 출역 기록을 관리하고, 월별 공수를 자동 집계해 청구서에 바로 반영합니다.",
    icon: "🏗️",
  },
];

const STATS = [
  { value: "260+", label: "이용 건설사" },
  { value: "725만", label: "누적 보호 근로자" },
  { value: "58조원", label: "연간 안전 지급액" },
  { value: "0건", label: "체불 발생" },
];

export default function Home() {
  return (
    <div className="flex-1">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-extrabold text-blue-700">New Con-tech</span>
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            데모 로그인
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-blue-600">
            건설 특화 전자적 대금지급시스템
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
            체불이 없는 세상,
            <br />
            <span className="text-blue-700">투명한 건설 현장</span>을 만듭니다
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            하도급 대금의 청구부터 지급까지, 근로자의 출역부터 임금 수령까지.
            건설 현장의 모든 돈의 흐름을 한 곳에서 관리하세요.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              데모 체험하기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">핵심 서비스</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="text-4xl">{f.icon}</div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-700">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-16 text-center sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-gray-400">
          New Con-tech — 노무비닷컴 스타일 데모 프로젝트 (실제 서비스가 아닙니다)
        </div>
      </footer>
    </div>
  );
}
