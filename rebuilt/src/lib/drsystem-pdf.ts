import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  calcLine,
  calcTotals,
  getOfferCommercialTerms,
  type CompanyData,
  type Offer,
  type OfferLine,
} from "./drsystem-types";
import { ensurePdfFonts, PDF_FONT } from "./pdf-fonts";

// ===== PALETA dopasowana do logo DR SYSTEM (pomarańcz + grafit) =====
const ACCENT: [number, number, number] = [232, 121, 23]; // pomarańczowy z logo
const GRAPHITE: [number, number, number] = [51, 56, 64]; // ciemny grafit z logo
const INK: [number, number, number] = [33, 37, 43]; // główny tekst
const SOFT: [number, number, number] = [110, 116, 124]; // etykiety
const LINE: [number, number, number] = [220, 224, 230]; // separatory
const PANEL_BG: [number, number, number] = [248, 249, 251];

const PAGE_W = 210;
const PAGE_H = 297;
const M_L = 18;
const M_R = 18;
const CONTENT_W = PAGE_W - M_L - M_R;

// Strefa zajęta przez nagłówek strony (powyżej której nic nie rysujemy)
const HEADER_BOTTOM = 22; // dolna krawędź nagłówka na stronach 2+
const PAGE1_HEADER_BOTTOM = 50; // dolna krawędź nagłówka na stronie 1
const FOOTER_TOP = 22; // wysokość zajęta przez stopkę

const fmt = (n: number) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";

type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

function assertPolishGlyphs(doc: jsPDF) {
  const probe = "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
  const w = doc.getTextWidth(probe);
  if (!w || !isFinite(w) || w < 1) {
    throw new Error("Font nie obsługuje polskich znaków. Generowanie PDF przerwane.");
  }
}

function setF(
  doc: jsPDF,
  weight: "normal" | "bold",
  size: number,
  color: [number, number, number] = INK,
) {
  doc.setFont(PDF_FONT, weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function formatDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-");
    if (y && m && d) return `${d}.${m}.${y}`;
    return iso;
  } catch {
    return iso;
  }
}

