/**
 * Bundled offline seed forms (work-order §5A). The bottom rung of the fallback ladder: if live
 * generation is unavailable (no key, rate-limited, repeated invalid output), the exam still works
 * with no network. These are clearly flagged `isSeed: true` so the UI can label them. They are
 * compact but schema-valid; richer/longer forms can be added over time.
 */
import type { Choice, GeneratedExam, GeneratedSection, ObjectiveQuestion } from "@/lib/exam/schema";

let counter = 0;
const uid = (p: string) => `${p}${++counter}`;

function mc(prompt: string, choices: string[], correctIdx: number, explanation: string, typeLabel: string, passageRef?: string): ObjectiveQuestion {
  const cs: Choice[] = choices.map((text, i) => ({ id: `c${i}`, text }));
  return {
    id: uid("q"),
    kind: "objective",
    typeLabel,
    prompt,
    choices: cs,
    answerId: `c${correctIdx}`,
    explanation,
    passageRef,
  };
}

const IELTS_READING: GeneratedSection = {
  skill: "reading",
  title: "Reading",
  instructions: "Read the passage and answer the questions.",
  open: [],
  passages: [
    {
      id: "p1",
      title: "The Quiet Spread of Urban Beekeeping",
      kind: "reading",
      body:
        "Over the past two decades, beekeeping has moved from the countryside onto city rooftops and balconies. Advocates argue that urban hives support pollination of parks and community gardens, while giving residents a tangible connection to food production. Critics, however, caution that a rapid rise in managed honeybee colonies can crowd out wild pollinators such as solitary bees, which are often more effective pollinators of native plants. Researchers now recommend that cities pair any expansion of hives with plantings of diverse, nectar-rich flowers, so that the additional bees do not simply compete for a fixed supply of forage. Several municipalities have begun registering hives to monitor density, a measure that beekeepers initially resisted but increasingly accept as a way to keep the practice sustainable.",
    },
  ],
  objective: [
    mc("Urban beekeeping has mainly expanded in which locations?", ["Rural farms", "City rooftops and balconies", "Desert regions", "Coastal wetlands"], 1, "The passage says it moved 'onto city rooftops and balconies'.", "Multiple choice", "p1"),
    mc("Critics worry that more honeybee colonies may harm wild solitary bees. (True / False / Not Given)", ["True", "False", "Not Given"], 0, "Critics caution managed colonies 'can crowd out wild pollinators such as solitary bees'.", "True/False/Not Given", "p1"),
    mc("According to the passage, solitary bees are always less effective than honeybees. (True / False / Not Given)", ["True", "False", "Not Given"], 1, "It says solitary bees are 'often more effective pollinators of native plants'.", "True/False/Not Given", "p1"),
    mc("What do researchers recommend alongside expanding hives?", ["Banning wild bees", "Planting diverse nectar-rich flowers", "Removing parks", "Importing foreign bees"], 1, "They recommend pairing hives 'with plantings of diverse, nectar-rich flowers'.", "Multiple choice", "p1"),
    mc("How did beekeepers first react to hive registration?", ["They welcomed it", "They resisted it", "They ignored it", "They invented it"], 1, "Beekeepers 'initially resisted' registration.", "Detail", "p1"),
    mc("The main purpose of registering hives is to…", ["increase honey prices", "monitor hive density for sustainability", "ban community gardens", "replace wild bees"], 1, "Registration monitors density 'as a way to keep the practice sustainable'.", "Purpose", "p1"),
  ],
};

const IELTS_LISTENING: GeneratedSection = {
  skill: "listening",
  title: "Listening",
  instructions: "Listen to the recording and answer the questions. The audio plays once.",
  open: [],
  passages: [
    {
      id: "l1",
      title: "Part 1 — Community centre enquiry",
      kind: "listening",
      body:
        "Hello, you've reached the Riverside Community Centre. The pottery course runs on Tuesday evenings from seven to nine. The cost is forty pounds for eight weeks, and that includes all materials. You'll need to bring an apron, but tools are provided. Please note the first session is in the studio on the second floor, not the main hall.",
    },
  ],
  objective: [
    mc("When does the pottery course run?", ["Monday mornings", "Tuesday evenings", "Wednesday afternoons", "Thursday evenings"], 1, "'Tuesday evenings from seven to nine.'", "Form completion", "l1"),
    mc("How much does the course cost?", ["£14", "£40", "£48", "£80"], 1, "'forty pounds for eight weeks'.", "Form completion", "l1"),
    mc("What must participants bring?", ["Tools", "An apron", "Clay", "A laptop"], 1, "'You'll need to bring an apron, but tools are provided.'", "Detail", "l1"),
    mc("Where is the first session held?", ["The main hall", "The studio on the second floor", "The car park", "The café"], 1, "'in the studio on the second floor, not the main hall'.", "Plan/map labelling", "l1"),
  ],
};

