import { PageHeader } from "@/components/common/PageHeader";
import { TESTAS_SEED, TESTAS_SPEC } from "@/lib/exam/banks/testas";
import { AptitudeMockPage } from "./AptitudeMockPage";

/**
 * TestAS — Core-module practice mock (gap G3-3). The previously guide-only TestAS page now has a timed,
 * deterministically-scored Core-module mock. Items are AI-generated study aids (fresh when a provider is
 * set; a bundled offline seed otherwise); the FORMAT facts are sourced inside {@link AptitudeMockPage}.
 */
export default function ExamTestas() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · TestAS"
        title="TestAS — Core module practice"
        description="A timed practice run of the TestAS Core module (Kerntest): quantitative problems, relationship reasoning, and number/pattern series — auto-scored so you can drill speed and pattern recognition."
        category="language"
      />
      <AptitudeMockPage spec={TESTAS_SPEC} seed={TESTAS_SEED} />
    </div>
  );
}
