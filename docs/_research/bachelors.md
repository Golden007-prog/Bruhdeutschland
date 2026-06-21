# Research: Real Bachelor's Programmes at German Public Universities

> Curated seed for the DeutschPrep `Program` catalogue. **Golden rule #2 (CLAUDE.md): never fabricate.**
> Every entry below has a **real official study-page URL that was actually retrieved** during this
> research pass (2026-06-21). Where a value could not be confirmed from an official source it is left
> `null` and flagged `needsVerification: true`. Admission requirements (language thresholds, NC,
> internship rules) change yearly — treat them as `needsVerification` until re-checked at intake.
>
> Retrieved: 2026-06-21. Sources: official university study pages + DAAD International Programmes
> database (daad.de). Private institutions were intentionally excluded (public only).
>
> Fee notes:
> - Public universities in Germany charge **no tuition** EXCEPT **Baden-Württemberg**, which levies
>   **EUR 1,500 / semester for non-EU/EEA** students (confirmed: Heidelberg, Freiburg, Stuttgart).
> - **Bavaria** reintroduced **non-EU tuition (~EUR 3,000 / semester at TUM)** — confirmed on the TUM
>   Mechanical Engineering page. Other Bavarian unis (LMU etc.) `needsVerification` for exact amount.
> - `tuitionPerSemester` is the **non-EU** figure where it applies; EU students generally pay 0.
> - `semesterContribution` (Semesterbeitrag) is separate, ~EUR 150–350, charged to everyone.

---

## A. English-taught (the rarer category) — verified public universities

### 1. Liberal Arts and Sciences — University of Freiburg
- id: `freiburg-liberal-arts-sciences-ba`
- name: Liberal Arts and Sciences
- degree: `B.A.` (B.A. or B.Sc. depending on Major chosen after year 1)
- university: University of Freiburg (Albert-Ludwigs-Universität Freiburg)
- institutionType: `uni`
- city: Freiburg
- bundesland: Baden-Württemberg
- languages: `en`
- languageLevelEn: "English B2 (CEFR)"
- languageLevelDe: null
- subjectGroup: Language & Cultural Studies
- areasOfStudy: ["Liberal Arts", "Governance", "Environmental & Sustainability Sciences"]
- intake: `winter`
- admissionMode: `aptitude` (restricted admission with selection: prior qualification + essay + interview; ~74 places; 240 ECTS / 8 semesters)
- tuitionPerSemester: 1500 (non-EU, Baden-Württemberg)
- semesterContribution: 190
- officialUrl: https://uni-freiburg.de/en/studies/degree-programmes/degree-programme/391/
- **verified: yes** (degree/language/intake/selection from official page; EUR 190 fee + EUR 1500 non-EU tuition from official Freiburg semester-fees page)

### 2. North American Studies — Freie Universität Berlin
- id: `fu-berlin-north-american-studies-ba`
- name: North American Studies
- degree: `B.A.`
- university: Freie Universität Berlin (John F. Kennedy Institute)
- institutionType: `uni`
- city: Berlin
- bundesland: Berlin
- languages: `en`
- languageLevelEn: "English C1 (CEFR)"
- languageLevelDe: null  (no German proficiency required for admission per JFKI page)
- subjectGroup: Language & Cultural Studies
- areasOfStudy: ["North American Studies", "USA & Canada", "Area Studies"]
- intake: `winter`  *(needsVerification — standard FU winter start inferred; not explicit on page)*
- admissionMode: `nc`  *(needsVerification — mono-bachelor 150 CP; admission restriction typical but not stated on retrieved page)*
- tuitionPerSemester: null  (Berlin = no tuition)
- semesterContribution: null  *(needsVerification — FU Berlin Semesterbeitrag ~EUR 300+, not retrieved)*
- officialUrl: https://www.jfki.fu-berlin.de/en/academics/ba/index.html
- **verified: partial** (language=English entirely + C1 requirement + mono-bachelor 150 CP + mandatory semester abroad confirmed on official JFKI page; intake/admissionMode/fee need verification)

