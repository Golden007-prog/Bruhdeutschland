/**
 * Topic pools + freshness helpers (work-order §5A). Each generation injects a per-attempt nonce and
 * rotates over a topic pool, passing recently-seen topics as an exclusion list so consecutive
 * attempts don't repeat. Pools are broad academic/everyday themes appropriate to each exam's domain.
 */

export function makeNonce(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${id}-${Date.now()}`;
}

/** Academic/everyday topic pools by exam family. */
const ACADEMIC_EN = [
  "urban beekeeping", "deep-sea exploration", "the history of tea", "renewable energy storage",
  "sleep science", "the psychology of habit", "ancient road networks", "coral reef restoration",
  "the economics of recycling", "language acquisition in children", "vertical farming",
  "the printing revolution", "migratory birds", "volcanology", "the gig economy",
  "museum conservation", "desalination", "the science of memory", "soundscape ecology",
  "the future of work", "glacier monitoring", "food preservation through history",
  "behavioural economics", "the night sky and light pollution", "textile dyeing traditions",
];

const GERMAN_THEMES = [
  "Studium in Deutschland", "öffentlicher Nahverkehr", "Mülltrennung und Recycling",
  "Work-Life-Balance", "digitale Bildung", "erneuerbare Energien", "Ehrenamt",
  "Wohnen in der Großstadt", "Ernährung und Gesundheit", "Reisen mit der Bahn",
  "Künstliche Intelligenz im Alltag", "Sprachenlernen", "Klimaschutz", "Arbeitsmarkt",
];

const QUANT_CONTEXTS = [
  "rates and work", "ratios and mixtures", "percentages and discounts", "averages and weighted means",
  "number properties", "linear equations", "geometry of triangles", "probability basics",
  "sequences", "interest and growth", "data sufficiency on inequalities", "coordinate geometry",
];

export function topicPool(examId: string, skill: string): string[] {
  if (examId === "testdaf" || examId === "goethe") return GERMAN_THEMES;
  if (skill === "quantitative" || skill === "data_insights") return QUANT_CONTEXTS;
  return ACADEMIC_EN;
}

/** Pick a topic deterministically from the nonce so a run is reproducible but varies attempt-to-attempt. */
export function pickTopics(pool: string[], exclude: string[], count: number, nonce: string): string[] {
  const available = pool.filter((t) => !exclude.includes(t));
  const source = available.length >= count ? available : pool;
  // Seed an index from the nonce so different attempts pick different starting points.
  let seed = 0;
  for (const ch of nonce) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(source[(seed + i * 7) % source.length]);
  }
  return picks;
}
