/**
 * One-off scaffolding generator. Single source of truth for the route table: writes a stub page
 * file per route (if missing) and regenerates src/lib/nav.tsx. Re-running NEVER overwrites an
 * existing page file — it only fills gaps — so it's safe to run after pages have real content.
 *
 *   node scripts/gen-pages.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../src");

/** group key -> {label}. Order here is the sidebar order. */
const GROUPS = {
  overview: "Overview",
  profile: "Profile & Assessment",
  documents: "Document Prep",
  language: "Language & Test Prep",
  finance: "Finance & Logistics",
  visa: "Visa & Relocation",
  campus: "Campus Life",
  system: "System",
};

/**
 * Each entry: path, file (under src/pages), comp (unique PascalCase id), label (sidebar),
 * title (h1), eyebrow, desc, group, category?, icon (lucide name), featureNo?, hide? (not in nav),
 * disclaimer? (finance/visa).
 */
const PAGES = [
  // ── Overview / cross-cutting ───────────────────────────────────────────────
  { path: "/", file: "overview/Dashboard", comp: "Dashboard", label: "Dashboard", title: "Application dashboard", eyebrow: "Übersicht · Overview", desc: "Your German Master's application at a glance — profile, roadmap, deadlines, and progress across all six areas.", group: "overview", icon: "LayoutDashboard" },
  { path: "/roadmap", file: "overview/Roadmap", comp: "RoadmapPage", label: "Roadmap", title: "Step-by-step roadmap", eyebrow: "Aktenplan · Roadmap", desc: "A dependency-ordered plan from profile evaluation to enrolment. Each step links to the tool that completes it.", group: "overview", icon: "Map" },
  { path: "/process", file: "overview/Process", comp: "ProcessPage", label: "Application status", eyebrow: "Bearbeitungsstand · Status", title: "Application status board", desc: "Process polling for every application thread — where each one stands in the not-started → submitted → complete pipeline.", group: "overview", icon: "Activity" },
  { path: "/deadlines", file: "overview/Deadlines", comp: "DeadlinesPage", label: "Deadlines & alerts", eyebrow: "Fristen · Deadlines", title: "Deadlines & alerts", desc: "Every date that matters, soonest first, with urgency computed deterministically. Official dates that change yearly are flagged for verification.", group: "overview", icon: "BellRing" },
  { path: "/events", file: "overview/Events", comp: "EventsPage", label: "Event watch", eyebrow: "Terminüberwachung · Event watch", title: "Event watch", desc: "Recurring windows worth watching — portal openings, intake cycles, scholarship rounds, and visa-appointment lead times.", group: "overview", icon: "Eye" },
  { path: "/documents-checklist", file: "overview/DocumentsHub", comp: "DocumentsHubPage", label: "Document gathering", eyebrow: "Unterlagen · Documents", title: "Document gathering", desc: "Master checklists for the whole journey: application, APS, visa, and enrolment paperwork — with where to obtain each.", group: "overview", icon: "FolderCheck" },
  { path: "/timeline", file: "overview/Timeline", comp: "TimelinePage", label: "Timeline", eyebrow: "Zeitplan · Timeline", title: "Preparation timeline", desc: "A month-by-month view of the typical 12–18 month preparation arc, from first research to arrival in Germany.", group: "overview", icon: "CalendarRange" },
  { path: "/sources", file: "overview/Sources", comp: "SourcesPage", label: "Sources", eyebrow: "Quellen · Sources", title: "Source registry", desc: "Every official source DeutschPrep cites. Specific figures are grounded against these or flagged for verification.", group: "overview", icon: "Library" },
  { path: "/tracker", file: "overview/Tracker", comp: "TrackerPage", label: "Application tracker", eyebrow: "Bewerbungen · Tracker", title: "Application tracker", desc: "A Kanban board of every programme you're applying to — from researching to decision. Syncs to your account.", group: "overview", icon: "Columns3" },
  { path: "/calendar", file: "overview/Calendar", comp: "CalendarPage", label: "Deadline calendar", eyebrow: "Kalender · Calendar", title: "Deadline calendar", desc: "Every application, VPD, visa, and Sperrkonto date on a month grid — plus deadlines you add yourself.", group: "overview", icon: "CalendarDays" },

  // ── Profile & Assessment (features 1–5) ────────────────────────────────────
  { path: "/profile", file: "profile/Overview", comp: "ProfileOverview", label: "Overview", title: "Profile & Assessment", eyebrow: "Bereich A · Profile & Assessment", desc: "Turn your resume into a German-readable academic profile: parsed facts, a converted grade, matched programs, and skill gaps.", group: "profile", category: "profile", icon: "UserCircle" },
  { path: "/profile/parse", file: "profile/Parse", comp: "ProfileParse", label: "Resume / LinkedIn parsing", title: "Resume & LinkedIn parsing", eyebrow: "Feature 01 · Profile", desc: "Extract structured facts from a resume, LinkedIn export, or intake form — handled as personal data.", group: "profile", category: "profile", icon: "ScanLine", featureNo: 1 },
  { path: "/profile/evaluate", file: "profile/Evaluate", comp: "ProfileEvaluate", label: "Profile evaluation (GPA)", title: "Profile evaluation — GPA → German grade", eyebrow: "Feature 02 · Profile", desc: "Convert your grade to the German 1.0–4.0 scale with the deterministic Modified Bavarian Formula.", group: "profile", category: "profile", icon: "Gauge", featureNo: 2 },
  { path: "/profile/matching", file: "profile/Matching", comp: "ProfileMatching", label: "University matching", title: "Course & university matching", eyebrow: "Feature 03 · Profile", desc: "Shortlist Master's programs at German public universities that fit your background and goals.", group: "profile", category: "profile", icon: "GraduationCap", featureNo: 3 },
  { path: "/profile/skill-gap", file: "profile/SkillGap", comp: "ProfileSkillGap", label: "Skill-gap analysis", title: "Skill-gap analysis", eyebrow: "Feature 04 · Profile", desc: "See what target programs expect that your profile doesn't yet show — and how to close each gap.", group: "profile", category: "profile", icon: "Target", featureNo: 4 },
  { path: "/profile/ects", file: "profile/Ects", comp: "ProfileEcts", label: "ECTS calculator", title: "ECTS calculator", eyebrow: "Feature 05 · Profile", desc: "Total and normalize your credits to ECTS so admissions can compare your degree to a German one.", group: "profile", category: "profile", icon: "Calculator", featureNo: 5 },
  { path: "/universities", file: "profile/Universities", comp: "UniversitiesExplorer", label: "Universities explorer", eyebrow: "Hochschulen · Universities", title: "Universities & programs explorer", desc: "Browse and compare Master's programmes at German public universities, with grounded requirements you can re-verify.", group: "profile", category: "profile", icon: "School" },

  // ── Document Prep (features 6–11) ───────────────────────────────────────────
  { path: "/documents", file: "documents/Overview", comp: "DocumentsOverview", label: "Overview", title: "Document Prep", eyebrow: "Bereich B · Document Prep", desc: "Draft and track every document an application needs: SOP, CV, recommendation letters, and the uni-assist workflow.", group: "documents", category: "documents", icon: "FileText" },
  { path: "/documents/sop", file: "documents/Sop", comp: "DocumentsSop", label: "Statement of Purpose", title: "Statement of Purpose generator", eyebrow: "Feature 06 · Documents", desc: "Build a tailored SOP from your profile and a target program — structured, specific, and yours to edit.", group: "documents", category: "documents", icon: "PenLine", featureNo: 6 },
  { path: "/documents/cv", file: "documents/Cv", comp: "DocumentsCv", label: "Europass CV", title: "Europass CV builder", eyebrow: "Feature 07 · Documents", desc: "Produce a Europass-format CV, the European standard German universities recognize.", group: "documents", category: "documents", icon: "FileBadge", featureNo: 7 },
  { path: "/documents/lor", file: "documents/Lor", comp: "DocumentsLor", label: "Recommendation letters", title: "Letter of Recommendation templates", eyebrow: "Feature 08 · Documents", desc: "Give recommenders a strong starting draft tailored to the program and your relationship.", group: "documents", category: "documents", icon: "ScrollText", featureNo: 8 },
  { path: "/documents/uni-assist", file: "documents/UniAssist", comp: "DocumentsUniAssist", label: "Uni-Assist walkthrough", title: "Uni-Assist walkthrough", eyebrow: "Feature 09 · Documents", desc: "Step through the uni-assist application: account, programs, documents, fees, and what happens after you submit.", group: "documents", category: "documents", icon: "ClipboardList", featureNo: 9 },
  { path: "/documents/vpd", file: "documents/Vpd", comp: "DocumentsVpd", label: "VPD tracker", title: "VPD (Preliminary Documentation) tracker", eyebrow: "Feature 10 · Documents", desc: "Track the Vorprüfungsdokumentation some universities require before you apply directly.", group: "documents", category: "documents", icon: "FileCheck", featureNo: 10 },
  { path: "/documents/translation", file: "documents/Translation", comp: "DocumentsTranslation", label: "Translation assistant", title: "Translation assistant", eyebrow: "Feature 11 · Documents", desc: "Understand which documents need certified translations and prepare drafts to hand to a sworn translator.", group: "documents", category: "documents", icon: "Languages", featureNo: 11 },
  { path: "/vault", file: "documents/Vault", comp: "DocumentsVault", label: "Document vault", eyebrow: "Tresor · Vault", title: "Document vault", desc: "One place for your SOP, CV, recommendation letters, transcripts, and certificates — synced to your account.", group: "documents", category: "documents", icon: "FolderLock" },

  // ── Language & Test Prep (features 12–16) + mock-exam engine ────────────────
  { path: "/language", file: "language/Overview", comp: "LanguageOverview", label: "Overview", title: "Language & Test Prep", eyebrow: "Bereich C · Language & Test", desc: "Reach the German or English level your program requires, and rehearse every admission test with timed mocks.", group: "language", category: "language", icon: "Languages" },
  { path: "/language/german", file: "language/German", comp: "LanguageGerman", label: "German A1–B2 (+TTS)", title: "German A1–B2 course", eyebrow: "Feature 12 · Language", desc: "A structured path from beginner to B2, with audio practice for listening and pronunciation.", group: "language", category: "language", icon: "BookOpen", featureNo: 12 },
  { path: "/language/flashcards", file: "language/Flashcards", comp: "LanguageFlashcards", label: "SRS flashcards", title: "Spaced-repetition flashcards", eyebrow: "Feature 13 · Language", desc: "Memorize vocabulary efficiently with a spaced-repetition schedule that surfaces cards right before you'd forget them.", group: "language", category: "language", icon: "Layers", featureNo: 13 },
  { path: "/language/ielts-toefl", file: "language/IeltsToefl", comp: "LanguageIeltsToefl", label: "IELTS / TOEFL prep", title: "IELTS & TOEFL preparation", eyebrow: "Feature 14 · Language", desc: "Understand the formats, target the right band/score, and practice with timed section mocks.", group: "language", category: "language", icon: "Headphones", featureNo: 14 },
  { path: "/language/gre-gmat", file: "language/GreGmat", comp: "LanguageGreGmat", label: "GRE / GMAT checker", title: "GRE / GMAT requirement checker", eyebrow: "Feature 15 · Language", desc: "Find out whether your target programs require GRE or GMAT, and what scores are competitive.", group: "language", category: "language", icon: "BarChart3", featureNo: 15 },
  { path: "/language/goethe-testdaf", file: "language/GoetheTestdaf", comp: "LanguageGoetheTestdaf", label: "Goethe / TestDaF guides", title: "Goethe & TestDaF guides", eyebrow: "Feature 16 · Language", desc: "Pick the right German certificate (TestDaF, DSH, Goethe, telc) and prepare for each section.", group: "language", category: "language", icon: "BookOpenCheck", featureNo: 16 },
  { path: "/language/exams", file: "language/ExamsHub", comp: "LanguageExamsHub", label: "Mock exams", title: "Mock exam centre", eyebrow: "Übungstests · Mock exams", desc: "Timed practice exams for every test you might need: IELTS, TOEFL, TestDaF, Goethe, GRE, and GMAT.", group: "language", category: "language", icon: "ClipboardCheck" },
  { path: "/language/exams/ielts", file: "language/exams/Ielts", comp: "ExamIelts", label: "IELTS mock", title: "IELTS Academic — practice exam", eyebrow: "Übungstest · IELTS", desc: "A timed IELTS Academic practice set across Listening, Reading, and Writing question types.", group: "language", category: "language", icon: "Headphones", hide: true },
  { path: "/language/exams/toefl", file: "language/exams/Toefl", comp: "ExamToefl", label: "TOEFL mock", title: "TOEFL iBT — practice exam", eyebrow: "Übungstest · TOEFL", desc: "A timed TOEFL iBT practice set across Reading and Listening question types.", group: "language", category: "language", icon: "Globe", hide: true },
  { path: "/language/exams/testdaf", file: "language/exams/Testdaf", comp: "ExamTestdaf", label: "TestDaF mock", title: "TestDaF — practice exam", eyebrow: "Übungstest · TestDaF", desc: "A timed TestDaF practice set mapped to the TDN 3–5 band scale.", group: "language", category: "language", icon: "Languages", hide: true },
  { path: "/language/exams/goethe", file: "language/exams/Goethe", comp: "ExamGoethe", label: "Goethe mock", title: "Goethe-Zertifikat — practice exam", eyebrow: "Übungstest · Goethe", desc: "A timed CEFR-aligned German practice set (A2–B2 grammar, vocabulary, and reading).", group: "language", category: "language", icon: "MessageSquare", hide: true },
  { path: "/language/exams/gre", file: "language/exams/Gre", comp: "ExamGre", label: "GRE mock", title: "GRE General — practice exam", eyebrow: "Übungstest · GRE", desc: "A timed GRE practice set across Verbal Reasoning and Quantitative Reasoning question types.", group: "language", category: "language", icon: "Sigma", hide: true },
  { path: "/language/exams/gmat", file: "language/exams/Gmat", comp: "ExamGmat", label: "GMAT mock", title: "GMAT Focus — practice exam", eyebrow: "Übungstest · GMAT", desc: "A timed GMAT Focus practice set across Quantitative, Verbal, and Data Insights question types.", group: "language", category: "language", icon: "TrendingUp", hide: true },

  // ── Finance & Logistics (features 17–21) — disclaimer required ──────────────
  { path: "/finance", file: "finance/Overview", comp: "FinanceOverview", label: "Overview", title: "Finance & Logistics", eyebrow: "Bereich D · Finance & Logistics", desc: "Plan the money side: blocked account, monthly costs, health insurance, scholarships, and part-time work.", group: "finance", category: "finance", icon: "Wallet", disclaimer: true },
  { path: "/finance/sperrkonto", file: "finance/Sperrkonto", comp: "FinanceSperrkonto", label: "Sperrkonto guide", title: "Blocked account (Sperrkonto) guide", eyebrow: "Feature 17 · Finance", desc: "Understand the blocked account you need for the visa: how it works, the required amount, and which providers to use.", group: "finance", category: "finance", icon: "Landmark", featureNo: 17, disclaimer: true },
  { path: "/finance/cost-of-living", file: "finance/CostOfLiving", comp: "FinanceCostOfLiving", label: "Cost-of-living calc", title: "Cost-of-living calculator", eyebrow: "Feature 18 · Finance", desc: "Estimate your monthly budget by city with a transparent, deterministic breakdown you can adjust.", group: "finance", category: "finance", icon: "Coins", featureNo: 18, disclaimer: true },
  { path: "/finance/health-insurance", file: "finance/HealthInsurance", comp: "FinanceHealthInsurance", label: "Health insurance", title: "Health-insurance selector", eyebrow: "Feature 19 · Finance", desc: "Choose between statutory and private student health insurance — required for enrolment and the visa.", group: "finance", category: "finance", icon: "HeartPulse", featureNo: 19, disclaimer: true },
  { path: "/finance/scholarships", file: "finance/Scholarships", comp: "FinanceScholarships", label: "Scholarship finder", title: "Scholarship finder", eyebrow: "Feature 20 · Finance", desc: "Find scholarships you're eligible for — DAAD, Deutschlandstipendium, Erasmus+, and more.", group: "finance", category: "finance", icon: "Award", featureNo: 20, disclaimer: true },
  { path: "/finance/work", file: "finance/Work", comp: "FinanceWork", label: "HiWi / Werkstudent", title: "HiWi & Werkstudent readiness", eyebrow: "Feature 21 · Finance", desc: "Learn the rules and norms for student jobs in Germany, including legal working-hour limits.", group: "finance", category: "finance", icon: "Briefcase", featureNo: 21, disclaimer: true },

  // ── Visa & Relocation (features 22–26) — disclaimer required ────────────────
  { path: "/visa", file: "visa/Overview", comp: "VisaOverview", label: "Overview", title: "Visa & Relocation", eyebrow: "Bereich E · Visa & Relocation", desc: "Get from offer letter to Anmeldung: APS, the student visa, accommodation, and registering your address.", group: "visa", category: "visa", icon: "Plane", disclaimer: true },
  { path: "/visa/simulator", file: "visa/Simulator", comp: "VisaSimulator", label: "Visa interview simulator", title: "Visa interview simulator", eyebrow: "Feature 22 · Visa", desc: "Rehearse the student-visa interview with realistic questions and spoken practice.", group: "visa", category: "visa", icon: "Mic", featureNo: 22, disclaimer: true },
  { path: "/visa/checklist", file: "visa/Checklist", comp: "VisaChecklist", label: "Visa checklist", title: "Visa checklist & deadlines", eyebrow: "Feature 23 · Visa", desc: "The documents a German student-visa application needs, plus appointment lead times to plan around.", group: "visa", category: "visa", icon: "ListChecks", featureNo: 23, disclaimer: true },
  { path: "/visa/aps", file: "visa/Aps", comp: "VisaAps", label: "APS guide", title: "APS certificate guide", eyebrow: "Feature 24 · Visa", desc: "Understand the Akademische Prüfstelle check required for students from some countries, and how to get it.", group: "visa", category: "visa", icon: "Stamp", featureNo: 24, disclaimer: true },
  { path: "/visa/accommodation", file: "visa/Accommodation", comp: "VisaAccommodation", label: "Accommodation finder", title: "Accommodation finder", eyebrow: "Feature 25 · Visa", desc: "Find student housing — Studierendenwerk dorms and the private market — and avoid common rental scams.", group: "visa", category: "visa", icon: "Building2", featureNo: 25, disclaimer: true },
  { path: "/visa/anmeldung", file: "visa/Anmeldung", comp: "VisaAnmeldung", label: "Anmeldung simulation", title: "Anmeldung (address registration)", eyebrow: "Feature 26 · Visa", desc: "Walk through registering your address at the Bürgeramt after you arrive — the step that unlocks everything else.", group: "visa", category: "visa", icon: "MapPin", featureNo: 26, disclaimer: true },

  // ── Campus Life (features 27–30) ────────────────────────────────────────────
  { path: "/campus", file: "campus/Overview", comp: "CampusOverview", label: "Overview", title: "Campus Life", eyebrow: "Bereich F · Campus Life", desc: "Land well: pre-departure packing, academic networking, transit, and how German academic culture works.", group: "campus", category: "campus", icon: "Sparkles" },
  { path: "/campus/pre-departure", file: "campus/PreDeparture", comp: "CampusPreDeparture", label: "Pre-departure checklist", title: "Pre-departure checklist", eyebrow: "Feature 27 · Campus", desc: "Everything to arrange and pack before you fly — documents, money, tech, and first-week essentials.", group: "campus", category: "campus", icon: "Backpack", featureNo: 27 },
  { path: "/campus/networking", file: "campus/Networking", comp: "CampusNetworking", label: "Academic networking", title: "Academic networking", eyebrow: "Feature 28 · Campus", desc: "Build relationships with professors, peers, and student groups — how to reach out and what to say.", group: "campus", category: "campus", icon: "Users", featureNo: 28 },
  { path: "/campus/deutschlandticket", file: "campus/Deutschlandticket", comp: "CampusDeutschlandticket", label: "Deutschlandticket guide", title: "Deutschlandticket guide", eyebrow: "Feature 29 · Campus", desc: "Use Germany's nationwide public-transport ticket and the discounted student semester ticket.", group: "campus", category: "campus", icon: "TramFront", featureNo: 29 },
  { path: "/campus/culture", file: "campus/Culture", comp: "CampusCulture", label: "Academic culture", title: "Academic culture & plagiarism", eyebrow: "Feature 30 · Campus", desc: "How German universities expect you to study, cite, and behave — including strict plagiarism rules.", group: "campus", category: "campus", icon: "BookOpen", featureNo: 30 },

  // ── System ──────────────────────────────────────────────────────────────────
  { path: "/about", file: "system/About", comp: "AboutPage", label: "About & methodology", title: "About DeutschPrep", eyebrow: "Info · Methodik", desc: "How DeutschPrep grounds official facts, computes deterministic values, and what it does not do.", group: "system", icon: "Info" },
  { path: "/settings", file: "system/Settings", comp: "SettingsPage", label: "Profile & settings", title: "Profile & settings", eyebrow: "Einstellungen · Settings", desc: "Manage the intake details that personalize your roadmap. Your data stays on this device in this build.", group: "system", icon: "Settings" },
  { path: "/help", file: "system/Help", comp: "HelpPage", label: "Help & FAQ", title: "Help & FAQ", eyebrow: "Hilfe · Help", desc: "Answers to common questions, with the advisory disclaimer and links to official sources.", group: "system", icon: "CircleHelp" },
  { path: "/legal/privacy", file: "system/Privacy", comp: "PrivacyPage", label: "Privacy Policy", title: "Privacy Policy", eyebrow: "Datenschutz · Privacy", desc: "How DeutschPrep handles your personal data, including GDPR export and deletion.", group: "system", icon: "ShieldCheck", hide: true },
  { path: "/legal/terms", file: "system/Terms", comp: "TermsPage", label: "Terms of Service", title: "Terms of Service", eyebrow: "Nutzungsbedingungen · Terms", desc: "The terms for using DeutschPrep.", group: "system", icon: "FileText", hide: true },
  { path: "/legal/accessibility", file: "system/Accessibility", comp: "AccessibilityPage", label: "Accessibility", title: "Accessibility statement", eyebrow: "Barrierefreiheit · Accessibility", desc: "Our commitment to WCAG 2.1 AA and how to report barriers.", group: "system", icon: "Accessibility", hide: true },
  { path: "*", file: "system/NotFound", comp: "NotFoundPage", label: "Not found", title: "Page not found", eyebrow: "404", desc: "That page doesn't exist. Use the navigation to get back on track.", group: "system", icon: "FileSearch", hide: true },
];