### 3. International Relations — Hochschule Rhein-Waal (Rhine-Waal University)
- id: `rhine-waal-international-relations-ba`
- name: International Relations
- degree: `B.A.`
- university: Hochschule Rhein-Waal (Rhine-Waal University of Applied Sciences)
- institutionType: `uas`
- city: Kleve
- bundesland: North Rhine-Westphalia
- languages: `en`
- languageLevelEn: "IELTS / TOEFL at CEFR B2 or better"
- languageLevelDe: null
- subjectGroup: Law, Economics & Social Sciences
- areasOfStudy: ["International Politics", "International Economic Relations", "International Law"]
- intake: `winter`
- admissionMode: `nc` (restricted admission; also requires an 8-week preparatory internship by 4th semester)
- tuitionPerSemester: null  (NRW = no tuition)
- semesterContribution: 300  (~EUR 300/semester incl. semester transport ticket)
- officialUrl: https://www.hochschule-rhein-waal.de/en/faculties/society-and-economics/degree-programmes/international-relations-ba
- **verified: yes** (DAAD International Programmes detail page for this exact programme: English-taught, B2, winter, restricted, no tuition, ~EUR 300 fee, Kleve). Note: direct hsrw.eu page blocked WebFetch; DAAD page used as the retrieved official-data source.

### 4. Information Systems (Wirtschaftsinformatik) — University of Münster
- id: `muenster-information-systems-bsc`
- name: Information Systems
- degree: `B.Sc.`
- university: University of Münster
- institutionType: `uni`
- city: Münster
- bundesland: North Rhine-Westphalia
- languages: `en`  *(English language of instruction per dept. admission page; good German also recommended — could be modelled `de_en`)*
- languageLevelEn: null  *(needsVerification — exact English cert level not stated on retrieved page)*
- languageLevelDe: "Good German recommended"  *(needsVerification)*
- subjectGroup: Law, Economics & Social Sciences
- areasOfStudy: ["Information Systems", "Business Informatics"]
- intake: `winter`
- admissionMode: `nc` (admissions-restricted; NC varies yearly)
- tuitionPerSemester: null  (NRW)
- semesterContribution: null  *(needsVerification — Münster Semesterbeitrag ~EUR 300, not retrieved)*
- officialUrl: https://www.wi.uni-muenster.de/applicationadmission-bachelor-science-information-systems
- **verified: partial** (English instruction + winter + NC restricted confirmed on official dept. admission page; exact language cert + fee need verification)

---

## B. Bilingual / German-required (de_en)

### 5. Philosophy & Economics (P&E) — University of Bayreuth
- id: `bayreuth-philosophy-economics-ba`
- name: Philosophy & Economics
- degree: `B.A.`
- university: University of Bayreuth
- institutionType: `uni`
- city: Bayreuth
- bundesland: Bavaria
- languages: `de_en`  (partially taught in German; good German is an essential prerequisite per official page)
- languageLevelEn: null  *(needsVerification)*
- languageLevelDe: "German B2 (essential)"
- subjectGroup: Law, Economics & Social Sciences
- areasOfStudy: ["Philosophy", "Economics", "PPE"]
- intake: `winter`  *(needsVerification — not on retrieved page)*
- admissionMode: `nc`  *(needsVerification — not on retrieved page; P&E is typically restricted)*
- tuitionPerSemester: null  *(needsVerification — Bavaria non-EU tuition status for non-TUM unis unclear)*
- semesterContribution: null  *(needsVerification)*
- officialUrl: https://www.uni-bayreuth.de/en/bachelor/philosophy-and-economics
- **verified: partial** (degree B.A., 6 semesters, "partially taught in German" + German B2 essential confirmed on official page; intake/admission/fees need verification. NOTE: originally hypothesised as English-only — corrected to de_en after fetching the page.)

---

## C. German-taught (the majority path: Studienkolleg → Bachelor)

