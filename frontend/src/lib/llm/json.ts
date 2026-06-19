/**
 * JSON extraction + Zod validation shared by all providers. Models sometimes wrap JSON in code
 * fences or prose; we strip that, parse, and validate. Used with a one-shot repair retry by each
 * provider so a single malformed response doesn't break the exam.
 */
import type { ZodType } from "zod";

/** Pull the first JSON object/array out of a possibly fenced/prose-wrapped string. */
export function extractJson(text: string): unknown {
  let t = text.trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // If there is leading/trailing prose, slice to the outermost bracket pair.
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  const start =
    firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
  if (start > 0) {
    const lastObj = t.lastIndexOf("}");
    const lastArr = t.lastIndexOf("]");
    const end = Math.max(lastObj, lastArr);
    if (end > start) t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
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
