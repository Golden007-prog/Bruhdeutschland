import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Map } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

/** 404 — friendly not-found page with links back into the app. */
export default function NotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="That page doesn't exist. Use the navigation to get back on track."
      />

      <Card>
        <CardContent className="space-y-5 p-8 text-center">
          <p className="official-figure text-5xl font-bold text-muted-foreground/60" aria-hidden>
            404
          </p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            We couldn&apos;t find this dossier entry. The link may be out of date, or the page may
            have moved. Here are two good places to pick things back up.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Go to Dashboard
            </Link>
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <Map className="h-4 w-4" aria-hidden />
              View your Roadmap
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