### 6. Computer Science — TU Berlin
- id: `tu-berlin-computer-science-bsc`
- name: Computer Science (Informatik)
- degree: `B.Sc.`
- university: Technische Universität Berlin
- institutionType: `uni`
- city: Berlin
- bundesland: Berlin
- languages: `de`
- languageLevelDe: "Proof of German required (level not specified on page)"  *(needsVerification — typically DSH-2 / TestDaF 4)*
- languageLevelEn: null
- subjectGroup: Mathematics & Natural Sciences  *(CS; could also map to Engineering)*
- areasOfStudy: ["Computer Science", "Informatics"]
- intake: `winter`
- admissionMode: `nc` (restricted admission)
- tuitionPerSemester: null  (Berlin = no tuition)
- semesterContribution: null  *(needsVerification — TU Berlin Semesterbeitrag ~EUR 300+)*
- officialUrl: https://www.tu.berlin/en/studying/study-programs/all-programs-offered/study-course/computer-science-b-sc
- **verified: yes** (German-taught, winter, restricted admission confirmed on official TU Berlin page; programme being redesigned for WS 2026/27; exact German level + fee need verification)

### 7. Computer Engineering — TU Berlin
- id: `tu-berlin-computer-engineering-bsc`
- name: Computer Engineering
- degree: `B.Sc.`
- university: Technische Universität Berlin
- institutionType: `uni`
- city: Berlin
- bundesland: Berlin
- languages: `de`
- languageLevelDe: "Proof of German required (level not specified)"  *(needsVerification)*
- languageLevelEn: null
- subjectGroup: Engineering
- areasOfStudy: ["Computer Engineering", "Digital Technology"]
- intake: `winter`  *(needsVerification — not explicit on retrieved page)*
- admissionMode: `nc`  *(needsVerification — restricted typical, not confirmed on page)*
- tuitionPerSemester: null  (Berlin)
- semesterContribution: null  *(needsVerification)*
- officialUrl: https://www.tu.berlin/en/studying/study-programs/all-programs-offered/study-course/computer-engineering-b-sc
- **verified: partial** (German-taught confirmed on official page; intake/admission/fee need verification)

### 8. Mechanical Engineering (Maschinenbau) — RWTH Aachen
- id: `rwth-aachen-mechanical-engineering-bsc`
- name: Mechanical Engineering (Maschinenbau)
- degree: `B.Sc.`
- university: RWTH Aachen University
- institutionType: `uni`
- city: Aachen
- bundesland: North Rhine-Westphalia
- languages: `de`
- languageLevelDe: "German required (level not specified on page)"  *(needsVerification — typically DSH-2 / TestDaF 4)*
- languageLevelEn: null
- subjectGroup: Engineering
- areasOfStudy: ["Mechanical Engineering", "Production Technology", "Energy Engineering"]
- intake: `winter`
- admissionMode: `open` ("Open (No NC)" for first and higher semesters; requires 6-week pre-study internship + 16 weeks total)
- tuitionPerSemester: null  (NRW)
- semesterContribution: null  *(needsVerification — RWTH Semesterbeitrag ~EUR 300)*
- officialUrl: https://www.rwth-aachen.de/cms/root/studium/vor-dem-studium/studiengaenge/liste-aktuelle-studiengaenge/studiengangbeschreibung/~bnev/maschinenbau-b-sc-/?lidx=1
- **verified: yes** (German-taught, winter, open/no-NC, 7 semesters, internship requirement confirmed on official RWTH programme page; fee + German level need verification)

### 9. Mechanical Engineering — TU Munich (TUM)
- id: `tum-mechanical-engineering-bsc`
- name: Mechanical Engineering (Maschinenwesen)
- degree: `B.Sc.`
- university: Technical University of Munich
- institutionType: `uni`
- city: Garching (Munich)
- bundesland: Bavaria
- languages: `de`
- languageLevelDe: "Sufficient German skills required (level not specified on page)"  *(needsVerification)*
- languageLevelEn: null
- subjectGroup: Engineering
- areasOfStudy: ["Mechanical Engineering", "Plant Engineering"]
- intake: `winter`
- admissionMode: `aptitude` (two-part aptitude assessment: points on grades/experience, then possible interview; 8-week pre-study internship)
- tuitionPerSemester: 3000 (non-EU/third-country students — Bavaria reintroduced tuition; confirmed on TUM page)
- semesterContribution: null  *(needsVerification — separate, varies by location)*
- officialUrl: https://www.tum.de/en/studies/degree-programs/detail/mechanical-engineering-bachelor-of-science-bsc
- **verified: yes** (German-taught, winter, aptitude assessment, 6 semesters/180 ECTS, EUR 3,000 non-EU tuition confirmed on official TUM page)