// ── Write stub page files (never overwrite existing) ──────────────────────────
let created = 0;
for (const p of PAGES) {
  const filePath = resolve(SRC, "pages", `${p.file}.tsx`);
  if (existsSync(filePath)) continue;
  mkdirSync(dirname(filePath), { recursive: true });
  const depth = p.file.split("/").length; // for nothing — we use @ alias
  void depth;
  const catProp = p.category ? `\n      category="${p.category}"` : "";
  const disclaimerImport = p.disclaimer
    ? `\nimport { Disclaimer } from "@/components/common/Disclaimer";`
    : "";
  const disclaimerEl = p.disclaimer ? `\n      <Disclaimer />\n` : "";
  const stub = `import { PageHeader } from "@/components/common/PageHeader";${disclaimerImport}

/** ${p.title} — scaffolded page. Replace this body with the real feature UI. */
export default function ${p.comp}() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow=${JSON.stringify(p.eyebrow ?? "")}
        title=${JSON.stringify(p.title)}
        description=${JSON.stringify(p.desc ?? "")}${catProp}
      />
${disclaimerEl}      <section className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This page is being assembled. Check back shortly.
        </p>
      </section>
    </div>
  );
}
`;
  writeFileSync(filePath, stub, "utf8");
  created += 1;
}

