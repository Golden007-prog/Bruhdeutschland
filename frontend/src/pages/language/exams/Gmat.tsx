import { PageHeader } from "@/components/common/PageHeader";
import { MockExamPage } from "@/features/mock/MockExamPage";

/** GMAT Focus — live practice exam with KaTeX-rendered math (offline seed fallback). */
export default function ExamGmat() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · GMAT"
        title="GMAT Focus — practice exam"
        description="A timed GMAT Focus practice exam across Quantitative Reasoning, Verbal Reasoning, and Data Insights (math rendered with KaTeX)."
        category="language"
        fileRef="§ 15"
      />
      <MockExamPage examId="gmat" />
    </div>
  );
}