### 10. Mechanical Engineering — University of Stuttgart
- id: `stuttgart-mechanical-engineering-bsc`
- name: Mechanical Engineering (Maschinenbau)
- degree: `B.Sc.`
- university: University of Stuttgart
- institutionType: `uni`
- city: Stuttgart
- bundesland: Baden-Württemberg
- languages: `de`
- languageLevelDe: "German required (level not specified on page)"  *(needsVerification)*
- languageLevelEn: null
- subjectGroup: Engineering
- areasOfStudy: ["Mechanical Engineering", "Industry 4.0", "Sustainability"]
- intake: `winter`
- admissionMode: `open` ("Admission unrestricted"; pre-study internship required; deadline 15 Sept)
- tuitionPerSemester: 1500 (non-EU, Baden-Württemberg)
- semesterContribution: null  *(needsVerification — Stuttgart Semesterbeitrag ~EUR 180)*
- officialUrl: https://www.uni-stuttgart.de/en/study/bachelor-programs/mechanical-engineering-b.sc./
- **verified: yes** (German-taught, winter, admission unrestricted, 6 semesters confirmed on official Stuttgart page; BW EUR 1,500 non-EU tuition applies; exact fee/German level need verification)

### 11. Economics (Volkswirtschaftslehre) — University of Bonn
- id: `bonn-economics-bsc`
- name: Economics
- degree: `B.Sc.`
- university: University of Bonn
- institutionType: `uni`
- city: Bonn
- bundesland: North Rhine-Westphalia
- languages: `de`  (page lists German + some English; primarily German, DSH-1/B2 required)
- languageLevelDe: "German DSH level 1 (CEFR B2)"
- languageLevelEn: null
- subjectGroup: Law, Economics & Social Sciences
- areasOfStudy: ["Economics", "Quantitative Methods"]
- intake: `winter`
- admissionMode: `open` ("Open admission" per official page; 180 ECTS / 6 semesters)
- tuitionPerSemester: null  (NRW)
- semesterContribution: null  *(needsVerification — Bonn Semesterbeitrag ~EUR 300)*
- officialUrl: https://www.uni-bonn.de/en/studying/degree-programs/degree-programs-a-z/economics-bsc
- **verified: yes** (German-taught, DSH-1/B2, winter, open admission confirmed on official Bonn page; fee needs verification)

### 12. Economics (VWL) — Kiel University
- id: `kiel-economics-bsc`
- name: Economics
- degree: `B.Sc.`
- university: Kiel University (Christian-Albrechts-Universität zu Kiel)
- institutionType: `uni`
- city: Kiel
- bundesland: Schleswig-Holstein
- languages: `de`  *(official page rendered "English" as UI language; programme is the German VWL B.Sc. — treat as German-taught, needsVerification on instruction language)*
- languageLevelDe: null  *(needsVerification — DSH/TestDaF expected)*
- languageLevelEn: null
- subjectGroup: Law, Economics & Social Sciences
- areasOfStudy: ["Economics", "Econometrics", "Data Science"]
- intake: `both` ("Winter and summer semester (winter recommended)")
- admissionMode: `open` ("admission-free in the first and higher semesters"; 180 CP / 6 semesters)
- tuitionPerSemester: null  (Schleswig-Holstein = no tuition)
- semesterContribution: null  *(needsVerification — Kiel Semesterbeitrag ~EUR 280)*
- officialUrl: https://www.uni-kiel.de/en/wiso/studying/bachelor/economics
- **verified: partial** (intake=both + admission-free + 6 semesters confirmed on official Kiel page; language of instruction de vs en and fee need verification)

