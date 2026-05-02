import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === "ecs" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./messages/**/*.json"],
  },
  // ali-oss has dynamic optional require('proxy-agent') that breaks bundling.
  // Mark as external so it's resolved at runtime (server-only anyway).
  serverExternalPackages: ["ali-oss"],
};

export default withNextIntl(nextConfig);
