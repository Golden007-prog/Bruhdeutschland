import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface State {
  error: Error | null;
}

/**
 * App-level error boundary (work order §8F-56). Catches render-time crashes and shows a friendly
 * recovery screen instead of a white page — the user's data stays safe in localStorage. Class
 * component because React error boundaries require lifecycle methods.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Never log raw PII; a render error message + component stack is safe diagnostic data.
    console.error("DeutschPrep render error:", error.message, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page. Your data is safe on this device.
          Reloading usually fixes it.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className={cn(buttonVariants())}>
            Reload
          </button>
          <a href={import.meta.env.BASE_URL} className={cn(buttonVariants({ variant: "outline" }))}>
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }
}
