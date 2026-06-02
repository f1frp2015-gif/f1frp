import { ClerkProvider } from "@clerk/nextjs";
import { SessionProvider } from "next-auth/react";
import { AuthModeProvider } from "@/lib/auth/auth-mode";

// 认证 Provider 按 profile 分流:
//   wechat (f1frp.com / 国内) → Auth.js SessionProvider
//   clerk  (getfrp.com / 海外) → ClerkProvider(保留,海外侧不变)
// authMode 由 layout 依据 AI_PROFILE 传入(构建期固定,每个部署只走一支)。
// AuthModeProvider 把模式透传给客户端组件(如 supplier-claim-button)做 hook 分流。
export function Providers({
  children,
  authMode,
}: {
  children: React.ReactNode;
  authMode: "wechat" | "clerk";
}) {
  if (authMode === "wechat") {
    return (
      <SessionProvider>
        <AuthModeProvider mode="wechat">{children}</AuthModeProvider>
      </SessionProvider>
    );
  }
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <AuthModeProvider mode="clerk">{children}</AuthModeProvider>
    </ClerkProvider>
  );
}
