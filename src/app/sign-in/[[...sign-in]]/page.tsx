import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = { title: "登录" };

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <SignIn />
    </div>
  );
}
