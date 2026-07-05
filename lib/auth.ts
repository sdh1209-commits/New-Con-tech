import { cookies } from "next/headers";

export type Role = "prime" | "sub" | "worker";

export interface DemoSession {
  role: Role;
  /** prime/sub: 회사 id, worker: 근로자 id */
  entityId: string;
  name: string;
}

export const DEMO_ACCOUNTS: Record<Role, DemoSession> = {
  prime: {
    role: "prime",
    entityId: "11111111-1111-1111-1111-111111111101",
    name: "대한건설",
  },
  sub: {
    role: "sub",
    entityId: "11111111-1111-1111-1111-111111111102",
    name: "한빛전기",
  },
  worker: {
    role: "worker",
    entityId: "33333333-3333-3333-3333-333333333301",
    name: "홍길동",
  },
};

const COOKIE_NAME = "demo_session";

export async function getSession(): Promise<DemoSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (parsed.role && parsed.entityId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function setSession(session: DemoSession) {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
