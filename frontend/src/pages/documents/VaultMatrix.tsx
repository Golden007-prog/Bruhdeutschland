import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, FolderCheck, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";

interface CvForm { fullName?: string; [k: string]: unknown }
interface VaultItem { id: string; name: string; kind: string; note: string; url: string }
interface TransRow { id: string; document: string; status: string }
interface SopEntry { draft: string }

/**
 * Each matrix row carries an `exists` predicate over the document stores. When a row's underlying
 * draft/file is missing, ticking "sent" for it is blocked and flagged — so a stressed applicant can't
 * believe a document went out that was never written (gap G4-06). Rows we can't verify from a generator
 * (transcript, degree, passport) check the vault index; if nothing matches there, they stay un-gated
 * (the student may hold the file outside the app) but show a soft "not in your vault" hint.
 */
interface DocRow {
  id: string;
  label: string;
  /** Whether the underlying artefact exists in the app's stores. */
  exists: boolean;
  /** True when we can only *softly* check (file may live outside the app) — don't block, just hint. */
  soft: boolean;
  href: string;
}

interface App { id: string; university: string; program: string }

/** G19 / G4-06 — doc × application matrix that can't mark a non-existent document "sent". */
export default function DocumentsVaultMatrix() {
  const [apps] = useSyncedState<App[]>("tracker:apps", []);
  const [sent, setSent] = useSyncedState<Record<string, boolean>>("vault:matrix", {});

  // Read-only views of the document stores to decide whether each doc actually exists.
  const [sopMap] = useSyncedState<Record<string, SopEntry>>("doc:sop:byProgram", {});
  const [sopLegacy] = useSyncedState<string>("doc:sop:draft", "");
  const [cv] = useSyncedState<CvForm | null>("doc:cv:form", null);
  const [lor] = useSyncedState<string>("doc:lor:program", "");
  const [vaultItems] = useSyncedState<VaultItem[]>("vault:items", []);
  const [transRows] = useSyncedState<TransRow[]>("translation:tracker", []);

  const sopExists = sopLegacy.trim() !== "" || Object.values(sopMap).some((e) => e?.draft?.trim());
  const cvExists = !!cv && Object.values(cv).some((v) => typeof v === "string" && v.trim() !== "");
  const lorExists = lor.trim() !== "";
  const hasVaultKind = (kinds: string[]) => vaultItems.some((i) => kinds.includes(i.kind) && (i.name.trim() || i.url.trim()));
  const translationsExist = transRows.some((r) => r.status === "received") || hasVaultKind(["other"]);

  const rows: DocRow[] = [
    { id: "transcript", label: "Transcript", exists: hasVaultKind(["transcript"]), soft: true, href: "/vault" },
    { id: "degree", label: "Degree / certificate", exists: hasVaultKind(["certificate"]), soft: true, href: "/vault" },
    { id: "cv", label: "CV", exists: cvExists, soft: false, href: "/documents/cv" },
    { id: "sop", label: "SOP / motivation", exists: sopExists, soft: false, href: "/documents/sop" },
    { id: "lor", label: "Recommendation letters", exists: lorExists, soft: false, href: "/documents/lor" },
    { id: "language", label: "Language certificate", exists: hasVaultKind(["other", "certificate"]), soft: true, href: "/vault" },
    { id: "passport", label: "Passport copy", exists: hasVaultKind(["passport"]), soft: true, href: "/vault" },
    { id: "translations", label: "Certified translations", exists: translationsExist, soft: true, href: "/documents/translation-tracker" },
  ];

  const toggle = (row: DocRow, appId: string) => {
    const key = `${row.id}:${appId}`;
    const turningOn = !sent[key];
    // Hard-gate: a strict (generator-backed) row can't be marked sent when its draft is empty.
    if (turningOn && !row.exists && !row.soft) return;
    setSent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Surface any ticks that no longer have a backing document (e.g. the draft was cleared after ticking).
  const phantom = rows
    .filter((r) => !r.exists)
    .flatMap((r) => apps.filter((a) => sent[`${r.id}:${a.id}`]).map((a) => `${r.label} → ${a.university || a.program}`));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G19 · Documents"
        title="Which document went to which application"
        description="When you're applying to several programmes, it's easy to lose track of what you've already sent where. This matrix keeps it straight — and it won't let you tick a document that you haven't actually written yet."
        category="documents"
      />

      {phantom.length > 0 && (
        <Alert variant="warning" className="text-sm">
          <AlertTriangle aria-hidden />
          <AlertDescription>
            Marked sent but the document isn't in the app any more: {phantom.join("; ")}. Re-check before you rely on this.
          </AlertDescription>
        </Alert>
      )}

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
              {rows.map((d, i) => {
                const blocked = !d.exists && !d.soft;
                return (
                  <tr key={d.id} className={cn("border-t", i % 2 && "bg-muted/20")}>
                    <td className="sticky left-0 bg-inherit p-3 font-medium">
                      <span className="flex flex-col gap-0.5">
                        <span>{d.label}</span>
                        {blocked ? (
                          <Link to={d.href} className="inline-flex items-center gap-1 text-[0.7rem] font-normal text-amber-700 underline">
                            not written yet — start it <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                        ) : !d.exists && d.soft ? (
                          <span className="text-[0.7rem] font-normal text-muted-foreground">not in your vault</span>
                        ) : null}
                      </span>
                    </td>
                    {apps.map((a) => {
                      const on = !!sent[`${d.id}:${a.id}`];
                      return (
                        <td key={a.id} className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(d, a.id)}
                            disabled={blocked && !on}
                            aria-pressed={on}
                            aria-label={`${d.label} for ${a.university || a.program}: ${on ? "sent" : blocked ? "cannot mark sent — document not written" : "not sent"}`}
                            title={blocked && !on ? "Write this document first" : undefined}
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              on ? "border-emerald-500 bg-emerald-500 text-white" : "bg-card hover:bg-muted",
                              blocked && !on && "cursor-not-allowed opacity-40 hover:bg-card",
                            )}
                          >
                            {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
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