function drawHeader(doc: jsPDF, company: CompanyData, offer: Offer, pageNo: number) {
  // ====== STRONA 1 — pełen nagłówek z logo + danymi firmy ======
  if (pageNo === 1) {
    // LOGO po lewej — większe, niżej, z danymi firmy pod spodem
    const logoTopY = 16;
    const logoMaxW = 70;
    const logoMaxH = 26;
    let logoBottomY = logoTopY + logoMaxH;

    if (company.logoDataUrl) {
      try {
        const props = doc.getImageProperties(company.logoDataUrl);
        const ratio = props.width / props.height;
        let w = logoMaxW;
        let h = logoMaxW / ratio;
        if (h > logoMaxH) {
          h = logoMaxH;
          w = logoMaxH * ratio;
        }
        doc.addImage(company.logoDataUrl, M_L, logoTopY, w, h);
        logoBottomY = logoTopY + h;
      } catch {
        setF(doc, "bold", 22, GRAPHITE);
        doc.text("DR", M_L, logoTopY + 16);
        setF(doc, "bold", 22, ACCENT);
        doc.text("SYSTEM", M_L + doc.getTextWidth("DR") + 2, logoTopY + 16);
        logoBottomY = logoTopY + 20;
      }
    } else {
      // Tekstowy zastępczy logo w kolorach z grafiki — większy
      doc.setFillColor(...GRAPHITE);
      doc.roundedRect(M_L, logoTopY, 70, 18, 2, 2, "F");
      setF(doc, "bold", 18, [255, 255, 255]);
      doc.text("DR", M_L + 6, logoTopY + 12);
      setF(doc, "bold", 18, ACCENT);
      doc.text("SYSTEM", M_L + 6 + doc.getTextWidth("DR") + 3, logoTopY + 12);
      logoBottomY = logoTopY + 18;
    }

    // PRAWY GÓRNY: data nad numerem oferty (zgodnie z żądaniem użytkownika)
    setF(doc, "normal", 8.5, SOFT);
    const datePart = formatDate(offer.date);
    const city = company.city?.replace(/^\d{2}-\d{3}\s*/, "") || "Rostworowo";
    doc.text(`${city}, ${datePart}`, PAGE_W - M_R, 18, { align: "right" });
    setF(doc, "normal", 8.5, SOFT);
    doc.text("Oferta nr:", PAGE_W - M_R, 24, { align: "right" });
    setF(doc, "bold", 13, GRAPHITE);
    doc.text(offer.number, PAGE_W - M_R, 30, { align: "right" });

    const subY = logoBottomY + 3.5;

    // PEŁNE DANE FIRMY pod logo
    setF(doc, "bold", 8.5, GRAPHITE);
    doc.text(company.name, M_L, subY + 4);
    setF(doc, "normal", 7.5, SOFT);
    doc.text(`${company.street}, ${company.city}`, M_L, subY + 7.5);
    const contactBits: string[] = [];
    if (company.phone) contactBits.push(`tel. ${company.phone}`);
    if (company.email) contactBits.push(company.email);
    if (company.www) contactBits.push(company.www);
    if (contactBits.length > 0) {
      doc.text(contactBits.join("  ·  "), M_L, subY + 10.5);
    }

    // Linia akcentowa pod całością — dynamicznie pod ostatnim elementem
    const lineY = Math.max(subY + 13, PAGE1_HEADER_BOTTOM + 2);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(M_L, lineY, PAGE_W - M_R, lineY);
    return;
  }

  // ====== KOLEJNE STRONY — minimalistyczny nagłówek z mniejszym logo ======
  const smallLogoTop = 9;
  const smallLogoMaxW = 30;
  const smallLogoMaxH = 10;

  if (company.logoDataUrl) {
    try {
      const props = doc.getImageProperties(company.logoDataUrl);
      const ratio = props.width / props.height;
      let w = smallLogoMaxW;
      let h = smallLogoMaxW / ratio;
      if (h > smallLogoMaxH) {
        h = smallLogoMaxH;
        w = smallLogoMaxH * ratio;
      }
      doc.addImage(company.logoDataUrl, M_L, smallLogoTop, w, h);
    } catch {
      setF(doc, "bold", 10, GRAPHITE);
      doc.text("DR", M_L, smallLogoTop + 7);
      setF(doc, "bold", 10, ACCENT);
      doc.text("SYSTEM", M_L + doc.getTextWidth("DR") + 1, smallLogoTop + 7);
    }
  } else {
    setF(doc, "bold", 10, GRAPHITE);
    doc.text("DR", M_L, smallLogoTop + 7);
    setF(doc, "bold", 10, ACCENT);
    doc.text("SYSTEM", M_L + doc.getTextWidth("DR") + 1, smallLogoTop + 7);
  }

  setF(doc, "normal", 8.5, SOFT);
  doc.text(`Oferta ${offer.number}`, PAGE_W - M_R, smallLogoTop + 7, { align: "right" });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(M_L, smallLogoTop + smallLogoMaxH + 2, PAGE_W - M_R, smallLogoTop + smallLogoMaxH + 2);
}

function drawFooter(doc: jsPDF, company: CompanyData) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(M_L, PAGE_H - 16, PAGE_W - M_R, PAGE_H - 16);

    setF(doc, "normal", 7, SOFT);
    const left = `${company.name} · ${company.street}, ${company.city}`;
    doc.text(left, M_L, PAGE_H - 11);

    const reg = `NIP ${company.nip}${company.regon ? ` · REGON ${company.regon}` : ""}${
      company.krs ? ` · KRS ${company.krs}` : ""
    }`;
    doc.text(reg, M_L, PAGE_H - 7);

    doc.text(`Strona ${i} z ${pageCount}`, PAGE_W - M_R, PAGE_H - 7, { align: "right" });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number, company: CompanyData, offer: Offer) {
  if (y + needed > PAGE_H - FOOTER_TOP) {
    doc.addPage();
    drawHeader(doc, company, offer, doc.getNumberOfPages());
    return HEADER_BOTTOM + 6;
  }
  return y;
}

function sectionHeading(doc: jsPDF, y: number, label: string): number {
  setF(doc, "bold", 9.5, GRAPHITE);
  const upper = label.toUpperCase();
  doc.text(upper, M_L, y);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(M_L, y + 1.5, M_L + doc.getTextWidth(upper) + 3, y + 1.5);
  return y + 6;
}

