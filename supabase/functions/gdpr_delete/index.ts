// Section 9 §9.5/§9.6 — gdpr_delete Edge Function (admin right-to-erasure).
//
// Hard-deletes the CALLING user's entire account server-side: every per-user row, every Storage object
// under <uid>/, then the auth.users login itself (admin API). This is the one operation the client can't
// do alone (deleting the auth user needs the service role). Deployed with verify_jwt=true; the caller is
// resolved from their own JWT, and the service-role key is read from the edge runtime env (NEVER bundled).
//
// Deploy: mcp deploy_edge_function name=gdpr_delete verify_jwt=true. Idempotent.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Mirror of frontend/src/lib/gdpr/userData.ts GDPR_USER_TABLES (keep in sync). profiles is keyed on id.
const USER_TABLES = [
  "settings", "consents", "sessions", "audit_log", "account_memory", "events", "notifications", "reminders",
  "intake_submissions", "work_experiences", "education_timeline", "documents", "documents_meta",
  "document_vault", "generated_docs", "pathway_results", "eligibility_checks", "grade_conversions",
  "roadmap_items", "progress_snapshots", "tasks", "checklists", "exam_forms", "exam_attempts", "answers",
  "seen_topics", "srs_cards", "study_plan_items", "question_type_stats", "skill_progress", "assessments",
  "goals_streaks", "leaderboard_stats", "user_shortlist", "saved_searches", "applications", "comparisons",
  "deadlines", "cost_profiles", "budgets", "scholarship_matches", "sperrkonto_status", "visa_checklists",
  "outcomes", "achievements",
];
const BUCKETS = ["exam-audio", "generated-docs"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function listAll(client: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const entry of data) {
    const path = `${prefix}/${entry.name}`;
    if ((entry as { id: string | null }).id === null) out.push(...(await listAll(client, bucket, path)));
    else out.push(path);
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Resolve the caller from their own JWT (the only identity we will delete).
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const uid = (await userClient.auth.getUser()).data.user?.id;
    if (!uid) return json({ error: "unauthorized" }, 401);

    // Service role bypasses RLS to erase everything the user owns.
    const admin = createClient(url, service, { auth: { persistSession: false } });
    for (const t of USER_TABLES) await admin.from(t).delete().eq("user_id", uid);
    await admin.from("profiles").delete().eq("id", uid);
    for (const b of BUCKETS) {
      const paths = await listAll(admin, b, uid);
      if (paths.length) await admin.storage.from(b).remove(paths);
    }
    await admin.auth.admin.deleteUser(uid);
    return json({ ok: true });
  } catch (_e) {
    // Never leak internals or PII.
    return json({ error: "delete_failed" }, 500);
  }
});
