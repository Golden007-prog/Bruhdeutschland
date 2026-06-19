/**
 * Client-side résumé/LinkedIn parsing (work order §11). Extracts plain text from a PDF or DOCX in the
 * browser — nothing is uploaded — then a deterministic heuristic guesses structured fields to PRE-FILL
 * an editable review form. The user corrects everything before any GPA/ECTS is computed (CLAUDE.md §2:
 * the model/heuristic never finalizes official values). LinkedIn: export "Save to PDF" and upload it.
 */
import type { GradeScaleKey } from "@/lib/profile/types";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export class FileTooLargeError extends Error {
  constructor() {
    super("That file is larger than 8 MB. Try a smaller export, or paste the text instead.");
    this.name = "FileTooLargeError";
  }
}

export class UnsupportedFileError extends Error {
  constructor() {
    super("Unsupported file type. Upload a PDF or DOCX, or paste the text.");
    this.name = "UnsupportedFileError";
  }
}

/** Extract plain text from a résumé file (PDF, DOCX, or TXT). Throws on size/type errors. */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new FileTooLargeError();
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return extractPdf(file);
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocx(file);
  }
  if (name.endsWith(".txt") || file.type === "text/plain") return file.text();
  throw new UnsupportedFileError();
}

let pdfWorkerConfigured = false;

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfWorkerConfigured) {
    const PdfWorker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker")).default;
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
    pdfWorkerConfigured = true;
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  await loadingTask.destroy();
  return parts.join("\n");
}

type MammothLike = {
  extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

async function extractDocx(file: File): Promise<string> {
  const mod = (await import("mammoth")) as unknown as MammothLike & { default?: MammothLike };
  const mammoth = typeof mod.extractRawText === "function" ? mod : mod.default!;
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

export interface GuessedProfile {
  name: string;
  currentDegree: string;
  institution: string;
  gradeValue: string;
  gradeScale: GradeScaleKey | "";
  targetField: string;
}

const EMPTY_GUESS: GuessedProfile = {
  name: "",
  currentDegree: "",
  institution: "",
  gradeValue: "",
  gradeScale: "",
  targetField: "",
};

/**
 * Best-effort, deterministic extraction of structured fields from résumé text — purely to pre-fill the
 * review form. Always wrong sometimes; that's why the user edits before anything is computed.
 */
export function guessProfileFields(text: string): GuessedProfile {
  const guess: GuessedProfile = { ...EMPTY_GUESS };
  if (!text.trim()) return guess;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Name: first short line of mostly letters, trimmed at a separator (e.g. "Jane Doe — Engineer").
  const first = lines[0] ?? "";
  const namePart = first.split(/[—|,••]|\s-\s/)[0].trim();
  if (namePart && namePart.split(/\s+/).length <= 4 && /^[A-Za-z.\s'-]+$/.test(namePart)) {
    guess.name = namePart;
  }

  // Degree.
  const degree = text.match(
    /\b(B\.?\s?Tech|B\.?\s?Sc|B\.?\s?E\b|B\.?\s?A\b|Bachelor(?:'s)?|M\.?\s?Tech|M\.?\s?Sc|Master(?:'s)?)\b[^,\n]{0,60}/i,
  );
  if (degree) guess.currentDegree = degree[0].trim();

  // Institution.
  const instLine = lines.find((l) =>
    /\b(University|Universit[aä]t|Institute|Institut|College|IIT|IIM|NIT|Hochschule)\b/i.test(l),
  );
  if (instLine) {
    const m = instLine.match(
      /((?:IIT|IIM|NIT)\s+[A-Za-z]+)|([A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*)*\s+(?:University|Institute|College|Hochschule))/,
    );
    guess.institution = (m?.[0] ?? instLine).trim().slice(0, 80);
  }

  // Grade + scale (first match wins, most specific first).
  let gm: RegExpMatchArray | null;
  if ((gm = text.match(/(\d{1,2}(?:\.\d+)?)\s*\/\s*10\b/))) {
    guess.gradeValue = gm[1];
    guess.gradeScale = "cgpa10";
  } else if ((gm = text.match(/\bCGPA[:\s]*?(\d{1,2}(?:\.\d+)?)/i))) {
    guess.gradeValue = gm[1];
    guess.gradeScale = "cgpa10";
  } else if ((gm = text.match(/(\d(?:\.\d+)?)\s*\/\s*4(?:\.0)?\b/))) {
    guess.gradeValue = gm[1];
    guess.gradeScale = "gpa4";
  } else if ((gm = text.match(/(\d{2,3}(?:\.\d+)?)\s*%/))) {
    guess.gradeValue = gm[1];
    guess.gradeScale = "percent";
  }

  return guess;
}
