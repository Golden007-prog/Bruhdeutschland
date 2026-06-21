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
  start: "Start Here",
  career: "Career & Guidance",
  profile: "Profile & Assessment",
  documents: "Document Prep",
  language: "Language & Test Prep",
  finance: "Finance & Logistics",
  visa: "Visa & Relocation",
  arrival: "Arrival & Settling In",
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
  { path: "/offers/interpret", file: "overview/AdmissionLetter", comp: "AdmissionLetterPage", label: "Admission-letter interpreter", eyebrow: "G25 · Offers", title: "Admission letter (Zulassungsbescheid) interpreter", desc: "Decode your admission letter: what's conditional, the enrolment deadline you can't miss, and the exact next actions it triggers.", group: "overview", icon: "FileBadge" },
  { path: "/offers/compare", file: "overview/OfferComparison", comp: "OfferComparisonPage", label: "Offer comparison board", eyebrow: "G26 · Offers", title: "Offer comparison board", desc: "Hold multiple admits side by side — cost, city, language, deadline — and decide with a clear head instead of a dozen browser tabs.", group: "overview", icon: "Columns3" },
  { path: "/offers/seat-deadlines", file: "overview/SeatDeadlines", comp: "SeatDeadlinesPage", label: "Seat-acceptance deadlines", eyebrow: "G28 · Offers", title: "Seat-acceptance deadline tracker", desc: "Accepting a seat has its own hard deadline, separate from the application. Track each offer's accept-by date so you never lose a place.", group: "overview", icon: "BellRing" },
  { path: "/calendar", file: "overview/Calendar", comp: "CalendarPage", label: "Deadline calendar", eyebrow: "Kalender · Calendar", title: "Deadline calendar", desc: "Every application, VPD, visa, and Sperrkonto date on a month grid — plus deadlines you add yourself.", group: "overview", icon: "CalendarDays" },
  { path: "/next-actions", file: "overview/NextActions", comp: "NextActionsPage", label: "Your next 3 actions", title: "You are here — your next 3 actions", eyebrow: "G50 · Overview", desc: "One screen that reads your pathway and profile and tells you the single most useful thing to do next — and the two after it.", group: "overview", icon: "Target" },
  { path: "/reminders", file: "overview/Reminders", comp: "RemindersPage", label: "Reminders & calendar export", eyebrow: "G51 · Overview", title: "Reminders & calendar export", desc: "All your personal deadlines in one place, with a one-click calendar (.ics) export so your reminders live in the app you already check.", group: "overview", icon: "BellRing" },
  { path: "/leaderboard", file: "overview/Leaderboard", comp: "LeaderboardPage", label: "Leaderboard", eyebrow: "Rangliste · Leaderboard", title: "Your standing", desc: "See how your readiness, roadmap progress, mock bands, and streak compare — anonymously — against everyone else preparing. Opt in to a pseudonymous board.", group: "overview", icon: "Trophy" },

  // ── Start Here — Orientation funnel (gap analysis G01–G04) ──────────────────
  { path: "/start", file: "start/Overview", comp: "StartOverview", label: "Start here", title: "Start here — orient yourself in 5 minutes", eyebrow: "Phase 0 · Orientation", desc: "New to studying in Germany? Four quick tools to learn whether you're eligible, by which route, by when, and at what total cost — before you invest in the full plan.", group: "start", icon: "Compass" },
  { path: "/start/eligibility", file: "start/Eligibility", comp: "StartEligibility", label: "Eligibility quick-check", title: "Am I eligible? — 30-second check", eyebrow: "Phase 0 · Orientation", desc: "Answer four questions and see whether — and by which route (direct Bachelor, Studienkolleg, Master, Medicine) — you can study in Germany. No signup, deterministic, grounded rules to verify.", group: "start", icon: "ClipboardCheck" },
  { path: "/start/feasibility", file: "start/Feasibility", comp: "StartFeasibility", label: "Reality check", title: "Reality check — feasibility & years to finish", eyebrow: "Phase 0 · Orientation", desc: "A blunt, honest read on how realistic your plan is and roughly how long it takes end-to-end, given your level, language, and target. A heuristic, not a guarantee.", group: "start", icon: "Gauge" },
  { path: "/start/timeline-planner", file: "start/TimelinePlanner", comp: "StartTimelinePlanner", label: "Reverse timeline planner", title: "Reverse timeline — work back from your intake", eyebrow: "Phase 0 · Orientation", desc: "Pick a target intake and we back-date every milestone — language tests, APS, applications, visa, Sperrkonto — so you know what to start by when.", group: "start", icon: "CalendarRange" },
  { path: "/start/budget", file: "start/Budget", comp: "StartBudget", label: "Total-journey budget", title: "Total-journey budget — one-time + recurring", eyebrow: "Phase 0 · Orientation", desc: "Add up the real end-to-end cost: APS, uni-assist, translations, visa, Sperrkonto, flights, deposit, and monthly living — with every official figure grounded or flagged.", group: "start", icon: "Calculator", disclaimer: true },
  { path: "/start/class-10", file: "start/ClassTenOrientation", comp: "StartClassTenOrientation", label: "Class-10 plan", title: "Finishing Class 10? Here's your runway", eyebrow: "Phase 0 · Orientation", desc: "The blocked persona's runway: finish Class 12, build German A1→B1, then re-run eligibility for the right route into Germany.", group: "start", icon: "GraduationCap" },

  // ── Career & Guidance (long-game addendum §5–§7) ────────────────────────────
  { path: "/career", file: "career/Overview", comp: "CareerOverview", label: "Career & guidance", title: "Career & guidance", eyebrow: "Bereich · Career", desc: "Before you pick a programme, figure out the right direction: counseling, course selection, the German education system, and where each field actually leads in the job market.", group: "career", icon: "Compass" },
  { path: "/career/counseling", file: "career/Counseling", comp: "CareerCounseling", label: "Counseling & course choice", title: "Career counseling & course selection", eyebrow: "§ Counseling", desc: "A short interest self-check plus optional AI consultation turns your background and interests into German programme fields to explore — then feeds straight into university matching.", group: "career", icon: "MessageSquare" },
  { path: "/career/outcomes", file: "career/Outcomes", comp: "CareerOutcomes", label: "Career outcomes & demand", title: "Career outcomes & job market", eyebrow: "§ Outcomes", desc: "What each field leads to in Germany — typical roles, demand, shortage-occupation status, and which EU Blue Card threshold it maps to. Qualitative + grounded; no invented salaries.", group: "career", icon: "TrendingUp" },
  { path: "/career/education-system", file: "career/EducationSystem", comp: "CareerEducationSystem", label: "German education system", title: "How the German education system works", eyebrow: "§ Orientation", desc: "Universität vs Technische Universität vs Fachhochschule (FH), and the school structure behind the HZB — so recognition and your options make sense.", group: "career", icon: "School" },

  // ── Profile & Assessment (features 1–5) ────────────────────────────────────
  { path: "/profile", file: "profile/Overview", comp: "ProfileOverview", label: "Overview", title: "Profile & Assessment", eyebrow: "Bereich A · Profile & Assessment", desc: "Turn your resume into a German-readable academic profile: parsed facts, a converted grade, matched programs, and skill gaps.", group: "profile", category: "profile", icon: "UserCircle" },
  { path: "/profile/parse", file: "profile/Parse", comp: "ProfileParse", label: "Resume / LinkedIn parsing", title: "Resume & LinkedIn parsing", eyebrow: "Feature 01 · Profile", desc: "Extract structured facts from a resume, LinkedIn export, or intake form — handled as personal data.", group: "profile", category: "profile", icon: "ScanLine", featureNo: 1 },
  { path: "/profile/evaluate", file: "profile/Evaluate", comp: "ProfileEvaluate", label: "Profile evaluation (GPA)", title: "Profile evaluation — GPA → German grade", eyebrow: "Feature 02 · Profile", desc: "Convert your grade to the German 1.0–4.0 scale with the deterministic Modified Bavarian Formula.", group: "profile", category: "profile", icon: "Gauge", featureNo: 2 },
  { path: "/profile/pathway", file: "profile/Pathway", comp: "ProfilePathway", label: "Study pathway", title: "Your German study pathway", eyebrow: "Pfad · Pathway", desc: "Bachelor, Master, Medicine or Studienkolleg — the correct German route for your level and country, with honest next steps and grounded rules to verify.", group: "profile", category: "profile", icon: "Route" },
  { path: "/profile/matching", file: "profile/Matching", comp: "ProfileMatching", label: "University matching", title: "Course & university matching", eyebrow: "Feature 03 · Profile", desc: "Shortlist Master's programs at German public universities that fit your background and goals.", group: "profile", category: "profile", icon: "GraduationCap", featureNo: 3 },
  { path: "/profile/skill-gap", file: "profile/SkillGap", comp: "ProfileSkillGap", label: "Skill-gap analysis", title: "Skill-gap analysis", eyebrow: "Feature 04 · Profile", desc: "See what target programs expect that your profile doesn't yet show — and how to close each gap.", group: "profile", category: "profile", icon: "Target", featureNo: 4 },
  { path: "/profile/ects", file: "profile/Ects", comp: "ProfileEcts", label: "ECTS calculator", title: "ECTS calculator", eyebrow: "Feature 05 · Profile", desc: "Total and normalize your credits to ECTS so admissions can compare your degree to a German one.", group: "profile", category: "profile", icon: "Calculator", featureNo: 5 },
  { path: "/profile/shortlist", file: "profile/Shortlist", comp: "ProfileShortlist", label: "Reach / match / safety", title: "Reach / match / safety shortlist", eyebrow: "G14 · Profile", desc: "Balance your programme list into ambitious, realistic, and safe tiers using your honest per-programme eligibility — so you don't over-bet on long shots.", group: "profile", category: "profile", icon: "Target" },
  { path: "/profile/supervisors", file: "profile/Supervisors", comp: "ProfileSupervisors", label: "Supervisor / lab finder", title: "Professor & research-group outreach", eyebrow: "G16 · Profile", desc: "For PhD and research-track applicants: how to find and approach a supervisor, with a tracker for your outreach.", group: "profile", category: "profile", icon: "Users" },
  { path: "/profile/cities", file: "profile/Cities", comp: "ProfileCities", label: "City explorer", title: "City explorer — where to study & live", eyebrow: "G17 · Profile", desc: "Compare student cities on the factors that matter — rough rent, size, and what to research — before you commit to a programme's location.", group: "profile", category: "profile", icon: "MapPin" },
  { path: "/universities", file: "profile/Universities", comp: "UniversitiesExplorer", label: "Universities explorer", eyebrow: "Hochschulen · Universities", title: "Universities & programs explorer", desc: "Browse and compare Master's programmes at German public universities, with grounded requirements you can re-verify.", group: "profile", category: "profile", icon: "School" },
  { path: "/profile/recognition", file: "profile/Recognition", comp: "ProfileRecognition", label: "Recognition (anabin / HZB)", title: "Qualification recognition — anabin & HZB", eyebrow: "G05 · Foundations", desc: "Understand how your certificates are recognised in Germany (the HZB categories), and look up the binding status on anabin — we orient you, anabin decides.", group: "profile", category: "profile", icon: "FileBadge" },
  { path: "/profile/studienkolleg", file: "profile/Studienkolleg", comp: "ProfileStudienkolleg", label: "Studienkolleg finder", title: "Studienkolleg finder & course (Kurs) guide", eyebrow: "G06 · Foundations", desc: "If your school-leaving certificate isn't Abitur-equivalent, the Studienkolleg is your route. Find the right course stream and how to apply through a university.", group: "profile", category: "profile", icon: "Library" },
  { path: "/profile/grade-simulator", file: "profile/GradeSimulator", comp: "ProfileGradeSimulator", label: "Grade simulator", title: "Grade simulator — what if I score X?", eyebrow: "G1-1 · Foundations", desc: "Sweep a percentage or CGPA and see your German grade and an indicative (non-binding) programme tier before results are even out.", group: "profile", category: "profile", icon: "TrendingUp" },

  // ── Document Prep (features 6–11) ───────────────────────────────────────────
  { path: "/documents", file: "documents/Overview", comp: "DocumentsOverview", label: "Overview", title: "Document Prep", eyebrow: "Bereich B · Document Prep", desc: "Draft and track every document an application needs: SOP, CV, recommendation letters, and the uni-assist workflow.", group: "documents", category: "documents", icon: "FileText" },
  { path: "/documents/sop", file: "documents/Sop", comp: "DocumentsSop", label: "Statement of Purpose", title: "Statement of Purpose generator", eyebrow: "Feature 06 · Documents", desc: "Build a tailored SOP from your profile and a target program — structured, specific, and yours to edit.", group: "documents", category: "documents", icon: "PenLine", featureNo: 6 },
  { path: "/documents/cv", file: "documents/Cv", comp: "DocumentsCv", label: "Europass CV", title: "Europass CV builder", eyebrow: "Feature 07 · Documents", desc: "Produce a Europass-format CV, the European standard German universities recognize.", group: "documents", category: "documents", icon: "FileBadge", featureNo: 7 },
  { path: "/documents/lor", file: "documents/Lor", comp: "DocumentsLor", label: "Recommendation letters", title: "Letter of Recommendation templates", eyebrow: "Feature 08 · Documents", desc: "Give recommenders a strong starting draft tailored to the program and your relationship.", group: "documents", category: "documents", icon: "ScrollText", featureNo: 8 },
  { path: "/documents/uni-assist", file: "documents/UniAssist", comp: "DocumentsUniAssist", label: "Uni-Assist walkthrough", title: "Uni-Assist walkthrough", eyebrow: "Feature 09 · Documents", desc: "Step through the uni-assist application: account, programs, documents, fees, and what happens after you submit.", group: "documents", category: "documents", icon: "ClipboardList", featureNo: 9 },
  { path: "/documents/vpd", file: "documents/Vpd", comp: "DocumentsVpd", label: "VPD tracker", title: "VPD (Preliminary Documentation) tracker", eyebrow: "Feature 10 · Documents", desc: "Track the Vorprüfungsdokumentation some universities require before you apply directly.", group: "documents", category: "documents", icon: "FileCheck", featureNo: 10 },
  { path: "/documents/translation", file: "documents/Translation", comp: "DocumentsTranslation", label: "Translation assistant", title: "Translation assistant", eyebrow: "Feature 11 · Documents", desc: "Understand which documents need certified translations and prepare drafts to hand to a sworn translator.", group: "documents", category: "documents", icon: "Languages", featureNo: 11 },
  { path: "/documents/lor-tracker", file: "documents/LorTracker", comp: "DocumentsLorTracker", label: "LOR request tracker", title: "Recommendation-letter request tracker", eyebrow: "G20 · Documents", desc: "The ask-to-receive workflow your LOR drafts don't cover: who you asked, when, deadlines, and whether each letter is in.", group: "documents", category: "documents", icon: "ScrollText" },
  { path: "/documents/translation-tracker", file: "documents/TranslationTracker", comp: "DocumentsTranslationTracker", label: "Translation tracker", title: "Certified-translation tracker", eyebrow: "G21 · Documents", desc: "Per-document status of your certified translations — which sworn translator, cost, and whether each is back.", group: "documents", category: "documents", icon: "Languages" },
  { path: "/documents/attestation", file: "documents/Attestation", comp: "DocumentsAttestation", label: "Attestation & legalization", title: "Attestation & legalization tracker", eyebrow: "G22 · Documents", desc: "Certified copies, notarisation, and apostille/legalisation — track which documents are authenticated and which still need it.", group: "documents", category: "documents", icon: "FileCheck" },
  { path: "/documents/vpd-helper", file: "documents/VpdHelper", comp: "DocumentsVpdHelper", label: "VPD-or-direct helper", title: "VPD or direct application — decision helper", eyebrow: "G23 · Documents", desc: "Some universities want a uni-assist VPD, others a direct application. Answer a couple of questions to see which path applies to you.", group: "documents", category: "documents", icon: "FileSearch" },
  { path: "/documents/dosv", file: "documents/Dosv", comp: "DocumentsDosv", label: "DoSV / hochschulstart", title: "DoSV / hochschulstart walkthrough", eyebrow: "G24 · Documents", desc: "For NC Bachelor and Medicine places allocated centrally, you apply via hochschulstart's DoSV. Walk through the priorities and the dialogue-oriented procedure.", group: "documents", category: "documents", icon: "ClipboardList" },
  { path: "/documents/requirements", file: "documents/Requirements", comp: "DocumentsRequirements", label: "Per-programme requirements", title: "Per-programme requirement capture", eyebrow: "G15 · Documents", desc: "Paste each programme's stated requirements into a structured, persisted record so you stop re-reading portals and can see what's still missing.", group: "documents", category: "documents", icon: "FileSearch" },
  { path: "/documents/vault-matrix", file: "documents/VaultMatrix", comp: "DocumentsVaultMatrix", label: "Doc-per-application matrix", title: "Which document went to which application", eyebrow: "G19 · Documents", desc: "A matrix of your core documents against each application, so you always know what's been sent where and what's still outstanding.", group: "documents", category: "documents", icon: "FolderCheck" },
  { path: "/vault", file: "documents/Vault", comp: "DocumentsVault", label: "Document vault", eyebrow: "Tresor · Vault", title: "Document vault", desc: "One place for your SOP, CV, recommendation letters, transcripts, and certificates — synced to your account.", group: "documents", category: "documents", icon: "FolderLock" },

  // ── Language & Test Prep (features 12–16) + mock-exam engine ────────────────
  { path: "/language", file: "language/Overview", comp: "LanguageOverview", label: "Overview", title: "Language & Test Prep", eyebrow: "Bereich C · Language & Test", desc: "Reach the German or English level your program requires, and rehearse every admission test with timed mocks.", group: "language", category: "language", icon: "Languages" },
  { path: "/language/german", file: "language/German", comp: "LanguageGerman", label: "German A1–B2 (+TTS)", title: "German A1–B2 course", eyebrow: "Feature 12 · Language", desc: "A structured path from beginner to B2, with audio practice for listening and pronunciation.", group: "language", category: "language", icon: "BookOpen", featureNo: 12 },
  { path: "/language/flashcards", file: "language/Flashcards", comp: "LanguageFlashcards", label: "SRS flashcards", title: "Spaced-repetition flashcards", eyebrow: "Feature 13 · Language", desc: "Memorize vocabulary efficiently with a spaced-repetition schedule that surfaces cards right before you'd forget them.", group: "language", category: "language", icon: "Layers", featureNo: 13 },
  { path: "/language/ielts-toefl", file: "language/IeltsToefl", comp: "LanguageIeltsToefl", label: "IELTS / TOEFL prep", title: "IELTS & TOEFL preparation", eyebrow: "Feature 14 · Language", desc: "Understand the formats, target the right band/score, and practice with timed section mocks.", group: "language", category: "language", icon: "Headphones", featureNo: 14 },
  { path: "/language/gre-gmat", file: "language/GreGmat", comp: "LanguageGreGmat", label: "GRE / GMAT checker", title: "GRE / GMAT requirement checker", eyebrow: "Feature 15 · Language", desc: "Find out whether your target programs require GRE or GMAT, and what scores are competitive.", group: "language", category: "language", icon: "BarChart3", featureNo: 15 },
  { path: "/language/goethe-testdaf", file: "language/GoetheTestdaf", comp: "LanguageGoetheTestdaf", label: "Goethe / TestDaF guides", title: "Goethe & TestDaF guides", eyebrow: "Feature 16 · Language", desc: "Pick the right German certificate (TestDaF, DSH, Goethe, telc) and prepare for each section.", group: "language", category: "language", icon: "BookOpenCheck", featureNo: 16 },
  { path: "/language/german-plan", file: "language/GermanPlan", comp: "LanguageGermanPlan", label: "German A1→C1 study plan", title: "German A1→C1 — structured study plan", eyebrow: "G09 · Language", desc: "A level-by-level plan from absolute beginner to the C1 many German-taught degrees need — with realistic hours, milestones, and progress you can track.", group: "language", category: "language", icon: "BookOpen" },
  { path: "/language/testas", file: "language/TestAs", comp: "LanguageTestAs", label: "TestAS prep", title: "TestAS — Test for Academic Studies", eyebrow: "G11 · Language", desc: "Many Bachelor and foundation routes for international applicants expect TestAS. Understand the core + subject modules and how to prepare.", group: "language", category: "language", icon: "ClipboardCheck" },
  { path: "/language/dsh", file: "language/Dsh", comp: "LanguageDsh", label: "DSH exam prep", title: "DSH — university German exam", eyebrow: "G13 · Language", desc: "The university-run C1 German exam (alongside TestDaF). Understand the DSH-1/2/3 levels, the sections, and how to prepare.", group: "language", category: "language", icon: "BookOpenCheck" },
  { path: "/language/placement", file: "language/Placement", comp: "LanguagePlacement", label: "German placement self-check", title: "German level — quick self-check", eyebrow: "G10 · Language", desc: "Estimate your current CEFR level from a short self-assessment, so you start your German plan at the right place instead of guessing.", group: "language", category: "language", icon: "Gauge" },
  { path: "/language/aufnahmepruefung", file: "language/Aufnahmepruefung", comp: "LanguageAufnahmepruefung", label: "Aufnahmeprüfung prep", title: "Studienkolleg entrance exam (Aufnahmeprüfung)", eyebrow: "G07 · Language", desc: "The entrance test that gets you into a Studienkolleg — German plus subject basics. Know the format and how to prepare.", group: "language", category: "language", icon: "ClipboardCheck" },
  { path: "/language/fsp", file: "language/Fsp", comp: "LanguageFsp", label: "FSP (Feststellungsprüfung) prep", title: "Feststellungsprüfung (FSP) prep", eyebrow: "G08 · Language", desc: "The exam that confers your HZB at the end of the Studienkolleg — subjects, structure, and a per-subject prep tracker.", group: "language", category: "language", icon: "BookOpenCheck" },
  { path: "/language/tms", file: "language/Tms", comp: "LanguageTms", label: "TMS (medicine) prep", title: "TMS — medical studies aptitude test", eyebrow: "G12 · Language", desc: "The Test für Medizinische Studiengänge can lift your Medicine application. Understand the subtests and how to prepare.", group: "language", category: "language", icon: "HeartPulse" },
  { path: "/language/exams", file: "language/ExamsHub", comp: "LanguageExamsHub", label: "Mock exams", title: "Mock exam centre", eyebrow: "Übungstests · Mock exams", desc: "Timed practice exams for every test you might need: IELTS, TOEFL, TestDaF, Goethe, GRE, and GMAT.", group: "language", category: "language", icon: "ClipboardCheck" },
  { path: "/language/exam-progress", file: "language/ExamTracker", comp: "LanguageExamTracker", label: "Exam progress", title: "Exam progress & analytics", eyebrow: "Fortschritt · Progress", desc: "Track your mock-exam scores over time: per-skill and per-question-type accuracy, ranked weaknesses, a predicted band, and a personalised study plan.", group: "language", category: "language", icon: "TrendingUp" },
  { path: "/language/exams/ielts", file: "language/exams/Ielts", comp: "ExamIelts", label: "IELTS mock", title: "IELTS Academic — practice exam", eyebrow: "Übungstest · IELTS", desc: "A timed IELTS Academic practice set across Listening, Reading, and Writing question types.", group: "language", category: "language", icon: "Headphones", hide: true },
  { path: "/language/exams/toefl", file: "language/exams/Toefl", comp: "ExamToefl", label: "TOEFL mock", title: "TOEFL iBT — practice exam", eyebrow: "Übungstest · TOEFL", desc: "A timed TOEFL iBT practice set across Reading and Listening question types.", group: "language", category: "language", icon: "Globe", hide: true },
  { path: "/language/exams/toefl-legacy", file: "language/exams/ToeflLegacy", comp: "ExamToeflLegacy", label: "TOEFL legacy mock", title: "TOEFL iBT (legacy 0–120) — practice exam", eyebrow: "Übungstest · TOEFL legacy", desc: "Practice the retired pre-2026 TOEFL format and interpret an old 0–120 score.", group: "language", category: "language", icon: "Globe", hide: true },
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
  { path: "/finance/work-days", file: "finance/WorkDays", comp: "FinanceWorkDays", label: "Work-day limit tracker", title: "Work-day limit tracker (140 / 280)", eyebrow: "G33 · Finance", desc: "Log your working days against the annual 140-full / 280-half-day limit for non-EU students, computed deterministically so you never breach your permit.", group: "finance", category: "finance", icon: "Briefcase", disclaimer: true },
  { path: "/finance/application-costs", file: "finance/ApplicationCosts", comp: "FinanceApplicationCosts", label: "Application-cost estimator", title: "Application-cost estimator", eyebrow: "G18 · Finance", desc: "Sum the uni-assist and APS fees across your whole shortlist before you apply, so the application phase doesn't surprise you.", group: "finance", category: "finance", icon: "Coins", disclaimer: true },
  { path: "/finance/scholarship-tracker", file: "finance/ScholarshipTracker", comp: "FinanceScholarshipTracker", label: "Scholarship tracker", title: "Scholarship application tracker", eyebrow: "G31 · Finance", desc: "Track every scholarship you're applying to — deadline, status, and outcome — so none slips through.", group: "finance", category: "finance", icon: "Award", disclaimer: true },
  { path: "/finance/funding-plan", file: "finance/FundingPlan", comp: "FinanceFundingPlan", label: "Funding-gap planner", title: "Funding-gap & affordability planner", eyebrow: "G32 · Finance", desc: "Put your savings, family support, loan, scholarship, and expected work income against the total cost — and see, deterministically, whether you're covered.", group: "finance", category: "finance", icon: "Coins", disclaimer: true },
  { path: "/finance/loans", file: "finance/Loans", comp: "FinanceLoans", label: "Education-loan comparison", title: "Education-loan comparison framework", eyebrow: "G29 · Finance", desc: "The #1 funding route for many students. Compare loan offers on the terms that actually matter — without us inventing any rates.", group: "finance", category: "finance", icon: "Landmark", disclaimer: true },
  { path: "/finance/sperrkonto-providers", file: "finance/SperrkontoProviders", comp: "FinanceSperrkontoProviders", label: "Sperrkonto providers", title: "Sperrkonto provider comparison", eyebrow: "G30 · Finance", desc: "Compare blocked-account providers on setup time, fees, and acceptance — and track your own funding progress toward the required amount.", group: "finance", category: "finance", icon: "Landmark", disclaimer: true },

  // ── Visa & Relocation (features 22–26) — disclaimer required ────────────────
  { path: "/visa", file: "visa/Overview", comp: "VisaOverview", label: "Overview", title: "Visa & Relocation", eyebrow: "Bereich E · Visa & Relocation", desc: "Get from offer letter to Anmeldung: APS, the student visa, accommodation, and registering your address.", group: "visa", category: "visa", icon: "Plane", disclaimer: true },
  { path: "/visa/simulator", file: "visa/Simulator", comp: "VisaSimulator", label: "Visa interview simulator", title: "Visa interview simulator", eyebrow: "Feature 22 · Visa", desc: "Rehearse the student-visa interview with realistic questions and spoken practice.", group: "visa", category: "visa", icon: "Mic", featureNo: 22, disclaimer: true },
  { path: "/visa/checklist", file: "visa/Checklist", comp: "VisaChecklist", label: "Visa checklist", title: "Visa checklist & deadlines", eyebrow: "Feature 23 · Visa", desc: "The documents a German student-visa application needs, plus appointment lead times to plan around.", group: "visa", category: "visa", icon: "ListChecks", featureNo: 23, disclaimer: true },
  { path: "/visa/appointment", file: "visa/Appointment", comp: "VisaAppointment", label: "Visa appointment tracker", title: "Visa appointment tracker", eyebrow: "G34 · Visa", desc: "Mission appointment waits can run months. Track your booked slot and the document deadlines around it so the visa never becomes your bottleneck.", group: "visa", category: "visa", icon: "CalendarDays", disclaimer: true },
  { path: "/visa/refusal", file: "visa/Refusal", comp: "VisaRefusal", label: "Visa refusal & next steps", title: "If your visa is refused — what now", eyebrow: "G7-01 · Visa", desc: "A refusal isn't the end. Read the ground(s) the mission gave, fix them, and choose: re-apply with stronger evidence, take legal action, or defer to the next intake.", group: "visa", category: "visa", icon: "FileX2", disclaimer: true },
  { path: "/visa/visa-type", file: "visa/VisaType", comp: "VisaType", label: "Which visa do I need?", title: "Visa-type selector", eyebrow: "G36 · Visa", desc: "Study visa, applicant visa, or language-course visa? Answer a couple of questions to find the right category for your situation.", group: "visa", category: "visa", icon: "Plane", disclaimer: true },
  { path: "/visa/videx", file: "visa/Videx", comp: "VisaVidex", label: "VIDEX form walkthrough", title: "VIDEX visa-form walkthrough", eyebrow: "G35 · Visa", desc: "The online national-visa form (VIDEX) trips people up. Walk through what each section asks and the documents to have open while you fill it.", group: "visa", category: "visa", icon: "FileText", disclaimer: true },
  { path: "/visa/aps", file: "visa/Aps", comp: "VisaAps", label: "APS guide", title: "APS certificate guide", eyebrow: "Feature 24 · Visa", desc: "Understand the Akademische Prüfstelle check required for students from some countries, and how to get it.", group: "visa", category: "visa", icon: "Stamp", featureNo: 24, disclaimer: true },
  { path: "/visa/accommodation", file: "visa/Accommodation", comp: "VisaAccommodation", label: "Accommodation finder", title: "Accommodation finder", eyebrow: "Feature 25 · Visa", desc: "Find student housing — Studierendenwerk dorms and the private market — and avoid common rental scams.", group: "visa", category: "visa", icon: "Building2", featureNo: 25, disclaimer: true },
  { path: "/visa/anmeldung", file: "visa/Anmeldung", comp: "VisaAnmeldung", label: "Anmeldung simulation", title: "Anmeldung (address registration)", eyebrow: "Feature 26 · Visa", desc: "Walk through registering your address at the Bürgeramt after you arrive — the step that unlocks everything else.", group: "visa", category: "visa", icon: "MapPin", featureNo: 26, disclaimer: true },

  // ── Arrival & Settling In (gap analysis G27, G38–G47) — disclaimer where visa/finance ──
  { path: "/arrival", file: "arrival/Overview", comp: "ArrivalOverview", label: "Arrival overview", title: "Arrival & settling in", eyebrow: "Phase 8 · Arrival", desc: "The steps nobody warns you about — the ones after you land. Register, open a bank account, convert your visa, enrol, and stay on top of renewals.", group: "arrival", icon: "MapPin" },
  { path: "/arrival/enrolment", file: "arrival/Enrolment", comp: "ArrivalEnrolment", label: "Enrolment (Immatrikulation)", title: "Enrolment (Immatrikulation) guide", eyebrow: "G27 · Arrival", desc: "Turn your admission letter into a student place: the documents, the semester contribution, and the Matrikelnummer that unlocks campus life.", group: "arrival", icon: "GraduationCap" },
  { path: "/arrival/bank-account", file: "arrival/BankAccount", comp: "ArrivalBankAccount", label: "German bank account", title: "Opening a German bank account", eyebrow: "G38 · Arrival", desc: "The account that unblocks your Sperrkonto payouts, rent, and salary — which type to open, what you need, and the order to do it in.", group: "arrival", icon: "Landmark" },
  { path: "/arrival/residence-permit", file: "arrival/ResidencePermit", comp: "ArrivalResidencePermit", label: "Residence permit tracker", title: "Residence-permit (Aufenthaltstitel) conversion", eyebrow: "G39 · Arrival", desc: "Your entry visa must become a residence permit at the Ausländerbehörde — track the documents, the appointment, and the deadline so it never lapses.", group: "arrival", icon: "Stamp", disclaimer: true },
  { path: "/arrival/auslaenderbehoerde", file: "arrival/Auslaenderbehoerde", comp: "ArrivalAuslaenderbehoerde", label: "Ausländerbehörde tracker", title: "Ausländerbehörde appointment & documents", eyebrow: "G40 · Arrival", desc: "The foreigners' office runs your residence permit. Track your appointment and assemble the exact document set it expects.", group: "arrival", icon: "Building2", disclaimer: true },
  { path: "/arrival/university-onboarding", file: "arrival/UniversityOnboarding", comp: "ArrivalUniversityOnboarding", label: "University onboarding", title: "First-weeks university onboarding", eyebrow: "G41 · Arrival", desc: "Matrikelnummer, student ID & email, library and IT accounts, course registration, and the Rückmeldung you mustn't miss.", group: "arrival", icon: "School" },
  { path: "/arrival/anmeldung-runbook", file: "arrival/AnmeldungRunbook", comp: "ArrivalAnmeldungRunbook", label: "Anmeldung runbook", title: "Anmeldung — booking & document runbook", eyebrow: "G42 · Arrival", desc: "A practical, city-agnostic runbook for booking the Bürgeramt appointment and bringing exactly the right documents the first time.", group: "arrival", icon: "ClipboardList" },
  { path: "/arrival/rundfunkbeitrag", file: "arrival/Rundfunkbeitrag", comp: "ArrivalRundfunkbeitrag", label: "Rundfunkbeitrag & utilities", title: "Rundfunkbeitrag & utilities setup", eyebrow: "G43 · Arrival", desc: "The mandatory broadcasting fee per household, plus electricity, internet, and liability insurance — the bills that blindside new arrivals.", group: "arrival", icon: "Coins" },
  { path: "/arrival/job-seeker-permit", file: "arrival/JobSeekerPermit", comp: "ArrivalJobSeekerPermit", label: "Post-study job-seeker permit", title: "18-month post-study job-seeker permit", eyebrow: "G44 · Ongoing", desc: "After graduation you can stay up to 18 months to find qualified work — what it allows, when to apply, and the path to a work permit or Blue Card.", group: "arrival", icon: "Briefcase", disclaimer: true },
  { path: "/arrival/family-reunion", file: "arrival/FamilyReunion", comp: "ArrivalFamilyReunion", label: "Family reunion", title: "Bringing your family (Familiennachzug)", eyebrow: "G45 · Ongoing", desc: "If a spouse or children join you, plan the family-reunion visa: who qualifies, the income and housing expectations, and the documents.", group: "arrival", icon: "Users", disclaimer: true },
  { path: "/arrival/renewals", file: "arrival/Renewals", comp: "ArrivalRenewals", label: "Renewals & re-registration", title: "Permit renewals & semester re-registration", eyebrow: "G46 · G47 · Ongoing", desc: "Two recurring deadlines that get people exmatrikuliert or out of status: residence-permit renewal and the semester Rückmeldung. Set them and never miss them.", group: "arrival", icon: "BellRing" },
  { path: "/arrival/arrival-day", file: "arrival/ArrivalDay", comp: "ArrivalArrivalDay", label: "Arrival-day planner", title: "Arrival-day & first-72-hours planner", eyebrow: "G37 · Arrival", desc: "A practical sequence for landing day and the first few days: SIM, transport, temporary stay, cash, and the appointments to book immediately.", group: "arrival", icon: "Backpack" },
  { path: "/arrival/blue-card", file: "arrival/BlueCard", comp: "ArrivalBlueCard", label: "Blue Card & settlement", title: "EU Blue Card & permanent settlement", eyebrow: "G48 · Ongoing", desc: "The work-to-settlement endgame: how a qualified job becomes an EU Blue Card and, in time, permanent residence (Niederlassungserlaubnis).", group: "arrival", icon: "Award", disclaimer: true },
  { path: "/arrival/immigration-pathway", file: "arrival/ImmigrationPathway", comp: "ArrivalImmigrationPathway", label: "Your immigration long-game", title: "Study → Blue Card → PR → Citizenship", eyebrow: "Long game · Ongoing", desc: "The full ladder from student to citizen, personalised to your field and German level — with the current 2026 thresholds, timelines, and the official sources to verify each.", group: "arrival", icon: "Route", disclaimer: true },
  { path: "/arrival/blue-card-check", file: "arrival/BlueCardCheck", comp: "ArrivalBlueCardCheck", label: "Blue Card salary check", title: "EU Blue Card eligibility check", eyebrow: "Long game · Tool", desc: "Enter an expected salary and field to see whether it clears the 2026 Blue Card threshold — the lower one for shortage occupations, STEM, and recent graduates.", group: "arrival", icon: "Gauge", disclaimer: true },
  { path: "/arrival/pr-citizenship", file: "arrival/PrCitizenship", comp: "ArrivalPrCitizenship", label: "PR & citizenship timeline", title: "PR & citizenship timeline tracker", eyebrow: "Long game · Tool", desc: "Track your qualified-residence start and German level to see indicative dates for permanent residence and citizenship under the current 2026 rules.", group: "arrival", icon: "Stamp", disclaimer: true },
  { path: "/arrival/tax-id", file: "arrival/TaxId", comp: "ArrivalTaxId", label: "Tax-ID & first job", title: "Tax-ID & first-job onboarding", eyebrow: "G49 · Ongoing", desc: "Starting work means a tax ID, a tax class, social contributions, and the Werkstudent rules. Here's what to set up and what to expect on your payslip.", group: "arrival", icon: "FileBadge", disclaimer: true },

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
