// Build-time gate ensuring the China-side (f1frp.com) bundle ships with an
// ICP filing number in the footer.
//
// Why this exists
// ───────────────
// 工信部《互联网信息服务管理办法》§4 + 《非经营性互联网信息服务备案管理办法》
// requires every domain pointing at a mainland-China-served site to display
// the ICP filing number on every page. f1frp.com is served from Aliyun ECS
// (Hangzhou), so the ICP number on the bundle is the difference between a
// legal site and one that gets pulled by 工信部 spider sweeps.
//
// The footer already reads `NEXT_PUBLIC_ICP_BEIAN` at render time
// (src/components/layout/footer.tsx:133), but a missing env on the build
// runner silently produces an empty string → footer renders no ICP → 备案
// breach without anyone noticing until the next 工信部 quarterly scan.
//
// This script makes that silent failure loud: when the build is destined
// for the zh deploy AND we're producing a production bundle, it fails the
// prebuild if no ICP is set.
//
// Triggers (all must be true to enforce):
//   1. NEXT_PUBLIC_LOCALES includes "zh"  (so we're building the zh bundle)
//   2. BUILD_TARGET === "ecs"             (production ECS deploy, not local)
//
// When the gate is not triggered (local dev, EN-only builds, preview) the
// script downgrades to a warning so it never blocks unrelated workflows.

const RAW_LOCALES = (process.env.NEXT_PUBLIC_LOCALES ?? "").trim();
const ICP = (process.env.NEXT_PUBLIC_ICP_BEIAN ?? "").trim();
const BUILD_TARGET = (process.env.BUILD_TARGET ?? "").trim();

const localesInclude = (code: string): boolean =>
  RAW_LOCALES === "" ||
  RAW_LOCALES.split(",").map((s) => s.trim()).includes(code);

const isZhBuild = localesInclude("zh");
const isProdEcsBuild = BUILD_TARGET === "ecs";

const MSG_BREACH =
  "[icp-check] FAIL — NEXT_PUBLIC_ICP_BEIAN is empty for a zh production " +
  "ECS build. Mainland-China-served sites must display an ICP filing " +
  "number on every page (工信部 ICP 备案管理办法). Set the GitHub " +
  "repository variable NEXT_PUBLIC_ICP_BEIAN (Settings → Secrets and " +
  "variables → Actions → Variables tab) to the filing number, then " +
  "re-run the deploy. Example: 蜀ICP备XXXXXXXX号";

const MSG_WARN =
  "[icp-check] WARN — NEXT_PUBLIC_ICP_BEIAN is unset; footer ICP line " +
  "will render empty. Acceptable for local dev / Vercel preview / EN-only " +
  "builds, NOT for the production ECS deploy.";

if (isZhBuild && isProdEcsBuild && !ICP) {
  console.error(MSG_BREACH);
  process.exit(1);
}

if (isZhBuild && !ICP) {
  console.warn(MSG_WARN);
} else if (isZhBuild && ICP) {
  console.log(`[icp-check] OK — zh build will display ICP "${ICP}".`);
}
