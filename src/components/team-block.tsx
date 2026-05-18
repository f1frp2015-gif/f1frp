import { ExternalLink, Languages, MapPin, UserRound } from "lucide-react";
import { team, type TeamMember } from "@/lib/data/team";

// Renders the team strip on /about (EN). Each card includes role, location,
// languages, optional bio, and a LinkedIn link if the member has consented
// to publish their profile. Anonymous-by-default — names only render after
// the data file is populated.
//
// Generates an avatar from the member's name initials, or a generic person
// icon if anonymous. Keeps the visual rhythm even before names ship.

interface Props {
  className?: string;
  items?: readonly TeamMember[];
}

export function TeamBlock({ className, items }: Props) {
  const list = items ?? team;
  if (list.length === 0) return null;

  return (
    <section className={`mt-12 ${className ?? ""}`}>
      <div className="mb-6 border-b border-border/70 pb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          TEAM
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Who you&apos;ll actually talk to
        </h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          The sourcing desk is run by composites engineers based in China —
          fluent in Mandarin and working in English. The names below
          anonymize until each member has consented to a public profile;
          ask any of us for a LinkedIn intro by email and we&apos;ll connect.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <TeamCard key={m.id} member={m} />
        ))}
      </div>
    </section>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const initials = member.name
    ? member.name
        .split(/\s+/)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2)
    : null;

  return (
    <div className="flex flex-col gap-3 border border-border/70 bg-background p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-foreground/80">
          {initials ? (
            <span className="font-mono text-sm font-semibold">{initials}</span>
          ) : (
            <UserRound size={20} strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight">
            {member.name ?? "Anonymized until consent"}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {member.role}
          </div>
        </div>
        {member.linkedinUrl && (
          <a
            href={member.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`${member.name ?? member.role} on LinkedIn`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            LinkedIn
            <ExternalLink size={10} />
          </a>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} />
          {member.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Languages size={11} />
          {member.languages.join(" · ")}
        </span>
      </div>
      {member.bio && (
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {member.bio}
        </p>
      )}
    </div>
  );
}
