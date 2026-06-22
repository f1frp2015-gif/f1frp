"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

// Pure client-side decision aid — no data, no network. Encodes the logic of the
// /sourcing/frp-baba-buy-america guide so a buyer self-screens before sending an
// RFQ. Deliberately conservative: anything unconfirmed resolves to "verify".
type Answer = "yes" | "no" | "unsure" | null;

type Tone = "excluded" | "eligible" | "caution";

interface Verdict {
  tone: Tone;
  title: string;
  body: string;
}

function computeVerdict(federal: Answer, permanent: Answer): Verdict | null {
  if (federal === null) return null;

  if (federal === "no") {
    return {
      tone: "eligible",
      title: "Outside Build America, Buy America",
      body: "Your project isn't receiving US federal financial assistance, so BABA doesn't apply — imported (including Chinese) FRP is eligible on its merits. Note that tariffs and trade-remedy duties (AD/CVD, Section 301) still apply to imports regardless of funding source.",
    };
  }

  if (federal === "unsure") {
    return {
      tone: "caution",
      title: "Confirm the funding source first",
      body: "If any US federal financial assistance flows into the project, assume BABA applies and that imported FRP is excluded unless a waiver is in hand. Check with the awarding agency or project counsel before committing to imported FRP.",
    };
  }

  // federal === "yes"
  if (permanent === null) return null;

  if (permanent === "yes") {
    return {
      tone: "excluded",
      title: "BABA likely applies — imported FRP generally excluded",
      body: "Federally funded and the FRP is a permanent part of the infrastructure → under Build America, Buy America, Chinese-origin FRP generally does not qualify unless the agency grants a waiver (non-availability, unreasonable cost, or public interest). Plan for domestic or domestically-finished FRP, or move this scope to a private/commercial project where imported FRP is a clean fit.",
    };
  }

  if (permanent === "no") {
    return {
      tone: "caution",
      title: "Possibly outside BABA's material scope — confirm",
      body: "BABA covers permanent materials incorporated into the infrastructure, not contractor tools or equipment. If the FRP is genuinely not a permanent part of the works it may fall outside scope — but the classification is the awarding agency's call, so confirm it with project counsel before relying on it.",
    };
  }

  // permanent === "unsure"
  return {
    tone: "caution",
    title: "Treat as BABA-applicable until confirmed",
    body: "Verify whether the FRP is a permanent part of the infrastructure. If it is, imported FRP is generally excluded on federally funded scope without an agency waiver.",
  };
}

const TONE_STYLES: Record<Tone, string> = {
  excluded: "border-red-500/40 bg-red-500/5",
  eligible: "border-emerald-500/40 bg-emerald-500/5",
  caution: "border-amber-500/40 bg-amber-500/5",
};

function QuestionGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Answer;
  onChange: (a: Answer) => void;
}) {
  const opts: { v: Exclude<Answer, null>; label: string }[] = [
    { v: "yes", label: "Yes" },
    { v: "no", label: "No" },
    { v: "unsure", label: "Not sure" },
  ];
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-medium text-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.v)}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/60"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function BuyAmericaChecker() {
  const [federal, setFederal] = useState<Answer>(null);
  const [permanent, setPermanent] = useState<Answer>(null);

  const showPermanent = federal === "yes";
  const verdict = computeVerdict(federal, permanent);

  return (
    <div>
      <QuestionGroup
        label="1. Is the project receiving any US federal financial assistance (grants, loans, federal infrastructure funding)?"
        value={federal}
        onChange={(a) => {
          setFederal(a);
          if (a !== "yes") setPermanent(null);
        }}
      />

      {showPermanent && (
        <QuestionGroup
          label="2. Is the FRP a permanent part of the infrastructure (incorporated into the works — not a contractor tool or piece of equipment)?"
          value={permanent}
          onChange={setPermanent}
        />
      )}

      {verdict ? (
        <div className={`mt-2 border p-5 ${TONE_STYLES[verdict.tone]}`}>
          <h2 className="text-base font-semibold tracking-tight">
            {verdict.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {verdict.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href={"/sourcing/frp-baba-buy-america" as never}
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              Read the full BABA guide
            </Link>
            <Link
              href={"/rfq" as never}
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              Talk to the sourcing desk
            </Link>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Answer the question{showPermanent ? "s" : ""} above to see whether
          imported FRP can be used on your project.
        </p>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        This checker is general guidance, not legal advice. BABA classification
        (manufactured product vs construction material) and waiver eligibility
        are the awarding agency&apos;s determination — confirm with project counsel
        before committing.
      </p>
    </div>
  );
}