const IELTS_WRITING: GeneratedSection = {
  skill: "writing",
  title: "Writing",
  passages: [],
  objective: [],
  figure: {
    chartType: "bar",
    title: "Weekly visitors to a city library by age group (2025)",
    xLabel: "Age group",
    yLabel: "Visitors (thousands)",
    series: [
      {
        name: "Visitors",
        points: [
          { label: "Under 18", value: 4.2 },
          { label: "18–34", value: 6.8 },
          { label: "35–54", value: 3.1 },
          { label: "55+", value: 5.4 },
        ],
      },
    ],
  },
  open: [
    {
      id: "w1",
      kind: "open",
      typeLabel: "Task 1 — describe a figure",
      prompt: "The chart shows weekly visitors to a city library by age group in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      guidance: "Write at least 150 words. Describe the overall trend, the highest and lowest groups, and notable comparisons.",
      minWords: 150,
    },
    {
      id: "w2",
      kind: "open",
      typeLabel: "Task 2 — essay",
      prompt: "Some people believe public libraries should focus on digital services rather than physical books. To what extent do you agree or disagree?",
      guidance: "Write at least 250 words with a clear position, developed reasons, and examples.",
      minWords: 250,
    },
  ],
};

const IELTS_SPEAKING: GeneratedSection = {
  skill: "speaking",
  title: "Speaking",
  passages: [],
  objective: [],
  open: [
    { id: "s1", kind: "open", typeLabel: "Part 1 — familiar topics", prompt: "Let's talk about your hometown. Where is it, and what do you like most about living there?", recordSeconds: 60 },
    { id: "s2", kind: "open", typeLabel: "Part 2 — cue card", prompt: "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would help you.", guidance: "You have 1 minute to prepare and up to 2 minutes to speak.", prepSeconds: 60, recordSeconds: 120 },
    { id: "s3", kind: "open", typeLabel: "Part 3 — discussion", prompt: "Do you think people learn new skills differently today than in the past? Why?", recordSeconds: 60 },
  ],
};

function makeExam(examId: string, title: string, language: "en" | "de", sections: GeneratedSection[]): GeneratedExam {
  return { examId, title, language, sections, nonce: `seed-${examId}`, isSeed: true };
}

/** Minimal objective-only seed section for exams without bundled long-form content yet. */
function genericSection(skill: GeneratedSection["skill"], title: string, qs: ObjectiveQuestion[]): GeneratedSection {
  return { skill, title, passages: [], open: [], objective: qs };
}

