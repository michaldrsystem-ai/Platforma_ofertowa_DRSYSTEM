import type { Offer } from "./drsystem-types";

export interface OfferCheck {
  errors: string[]; // blokują eksport
  warnings: string[]; // do potwierdzenia przez użytkownika
}

const RBH = 200;
const WEEKEND_ARRIVAL = 3500;

/** Kontrola oferty przed eksportem (Word/PDF). Nie zmienia oferty. */
export function checkOffer(offer: Offer): OfferCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!offer.clientName.trim()) errors.push("Brak nazwy klienta (pole „Dla”).");
  if (!offer.investmentName.trim()) errors.push("Brak tytułu oferty (inwestycja).");
  if (!offer.locationAddress.trim()) errors.push("Brak lokalizacji.");

  const scopePriced = offer.scope.filter((s) => (s.price ?? 0) > 0).length;
  if (offer.deviceLines.length + scopePriced === 0) errors.push("Oferta nie ma żadnej pozycji z ceną.");

  offer.deviceLines.forEach((l, i) => {
    const n = `Pozycja ${i + 1} („${l.name}”)`;
    if (!(l.price > 0)) warnings.push(`${n}: cena zero.`);
    if (!(l.qty > 0)) warnings.push(`${n}: ilość zero.`);
    if (!l.name.trim()) warnings.push(`Pozycja ${i + 1}: brak nazwy.`);
    if (l.discount > 0) warnings.push(`${n}: rabat ${l.discount}% (oferta ma ceny netto bez rabatów).`);
    const lname = l.name.toLowerCase();
    if ((l.unit === "rbh" || lname.includes("roboczogodzin")) && l.price !== RBH) {
      warnings.push(`${n}: roboczogodzina ${l.price} zł, stawka DRSYSTEM to ${RBH} zł netto.`);
    }
    if ((lname.includes("weekend") || lname.includes("niedziel") || lname.includes("święt")) &&
        lname.includes("przyjazd") && l.price !== WEEKEND_ARRIVAL) {
      warnings.push(`${n}: przyjazd w weekend/święto ${l.price} zł, stawka to ${WEEKEND_ARRIVAL} zł.`);
    }
  });

  if (!offer.number?.trim()) warnings.push("Brak numeru oferty (numer wpisuje Michał).");
  if (!offer.purpose?.trim() && offer.showPurpose !== false) warnings.push("Brak przedmiotu oferty.");
  if (!offer.preparedBy.trim()) warnings.push("Brak osoby opracowującej.");
  return { errors, warnings };
}

/** Zwraca true, gdy można eksportować (ostrzeżenia potwierdzone przez użytkownika). */
export function confirmOfferCheck(
  offer: Offer,
  toastError: (msg: string) => void,
): boolean {
  const { errors, warnings } = checkOffer(offer);
  if (errors.length) {
    toastError(errors.join(" "));
    return false;
  }
  if (warnings.length) {
    return window.confirm(
      "Kontrola oferty, do sprawdzenia:\n\n- " + warnings.join("\n- ") + "\n\nPobrać mimo to?",
    );
  }
  return true;
}
