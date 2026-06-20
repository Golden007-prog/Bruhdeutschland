import { Link } from "react-router-dom";
import { ArrowRight, BellRing, Briefcase, Building2, ClipboardList, Coins, GraduationCap, Landmark, MapPin, School, Stamp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STEPS: { to: string; icon: LucideIcon; title: string; desc: string; when: string }[] = [
  { to: "/arrival/anmeldung-runbook", icon: MapPin, title: "Register your address (Anmeldung)", desc: "Within 14 days of moving in — it unlocks almost everything else.", when: "Week 1" },
  { to: "/arrival/bank-account", icon: Landmark, title: "Open a German bank account", desc: "Unblocks your Sperrkonto payouts, rent, and salary.", when: "Week 1–2" },
  { to: "/arrival/enrolment", icon: GraduationCap, title: "Enrol (Immatrikulation)", desc: "Admission letter → student place + Matrikelnummer.", when: "Week 1–2" },
  { to: "/arrival/residence-permit", icon: Stamp, title: "Convert your visa → residence permit", desc: "Book the Ausländerbehörde before the entry visa expires.", when: "Month 1–3" },
  { to: "/arrival/university-onboarding", icon: School, title: "Onboard at the university", desc: "Student ID, email, IT, course & exam registration.", when: "Weeks 1–4" },
  { to: "/arrival/rundfunkbeitrag", icon: Coins, title: "Set up bills (Rundfunkbeitrag, utilities)", desc: "The mandatory broadcasting fee and household bills.", when: "Month 1" },
  { to: "/arrival/renewals", icon: BellRing, title: "Track renewals & Rückmeldung", desc: "Permit renewal and each semester's re-registration.", when: "Ongoing" },
  { to: "/arrival/job-seeker-permit", icon: Briefcase, title: "Plan your post-study stay", desc: "The 18-month job-seeker permit after graduation.", when: "Final year" },
  { to: "/arrival/family-reunion", icon: Users, title: "Bring your family (if applicable)", desc: "Family-reunion visa for a spouse or children.", when: "As needed" },
];

/** Arrival hub (gap G27, G38–G47) — the journey tail the roadmap previously stopped short of. */
export default function ArrivalOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 8 · Arrival"
        title="Arrival & settling in"
        description="The steps nobody warns you about — the ones after you land. This is the journey tail: register, bank, enrol, convert your visa, and stay on top of the recurring deadlines."
      />

      <Alert variant="info" className="text-sm">
        <Building2 aria-hidden />
        <AlertDescription>
          Rough order matters more than exact dates. <strong>Anmeldung first</strong> (it gates the bank
          account and residence permit), then bank, enrolment, and the permit conversion before your entry
          visa expires.
        </AlertDescription>
      </Alert>

      <ol className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.to}>
              <Link to={s.to} className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="official-figure text-xs text-muted-foreground">{s.when}</span>
                </div>
                <h2 className="mt-3 font-semibold tracking-tight">{s.title}</h2>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
        <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
        Every checklist here saves to your account, so you can tick items off as you go.
      </p>
    </div>
  );
}
