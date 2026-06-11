/**
 * Lokalny generator opisu „Cel prac" i „Zakres odpowiedzialności" dla ofert DRSYSTEM.
 *
 * Działa deterministycznie, bez zewnętrznych API.
 * Łączy dane z oferty (urządzenia, zakres prac, obiekt) ze swobodnym opisem użytkownika,
 * stosując sprawdzone formuły z branży SSP/DSO.
 */

import type { Offer } from "./drsystem-types";

const STOP_WORDS = new Set([
  "i",
  "oraz",
  "a",
  "w",
  "na",
  "z",
  "do",
  "po",
  "od",
  "dla",
  "po",
  "się",
  "jest",
  "są",
  "to",
  "ten",
  "ta",
  "ze",
  "lub",
  "albo",
  "też",
  "także",
]);

export interface PurposeContext {
  hint?: string; // swobodny opis od użytkownika
  offer: Offer;
}

export interface GeneratedPurpose {
  purpose: string;
  benefits: string[];
  responsibilities: string[];
}

const tokenize = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-ząćęłńóśźż0-9]+/i)
    .filter((t) => t && !STOP_WORDS.has(t) && t.length > 2);

function detectSystems(offer: Offer, hint: string): string[] {
  const text = [
    hint,
    offer.investmentName,
    ...offer.scope.map((s) => s.text),
    ...offer.deviceLines.map((l) => l.name + " " + (l.description || "")),
  ]
    .join(" ")
    .toLowerCase();
  const systems: string[] = [];
  if (/(ssp|sygnalizac.*poża|czujk|rop\b|centra|polon|esser|honeywell)/i.test(text))
    systems.push("sygnalizacji pożarowej (SSP)");
  if (/(dso|dźwięk|variodyn|głośnik|bosch)/i.test(text))
    systems.push("dźwiękowego systemu ostrzegawczego (DSO)");
  if (/(oddymia|klap|wentylac)/i.test(text)) systems.push("oddymiania");
  if (/(vesda|wczesn.*detek)/i.test(text)) systems.push("wczesnej detekcji VESDA");
  if (/(gaszen|gaz|inergen|fm200|novec)/i.test(text)) systems.push("gaszenia gazowego");
  if (systems.length === 0) systems.push("bezpieczeństwa pożarowego");
  return systems;
}

function detectAction(hint: string, offer: Offer): string {
  const text = [hint, offer.investmentName, ...offer.scope.map((s) => s.text)]
    .join(" ")
    .toLowerCase();

  if (/(awaria|naprawa|usunięc|usterk)/.test(text)) return "naprawa";
  if (/(wymian|wymienić|zastąp)/.test(text)) return "wymiana";
  if (/(modernizac|rozbudow|rozbud|rozszerz)/.test(text)) return "modernizacja";
  if (/(przegląd|konserwac|serwis)/.test(text)) return "przegląd";
  if (/(uruchom|instalac|montaż|wykonan|nowa)/.test(text)) return "nowa instalacja";
  return "serwis";
}

const PURPOSE_TEMPLATES: Record<string, (systems: string) => string> = {
  naprawa: (s) =>
    `Przywrócenie pełnej sprawności systemu ${s} poprzez usunięcie zgłoszonych usterek, ` +
    `zapewnienie niezawodnego wykrywania zagrożeń pożarowych oraz zachowanie ciągłości nadzoru w obiekcie.`,
  wymiana: (s) =>
    `Wymiana wyeksploatowanych komponentów systemu ${s} na nowe urządzenia spełniające aktualne ` +
    `wymagania techniczne, w celu utrzymania pełnej funkcjonalności ochrony przeciwpożarowej obiektu.`,
  modernizacja: (s) =>
    `Modernizacja systemu ${s} obejmująca rozbudowę i dostosowanie do aktualnych norm oraz wymagań ` +
    `obiektu, zapewniająca podniesienie poziomu bezpieczeństwa pożarowego.`,
  przegląd: (s) =>
    `Wykonanie okresowego przeglądu konserwacyjnego systemu ${s} zgodnie z wymaganiami producentów ` +
    `urządzeń oraz obowiązującymi przepisami, mającego na celu utrzymanie systemu w pełnej sprawności technicznej.`,
  "nowa instalacja": (s) =>
    `Wykonanie kompletnej instalacji systemu ${s} obejmującej dostawę, montaż, konfigurację, ` +
    `uruchomienie oraz przekazanie do eksploatacji, zapewniającej skuteczną ochronę przeciwpożarową obiektu.`,
  serwis: (s) =>
    `Wykonanie prac serwisowych w systemie ${s} w celu zapewnienia ciągłej i niezawodnej ochrony ` +
    `przeciwpożarowej obiektu.`,
};

