/**
 * JSON extraction + Zod validation shared by all providers. Models sometimes wrap JSON in code
 * fences or prose; we strip that, parse, and validate. Used with a one-shot repair retry by each
 * provider so a single malformed response doesn't break the exam.
 */
import type { ZodType } from "zod";

/**
 * Pull the first complete JSON object/array out of a possibly fenced/prose-wrapped string.
 * Scans from the first `{`/`[` with a balanced-bracket walk (string- and escape-aware) so a stray
 * brace in trailing prose, or a second JSON value, can't swallow the wrong span. Falls back to a
 * plain parse of the trimmed text when no bracketed value is found.
 */
export function extractJson(text: string): unknown {
  let t = text.trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const slice = firstJsonValue(t);
  return JSON.parse(slice ?? t);
}

/** Return the substring of the first balanced JSON object/array, or null if none is found. */
function firstJsonValue(t: string): string | null {
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  const start =
    firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
  if (start === -1) return null;

  const open = t[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return t.slice(start, i + 1);
    }
  }
  return null; // unbalanced — let the caller parse the trimmed text and surface the real error
}

/** Parse + validate; throws with a compact error message describing what failed. */
export function validate<T>(schema: ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Schema validation failed: ${issues}`);
  }
  return result.data;
}

/** Build a repair instruction appended to the original prompt after a bad first attempt. */
export function repairPrompt(original: string, error: string, schemaHint: string): string {
  return [
    original,
    "",
    "Your previous response was not valid. Error:",
    error,
    "",
    `Return ONLY a single JSON value matching this shape, with no prose or code fences: ${schemaHint}`,
  ].join("\n");
}
