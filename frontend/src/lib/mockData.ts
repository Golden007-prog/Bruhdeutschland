import type { FeatureModule, ParsedProfile, RoadmapItem } from "./types";

/** Mock roadmap items spanning all six categories + every status (Phase 3: no backend). */
export const mockRoadmapItems: RoadmapItem[] = [
  {
    id: "r1",
    category: "profile",
    title: "Evaluate profile & convert GPA",
    description: "German GPA via the Modified Bavarian Formula; ECTS totalled.",
    status: "done",
  },
  {
    id: "r2",
    category: "profile",
    title: "Shortlist matching Master's programs",
    description: "Semantic match against DAAD programs.",
    status: "active",
  },
  {
    id: "r3",
    category: "documents",
    title: "Draft Statement of Purpose",
    description: "Tailored to TUM M.Sc. Data Engineering.",
    status: "active",
  },
  {
    id: "r4",
    category: "documents",
    title: "Complete Uni-Assist application",
    deadline: "2026-07-15",
    status: "locked",
    needsVerification: true,
  },
  {
    id: "r5",
    category: "language",
    title: "Reach German B2 + book TestDaF",
    status: "locked",
  },
  {
    id: "r6",
    category: "finance",
    title: "Open a Sperrkonto (blocked account)",
    description: "Guidance only — verify the current amount with official sources.",
    status: "locked",
    needsVerification: true,
  },
  {
    id: "r7",
    category: "visa",
    title: "Prepare student visa documents",
    deadline: "2026-09-15",
    status: "locked",
    needsVerification: true,
  },
  {
    id: "r8",
    category: "campus",
    title: "Get the Deutschlandticket & plan arrival",
    status: "locked",
  },
];

export const mockParsedProfile: ParsedProfile = {
  fileName: "jane_doe_resume.pdf",
  facts: [
    { label: "Degree", value: "B.Tech Computer Science" },
    { label: "Institution", value: "IIT Delhi" },
    { label: "Graduation", value: "2024" },
    { label: "Experience", value: "1 yr — Backend Engineer" },
  ],
  germanGpa: {
    value: 1.7,
    sourceName: "Modified Bavarian Formula",
    needsVerification: false,
  },
  gpaMethod: "Modified Bavarian Formula",
  totalEcts: {
    // Ungrounded → must show a "needs verification" badge (CLAUDE.md §2).
    value: null,
    needsVerification: true,
  },
  skillGaps: [
    { id: "s1", skill: "German B2", severity: "high" },
    { id: "s2", skill: "Distributed Systems coursework", severity: "medium" },
    { id: "s3", skill: "Research publication", severity: "low" },
  ],
};

export const mockFeatureModules: FeatureModule[] = [
  { key: "profile", label: "Profile & Assessment", featureCount: 5, completedCount: 3 },
  { key: "documents", label: "Document Prep", featureCount: 6, completedCount: 1 },
  { key: "language", label: "Language & Test Prep", featureCount: 5, completedCount: 0 },
  { key: "finance", label: "Finance & Logistics", featureCount: 5, completedCount: 0 },
  { key: "visa", label: "Visa & Relocation", featureCount: 5, completedCount: 0 },
  { key: "campus", label: "Campus Life", featureCount: 4, completedCount: 0 },
];
