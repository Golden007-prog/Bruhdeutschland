/**
 * Shallow Zod schemas for the live-AI feature paths (work-order §3: structured outputs only).
 * Each schema is intentionally flat so structured-output providers accept it; the pages assemble
 * any richer presentation client-side. None of these assert official German figures — grounding /
 * needs-verification treatment stays in the page UI per CLAUDE.md §2/§3.
 */
import { z } from "zod";

/* ── Statement of Purpose (Sop.tsx) ─────────────────────────────────────────────── */
export const sopSchema = z.object({
  intro: z.string().min(1),
  body: z.array(z.string().min(1)).min(1).max(6),
  conclusion: z.string().min(1),
});
export type SopResult = z.infer<typeof sopSchema>;

/* ── CV polish (Cv.tsx) ─────────────────────────────────────────────────────────── */
export const cvPolishSchema = z.object({
  summary: z.string().min(1),
  experienceBullets: z.array(z.string().min(1)).max(8),
});
export type CvPolishResult = z.infer<typeof cvPolishSchema>;

/* ── Letter of Recommendation (Lor.tsx) ─────────────────────────────────────────── */
export const lorSchema = z.object({
  body: z.string().min(1),
});
export type LorResult = z.infer<typeof lorSchema>;

/* ── Resume parse (Parse.tsx) ───────────────────────────────────────────────────── */
export const parsedProfileSchema = z.object({
  facts: z
    .array(z.object({ label: z.string().min(1), value: z.string().min(1) }))
    .min(1)
    .max(12),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .max(8),
  /** Work experience extracted from the résumé (addendum §1). Only roles present in the text. */
  workExperiences: z
    .array(
      z.object({
        title: z.string().min(1),
        employer: z.string().default(""),
        country: z.string().default(""),
        employmentType: z
          .enum(["full_time", "part_time", "internship", "working_student", "freelance", "research", "volunteer"])
          .default("full_time"),
        startDate: z.string().default(""), // "YYYY-MM" if known
        endDate: z.string().default(""),
        ongoing: z.boolean().default(false),
        domain: z.string().default(""),
        skills: z.array(z.string()).default([]),
        relevantToTarget: z.boolean().default(false),
      }),
    )
    .max(12)
    .default([]),
});
export type ParsedProfileResult = z.infer<typeof parsedProfileSchema>;

/* ── Program matching (Matching.tsx) ────────────────────────────────────────────── */
export const programMatchesSchema = z.object({
  programs: z
    .array(
      z.object({
        name: z.string().min(1),
        university: z.string().min(1),
        city: z.string().min(1),
        language: z.enum(["EN", "DE"]),
        fitReason: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
});
export type ProgramMatchesResult = z.infer<typeof programMatchesSchema>;

/* ── Skill-gap analysis (SkillGap.tsx) ──────────────────────────────────────────── */
export const skillGapAnalysisSchema = z.object({
  gaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        severity: z.enum(["low", "medium", "high"]),
        howToClose: z.string().min(1),
      }),
    )
    .min(1)
    .max(8),
});
export type SkillGapAnalysisResult = z.infer<typeof skillGapAnalysisSchema>;

/* ── Visa interview feedback (Simulator.tsx) ────────────────────────────────────── */
export const interviewFeedbackSchema = z.object({
  strengths: z.array(z.string().min(1)).max(6),
  improvements: z.array(z.string().min(1)).max(6),
  sampleAnswer: z.string().min(1),
});
export type InterviewFeedbackResult = z.infer<typeof interviewFeedbackSchema>;
