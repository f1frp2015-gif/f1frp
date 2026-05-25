"use client";

// 客户端读取当前认证模式(domestic=wechat / global=clerk),供需要分流 Clerk vs
// Auth.js 客户端 hook 的组件使用。由 Providers 依 AI_PROFILE 注入。
import { createContext, useContext, type ReactNode } from "react";

export type AuthMode = "wechat" | "clerk";

const AuthModeContext = createContext<AuthMode>("clerk");

export function AuthModeProvider({
  mode,
  children,
}: {
  mode: AuthMode;
  children: ReactNode;
}) {
  return (
    <AuthModeContext.Provider value={mode}>{children}</AuthModeContext.Provider>
  );
}

export function useAuthMode(): AuthMode {
  return useContext(AuthModeContext);
}