const SEED_FORMS: Record<string, GeneratedExam> = {
  ielts: makeExam("ielts", "IELTS Academic — offline practice", "en", [
    IELTS_LISTENING,
    IELTS_READING,
    IELTS_WRITING,
    IELTS_SPEAKING,
  ]),
  toefl: makeExam("toefl", "TOEFL iBT (2026) — offline practice", "en", [
    genericSection("reading", "Reading", [
      mc("In a 'Complete the Words' item, you must supply the word that…", ["fits the blank in meaning and form", "is the longest option", "appears first in the text", "rhymes with the title"], 0, "Cloze items reward the contextually correct word.", "Complete the Words"),
      mc("'Read in Daily Life' passages are typically…", ["academic journal articles", "ads, menus, and forms", "poetry", "lab reports"], 1, "Daily-life items use everyday texts.", "Read in Daily Life"),
      mc("A short academic passage item rewards identifying the…", ["main idea and key details", "font size", "author's age", "page number"], 0, "Comprehension targets the main idea and details.", "Read an Academic Passage"),
      mc("The 2026 Reading section is…", ["fixed-form", "multistage-adaptive", "untimed", "oral"], 1, "Reading is multistage-adaptive in 2026.", "Format"),
    ]),
  ]),
  "toefl-legacy": makeExam("toefl-legacy", "TOEFL iBT (legacy 0–120) — offline practice", "en", [
    genericSection("reading", "Reading", [
      mc("The word 'mitigate' most nearly means…", ["worsen", "lessen", "ignore", "repeat"], 1, "'Mitigate' means to make less severe.", "Vocabulary in context"),
      mc("A passage's main idea is best described as its…", ["smallest detail", "central argument", "first word", "footnote"], 1, "The main idea is the central argument.", "Main idea"),
      mc("An inference question asks you to…", ["restate the text", "draw a supported conclusion", "count words", "translate"], 1, "Inference = a supported conclusion not stated directly.", "Inference"),
      mc("'Sentence simplification' items reward answers that keep the…", ["essential meaning", "exact words", "longest form", "first clause"], 0, "They must preserve essential meaning.", "Sentence simplification"),
    ]),
  ]),
  testdaf: makeExam("testdaf", "TestDaF — Offline-Übung", "de", [
    genericSection("reading", "Lesen", [
      mc("Was bedeutet 'die Frist'?", ["der Anfang", "der Termin / die Deadline", "die Pause", "der Ort"], 1, "'Frist' = Deadline/Termin.", "Wortschatz"),
      mc("Welcher Satz ist im Perfekt?", ["Ich gehe.", "Ich bin gegangen.", "Ich werde gehen.", "Ich ginge."], 1, "'bin gegangen' = Perfekt.", "Grammatik"),
      mc("'obwohl' leitet einen … Satz ein.", ["Kausalsatz", "Konzessivsatz", "Finalsatz", "Relativsatz"], 1, "'obwohl' = konzessiv (Einräumung).", "Grammatik"),
      mc("Synonym für 'wichtig':", ["nebensächlich", "bedeutend", "langweilig", "schnell"], 1, "'bedeutend' = wichtig.", "Wortschatz"),
    ]),
  ]),
  goethe: makeExam("goethe", "Goethe-Zertifikat — Offline-Übung", "de", [
    genericSection("reading", "Lesen", [
      mc("'Ich ___ gern Kaffee.' (Wähle das Verb.)", ["trinke", "trinkt", "trinken", "getrunken"], 0, "1. Person Singular: 'ich trinke'.", "Grammatik (A1/A2)"),
      mc("Der Artikel von 'Haus' ist…", ["der", "die", "das", "den"], 2, "'das Haus' (Neutrum).", "Artikel"),
      mc("Gegenteil von 'groß':", ["klein", "schnell", "alt", "neu"], 0, "Antonym: klein.", "Wortschatz"),
      mc("'Wir fahren ___ Berlin.' Präposition?", ["nach", "in", "an", "zu"], 0, "Städtenamen: 'nach Berlin'.", "Präpositionen"),
    ]),
  ]),
  gre: makeExam("gre", "GRE General — offline practice", "en", [
    genericSection("quantitative", "Quantitative Reasoning", [
      mc("If $3x = 18$, then $x =$", ["3", "6", "9", "15"], 1, "$x = 18/3 = 6$.", "Problem solving"),
      mc("A shirt costs $80 and is discounted 25%. The price is", ["$55", "$60", "$65", "$75"], 1, "$80 \\times 0.75 = 60$.", "Problem solving"),
      mc("The average of 4, 8, and 12 is", ["6", "8", "10", "12"], 1, "$(4+8+12)/3 = 8$.", "Problem solving"),
    ]),
    genericSection("verbal", "Verbal Reasoning", [
      mc("Choose the word that best completes: 'Her argument was ___, leaving no room for doubt.'", ["tenuous", "cogent", "vague", "trivial"], 1, "'Cogent' = clear and convincing.", "Text completion"),
      mc("'Ephemeral' most nearly means", ["lasting", "short-lived", "heavy", "ancient"], 1, "Ephemeral = short-lived.", "Sentence equivalence"),
    ]),
  ]),
  gmat: makeExam("gmat", "GMAT Focus — offline practice", "en", [
    genericSection("quantitative", "Quantitative Reasoning", [
      mc("If a pen costs $2 and you buy 10, the total is", ["$12", "$20", "$22", "$200"], 1, "$10 \\times 2 = 20$.", "Problem solving"),
      mc("If $5x = 35$, then $x =$", ["5", "6", "7", "8"], 2, "$x = 7$.", "Problem solving"),
    ]),
    genericSection("verbal", "Verbal Reasoning", [
      mc("A critical-reasoning 'assumption' is something the argument…", ["states explicitly", "takes for granted", "contradicts", "ignores entirely"], 1, "An assumption is taken for granted, not stated.", "Critical reasoning"),
    ]),
    genericSection("data_insights", "Data Insights", [
      mc("In data sufficiency, 'each statement alone is sufficient' is chosen when…", ["only (1) works", "only (2) works", "both independently determine the answer", "neither works"], 2, "Each alone determines the answer.", "Data sufficiency"),
    ]),
  ]),
};

/** Get a bundled seed form for an exam, or null if none exists. Seeds are full forms. */
export function getSeedForm(examId: string): GeneratedExam | null {
  const form = SEED_FORMS[examId];
  if (!form) return null;
  // Return a deep clone so the runner can mutate/answer without corrupting the shared seed.
  return JSON.parse(JSON.stringify(form)) as GeneratedExam;
}
