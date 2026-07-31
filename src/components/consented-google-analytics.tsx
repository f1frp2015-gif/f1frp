"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";

const COOKIE_KEY = "cookie-consent-v1";
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;

function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) === "accepted" : false;
}

export function ConsentedGoogleAnalytics({
  measurementId,
}: {
  measurementId?: string;
}) {
  const validId =
    measurementId && GA_ID_PATTERN.test(measurementId)
      ? measurementId
      : undefined;
  const allowed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("cookie-consent", onStoreChange);
      return () => window.removeEventListener("cookie-consent", onStoreChange);
    },
    hasAnalyticsConsent,
    () => false,
  );

  if (!validId || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${validId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${validId}',{'anonymize_ip':true});`}
      </Script>
    </>
  );
}
