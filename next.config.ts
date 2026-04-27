import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === "ecs" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./messages/**/*.json"],
  },
};

export default withNextIntl(nextConfig);
