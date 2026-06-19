import { PageHeader } from "@/components/common/PageHeader";
import { MockExamPage } from "@/features/mock/MockExamPage";

/** GRE General — live practice exam with KaTeX-rendered math (offline seed fallback). */
export default function ExamGre() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · GRE"
        title="GRE General — practice exam"
        description="A timed GRE practice exam across Verbal Reasoning, Quantitative Reasoning (math rendered with KaTeX), and Analytical Writing."
        category="language"
        fileRef="§ 15"
      />
      <MockExamPage examId="gre" />
    </div>
  );
}
