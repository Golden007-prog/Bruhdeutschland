import { Link } from "react-router-dom";
import { ExternalLink, History } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MockExamPage } from "@/features/mock/MockExamPage";
import { LegacyScoreInterpreter } from "@/features/mock/LegacyScoreInterpreter";

/** TOEFL iBT (2026) — live practice exam (AI-generated study aids; offline seed fallback). */
export default function ExamToefl() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstest · TOEFL"
        title="TOEFL iBT (2026) — practice exam"
        description="The current multistage-adaptive TOEFL: new task types across Reading, Listening, Writing, and Speaking, scored on the 1–6 CEFR-aligned band scale (with a 0–120 concordance through ~2028)."
        category="language"
        fileRef="§ 14"
      />
      <Alert variant="warning" className="text-xs">
        <AlertDescription>
          TOEFL was restructured on 21 Jan 2026 — these format facts are flagged for verification.
          Confirm against the{" "}
          <a href="https://www.ets.org/toefl.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline">
            official ETS TOEFL page <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          . Preparing against the old syllabus? Use the{" "}
          <Link to="/language/exams/toefl-legacy" className="inline-flex items-center gap-1 font-medium underline">
            <History className="h-3 w-3" aria-hidden /> legacy 0–120 practice
          </Link>
          .
        </AlertDescription>
      </Alert>
      <LegacyScoreInterpreter />
      <MockExamPage examId="toefl" />
    </div>
  );
}
