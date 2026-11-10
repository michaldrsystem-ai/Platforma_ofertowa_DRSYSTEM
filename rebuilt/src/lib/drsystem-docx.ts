import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import JSZip from "jszip";
import {
  calcLine,
  calcTotals,
  getOfferCommercialTerms,
  type CompanyData,
  type Offer,
} from "./drsystem-types";
import { buildOfferFilename } from "./offer-filename";
import templateUrl from "@/assets/szablon-oferty.docx?url";

/**
 * Oferta w Wordzie: wypełnianie prawdziwego szablonu oferty DRSYSTEM
 * (src/assets/szablon-oferty.docx, ten sam plik, który daje generator ofert w skillu:
 * papier firmowy, znak wodny, stopka, układ Michała). Szablon zawiera znaczniki @@NAZWA@@,
 * które tu podmieniamy, więc dokument w Wordzie edytuje się jak każda inna oferta.
 */

const NBSP = " ";

function zl(x: number): string {
  const [int, dec] = x.toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} zł`;
}

function qty(n: number): string {
  return String(Math.round(n * 1000) / 1000).replace(".", ",");
}

function dateIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || "";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Usuwa długie myślniki z tekstów trafiających do dokumentu (zasada DRSYSTEM). */
function clean(s: string): string {
  return (s || "").replace(/\s*[–—]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

const RUN_OF = (token: string) =>
  new RegExp(`<w:r(?:\\s[^>]*)?>(?:(?!</w:r>)[\\s\\S])*?${token}(?:(?!</w:r>)[\\s\\S])*?</w:r>`);

function setRed(rPr: string): string {
  const noColor = rPr.replace(/<w:color [^>]*\/>/g, "");
  return noColor.includes("</w:rPr>")
    ? noColor.replace("</w:rPr>", '<w:color w:val="FF0000"/></w:rPr>')
    : '<w:rPr><w:color w:val="FF0000"/></w:rPr>';
}

/** Podmienia znacznik w przebiegu tekstu; **fragment** jest pogrubiony, puste pole czerwone. */
function replaceToken(xml: string, token: string, value: string): string {
  const re = RUN_OF(token);
  const m = re.exec(xml);
  if (!m) return xml;
  const run = m[0];
  const empty0 = clean(value) === "";
  if (!empty0 && !value.includes("**")) {
    // zwykły tekst: podmień znacznik w miejscu, reszta przebiegu (tabulatory, inne teksty) zostaje
    return xml.replace(run, () => run.replace(token, () => esc(value)));
  }
  const rPrMatch = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run);
  let rPr = rPrMatch ? rPrMatch[0] : "";
  const textMatch = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/.exec(run);
  const before = textMatch ? textMatch[1].split(token)[0] : "";
  const after = textMatch ? textMatch[1].split(token).slice(1).join(token) : "";
  const empty = clean(value) === "";
  const text = empty ? "do uzupełnienia" : value;
  if (empty) rPr = setRed(rPr);
  const boldRPr = rPr
    ? rPr.includes("<w:b/>")
      ? rPr
      : rPr.replace("<w:rPr>", "<w:rPr><w:b/>")
    : "<w:rPr><w:b/></w:rPr>";
  const parts = (before + text + after).split("**");
  const runs = parts
    .map((p, i) => (p === "" ? "" : `<w:r>${i % 2 === 1 ? boldRPr : rPr}<w:t xml:space="preserve">${esc(p)}</w:t></w:r>`))
    .join("");
  return xml.replace(run, () => runs || `<w:r>${rPr}<w:t></w:t></w:r>`);
}

function replaceAll(xml: string, token: string, value: string): string {
  let out = xml;
  for (let i = 0; i < 10 && out.includes(token); i++) out = replaceToken(out, token, value);
  return out;
}

function span(xml: string, token: string, open: string[], close: string) {
  const idx = xml.indexOf(token);
  if (idx < 0) return null;
  const start = Math.max(...open.map((o) => xml.lastIndexOf(o, idx)));
  const end = xml.indexOf(close, idx) + close.length;
  return { start, end, chunk: xml.slice(start, end) };
}

/** Powiela akapit (lub wiersz) ze znacznikiem dla każdego elementu listy. */
function repeat(
  xml: string,
  token: string,
  open: string[],
  close: string,
  items: Record<string, string>[],
): string {
  const s = span(xml, token, open, close);
  if (!s) return xml;
  if (items.length === 0) return xml.slice(0, s.start) + xml.slice(s.end);
  const filled = items
    .map((it) => {
      let c = s.chunk;
      for (const [k, v] of Object.entries(it)) c = replaceAll(c, k, v);
      return c;
    })
    .join("");
  return xml.slice(0, s.start) + filled + xml.slice(s.end);
}

export async function buildOfferDocx(offer: Offer, company: CompanyData): Promise<Blob> {
  const totals = calcTotals(offer);
  const terms = getOfferCommercialTerms(offer);
  const res = await fetch(templateUrl);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  let xml = await zip.file("word/document.xml")!.async("string");

  const dla = [offer.clientContact, offer.clientName].map(clean).filter(Boolean).join(", ");
  const purpose = offer.showPurpose === false ? "" : clean(offer.purpose || "");
  const hide = offer.hideUnitPrices;

  // Pozycje: urządzenia oraz pozycje zakresu z ceną.
  const rows: Record<string, string>[] = [];
  for (const l of offer.deviceLines) {
    const { afterDiscount } = calcLine(l);
    const unit = l.qty ? afterDiscount / l.qty : l.price;
    rows.push({
      "@@NAZWA@@": clean(l.name + (l.description ? `. ${l.description}` : "")),
      "@@ILOSC@@": qty(l.qty) + (l.unit ? NBSP + l.unit : ""),
      "@@CENA@@": hide ? "" : zl(unit),
      "@@KWOTA@@": hide ? "" : zl(afterDiscount),
    });
  }
  for (const s of offer.scope) {
    const price = Number(s.price ?? 0);
    if (!price) continue;
    const q = Number(s.qty ?? 1);
    rows.push({
      "@@NAZWA@@": clean(s.text),
      "@@ILOSC@@": qty(q),
      "@@CENA@@": hide ? "" : zl(price),
      "@@KWOTA@@": hide ? "" : zl(q * price),
    });
  }
  rows.forEach((r, i) => (r["@@LP@@"] = `${i + 1}.`));
  if (rows.length === 0)
    rows.push({ "@@LP@@": "1.", "@@NAZWA@@": "", "@@ILOSC@@": "", "@@CENA@@": "", "@@KWOTA@@": "" });

  xml = repeat(xml, "@@NAZWA@@", ["<w:tr>", "<w:tr "], "</w:tr>", rows);
  xml = repeat(
    xml,
    "@@ZAKRES@@",
    ["<w:p>", "<w:p "],
    "</w:p>",
    offer.scope.map((s) => ({ "@@ZAKRES@@": clean(s.text) })).filter((x) => x["@@ZAKRES@@"]),
  );
  xml = repeat(
    xml,
    "@@DODATKOWE@@",
    ["<w:p>", "<w:p "],
    "</w:p>",
    [
      `Termin realizacji: ${terms.deliveryTerm}`,
      `Warunki płatności: ${terms.paymentTerms}`,
      `Gwarancja na urządzenia: ${terms.deviceWarranty}`,
      `Gwarancja na wykonanie: ${terms.workmanshipWarranty}`,
      ...(offer.validity?.trim() && offer.validity.trim() !== terms.paymentTerms
        ? [`Ważność oferty: ${offer.validity.trim()}`]
        : []),
    ].map((t) => ({ "@@DODATKOWE@@": clean(t) })),
  );

  const simple: [string, string][] = [
    ["@@NR@@", offer.number || ""],
    ["@@DLA@@", dla],
    ["@@DATA@@", dateIso(offer.date)],
    ["@@OPRACOWAL@@", offer.preparedBy || company.preparedBy || ""],
    ["@@TELEFON@@", (offer.preparedPhone || company.preparedPhone || "").replace(/ /g, NBSP)],
    ["@@EMAIL@@", offer.preparedEmail || company.preparedEmail || ""],
    ["@@TYTUL@@", clean(offer.investmentName || "")],
    ["@@LOKALIZACJA@@", clean(offer.locationAddress || "")],
    ["@@SUMA_OPIS@@", "Łączny przewidywany koszt netto:"],
    ["@@SUMA@@", zl(totals.total)],
  ];
  for (const [t, v] of simple) xml = replaceAll(xml, t, v);

  // Przedmiot oferty: gdy pusty, usuń cały akapit razem z nagłówkiem zostawiając czerwony znacznik.
  xml = replaceAll(xml, "@@PRZEDMIOT@@", purpose);

  zip.file("word/document.xml", xml);
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function generateOfferDocx(offer: Offer, company: CompanyData) {
  const blob = await buildOfferDocx(offer, company);
  saveAs(blob, buildOfferFilename(offer, "docx"));
}
