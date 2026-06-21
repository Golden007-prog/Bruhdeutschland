import { PageHeader } from "@/components/common/PageHeader";
import { TMS_SEED, TMS_SPEC } from "@/lib/exam/banks/tms";
import { AptitudeMockPage } from "./AptitudeMockPage";

/**
 * TMS — practice mock (gap G3-4). The previously guide-only TMS page now has timed, deterministically-
 * scored reasoning subtests (in German). Items are AI-generated study aids (fresh when a provider is set;
 * a bundled offline seed otherwise); the FORMAT facts are sourced inside {@link AptitudeMockPage}. The
 * real TMS transitions to "TMSnat" from spring 2027 — verify the current format on the official site.
 */
export default function ExamTms() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · TMS"
        title="TMS — Übungstest (practice)"
        description="A timed practice run of TMS reasoning subtests (in German): quantitative/formal problems and number-pattern matching — auto-scored so you can drill speed and concentration under time pressure."
        category="language"
      />
      <AptitudeMockPage spec={TMS_SPEC} seed={TMS_SEED} />
    </div>
  );
}
