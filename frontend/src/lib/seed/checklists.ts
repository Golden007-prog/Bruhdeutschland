import type { ChecklistItemDef } from "@/lib/types";

/** Documents commonly required for a Master's application via uni-assist or directly. */
export const APPLICATION_DOCS: ChecklistItemDef[] = [
  { id: "app-degree", label: "Bachelor's degree certificate (certified copy)", hint: "Plus a certified translation if not in German or English.", category: "documents" },
  { id: "app-transcript", label: "Academic transcript / mark sheets (certified)", hint: "All semesters, showing grades and credits.", category: "documents" },
  { id: "app-passport", label: "Passport (photo page)", category: "documents" },
  { id: "app-cv", label: "Curriculum vitae (Europass format)", hint: "Build one in the CV tool.", category: "documents" },
  { id: "app-sop", label: "Statement of Purpose / motivation letter", category: "documents" },
  { id: "app-lang", label: "Language certificate (IELTS/TOEFL or TestDaF/DSH)", hint: "Per the program's requirement.", category: "language" },
  { id: "app-aps", label: "APS certificate", hint: "Required for India, China, Vietnam.", category: "visa" },
  { id: "app-lor", label: "Letters of recommendation", optional: true, hint: "If the program requests them.", category: "documents" },
  { id: "app-gre", label: "GRE/GMAT score", optional: true, hint: "Only some programs require it.", category: "language" },
];

/** Documents for the German national student visa application. */
export const VISA_DOCS: ChecklistItemDef[] = [
  { id: "visa-form", label: "Completed national visa application form + declaration", category: "visa" },
  { id: "visa-passport", label: "Valid passport (issued < 10 yrs, 2 blank pages)", category: "visa" },
  { id: "visa-photo", label: "Biometric photo (< 6 months old)", category: "visa" },
  { id: "visa-admission", label: "University admission letter (Zulassung)", category: "documents" },
  { id: "visa-finance", label: "Proof of financing (blocked account)", category: "finance" },
  { id: "visa-insurance", label: "Health insurance confirmation", category: "finance" },
  { id: "visa-academics", label: "Academic certificates & transcripts", category: "documents" },
  { id: "visa-language", label: "Language proof", category: "language" },
  { id: "visa-aps", label: "APS certificate (India/China/Vietnam)", category: "visa" },
];

/** First weeks in Germany — what to do after you arrive. */
export const ARRIVAL_TASKS: ChecklistItemDef[] = [
  { id: "arr-anmeldung", label: "Register your address (Anmeldung) within 14 days", hint: "At the local Bürgeramt — bring the Wohnungsgeberbestätigung.", category: "visa" },
  { id: "arr-bank", label: "Open a German bank account", category: "finance" },
  { id: "arr-residence", label: "Apply for your residence permit at the Ausländerbehörde", category: "visa" },
  { id: "arr-enroll", label: "Enrol (Immatrikulation) and pay the semester contribution", category: "campus" },
  { id: "arr-insurance", label: "Activate statutory health insurance", category: "finance" },
  { id: "arr-ticket", label: "Get your Deutschland-Semesterticket", category: "campus" },
  { id: "arr-sim", label: "Get a German SIM card", optional: true, category: "campus" },
];

/** Pre-departure packing & arrangements. */
export const PRE_DEPARTURE: ChecklistItemDef[] = [
  { id: "pd-passport", label: "Passport with valid visa", category: "visa" },
  { id: "pd-admission", label: "Printed admission letter & enrolment documents", category: "documents" },
  { id: "pd-certs", label: "Original + certified academic certificates", category: "documents" },
  { id: "pd-blocked", label: "Blocked-account confirmation & first month's withdrawal plan", category: "finance" },
  { id: "pd-insurance", label: "Health-insurance documents", category: "finance" },
  { id: "pd-housing", label: "Accommodation confirmation / first-nights booking", category: "visa" },
  { id: "pd-cash", label: "Some euros in cash for the first days", category: "finance" },
  { id: "pd-adapter", label: "Type-F power adapter", optional: true, category: "campus" },
  { id: "pd-meds", label: "Personal medication + prescriptions", optional: true, category: "campus" },
];
