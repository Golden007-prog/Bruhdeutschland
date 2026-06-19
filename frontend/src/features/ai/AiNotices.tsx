/**
 * Small shared notices for the live-AI feature paths: the "AI-generated — review before use"
 * label, the "no provider configured → Settings" alert, and a retry alert for other failures.
 * Centralising these keeps the seven pages consistent and accessible.
 */
import { Link } from "react-router-dom";
import { RefreshCw, Settings as SettingsIcon, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The mandatory label on any AI-generated output (work-order rule). */
export function AiGeneratedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={cn("gap-1", className)}>
      <Sparkles className="h-3 w-3" aria-hidden />
      AI-generated — review before use
    </Badge>
  );
}

/** Shown when generation failed because no provider is configured. Links to Settings. */
export function NoProviderAlert({ className }: { className?: string }) {
  return (
    <Alert variant="info" className={cn("text-xs", className)}>
      <SettingsIcon aria-hidden />
      <AlertDescription>
        No AI provider is set up, so this uses the built-in template instead. Add a free Google
        Gemini key in{" "}
        <Link to="/settings" className="font-medium underline">
          Settings
        </Link>{" "}
        to generate a tailored version.
      </AlertDescription>
    </Alert>
  );
}

/** Shown on a non-provider failure; keeps the template output and offers a retry. */
export function RetryAlert({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <Alert variant="warning" className={cn("text-xs", className)}>
      <RefreshCw aria-hidden />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
