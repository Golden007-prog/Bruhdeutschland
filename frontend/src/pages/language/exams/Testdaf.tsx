import { PageHeader } from "@/components/common/PageHeader";
import { MockExamPage } from "@/features/mock/MockExamPage";

/** TestDaF — live practice exam (German prompts + German TTS; offline seed fallback). */
export default function ExamTestdaf() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · TestDaF"
        title="TestDaF — practice exam"
        description="Ein zeitlich begrenzter TestDaF-Übungstest: Lesen, Hören (Audio), Schreiben und Sprechen — auf der TDN-3–5-Skala."
        category="language"
        fileRef="§ 16"
      />
      <MockExamPage examId="testdaf" />
    </div>
  );
}
