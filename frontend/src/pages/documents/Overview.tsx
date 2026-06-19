import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  FileBadge,
  FileCheck,
  Languages,
  PenLine,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATION_DOCS } from "@/lib/seed/checklists";

interface ToolLink {
  href: string;
  icon: LucideIcon;
  title: string;
  feature: string;
  description: string;
}

const TOOLS: ToolLink[] = [
  {
    href: "/documents/sop",
    icon: PenLine,
    title: "Statement of Purpose",
    feature: "Feature 06",
    description: "Assemble a structured SOP draft from your profile and a target program.",
  },
  {
    href: "/documents/cv",
    icon: FileBadge,
    title: "Europass CV builder",
    feature: "Feature 07",
    description: "Build a CV in the European standard format German universities recognise.",
  },
  {
    href: "/documents/lor",
    icon: ScrollText,
    title: "Recommendation letters",
    feature: "Feature 08",
    description: "Give referees a tailored draft with placeholders they fill in.",
  },
  {
    href: "/documents/uni-assist",
    icon: ClipboardList,
    title: "Uni-Assist walkthrough",
    feature: "Feature 09",
    description: "Step through account, programs, documents, fees, and submission.",
  },
  {
    href: "/documents/vpd",
    icon: FileCheck,
    title: "VPD tracker",
    feature: "Feature 10",
    description: "Track the Vorprüfungsdokumentation some universities require.",
  },
  {
    href: "/documents/translation",
    icon: Languages,
    title: "Translation assistant",
    feature: "Feature 11",
    description: "See which documents need certified translations — and which don't.",
  },
];

/** Document Prep — landing page linking to the six tools, with a document checklist. */
export default function DocumentsOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich B · Document Prep"
        title="Document Prep"
        description="Draft and track every document an application needs: SOP, CV, recommendation letters, the uni-assist workflow, the VPD, and certified translations."
        category="documents"
      />

      <Card>
        <CardHeader>
          <CardTitle>What a complete application needs</CardTitle>
          <CardDescription>
            Most German public universities ask for a certified degree and transcript, a CV, a
            statement of purpose, and proof of language ability — submitted either through{" "}
            <span className="font-medium text-foreground">uni-assist</span> or{" "}
            <span className="font-medium text-foreground">directly to the university</span>, depending
            on the program. Recommendation letters and a GRE/GMAT score are required only by some
            programs. Build each document below, then track it against the checklist.
          </CardDescription>
        </CardHeader>
      </Card>

      <section aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="eyebrow mb-3">
          Tools · Werkzeuge
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                to={tool.href}
                className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full border-l-2 border-l-category-documents transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-category-documents/10 text-category-documents">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="eyebrow">{tool.feature}</span>
                    </div>
                    <CardTitle className="mt-2 flex items-center gap-1 text-base">
                      {tool.title}
                      <ArrowRight
                        className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Checklist items={APPLICATION_DOCS} title="Application documents" />
    </div>
  );
}
