"""Agent 1 — Profile & Assessment (agent-workflows.md §4).

GPA and ECTS come **only** from the deterministic services; skill gaps are LLM-reasoned and clearly
non-official; program matches come from the (coarse) shortlist and are flagged advisory until a
grounded ProgramSearch backs them. Contributes drafts to the roadmap.
"""

from __future__ import annotations

from app.llm.client import LLMProvider
from app.llm.prompts import PROFILE_ASSESSMENT_SYSTEM, profile_summary
from app.llm.schemas import (
    AgentInput,
    AgentNameEnum,
    DeterministicValue,
    ProfileAssessmentOutput,
    ProgramMatch,
    RoadmapItemDraft,
    SkillGapList,
)
from app.models.enums import FeatureCategory
from app.services.ects_calculator import sum_ects
from app.services.gpa_converter import convert_to_german_gpa


class ProfileAssessmentAgent:
    async def run(self, agent_input: AgentInput, *, llm: LLMProvider) -> ProfileAssessmentOutput:
        profile = agent_input.profile
        ctx = agent_input.plan_context

        # --- Deterministic: German GPA (Modified Bavarian) ---------------------
        gpa: DeterministicValue[float] | None = None
        if profile.raw_gpa is not None and profile.gpa_scale is not None:
            conv = convert_to_german_gpa(profile.raw_gpa, profile.gpa_scale)
            gpa = DeterministicValue[float](value=conv.german_grade, method=conv.method)

        # --- Deterministic: ECTS total ----------------------------------------
        ects: DeterministicValue[int] | None = None
        if profile.courses:
            summary = sum_ects(profile.courses)
            ects = DeterministicValue[int](
                value=int(round(summary.total_ects)), method=summary.method
            )

        # --- Advisory program matches (from coarse shortlist) -----------------
        matches = [
            ProgramMatch(
                program=ref,
                fit_score=max(0.0, 0.9 - 0.1 * idx),
                reason="Shortlist match for your field; confirm against the official program page.",
                grounded=False,
            )
            for idx, ref in enumerate(ctx.program_shortlist)
        ]

        # --- LLM-reasoned skill gaps (non-official) ---------------------------
        gap_payload: SkillGapList = await llm.structured(
            system=PROFILE_ASSESSMENT_SYSTEM,
            prompt=profile_summary(profile),
            schema=SkillGapList,
        )

        items = self._drafts(gpa, ects, matches, gap_payload)
        return ProfileAssessmentOutput(
            agent=AgentNameEnum.PROFILE_ASSESSMENT,
            items=items,
            german_gpa=gpa,
            total_ects=ects,
            matched_programs=matches,
            skill_gaps=gap_payload.skill_gaps,
            notes=[] if gpa else ["GPA not computed: provide a grade and its source scale."],
        )

    @staticmethod
    def _drafts(
        gpa: DeterministicValue[float] | None,
        ects: DeterministicValue[int] | None,
        matches: list[ProgramMatch],
        gaps: SkillGapList,
    ) -> list[RoadmapItemDraft]:
        drafts: list[RoadmapItemDraft] = []

        eval_body = []
        if gpa:
            eval_body.append(f"German GPA {gpa.value:.1f} ({gpa.method}).")
        if ects:
            eval_body.append(f"{ects.value} ECTS counted ({ects.method}).")
        drafts.append(
            RoadmapItemDraft(
                category=FeatureCategory.PROFILE,
                title="Evaluate profile & convert GPA",
                body=" ".join(eval_body) or "Add grades and courses to evaluate your profile.",
                status="done" if gpa else "active",
            )
        )

        if matches:
            listed = ", ".join(f"{m.program.title} ({m.program.university})" for m in matches[:3])
            drafts.append(
                RoadmapItemDraft(
                    category=FeatureCategory.PROFILE,
                    title="Shortlist matching Master's programs",
                    body=f"Candidate programs: {listed}. Verify requirements on each official page.",
                    status="active" if gpa else "locked",
                )
            )

        for gap in gaps.skill_gaps:
            drafts.append(
                RoadmapItemDraft(
                    category=FeatureCategory.PROFILE,
                    title=f"Close skill gap: {gap.skill}",
                    body=gap.rationale or f"Strengthen {gap.skill} (severity: {gap.severity}).",
                    status="locked",
                )
            )
        return drafts
