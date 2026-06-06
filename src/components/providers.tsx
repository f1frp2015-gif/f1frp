export function Providers({ children }: { children: React.ReactNode }) {
  // 自建手机/微信认证后不再需要 ClerkProvider;会话由 cookie + /api/auth/* 维护。
  return <>{children}</>;
}
