import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/** The canonical advisory text required on all visa/finance/immigration output (CLAUDE.md §2.5). */
export const DISCLAIMER_TEXT =
  "Guidance only, not legal or financial advice. Verify visa, finance, and immigration details against official sources before acting.";

/**
 * The advisory disclaimer. Required on every finance/visa/immigration page. Rendered as an
 * `info` alert so it reads as a standing notice rather than an error.
 */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <Alert variant="info" className={cn("text-xs", className)}>
      <Info aria-hidden />
      <AlertDescription>{DISCLAIMER_TEXT}</AlertDescription>
    </Alert>
  );
}
