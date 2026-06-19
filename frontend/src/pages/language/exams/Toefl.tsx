import { PageHeader } from "@/components/common/PageHeader";
import { MockExamPage } from "@/features/mock/MockExamPage";

/** TOEFL iBT — live practice exam (AI-generated study aids; offline seed fallback). */
export default function ExamToefl() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · TOEFL"
        title="TOEFL iBT — practice exam"
        description="A timed TOEFL iBT practice exam across Reading, Listening, Writing, and Speaking. Note the Jan-2026 redesign (1–6 section scale)."
        category="language"
        fileRef="§ 14"
      />
      <MockExamPage examId="toefl" />
    </div>
  );
}
