import { PageHeader } from "@/components/common/PageHeader";
import { MockExamPage } from "@/features/mock/MockExamPage";

/**
 * IELTS Academic — live full-length practice exam. Questions are AI-generated study aids (fresh every
 * time when a provider is set; an offline seed form otherwise). The section/scoring FORMAT is
 * official-grounded (cited inside MockExamPage from exam-specs provenance).
 */
export default function ExamIelts() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · IELTS"
        title="IELTS Academic — practice exam"
        description="A timed, full-length IELTS Academic practice exam: Listening (audio), Reading, Writing, and Speaking — auto-scored with an indicative band and review."
        category="language"
        fileRef="§ 14"
      />
      <MockExamPage examId="ielts" />
    </div>
  );
}
