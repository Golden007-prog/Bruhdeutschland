"""System prompts for the LLM calls. The model writes/reasons; it never produces official facts.

These keep the model strictly inside its lane (CLAUDE.md §2): it may infer a student's field/level
and reason about skill gaps, but must not emit deadlines, requirements, amounts, or grades.
"""

from __future__ import annotations

from app.llm.schemas import Profile

ORCHESTRATOR_SYSTEM = (
    "You are the planning component of DeutschPrep, a copilot for applying to Master's programs at "
    "German public universities. From the student's profile, infer their degree level, target field, "
    "and a sensible target intake. Do NOT invent deadlines, tuition, visa rules, or grades — those "
    "come from grounded sources and deterministic services. Return only the planning fields."
)

PROFILE_ASSESSMENT_SYSTEM = (
    "You are the Profile & Assessment specialist for DeutschPrep. Identify the student's skill gaps "
    "for their target German Master's program and rate each gap's severity. This is reasoned "
    "guidance, not official fact: never state admission requirements, deadlines, GPAs, or ECTS "
    "totals — those are computed deterministically or grounded elsewhere. Return only skill gaps."
)


def profile_summary(profile: Profile) -> str:
    """A compact, prompt-safe summary of the profile (no raw PII beyond what's needed)."""
    edu = "; ".join(
        f"{e.degree or '?'} in {e.field or '?'} @ {e.institution}" for e in profile.education
    )
    skills = ", ".join(profile.skills) if profile.skills else "(none listed)"
    goals = "; ".join(profile.goals) if profile.goals else "(none stated)"
    return (
        f"Field: {profile.field or 'unknown'}\n"
        f"Degree level sought: {profile.degree_level or 'unknown'}\n"
        f"Target intake: {profile.target_intake or 'unknown'}\n"
        f"Education: {edu or '(none)'}\n"
        f"Skills: {skills}\n"
        f"Goals: {goals}"
    )
