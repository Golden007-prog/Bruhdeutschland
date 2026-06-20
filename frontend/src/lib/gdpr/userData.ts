/**
 * Section 9 §9.6 — GDPR export & delete that cover EVERYTHING (closes qa-findings SEC-1 / SEC-2).
 *
 * The previous DataControls deleted only `settings` + `profiles`, leaving exam history, answers, events,
 * streaks, and Storage files bound to the user (right-to-erasure broken). This module enumerates every
 * per-user table + Storage bucket so export bundles all of it and delete erases all of it.
 *
 * All operations run through the user's own RLS-scoped client, so they only ever touch the caller's own
 * rows/files — no service role in the bundle. The functions take the client as a parameter (dependency
 * injection) so they are unit-testable without a live backend. Deleting the auth *login* itself needs the
 * admin API (the `gdpr_delete` Edge Function / "email us" path) — this erases all personal data + files.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Every table keyed on `user_id` (RLS `auth.uid() = user_id`). `profiles` is keyed on `id` (handled separately). */
export const GDPR_USER_TABLES: readonly string[] = [
  // account + core
  "settings", "consents", "sessions", "audit_log", "account_memory", "events", "notifications", "reminders",
  // background / intake / docs
  "intake_submissions", "work_experiences", "education_timeline", "documents", "documents_meta",
  "document_vault", "generated_docs",
  // pathway / eligibility (deterministic outputs)
  "pathway_results", "eligibility_checks", "grade_conversions",
  // roadmap / progress / tasks
  "roadmap_items", "progress_snapshots", "tasks", "checklists",
  // practice / tests
  "exam_forms", "exam_attempts", "answers", "seen_topics", "srs_cards", "study_plan_items",
  "question_type_stats", "skill_progress", "assessments", "goals_streaks", "leaderboard_stats",
  // discovery / applications
  "user_shortlist", "saved_searches", "applications", "comparisons", "deadlines",
  // finance
  "cost_profiles", "budgets", "scholarship_matches", "sperrkonto_status",
  // visa
  "visa_checklists",
  // outcomes
  "outcomes", "achievements",
];

/** Private Storage buckets that hold per-user files under a `<userId>/…` prefix. */
export const GDPR_BUCKETS: readonly string[] = ["exam-audio", "generated-docs"];

/** Recursively collect every Storage object path under `<uid>/…` in a bucket (folders have a null id). */
async function listAllFiles(client: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    // A Storage "folder" comes back with a null id; a file has an id.
    if ((entry as { id: string | null }).id === null) {
      out.push(...(await listAllFiles(client, bucket, path)));
    } else {
      out.push(path);
    }
  }
  return out;
}

export interface UserDataExport {
  generatedAt: string;
  userId: string;
  tables: Record<string, unknown[]>;
  storage: Record<string, string[]>;
  localSnapshot: Record<string, unknown>;
}

/** §9.6 export: bundle every per-user row + Storage file list + the local snapshot into one object. */
export async function exportAllUserData(
  client: SupabaseClient,
  uid: string,
  localSnapshot: Record<string, unknown>,
  generatedAt: string,
): Promise<UserDataExport> {
  const tables: Record<string, unknown[]> = {};
  const profile = await client.from("profiles").select("*").eq("id", uid);
  if (profile.data) tables.profiles = profile.data;
  for (const t of GDPR_USER_TABLES) {
    const { data } = await client.from(t).select("*").eq("user_id", uid);
    if (data && data.length) tables[t] = data;
  }
  const storage: Record<string, string[]> = {};
  for (const b of GDPR_BUCKETS) {
    const files = await listAllFiles(client, b, uid);
    if (files.length) storage[b] = files;
  }
  return { generatedAt, userId: uid, tables, storage, localSnapshot };
}

/** §9.6 delete: erase every per-user row across all tables + every Storage object under `<uid>/`. */
export async function deleteAllUserData(client: SupabaseClient, uid: string): Promise<void> {
  for (const t of GDPR_USER_TABLES) {
    await client.from(t).delete().eq("user_id", uid);
  }
  await client.from("profiles").delete().eq("id", uid);
  for (const b of GDPR_BUCKETS) {
    const files = await listAllFiles(client, b, uid);
    if (files.length) await client.storage.from(b).remove(files);
  }
}
