import { Link } from "react-router-dom";
import { ArrowRight, Check, FolderCheck, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";

const DOCS = [
  { id: "transcript", label: "Transcript" },
  { id: "degree", label: "Degree / certificate" },
  { id: "cv", label: "CV" },
  { id: "sop", label: "SOP / motivation" },
  { id: "lor", label: "Recommendation letters" },
  { id: "language", label: "Language certificate" },
  { id: "passport", label: "Passport copy" },
  { id: "translations", label: "Certified translations" },
];

interface App { id: string; university: string; program: string }

/** G19 — Which document went to which application. A persisted doc × application matrix. */
export default function DocumentsVaultMatrix() {
  const [apps] = useSyncedState<App[]>("tracker:apps", []);
  const [sent, setSent] = useSyncedState<Record<string, boolean>>("vault:matrix", {});

  const toggle = (docId: string, appId: string) => {
    const key = `${docId}:${appId}`;
    setSent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G19 · Documents"
        title="Which document went to which application"
        description="When you're applying to several programmes, it's easy to lose track of what you've already sent where. This matrix keeps it straight — tick each document off per application."
        category="documents"
      />

      {apps.length === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Add the programmes you're applying to in the{" "}
            <Link to="/tracker" className="font-medium underline">application tracker</Link> (or from{" "}
            <Link to="/profile/matching" className="font-medium underline">matching</Link>), and they'll appear as columns here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/50 p-3 text-left font-medium">Document</th>
                {apps.map((a) => (
                  <th key={a.id} className="p-3 text-center font-medium">
                    <span className="block max-w-[8rem] truncate" title={`${a.program} · ${a.university}`}>{a.university || a.program}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCS.map((d, i) => (
                <tr key={d.id} className={cn("border-t", i % 2 && "bg-muted/20")}>
                  <td className="sticky left-0 bg-inherit p-3 font-medium">{d.label}</td>
                  {apps.map((a) => {
                    const on = !!sent[`${d.id}:${a.id}`];
                    return (
                      <td key={a.id} className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(d.id, a.id)}
                          aria-pressed={on}
                          aria-label={`${d.label} for ${a.university || a.program}: ${on ? "sent" : "not sent"}`}
                          className={cn("inline-flex h-6 w-6 items-center justify-center rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "border-emerald-500 bg-emerald-500 text-white" : "bg-card hover:bg-muted")}
                        >
                          {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderCheck className="h-4 w-4" aria-hidden /> Store the files themselves in the{" "}
        <Link to="/vault" className="font-medium text-primary hover:underline">document vault</Link>.
      </p>

      <Link to="/documents/lor-tracker" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Track recommendation letters <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
