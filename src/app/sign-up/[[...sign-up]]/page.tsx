import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "注册" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <SignUp />
    </div>
  );
}
