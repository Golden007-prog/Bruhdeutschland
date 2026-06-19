import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MockExamPage } from "@/features/mock/MockExamPage";

/** TOEFL iBT — LEGACY (pre-2026, 0–120) practice exam, kept for students still holding old scores. */
export default function ExamToeflLegacy() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · TOEFL legacy"
        title="TOEFL iBT (legacy 0–120) — practice exam"
        description="The retired pre-2026 TOEFL format on the 0–120 scale. Use this only if you're preparing against an old syllabus or interpreting a score you already hold."
        category="language"
      />
      <Alert variant="warning" className="text-xs">
        <AlertDescription>
          This format was retired on 21 Jan 2026. For a test you're booking now, use the{" "}
          <Link to="/language/exams/toefl" className="inline-flex items-center gap-1 font-medium underline">
            <ArrowLeft className="h-3 w-3" aria-hidden /> current TOEFL (2026)
          </Link>{" "}
          instead.
        </AlertDescription>
      </Alert>
      <MockExamPage examId="toefl-legacy" />
    </div>
  );
}
