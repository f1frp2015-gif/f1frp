// Auth.js (NextAuth v5) — 国内侧 (f1frp.com / AI_PROFILE=domestic) 认证。
// 海外 getfrp.com 仍用 Clerk(运行时按 profile 分流,见 lib/auth/session.ts)。
// 会话:JWT 策略(无 DB adapter),token 里存本地 users.id。
// 需 env:AUTH_SECRET(JWT 签名;ECS 必设,Vercel 设了也无害)。
//
// Provider:
//   "wechat" — authorize 收的是"服务端已用 code 换好的" openid 等
//   (换 code 在 /api/auth/wechat/callback 里用 lib/auth/wechat-mp.ts 完成),
//   这里只负责认人(upsert users)+ 建会话,不直接调微信 API。
//   手机号 OTP provider 在阶段③加。
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { upsertWechatUser } from "@/lib/auth/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      id: "wechat",
      name: "WeChat",
      credentials: {
        openid: {},
        unionid: {},
        nickname: {},
        avatarUrl: {},
      },
      authorize: async (cred) => {
        const openid = typeof cred?.openid === "string" ? cred.openid : "";
        if (!openid) return null;
        const id = await upsertWechatUser({
          openid,
          unionid: typeof cred?.unionid === "string" ? cred.unionid : undefined,
          nickname: typeof cred?.nickname === "string" ? cred.nickname : undefined,
          avatarUrl:
            typeof cred?.avatarUrl === "string" ? cred.avatarUrl : undefined,
        });
        return { id };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) (token as { uid?: string }).uid = user.id;
      return token;
    },
    session({ session, token }) {
      const uid = (token as { uid?: string }).uid;
      if (session.user && uid) (session.user as { id?: string }).id = uid;
      return session;
    },
  },
});
