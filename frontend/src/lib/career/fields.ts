/**
 * Career fields & job-market signal (long-game addendum §6). QUALITATIVE only — roles, demand level, and
 * shortage-occupation status grounded against the make-it-in-germany "professions in demand" list. We
 * deliberately ship NO fabricated salary figures; the only salary anchor is which EU Blue Card threshold
 * a field maps to (those numbers live in lib/facts with provenance). `needs_verification` in the UI.
 */

export type Demand = "very_high" | "high" | "moderate";

export interface CareerField {
  key: string;
  name: string;
  /** Recognised shortage occupation (Mangelberuf) → lower Blue Card threshold + stronger demand. */
  shortage: boolean;
  demand: Demand;
  /** Typical roles (qualitative, not exhaustive). */
  roles: string[];
  /** Which EU Blue Card salary threshold typically applies. */
  blueCardTier: "shortage" | "standard";
  note: string;
}

export const CAREER_FIELDS: CareerField[] = [
  { key: "it", name: "IT & Software", shortage: true, demand: "very_high", blueCardTier: "shortage", roles: ["Software engineer", "DevOps / cloud engineer", "Data engineer", "IT security"], note: "Among Germany's most acute shortages; qualifying IT specialists can even use the lower threshold without a formal degree in some cases." },
  { key: "data_ai", name: "Data & AI", shortage: true, demand: "very_high", blueCardTier: "shortage", roles: ["Data scientist", "ML engineer", "Analytics", "AI researcher"], note: "Strong, growing demand across industry and research." },
  { key: "engineering", name: "Engineering", shortage: true, demand: "very_high", blueCardTier: "shortage", roles: ["Mechanical / electrical / automotive engineer", "Process engineer", "R&D"], note: "Core of Germany's industrial economy; persistent shortage." },
  { key: "natural_sciences", name: "Natural Sciences", shortage: true, demand: "high", blueCardTier: "shortage", roles: ["Physicist", "Chemist", "Biotech / lab scientist"], note: "STEM field; eligible for the lower Blue Card threshold." },
  { key: "maths", name: "Mathematics", shortage: true, demand: "high", blueCardTier: "shortage", roles: ["Quant", "Actuary", "Modelling / optimisation"], note: "STEM; strong demand in finance, insurance, and tech." },
  { key: "medicine", name: "Medicine & Health", shortage: true, demand: "very_high", blueCardTier: "shortage", roles: ["Physician (after Approbation)", "Public health", "Biomedical"], note: "Severe shortage; clinical practice needs Approbation + the medical Fachsprachprüfung." },
  { key: "nursing", name: "Nursing & Care", shortage: true, demand: "very_high", blueCardTier: "shortage", roles: ["Registered nurse", "Geriatric care", "Care management"], note: "One of the largest shortages; often an Ausbildung/recognition route rather than Blue Card." },
  { key: "pharmacy", name: "Pharmacy", shortage: true, demand: "high", blueCardTier: "shortage", roles: ["Pharmacist", "Pharma R&D", "Regulatory affairs"], note: "Shortage occupation; practice requires licensure." },
  { key: "teaching", name: "Education & Teaching", shortage: true, demand: "high", blueCardTier: "standard", roles: ["STEM teacher", "Vocational trainer", "EdTech"], note: "Teacher shortage, but state teaching needs German qualification recognition." },
  { key: "skilled_trades", name: "Skilled Trades & Crafts", shortage: true, demand: "high", blueCardTier: "standard", roles: ["Electrician", "Mechatronics", "Construction trades"], note: "Major shortage; typically the Ausbildung / recognition route, not the Blue Card." },
  { key: "business", name: "Business & Finance", shortage: false, demand: "moderate", blueCardTier: "standard", roles: ["Consultant", "Controller", "Product / project manager"], note: "Competitive; German often matters more here. Standard Blue Card threshold applies." },
  { key: "law_social", name: "Law, Social & Humanities", shortage: false, demand: "moderate", blueCardTier: "standard", roles: ["Policy / NGO", "HR", "Communications"], note: "Often German-dependent and competitive for non-EU graduates; standard threshold." },
];

const SHORTAGE_KEYWORDS = [
  "software", "comput", "informatic", "it ", "data", "machine learning", " ai", "artificial intelligence",
  "engineer", "mechatron", "electr", "mechanic", "automot", "civil eng",
  "physic", "chemist", "biolog", "biotech", "science", "math",
  "medic", "health", "nurs", "pharma", "doctor", "clinic",
  "teach", "education",
];

/** True when the (free-text) target field looks like a recognised shortage occupation. */
export function isShortageOccupation(text: string): boolean {
  const t = ` ${text.toLowerCase()} `;
  if (!text.trim()) return false;
  // Direct match against a known field's keys/name, then keyword scan.
  if (CAREER_FIELDS.some((f) => f.shortage && (t.includes(f.key) || t.includes(f.name.toLowerCase())))) return true;
  return SHORTAGE_KEYWORDS.some((k) => t.includes(k));
}

/** Look up a field by key. */
export function careerField(key: string): CareerField | undefined {
  return CAREER_FIELDS.find((f) => f.key === key);
}

/* ── Lightweight interest self-check (deterministic, non-clinical) ──────────────────────────────── */

export interface InterestQuestion {
  id: string;
  prompt: string;
  /** Field keys this interest points to. */
  fields: string[];
}

export const INTEREST_QUESTIONS: InterestQuestion[] = [
  { id: "build_software", prompt: "I enjoy building software or working with computers and systems.", fields: ["it", "data_ai"] },
  { id: "data_numbers", prompt: "I like working with data, numbers, and finding patterns.", fields: ["data_ai", "maths"] },
  { id: "design_build", prompt: "I like designing or building physical things and understanding how they work.", fields: ["engineering", "skilled_trades"] },
  { id: "science_research", prompt: "I'm drawn to scientific research and experiments.", fields: ["natural_sciences", "data_ai"] },
  { id: "help_health", prompt: "I want to help people directly, especially in health or care.", fields: ["medicine", "nursing"] },
  { id: "medicines", prompt: "I'm interested in medicines, chemistry, and how drugs work.", fields: ["pharmacy", "natural_sciences"] },
  { id: "teach_explain", prompt: "I like teaching, explaining, and helping others learn.", fields: ["teaching"] },
  { id: "business_manage", prompt: "I'm interested in business, strategy, and managing projects or people.", fields: ["business"] },
  { id: "people_society", prompt: "I care about people, society, law, or communication.", fields: ["law_social"] },
];

/** Tally selected interests into ranked field suggestions (deterministic). */
export function scoreInterests(selectedQuestionIds: string[]): { field: CareerField; score: number }[] {
  const tally = new Map<string, number>();
  for (const q of INTEREST_QUESTIONS) {
    if (!selectedQuestionIds.includes(q.id)) continue;
    for (const key of q.fields) tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([key, score]) => ({ field: careerField(key)!, score }))
    .filter((r) => r.field)
    .sort((a, b) => b.score - a.score || a.field.name.localeCompare(b.field.name));
}