// ── Regenerate nav.tsx ────────────────────────────────────────────────────────
const icons = [...new Set(PAGES.map((p) => p.icon))].sort();
const imports = PAGES.map((p) => `const ${p.comp} = lazy(() => import("@/pages/${p.file}"));`).join("\n");
const entries = PAGES.map((p) => {
  const fields = [
    `path: ${JSON.stringify(p.path)}`,
    `label: ${JSON.stringify(p.label)}`,
    `title: ${JSON.stringify(p.title)}`,
    p.eyebrow ? `eyebrow: ${JSON.stringify(p.eyebrow)}` : null,
    p.desc ? `description: ${JSON.stringify(p.desc)}` : null,
    `group: ${JSON.stringify(p.group)}`,
    p.category ? `category: ${JSON.stringify(p.category)}` : null,
    `icon: ${p.icon}`,
    p.featureNo ? `featureNo: ${p.featureNo}` : null,
    p.hide ? `hide: true` : null,
    p.disclaimer ? `disclaimer: true` : null,
    `Component: ${p.comp}`,
  ].filter(Boolean);
  return `  { ${fields.join(", ")} },`;
}).join("\n");

const groupEntries = Object.entries(GROUPS)
  .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
  .join("\n");

const nav = `/* AUTO-GENERATED by scripts/gen-pages.mjs — do not edit by hand.
 * Single source of truth for the route table: path, page metadata, lazy component, and nav grouping.
 * Re-run \`node scripts/gen-pages.mjs\` to regenerate after editing the PAGES list in that script. */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
${icons.map((i) => `  ${i},`).join("\n")}
  type LucideIcon,
} from "lucide-react";

import type { FeatureCategoryKey } from "@/lib/types";

export type NavGroupKey =
${Object.keys(GROUPS).map((k) => `  | ${JSON.stringify(k)}`).join("\n")};

export const NAV_GROUPS: Record<NavGroupKey, string> = {
${groupEntries}
};

export interface NavItem {
  path: string;
  label: string;
  title: string;
  eyebrow?: string;
  description?: string;
  group: NavGroupKey;
  category?: FeatureCategoryKey;
  icon: LucideIcon;
  /** 1–30 for the canonical features (feature-matrix.md). */
  featureNo?: number;
  /** Hidden from the sidebar (sub-pages, 404). */
  hide?: boolean;
  /** Requires the finance/visa advisory disclaimer. */
  disclaimer?: boolean;
  Component: LazyExoticComponent<ComponentType>;
}

${imports}

export const NAV: NavItem[] = [
${entries}
];

/** Visible nav items grouped in sidebar order. */
export function navByGroup(): { key: NavGroupKey; label: string; items: NavItem[] }[] {
  return (Object.keys(NAV_GROUPS) as NavGroupKey[]).map((key) => ({
    key,
    label: NAV_GROUPS[key],
    items: NAV.filter((n) => n.group === key && !n.hide),
  })).filter((g) => g.items.length > 0);
}

/** Look up a nav item by exact path. */
export function navItem(path: string): NavItem | undefined {
  return NAV.find((n) => n.path === path);
}
`;
writeFileSync(resolve(SRC, "lib/nav.tsx"), nav, "utf8");
console.log(`gen-pages: ${created} stub page(s) created; nav.tsx regenerated (${PAGES.length} routes).`);
