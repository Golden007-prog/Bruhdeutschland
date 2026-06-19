import { PageHeader } from "@/components/common/PageHeader";
import { MockExamPage } from "@/features/mock/MockExamPage";

/** Goethe-Zertifikat — live CEFR-aligned German practice exam (offline seed fallback). */
export default function ExamGoethe() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · Goethe"
        title="Goethe-Zertifikat — practice exam"
        description="Ein zeitlich begrenzter, CEFR-orientierter Deutsch-Übungstest: Lesen, Hören (Audio), Schreiben und Sprechen."
        category="language"
        fileRef="§ 16"
      />
      <MockExamPage examId="goethe" />
    </div>
  );
}
