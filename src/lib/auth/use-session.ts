"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  enterpriseId: string | null;
};

type State = { user: SessionUser | null; isLoaded: boolean };

/**
 * 客户端会话状态 —— 替代 Clerk 的 useAuth()/useUser()。
 * 拉取 /api/auth/me 一次;signOut() 调用 /api/auth/logout 后整页刷新。
 */
export function useSession(): State & { signOut: () => Promise<void> } {
  const [state, setState] = useState<State>({ user: null, isLoaded: false });

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        if (alive) setState({ user: d?.user ?? null, isLoaded: true });
      })
      .catch(() => {
        if (alive) setState({ user: null, isLoaded: true });
      });
    return () => {
      alive = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/");
  }, []);

  return { ...state, signOut };
}