// ===== GŁÓWNA FUNKCJA =====
export async function generateOfferPdf(offer: Offer, company: CompanyData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await ensurePdfFonts(doc);
  doc.setFont(PDF_FONT, "normal");
  assertPolishGlyphs(doc);

  drawHeader(doc, company, offer, 1);
  let y = PAGE1_HEADER_BOTTOM + 8;

  // ===== BLOK „DLA / OPRACOWAŁ" =====
  const colW = (CONTENT_W - 8) / 2;
  const col2X = M_L + colW + 8;

  setF(doc, "normal", 8.5, SOFT);
  doc.text("Dla:", M_L, y);
  doc.text("Opracował:", col2X, y);
  y += 4.5;

  setF(doc, "bold", 10.5, INK);
  const dlaLines: string[] = [];
  if (offer.clientContact) dlaLines.push(offer.clientContact);
  if (offer.clientName) dlaLines.push(offer.clientName);
  if (offer.facilityCompanyName) dlaLines.push(offer.facilityCompanyName);
  if (dlaLines.length === 0) dlaLines.push("—");
  const dlaText = dlaLines.join(", ");
  const dlaWrapped = doc.splitTextToSize(dlaText, colW);
  doc.text(dlaWrapped, M_L, y);

  doc.text(offer.preparedBy || "—", col2X, y);
  setF(doc, "normal", 8.5, SOFT);
  const contactLines: string[] = [];
  if (offer.preparedPhone) contactLines.push(`tel. ${offer.preparedPhone}`);
  if (offer.preparedEmail) contactLines.push(offer.preparedEmail);
  doc.text(contactLines.join("  ·  "), col2X, y + 4.5);

  y += Math.max(dlaWrapped.length * 4.5, 9);

  if (offer.clientEmail || offer.clientPhone) {
    setF(doc, "normal", 8.5, SOFT);
    const subContact: string[] = [];
    if (offer.clientPhone) subContact.push(`tel. ${offer.clientPhone}`);
    if (offer.clientEmail) subContact.push(offer.clientEmail);
    doc.text(subContact.join("  ·  "), M_L, y);
    y += 5;
  }

  y += 4;

  // ===== TYTUŁ INWESTYCJI =====
  const title = (offer.investmentName || "Oferta DRSYSTEM").toUpperCase();
  setF(doc, "bold", 13, GRAPHITE);
  const titleLines = doc.splitTextToSize(title, CONTENT_W);
  doc.text(titleLines, PAGE_W / 2, y + 2, { align: "center" });
  y += titleLines.length * 5.8 + 2;

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(M_L, y, PAGE_W - M_R, y);
  y += 6;

  // ===== LOKALIZACJA =====
  if (offer.siteObjectName || offer.locationAddress) {
    setF(doc, "bold", 9, SOFT);
    doc.text("Lokalizacja:", M_L, y);
    setF(doc, "normal", 9.5, INK);
    const locText = [offer.siteObjectName, offer.locationAddress].filter(Boolean).join(", ");
    const locLines = doc.splitTextToSize(locText, CONTENT_W - 28);
    doc.text(locLines, M_L + 26, y);
    y += locLines.length * 4.5 + 3;
  }

  // ===== PRZEDMIOT OFERTY (opcjonalny) =====
  if (offer.showPurpose === true && offer.purpose?.trim()) {
    y = ensureSpace(doc, y, 24, company, offer);
    y = sectionHeading(doc, y, "Przedmiot oferty");
    setF(doc, "normal", 10);
    const purposeLines = doc.splitTextToSize(offer.purpose.trim(), CONTENT_W);
    doc.text(purposeLines, M_L, y);
    y += purposeLines.length * 4.8 + 6;
  }

  // ===== ZAKRES PRAC =====
  const scope = offer.scope.filter((s) => s.text && s.text.trim());
  const totals = calcTotals(offer);
  if (scope.length > 0) {
    y = ensureSpace(doc, y, 18, company, offer);
    y = sectionHeading(doc, y, "Zakres prac");

    autoTable(doc, {
      startY: y,
      margin: { left: M_L, right: M_R, top: 26 },
      head: [["Lp.", "Opis", "Ilość", "Cena netto", "Wartość"]],
      body: scope.map((item, i) => [
        String(i + 1),
        item.text.trim(),
        Number(item.qty ?? 1).toLocaleString("pl-PL", { maximumFractionDigits: 2 }),
        offer.hideUnitPrices ? "—" : fmt(Number(item.price ?? 0)),
        offer.hideUnitPrices ? "—" : fmt(Number(item.qty ?? 1) * Number(item.price ?? 0)),
      ]),
      theme: "grid",
      styles: {
        font: PDF_FONT,
        fontSize: 9,
        cellPadding: 2.4,
        textColor: INK,
        lineColor: [224, 228, 233],
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: GRAPHITE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 92 },
        2: { cellWidth: 18, halign: "right" },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1 || doc.getNumberOfPages() > 1) {
          drawHeader(doc, company, offer, data.pageNumber);
        }
      },
    });
    y = (doc as AutoTableDoc).lastAutoTable?.finalY ?? y;

    if (!offer.hideUnitPrices) {
      const tableRight = M_L + 10 + 92 + 18 + 24 + 30;
      doc.setFont(PDF_FONT, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text("Razem zakres netto", tableRight - 32, y + 6, { align: "right" });
      doc.text(fmt(totals.scope), tableRight, y + 6, { align: "right" });
      y += 10;
    } else {
      y += 4;
    }
  }

  // ===== TABELA: WYSZCZEGÓLNIENIE MATERIAŁÓW =====
  if (offer.deviceLines.length > 0) {
    y = ensureSpace(doc, y, 22, company, offer);
    y = sectionHeading(doc, y, "Wyszczególnienie materiałów");
    y = renderLinesTable(
      doc,
      y,
      offer.deviceLines,
      offer.hideUnitPrices,
      company,
      offer,
      totals.dev,
      "Razem materiały netto",
    );
    y += 4;
  }

  // ===== ŁĄCZNY KOSZT — minimalistyczny, wyrównany do tabeli =====
  if (!offer.hideUnitPrices) {
    y = ensureSpace(doc, y, 12, company, offer);
    // Rzeczywista szerokość tabeli (taka sama jak w renderLinesTable dla widocznych cen)
    const tableWidth = 10 + 70 + 16 + 14 + 26 + 28;
    const tableRight = M_L + tableWidth;
    // Tylko poziomą linia nad sumą — od lewej krawędzi tabeli do prawej krawędzi tabeli
    doc.setDrawColor(GRAPHITE[0], GRAPHITE[1], GRAPHITE[2]);
    doc.setLineWidth(0.4);
    doc.line(M_L, y - 2, tableRight, y - 2);
    // Etykieta — normal weight
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text("Łączny koszt oferty netto:", M_L, y + 4);
    // Kwota — normal weight, wyrównana do prawej krawędzi tabeli
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(fmt(totals.total), tableRight, y + 4, { align: "right" });
    y += 10;

    if (offer.vatNote?.trim()) {
      setF(doc, "normal", 8, SOFT);
      const vlines = doc.splitTextToSize(offer.vatNote.trim(), CONTENT_W);
      doc.text(vlines, M_L, y);
      y += vlines.length * 3.8 + 2;
    }
  }

  // ===== WARUNKI =====
  const commercialTerms = getOfferCommercialTerms(offer);
  const warTerms: [string, string][] = [
    ["Termin realizacji", commercialTerms.deliveryTerm],
    ["Warunki płatności", commercialTerms.paymentTerms],
    ["Gwarancja na urządzenia", commercialTerms.deviceWarranty],
    ["Gwarancja na wykonanie", commercialTerms.workmanshipWarranty],
  ];
  if (warTerms.length > 0) {
    y += 2;
    y = ensureSpace(doc, y, 12 + warTerms.length * 5, company, offer);
    y = sectionHeading(doc, y, "Warunki");
    setF(doc, "normal", 9.5);
    warTerms.forEach(([k, v]) => {
      setF(doc, "bold", 9.5);
      doc.text(`${k}:`, M_L, y);
      const kw = doc.getTextWidth(`${k}: `);
      setF(doc, "normal", 9.5);
      const lines = doc.splitTextToSize(v, CONTENT_W - kw - 2);
      doc.text(lines, M_L + kw + 1, y);
      y += lines.length * 4.6 + 0.5;
    });
    y += 2;
  }

  // ===== ZAKRES ODPOWIEDZIALNOŚCI (OPCJONALNY) =====
  if (
    offer.showResponsibilities === true &&
    offer.responsibilities &&
    offer.responsibilities.filter((r) => r && r.trim()).length > 0
  ) {
    const responsibilities = offer.responsibilities.filter((r) => r && r.trim());
    y += 2;
    y = ensureSpace(doc, y, 12 + responsibilities.length * 5, company, offer);
    y = sectionHeading(doc, y, "Zakres odpowiedzialności DRSYSTEM");
    setF(doc, "normal", 9, SOFT);
    doc.text("W ramach realizacji zadania DRSYSTEM zapewnia:", M_L, y);
    y += 5;
    setF(doc, "normal", 9.5);
    responsibilities.forEach((r) => {
      const ll = doc.splitTextToSize(r.trim(), CONTENT_W - 8);
      y = ensureSpace(doc, y, ll.length * 4.6 + 1, company, offer);
      setF(doc, "bold", 10, ACCENT);
      doc.text("•", M_L, y);
      setF(doc, "normal", 9.5);
      doc.text(ll, M_L + 5, y);
      y += ll.length * 4.6 + 1;
    });
  }

  drawFooter(doc, company);
  return doc;
}