### 13. Molecular Biotechnology — Heidelberg University
- id: `heidelberg-molecular-biotechnology-bsc`
- name: Molecular Biotechnology
- degree: `B.Sc.`
- university: Heidelberg University (Ruprecht-Karls-Universität Heidelberg)
- institutionType: `uni`
- city: Heidelberg
- bundesland: Baden-Württemberg
- languages: `de`
- languageLevelDe: "Very good German required"  *(needsVerification — DSH-2 / TestDaF 4 expected)*
- languageLevelEn: null
- subjectGroup: Mathematics & Natural Sciences
- areasOfStudy: ["Molecular Biotechnology", "Biochemistry", "Bioinformatics"]
- intake: `winter`
- admissionMode: `nc` (admission restriction via dialogue-oriented service procedure / DoSV; 6 semesters)
- tuitionPerSemester: 1500 (non-EU, Baden-Württemberg)
- semesterContribution: null  *(needsVerification — Heidelberg Semesterbeitrag ~EUR 170)*
- officialUrl: https://www.uni-heidelberg.de/en/study/all-subjects/molecular-biotechnology/molecular-biotechnology-bachelor-100
- **verified: yes** (German-only, winter, admission-restricted (DoSV), 6 semesters confirmed on official Heidelberg page; BW EUR 1,500 non-EU tuition applies; exact German level/fee need verification)

### 14. Molecular Biology & Biotechnology — TU Dresden
- id: `tu-dresden-molecular-biology-biotechnology-bsc`
- name: Molecular Biology and Biotechnology
- degree: `B.Sc.`
- university: Technische Universität Dresden
- institutionType: `uni`
- city: Dresden
- bundesland: Saxony
- languages: `de`  *(needsVerification — Bachelor at TUD CMCB is German-taught; the English Molecular Bioengineering programme is a Master, deliberately excluded)*
- languageLevelDe: null  *(needsVerification)*
- languageLevelEn: null
- subjectGroup: Mathematics & Natural Sciences
- areasOfStudy: ["Molecular Biology", "Biotechnology", "Biochemistry"]
- intake: `winter`  *(needsVerification)*
- admissionMode: `nc`  *(needsVerification)*
- tuitionPerSemester: null  (Saxony = no tuition)
- semesterContribution: null  *(needsVerification — TUD Semesterbeitrag ~EUR 280)*
- officialUrl: https://tu-dresden.de/studium/vor-dem-studium/studienangebot/sins/sins_studiengang?autoid=313&set_language=en
- **verified: partial** (programme exists as a Bachelor at TUD per official study-offer page; language/intake/admission/fee all need verification — fetch the autoid=313 detail page before seeding)

---

## Excluded / corrected during research (do NOT seed)
- **TU Berlin Computer Engineering / Computer Science as English-taught** — both are GERMAN-taught (corrected; kept as German-taught entries 6 & 7).
- **TU Dresden "Computational Logic" / "Molecular Bioengineering" as English Bachelor** — these are
  **Master's** programmes, not Bachelor's. Excluded.
- **RWTH Aachen / Bayreuth "Engineering Science" English Bachelor** — not confirmed English-taught; not seeded.
- **Bayreuth P&E as English-only** — corrected to `de_en` (German B2 essential).
- **Private institutions** (Constructor/Jacobs Bremen, Bard College Berlin, Frankfurt School) — out of scope (public only).

## Verification debt (resolve before production seed)
1. Exact German language thresholds (DSH/TestDaF) for all German-taught entries — most pages only say
   "German required". Default expectation DSH-2 / TestDaF 4 but mark `needsVerification`.
2. `semesterContribution` for most unis was not on the programme page — only Freiburg (EUR 190) and
   Rhine-Waal (~EUR 300) confirmed. Pull each from the respective Studierendenwerk / re-registration page.
3. FU Berlin NAS, Münster Information Systems, Kiel Economics: confirm exact intake/admissionMode/language.
4. TU Dresden Molecular Biology: fetch the autoid=313 detail page for all fields before seeding.
