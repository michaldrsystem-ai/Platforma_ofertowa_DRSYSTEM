/**
 * Generator nazwy pliku PDF/DOCX dla oferty.
 *
 * Format: Oferta_DRSYSTEM-{temat}-{numer}.pdf
 *
 * Hasło-temat ("wymiana-czujek", "rozbudowa-dso") jest dedukowane heurystycznie
 * z pól oferty (purpose, investmentName, urządzenia, zakres prac).
 */

import type { Offer } from "./drsystem-types";

// Polskie znaki → ASCII (slugify)
const ASCII_MAP: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
  Ą: "A",
  Ć: "C",
  Ę: "E",
  Ł: "L",
  Ń: "N",
  Ó: "O",
  Ś: "S",
  Ź: "Z",
  Ż: "Z",
};

function slugify(s: string): string {
  return s
    .split("")
    .map((ch) => ASCII_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Słowniki rozpoznawania
const ACTIONS: { keys: RegExp; word: string }[] = [
  { keys: /(rozbudow|rozszerz|dod[ae]nie)/i, word: "rozbudowa" },
  { keys: /(modernizac)/i, word: "modernizacja" },
  { keys: /(wymian|wymien|zastap)/i, word: "wymiana" },
  { keys: /(napraw|usuwa|usterk|awari)/i, word: "naprawa" },
  { keys: /(przegląd|przegl[ai]d|konserwac)/i, word: "przeglad" },
  { keys: /(montaż|instalac|uruchom|nowa\s+instal|wykonanie)/i, word: "montaz" },
  { keys: /(serwis)/i, word: "serwis" },
  { keys: /(dostaw)/i, word: "dostawa" },
];

const SUBJECTS: { keys: RegExp; word: string }[] = [
  // konkretne urządzenia
  { keys: /(czujka liniow|czujki liniow|liniow)/i, word: "czujek-liniowych" },
  { keys: /(czujk[ai]?\b|czujek\b)/i, word: "czujek" },
  { keys: /(rop\b|ręczn.*ostrzegacz)/i, word: "rop" },
  { keys: /(sygnalizator)/i, word: "sygnalizatorow" },
  { keys: /(centrala?\b|centrali|panel\b)/i, word: "centrali" },
  { keys: /(modu[lł])/i, word: "modulow" },
  { keys: /(zasilac)/i, word: "zasilacza" },
  { keys: /(akumulator)/i, word: "akumulatorow" },
  { keys: /(g[lł]ośnik|nag[lł]ośn)/i, word: "glosnikow" },
  // systemy
  { keys: /\b(ssp|sygnalizac.*poża)/i, word: "ssp" },
  { keys: /\b(dso|d[zź]wi[eę]kow)/i, word: "dso" },
  { keys: /(oddymia|klap[ay] poż)/i, word: "oddymiania" },
  { keys: /\b(vesda)/i, word: "vesda" },
  { keys: /(gaszen|gaz.*gasz)/i, word: "gaszenia" },
];

function detectKeyword(...sources: string[]): string {
  const text = sources.filter(Boolean).join(" ").toLowerCase();
  let action: string | null = null;
  let subject: string | null = null;
  for (const a of ACTIONS) {
    if (a.keys.test(text)) {
      action = a.word;
      break;
    }
  }
  for (const s of SUBJECTS) {
    if (s.keys.test(text)) {
      subject = s.word;
      break;
    }
  }
  if (action && subject) return `${action}-${subject}`;
  if (action) return action;
  if (subject) return subject;
  return "";
}

export function buildOfferFilename(offer: Offer, ext: "pdf" | "docx" = "pdf"): string {
  // Źródła w kolejności priorytetu: nazwa inwestycji → cel prac → urządzenia/zakres
  const deviceText = offer.deviceLines.map((l) => l.name + " " + (l.description || "")).join(" ");
  const keyword = detectKeyword(
    offer.investmentName || "",
    offer.purpose || "",
    deviceText,
    offer.scope.map((s) => s.text).join(" "),
  );

  // Fallback: użyj nazwy inwestycji jako slug
  let topic = keyword || (offer.investmentName ? slugify(offer.investmentName) : "");
  if (!topic) topic = "oferta";

  const numberSlug = offer.number.replace(/[/\\:]/g, "_");
  return `Oferta_DRSYSTEM-${topic}-${numberSlug}.${ext}`;
}