const BENEFITS_BY_ACTION: Record<string, string[]> = {
  naprawa: [
    "Szybkie przywrócenie pełnej sprawności",
    "Minimalizacja ryzyka fałszywych alarmów",
    "Zgodność z wymaganiami ppoż.",
    "Kompletna dokumentacja powykonawcza",
  ],
  wymiana: [
    "Nowoczesne, niezawodne urządzenia",
    "Pełna kompatybilność z istniejącym systemem",
    "Wydłużenie żywotności instalacji",
    "Zgodność z aktualnymi normami",
  ],
  modernizacja: [
    "Wyższy poziom ochrony przeciwpożarowej",
    "Zgodność z aktualnymi przepisami",
    "Zwiększone możliwości monitoringu",
    "Optymalizacja kosztów eksploatacji",
  ],
  przegląd: [
    "Utrzymanie systemu w pełnej sprawności",
    "Wczesne wykrycie potencjalnych usterek",
    "Zgodność z wymaganiami producentów",
    "Protokół przeglądu dla ubezpieczyciela",
  ],
  "nowa instalacja": [
    "Kompleksowe wykonanie pod klucz",
    "Zgodność z projektem i normami",
    "Pełna dokumentacja powykonawcza",
    "Gwarancja jakości DRSYSTEM",
  ],
  serwis: [
    "Niezawodność systemu",
    "Zgodność z wymaganiami ppoż.",
    "Minimalizacja przestojów",
    "Wsparcie techniczne po realizacji",
  ],
};

const RESPONSIBILITIES_BY_ACTION: Record<string, string[]> = {
  naprawa: [
    "diagnostykę usterek",
    "dostawę urządzeń zamiennych",
    "demontaż uszkodzonych komponentów",
    "montaż nowych urządzeń",
    "konfigurację i programowanie systemu",
    "wykonanie testów funkcjonalnych",
    "sporządzenie dokumentacji powykonawczej",
  ],
  wymiana: [
    "dostawę nowych urządzeń",
    "demontaż istniejących komponentów",
    "montaż nowych urządzeń",
    "konfigurację i adresowanie",
    "programowanie central",
    "wykonanie testów funkcjonalnych",
    "wykonanie testów alarmowania",
    "sporządzenie dokumentacji powykonawczej",
  ],
  modernizacja: [
    "analizę stanu istniejącego",
    "dostawę nowych urządzeń",
    "rozbudowę instalacji",
    "konfigurację systemu",
    "programowanie i adresowanie",
    "wykonanie testów funkcjonalnych",
    "wykonanie testów alarmowania",
    "sporządzenie dokumentacji powykonawczej",
    "szkolenie obsługi",
  ],
  przegląd: [
    "wizualną kontrolę urządzeń",
    "test funkcjonalny czujek i ROP",
    "test sygnalizatorów akustyczno-optycznych",
    "weryfikację komunikacji z centralą",
    "pomiar parametrów linii dozorowych",
    "kontrolę pracy zasilania awaryjnego",
    "sporządzenie protokołu z przeglądu",
  ],
  "nowa instalacja": [
    "dostawę urządzeń",
    "montaż okablowania",
    "montaż urządzeń",
    "konfigurację systemu",
    "programowanie central",
    "wykonanie testów funkcjonalnych",
    "wykonanie testów alarmowania",
    "uruchomienie systemu",
    "sporządzenie dokumentacji powykonawczej",
    "szkolenie obsługi",
  ],
  serwis: [
    "dostawę urządzeń",
    "montaż urządzeń",
    "konfigurację systemu",
    "programowanie central",
    "wykonanie testów funkcjonalnych",
    "wykonanie testów alarmowania",
    "uruchomienie systemu",
    "sporządzenie dokumentacji powykonawczej",
    "wsparcie techniczne po wykonaniu prac",
  ],
};

export function generatePurpose(ctx: PurposeContext): GeneratedPurpose {
  const hint = (ctx.hint || "").trim();
  const action = detectAction(hint, ctx.offer);
  const systems = detectSystems(ctx.offer, hint);
  const systemsText = systems.join(" oraz ");

  const baseTemplate = PURPOSE_TEMPLATES[action] || PURPOSE_TEMPLATES.serwis;
  let purpose = baseTemplate(systemsText);

  // Jeżeli użytkownik podał własny opis — dopisz go jako kontekst.
  if (hint) {
    const polished = hint.charAt(0).toUpperCase() + hint.slice(1);
    const ending = polished.endsWith(".") ? polished : polished + ".";
    // Wpleć kontekst tylko jeśli ma sens (>= 3 słowa)
    if (tokenize(hint).length >= 3) {
      purpose = `${ending} ${purpose}`;
    }
  }

  const benefits = BENEFITS_BY_ACTION[action] || BENEFITS_BY_ACTION.serwis;
  const responsibilities = RESPONSIBILITIES_BY_ACTION[action] || RESPONSIBILITIES_BY_ACTION.serwis;

  return { purpose, benefits, responsibilities };
}
