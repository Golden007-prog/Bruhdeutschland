import { Link } from "react-router-dom";
import { ArrowRight, Building2, GraduationCap, Info, School } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const INSTITUTIONS = [
  { name: "Universität", icon: GraduationCap, detail: "Research-oriented, theory-heavy, the full range of subjects incl. Medicine and Law. Awards Bachelor → Master → and the right to pursue a doctorate (PhD)." },
  { name: "Technische Universität (TU)", icon: Building2, detail: "A university with a strong engineering / natural-sciences focus (e.g. TU München, RWTH Aachen). Same degrees + doctorate rights as a Universität." },
  { name: "Fachhochschule (FH) / University of Applied Sciences (HAW)", icon: School, detail: "Practice-oriented, with mandatory internships and close industry links. Bachelor & Master; a doctorate usually needs a partner university. An FH-Studienkolleg only qualifies you for FHs." },
];

const SCHOOL = [
  { stage: "Grundschule", detail: "Primary school (grades 1–4, sometimes 1–6)." },
  { stage: "Then one of:", detail: "Gymnasium (academic track → Abitur), Realschule (mid-level → Mittlere Reife), Hauptschule, or Gesamtschule (comprehensive)." },
  { stage: "Abitur", detail: "The Gymnasium leaving exam — the general higher-education entrance qualification (Hochschulreife). This is the benchmark your foreign HZB is compared against." },
];

/** Long-game §7 — German education-system explainer (institution types + school structure + HZB context). */
export default function CareerEducationSystem() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="§ Orientation"
        title="How the German education system works"
        description="A quick orientation so the rest makes sense: the kinds of higher-education institution (and why FH vs Uni matters), and the school structure behind the Abitur your qualification is measured against."
        category="profile"
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Higher education — three kinds of institution</h2>
        <div className="grid gap-3">
          {INSTITUTIONS.map((inst) => {
            const Icon = inst.icon;
            return (
              <div key={inst.name} className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-category-profile" aria-hidden /> {inst.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{inst.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          <strong>FH vs Universität matters for two things:</strong> a doctorate (easier from a Universität),
          and the Studienkolleg type — a <strong>University</strong>-Studienkolleg qualifies you for all
          institutions, an <strong>FH</strong>-Studienkolleg only for Fachhochschulen. For most careers and
          the immigration ladder, the degree LEVEL matters more than the institution type.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The school structure (where the Abitur comes from)</h2>
        <ul className="space-y-2">
          {SCHOOL.map((s) => (
            <li key={s.stage} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{s.stage}</p>
              <p className="mt-0.5 text-muted-foreground">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Why this matters for you: your foreign certificate is recognised by comparing it to the{" "}
          <strong>Abitur</strong> via anabin/ZAB into the HZB categories. If it isn't Abitur-equivalent, the
          Studienkolleg route bridges the gap.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/recognition" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Check your recognition (HZB) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/profile/studienkolleg" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Studienkolleg route <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("germanEducationSystem"), source("anabin"), source("studyInGermany")]} />
    </div>
  );
}
