import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, FolderLock, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/doc/export";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/** Default the Translation assistant ships with — an untouched note should read as "not started". */
const TRANSLATION_DEFAULT = `Translation request — working note (NOT a certified translation)

Language pair: [source language] -> German / English
Deadline: [date]

Documents to translate:
- [ ] Bachelor's degree certificate
- [ ] Transcript of records
- [ ] [other]

Notes for the translator:
- Please provide a certified (sworn) translation with stamp.
- University requires the translation stapled to a certified copy of the original: [yes/no].
`;

interface CvForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: string;
  experience: string;
  skills: string;
  languages: string;
}

const KIND_OPTIONS = [
  { value: "transcript", label: "Transcript" },
  { value: "certificate", label: "Certificate / degree" },
  { value: "passport", label: "Passport / ID" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
] as const;

type VaultKind = (typeof KIND_OPTIONS)[number]["value"];

const KIND_LABEL: Record<VaultKind, string> = Object.fromEntries(
  KIND_OPTIONS.map((o) => [o.value, o.label]),
) as Record<VaultKind, string>;

interface VaultItem {
  id: string;
  name: string;
  kind: VaultKind;
  note: string;
  url: string;
}

interface GeneratedDoc {
  title: string;
  href: string;
  started: boolean;
}

/** Document vault (Feature 10 companion) — a single index of generated documents plus tracked links. */
export default function DocumentsVault() {
  // Read-only views of the document generators' persisted state to surface "Drafted" badges.
  const [sop] = useSyncedState<string>("doc:sop:draft", "");
  const [cv] = useSyncedState<CvForm | null>("doc:cv:form", null);
  const [lor] = useSyncedState<string>("doc:lor:program", "");
  const [translation] = useSyncedState<string>("doc:translation:draft", TRANSLATION_DEFAULT);

  const cvStarted = !!cv && Object.values(cv).some((v) => typeof v === "string" && v.trim() !== "");
  const translationStarted =
    translation.trim() !== "" && translation.trim() !== TRANSLATION_DEFAULT.trim();

  const generated: GeneratedDoc[] = [
    { title: "Statement of Purpose", href: "/documents/sop", started: sop.trim() !== "" },
    { title: "Europass CV", href: "/documents/cv", started: cvStarted },
    { title: "Recommendation letters", href: "/documents/lor", started: lor.trim() !== "" },
    { title: "Translation note", href: "/documents/translation", started: translationStarted },
  ];

  // Editable list of other documents the user tracks (metadata + links only — no file binaries).
  const [items, setItems] = useSyncedState<VaultItem[]>("vault:items", []);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<VaultKind>("transcript");
  const [url, setUrl] = useState("");

  const addItem = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      { id: uid("doc"), name: trimmed, kind, note: "", url: url.trim() },
    ]);
    setName("");
    setUrl("");
    setKind("transcript");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tresor · Vault"
        title="Document vault"
        description="One place for your SOP, CV, recommendation letters, transcripts, and certificates — synced to your account."
        category="documents"
      />

      <section aria-labelledby="vault-generated" className="space-y-3">
        <h2 id="vault-generated" className="eyebrow">
          Your generated documents
        </h2>
        <p className="text-sm text-muted-foreground">
          Documents you build with the DeutschPrep tools. Open one to keep editing — your draft is
          saved automatically.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {generated.map((doc) => (
            <Link
              key={doc.href}
              to={doc.href}
              className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full border-l-2 border-l-category-documents transition-colors hover:bg-muted/40">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-category-documents/10 text-category-documents">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <CardTitle className="mt-1.5 truncate text-base">{doc.title}</CardTitle>
                  </div>
                  <Badge variant={doc.started ? "success" : "secondary"}>
                    {doc.started ? "Drafted" : "Not started"}
                  </Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="vault-other" className="space-y-3">
        <h2 id="vault-other" className="eyebrow">
          Other documents &amp; links
        </h2>
        <p className="text-sm text-muted-foreground">
          Track originals you collect elsewhere — transcripts, degree certificates, your passport,
          biometric photos. For privacy and size,{" "}
          <span className="font-medium text-foreground">we don&apos;t upload files</span>: store only
          a name, type, and an optional link (e.g. a cloud-drive URL). Keep the originals safe
          yourself.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderLock className="h-5 w-5 text-category-documents" aria-hidden />
              Tracked documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <label htmlFor="vault-name" className="eyebrow block">
                  Document name
                </label>
                <Input
                  id="vault-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                  placeholder="e.g. Bachelor transcript"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="vault-kind" className="eyebrow block">
                  Type
                </label>
                <select
                  id="vault-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as VaultKind)}
                  className={cn(selectClass, "sm:w-44")}
                >
                  {KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="vault-url" className="eyebrow block">
                  Link (optional)
                </label>
                <Input
                  id="vault-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                  placeholder="https://…"
                />
              </div>
              <Button onClick={addItem} variant="outline" aria-label="Add document">
                <Plus aria-hidden />
                Add
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                No documents tracked yet. Add the transcripts, certificates, and IDs you&apos;re
                collecting so you can find their links fast.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border bg-card p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Badge variant="outline" className="shrink-0">
                        {KIND_LABEL[item.kind]}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.name}
                      </span>
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-medium text-category-documents hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Open link for ${item.name} in a new tab`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Open
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