function renderLinesTable(
  doc: jsPDF,
  y: number,
  lines: OfferLine[],
  hidePrices: boolean,
  company: CompanyData,
  offer: Offer,
  subtotal: number,
  subtotalLabel: string,
): number {
  const head = hidePrices
    ? [["Lp.", "Nazwa", "Ilość", "Jm"]]
    : [["Lp.", "Nazwa", "Ilość", "Jm", "Cena netto", "Wartość"]];

  const body = lines.map((l, i) => {
    const { afterDiscount } = calcLine(l);
    const nameCell =
      l.kind === "device"
        ? l.description?.trim() || l.name
        : l.description?.trim()
          ? `${l.name}\n${l.description.trim()}`
          : l.name;
    if (hidePrices) {
      return [
        String(i + 1),
        nameCell,
        Number(l.qty).toLocaleString("pl-PL", { maximumFractionDigits: 2 }),
        l.unit,
      ];
    }
    return [
      String(i + 1),
      nameCell,
      Number(l.qty).toLocaleString("pl-PL", { maximumFractionDigits: 2 }),
      l.unit,
      fmt(l.price),
      fmt(afterDiscount),
    ];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: M_L, right: M_R, top: HEADER_BOTTOM + 4, bottom: FOOTER_TOP },
    theme: "grid",
    styles: {
      font: PDF_FONT,
      fontSize: 9,
      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
      textColor: INK,
      valign: "top",
      lineColor: LINE,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: PANEL_BG,
      textColor: GRAPHITE,
      fontStyle: "bold",
      fontSize: 8.5,
      lineColor: LINE,
      lineWidth: 0.15,
    },
    columnStyles: hidePrices
      ? {
          0: { halign: "center", cellWidth: 10, textColor: SOFT },
          2: { halign: "right", cellWidth: 18 },
          3: { halign: "center", cellWidth: 14, textColor: SOFT },
        }
      : {
          0: { halign: "center", cellWidth: 10, textColor: SOFT },
          1: { cellWidth: 70 },
          2: { halign: "right", cellWidth: 16 },
          3: { halign: "center", cellWidth: 14, textColor: SOFT },
          4: { halign: "right", cellWidth: 26 },
          5: { halign: "right", cellWidth: 28 },
        },
    didDrawPage: (data) => {
      const page = doc.getNumberOfPages();
      if (data.pageNumber > 1 || page > 1) {
        // Pre-emptywnie narysuj nagłówek strony (z poprawnym numerem strony,
        // czyli aktualnej strony PDF) — autoTable dodaje strony automatycznie.
        drawHeader(doc, company, offer, page);
      }
    },
  });

  // @ts-expect-error provided by jspdf-autotable
  const endY = doc.lastAutoTable?.finalY ?? y;

  if (!hidePrices) {
    // Wyliczamy rzeczywistą prawą krawędź tabeli z sumy szerokości kolumn.
    // To NIE jest PAGE_W - M_R, bo tabela może być węższa niż CONTENT_W.
    const tableWidth = hidePrices ? 10 + 70 + 18 + 14 : 10 + 70 + 16 + 14 + 26 + 28;
    const tableRight = M_L + tableWidth;

    // Sumy zbiorcze: zawsze NORMAL weight, w kolorze szarym.
    // Trzykrotne ustawienie fontu żeby na 100% nadpisać stan po autoTable.
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(SOFT[0], SOFT[1], SOFT[2]);

    const valStr = fmt(subtotal);
    const valW = doc.getTextWidth(valStr);
    const labelText = subtotalLabel + ":";
    const lineY = endY + 5;

    // Kwota wyrównana do prawej krawędzi tabeli (NIE do marginesu strony!)
    doc.text(valStr, tableRight, lineY, { align: "right" });
    // Etykieta zaraz przed kwotą
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(SOFT[0], SOFT[1], SOFT[2]);
    doc.text(labelText, tableRight - valW - 5, lineY, { align: "right" });
    return endY + 9;
  }
  return endY + 2;
}
