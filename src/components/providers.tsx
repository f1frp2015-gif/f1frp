import { ClerkProvider } from "@clerk/nextjs";
import { SessionProvider } from "next-auth/react";

// 认证 Provider 按 profile 分流:
//   wechat (f1frp.com / 国内) → Auth.js SessionProvider
//   clerk  (getfrp.com / 海外) → ClerkProvider(保留,海外侧不变)
// authMode 由 layout 依据 AI_PROFILE 传入(构建期固定,每个部署只走一支)。
export function Providers({
  children,
  authMode,
}: {
  children: React.ReactNode;
  authMode: "wechat" | "clerk";
}) {
  if (authMode === "wechat") {
    return <SessionProvider>{children}</SessionProvider>;
  }
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  );
}
