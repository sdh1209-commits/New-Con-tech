# New Con-tech

노무비닷컴 스타일의 **건설 특화 전자적 대금지급·출역관리 데모**입니다.
원청사 → 협력사 → 근로자로 이어지는 하도급 대금의 청구·승인·지급 흐름과
현장 출역(근태) 관리를 하나의 웹앱으로 구현했습니다.

> ⚠️ 데모/프로토타입 프로젝트입니다. 실제 은행 연동 없이 지급을 가상 처리하며,
> 인증은 역할 선택 방식의 데모 로그인, DB는 anon 전체 허용 RLS를 사용합니다.
> 실제 서비스 용도로 사용할 수 없습니다.

## 주요 기능

| 역할 | 기능 |
|---|---|
| **협력사** (한빛전기) | 근로자 출역(공수) 입력, 출역 자동집계 기반 월별 청구서 작성·제출 |
| **원청사** (대한건설) | 청구서 검토·승인·반려, 대금 지급 실행(가상), 현장·계약 현황 |
| **근로자** (홍길동) | 내 출역 내역, 지급예정 임금, 지급완료 내역 조회 |

- **노무비 구분관리**: 노무비를 자재비·장비비와 분리하고 근로자별 공수×일당 상세까지 추적
- **청구 상태 흐름**: 작성중 → 승인대기 → 승인완료 → 지급완료 (반려 시 재제출)

## 기술 스택

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript
- **Tailwind CSS 4**
- **Supabase** (Postgres) — 테이블: companies, sites, site_contracts, workers, attendances, claims, claim_labor_items

## 실행 방법

```bash
npm install
npm run dev
```

`.env.local`에 Supabase 접속 정보가 필요합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```

http://localhost:3000 접속 → **데모 로그인**에서 역할 선택.

## 데모 시나리오

1. **협력사**로 로그인 → 출역 관리에서 오늘 공수 입력 → 청구서 작성에서 자동집계 확인 후 생성·제출
2. **원청사**로 로그인 → 대시보드의 승인대기 청구 검토 → 승인 → 지급 실행
3. **근로자**로 로그인 → 지급완료 임금과 출역 기록 반영 확인
