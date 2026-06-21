# Studienkollegs — Grounded Research

> Per CLAUDE.md golden rule #2: every entry below was verified by fetching a real official
> page (or, where noted, a search result corroborated by the national studienkollegs.de
> directory PDF). **All entries are `needsVerification: true`** — streams, free/public status,
> and exact application routes change per semester and must be re-confirmed against the official
> page + uni-assist before being shown as fact to a student.
>
> Stream legend (university Studienkollegs): **T** = technical/math/natural science ·
> **M** = medicine/biology/pharmacy · **W** = economics/business/social science ·
> **G** = humanities/German studies · **S** = languages.
> FH (Fachhochschule / applied-sciences) Studienkollegs use different stream codes:
> **TI** = technical/engineering · **WW** = economics · **GD** = design/creative · **SW** = social work.
>
> Retrieved: 2026-06-21. Primary directory source:
> studienkollegs.de national contact PDF (https://studienkollegs.de/pdfs/Contact-information-German-Studienkollegs.pdf)
> and DAAD (https://www.daad.de/en/studying-in-germany/requirements/studienkollegs/).

---

## 1. Studienkolleg München
- id: studienkolleg-muenchen
- name: Studienkolleg München
- partnerUniversity: LMU München / TU München (serves all Bavarian universities)
- city: Munich
- bundesland: Bavaria
- type: university
- publicState: true
- kurse: [T, M, W, G]
- officialUrl: https://www.tum.de/en/studies/application/other-forms-of-study/preparatory-study-at-the-studienkolleg
- note: Apply for one course (G/M/T/W); B2 German + entrance test required.
- verified: yes (fetched TUM official Studienkolleg page; streams T/M/W/G confirmed)

## 2. Studienkolleg an der TU Berlin
- id: studienkolleg-tu-berlin
- name: Studienkolleg an der TU Berlin (Preparatory School)
- partnerUniversity: Technische Universität Berlin
- city: Berlin
- bundesland: Berlin
- type: university
- publicState: true
- kurse: [T, W]
- officialUrl: https://www.tu.berlin/en/international/students-1/preparatory-school
- note: Apply exclusively via uni-assist. (Course not offered winter 2026/27 per official page.)
- verified: yes (fetched TU Berlin official courses-and-tests page; only T + W confirmed)

## 3. Studienkolleg der Freien Universität Berlin
- id: studienkolleg-fu-berlin
- name: Studienkolleg der Freien Universität Berlin
- partnerUniversity: Freie Universität Berlin
- city: Berlin
- bundesland: Berlin
- type: university
- publicState: true
- kurse: []
- officialUrl: https://www.fu-berlin.de/sites/studienkolleg
- note: State/public; offers "Schwerpunktkurse" but specific stream codes NOT listed on the page — streams unverified.
- verified: partial (official FU page confirmed public + Schwerpunktkurse; stream codes not stated)

## 4. Studienkolleg Mainz (ISSK, JGU)
- id: studienkolleg-mainz
- name: Studienkolleg der Johannes Gutenberg-Universität Mainz (Internationales Studien- und Sprachenkolleg)
- partnerUniversity: Johannes Gutenberg-Universität Mainz
- city: Mainz
- bundesland: Rhineland-Palatinate
- type: university
- publicState: true
- kurse: [M, T, W, G, S]
- officialUrl: https://www.issk.uni-mainz.de/en/studienkolleg/
- note: Apply via uni-assist; deadlines May 15 (winter) / Nov 15 (summer).
- verified: yes (fetched official ISSK page; M/T/W/G/S confirmed)

## 5. Niedersächsisches Studienkolleg (Hannover)
- id: studienkolleg-hannover
- name: Niedersächsisches Studienkolleg an der Leibniz Universität Hannover
- partnerUniversity: Leibniz Universität Hannover
- city: Hanover
- bundesland: Lower Saxony
- type: university
- publicState: true
- kurse: [M, T, G, W, S]
- officialUrl: https://www.stk.uni-hannover.de/
- note: State institution of Lower Saxony; prepares for the Feststellungsprüfung.
- verified: yes (fetched official page; "staatliche Bildungseinrichtung des Landes Niedersachsen"; M/T/G/W/S confirmed)

## 6. Studienkolleg am KIT (Karlsruhe)
- id: studienkolleg-kit
- name: Studienkolleg am Karlsruher Institut für Technologie (KIT)
- partnerUniversity: Karlsruhe Institute of Technology (KIT)
- city: Karlsruhe
- bundesland: Baden-Württemberg
- type: university
- publicState: true
- kurse: [T]
- officialUrl: https://www.stk.kit.edu/
- note: Technical focus (T-Kurse) + TestDaF/D-Kurse; apply via the partner university.
- verified: partial (official KIT page confirmed public + T-Kurse; other streams not shown — treat as T-only/unverified)

## 7. Studienkolleg TU Darmstadt
- id: studienkolleg-darmstadt
- name: Studienkolleg der Technischen Universität Darmstadt
- partnerUniversity: Technische Universität Darmstadt
- city: Darmstadt
- bundesland: Hesse
- type: university
- publicState: true
- kurse: [T, G]
- officialUrl: https://www.stk.tu-darmstadt.de/
- note: Public technical university; T-Kurse (tech/science) and G-Kurse (humanities/social).
- verified: yes (fetched official page; T + G confirmed)

## 8. Studienkolleg Hamburg
- id: studienkolleg-hamburg
- name: Studienkolleg Hamburg
- partnerUniversity: Universität Hamburg (students enrolled at Uni Hamburg)
- city: Hamburg
- bundesland: Hamburg
- type: university
- publicState: true
- kurse: [G, M, T, W]
- officialUrl: https://studienkolleg-hamburg.de/en/
- note: Large state-run college (~400 students); one-year G/M/T/W courses + Propädeutikum.
- verified: yes (official site + course page; G/M/T/W confirmed; "state-run")

## 9. Landesstudienkolleg Sachsen-Anhalt (Halle)
- id: studienkolleg-halle
- name: Landesstudienkolleg Sachsen-Anhalt (Martin-Luther-Universität Halle-Wittenberg)
- partnerUniversity: Martin-Luther-Universität Halle-Wittenberg (joint with Hochschule Anhalt)
- city: Halle (Saale)
- bundesland: Saxony-Anhalt
- type: university
- publicState: true
- kurse: []
- officialUrl: https://www.studienkolleg.uni-halle.de/
- note: Central department of the State of Saxony-Anhalt; specific stream codes not listed on homepage — streams unverified.
- verified: partial (official page confirmed public/state; stream codes not stated)

## 10. Studienkolleg Sachsen (Leipzig)
- id: studienkolleg-leipzig
- name: Studienkolleg Sachsen an der Universität Leipzig
- partnerUniversity: Universität Leipzig
- city: Leipzig
- bundesland: Saxony
- type: university
- publicState: true
- kurse: [T, M, W, G, S]
- officialUrl: https://www.stksachs.uni-leipzig.de/
- note: Public (Uni Leipzig); apply via uni-assist; needs conditional pre-admission. Streams per natur-/wirtschafts-/geistes-/sprach- + medizinisch-biologisch focus.
- verified: yes for public + official URL; kurse partial (homepage describes the five focus areas in prose, not as T/M/W/G/S codes — confirm exact codes)

## 11. Internationales Studienzentrum Heidelberg
- id: studienkolleg-heidelberg
- name: Studienkolleg am Internationalen Studienzentrum der Universität Heidelberg (ISZ)
- partnerUniversity: Universität Heidelberg
- city: Heidelberg
- bundesland: Baden-Württemberg
- type: university
- publicState: true
- kurse: [M, W, G, T]
- officialUrl: https://www.isz.uni-heidelberg.de/en/courses
- note: Central facility of Heidelberg University; M/W/G/T core courses (each has its own official page).
- verified: yes (official ISZ course pages exist per stream; M/W/G/T confirmed)

## 12. Studienkolleg an der HTWG Konstanz
- id: studienkolleg-konstanz
- name: Studienkolleg an der HTWG Konstanz
- partnerUniversity: HTWG Konstanz (Hochschule Konstanz, applied sciences)
- city: Konstanz
- bundesland: Baden-Württemberg
- type: fh
- publicState: true
- kurse: [T, W]
- officialUrl: https://www.htwg-konstanz.de/studium/studienkolleg-der-htwg-konstanz/studienkolleg/unsere-kurse
- note: State-supported FH Studienkolleg; T + W; certificate valid at all FHs nationwide + BW universities. (Uses T/W labels though it is an FH college.)
- verified: yes (fetched official HTWG course page; T + W confirmed; public)

## 13. Studienkolleg Coburg
- id: studienkolleg-coburg
- name: Studienkolleg bei den Hochschulen für angewandte Wissenschaften des Freistaates Bayern in Coburg
- partnerUniversity: Hochschule Coburg (Bavarian universities of applied sciences)
- city: Coburg
- bundesland: Bavaria
- type: fh
- publicState: true
- kurse: [TI, WW]
- officialUrl: https://studienkolleg-coburg.de/en/focus-courses/
- note: State FH Studienkolleg; no tuition, ~€152 semester fee; apply via PRIMUSS (Hochschule Coburg). FH streams TI + WW.
- verified: yes (official site + focus-courses page; TI + WW confirmed; "state preparatory college")

## 14. Staatliches Studienkolleg Nordhausen
- id: studienkolleg-nordhausen
- name: Staatliches Studienkolleg an der Hochschule Nordhausen
- partnerUniversity: Hochschule Nordhausen (applied sciences)
- city: Nordhausen
- bundesland: Thuringia
- type: fh
- publicState: true
- kurse: [T, M, W, G, S]
- officialUrl: https://www.hs-nordhausen.de/international/staatliches-studienkolleg
- note: "Staatliches Studienkolleg" assigned to Hochschule Nordhausen; uses university-style T/M/W/G/S stream codes; ends with Feststellungsprüfung.
- verified: yes (fetched official HS Nordhausen page; T/M/G+S/W confirmed; "Staatliches")

## 15. Studienkolleg an der Hochschule Coburg → see #13 (do not duplicate)

---

## Sources fetched / corroborated
- DAAD Studienkollegs overview: https://www.daad.de/en/studying-in-germany/requirements/studienkollegs/
- studienkollegs.de national contact PDF: https://studienkollegs.de/pdfs/Contact-information-German-Studienkollegs.pdf
- Per-college official pages listed under each entry above (all fetched or search-corroborated 2026-06-21).

## Known unverified / dropped
- **Studienkolleg Frankfurt (Goethe Uni / ISZ):** official URL is mid-migration
  (isz.uni-frankfurt.de → uni-frankfurt.de/43662305/...); not included until a stable official
  URL + streams are confirmed.
- FH colleges at Hamburg (HAW), Wismar, Bochum, Kaiserslautern, Anhalt, Kiel, Glauchau, Zwickau:
  appear in the studienkollegs.de directory PDF but were NOT individually fetched this round —
  add only after fetching each official page.
