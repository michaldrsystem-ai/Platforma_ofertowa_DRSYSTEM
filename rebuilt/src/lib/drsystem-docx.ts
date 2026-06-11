import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  Footer,
  Header,
  PageNumber,
} from "docx";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import {
  calcLine,
  calcTotals,
  getOfferCommercialTerms,
  type CompanyData,
  type Offer,
  type OfferLine,
} from "./drsystem-types";
import { buildOfferFilename } from "./offer-filename";

const fmt = (n: number) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PRIMARY = "C41E26";
const MUTED = "6E6E73";

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

function p(
  text: string,
  opts: { bold?: boolean; size?: number; color?: string; align?: Align } = {},
) {
  return new Paragraph({
    alignment: opts.align,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 20,
        color: opts.color,
        font: "Arial",
      }),
    ],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: PRIMARY, font: "Arial" })],
  });
}

function cell(
  text: string,
  opts: { bold?: boolean; shade?: string; align?: Align; width?: number } = {},
) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            size: 18,
            font: "Arial",
            color: opts.shade ? "FFFFFF" : "000000",
          }),
        ],
      }),
    ],
  });
}

function linesToTable(
  title: string,
  lines: OfferLine[],
  hidePrices: boolean,
): (Paragraph | Table)[] {
  if (lines.length === 0) return [];
  const cols = hidePrices ? [600, 5400, 1200, 1000] : [600, 3000, 1000, 700, 1300, 800, 1560];
  const tableWidth = cols.reduce((a, b) => a + b, 0);
  const headerCells = hidePrices
    ? ["LP", "NAZWA", "ILOŚĆ", "JM"]
    : ["LP", "NAZWA", "ILOŚĆ", "JM", "CENA NETTO", "RABAT", "WARTOŚĆ NETTO"];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map((t, i) =>
      cell(t, { bold: true, shade: PRIMARY, width: cols[i], align: AlignmentType.CENTER }),
    ),
  });

  const bodyRows = lines.map((l, i) => {
    const { afterDiscount } = calcLine(l);
    const data = hidePrices
      ? [String(i + 1), l.name + (l.description ? `\n${l.description}` : ""), fmt(l.qty), l.unit]
      : [
          String(i + 1),
          l.name + (l.description ? `\n${l.description}` : ""),
          fmt(l.qty),
          l.unit,
          fmt(l.price),
          l.discount ? `${l.discount}%` : "—",
          fmt(afterDiscount),
        ];
    return new TableRow({
      children: data.map((t, idx) =>
        cell(t, {
          width: cols[idx],
          align:
            idx === 0 || idx === 3 || (!hidePrices && idx === 5)
              ? AlignmentType.CENTER
              : (!hidePrices && (idx === 2 || idx === 4 || idx === 6)) || (hidePrices && idx === 2)
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT,
        }),
      ),
    });
  });

  return [
    sectionHeading(title),
    new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: cols,
      rows: [headerRow, ...bodyRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "EEEEEE" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "EEEEEE" },
      },
    }),
  ];
}

function dataUrlToUint8(dataUrl: string): { data: Uint8Array; type: "png" | "jpg" } {
  const [meta, b64] = dataUrl.split(",");
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const type: "png" | "jpg" = meta.includes("png") ? "png" : "jpg";
  return { data: arr, type };
}

export async function generateOfferDocx(offer: Offer, company: CompanyData) {
  const totals = calcTotals(offer);
  const commercialTerms = getOfferCommercialTerms(offer);

  const headerChildren: Paragraph[] = [];
  if (company.logoDataUrl) {
    try {
      const { data, type } = dataUrlToUint8(company.logoDataUrl);
      headerChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              type,
              data,
              transformation: { width: 120, height: 48 },
              altText: { title: "Logo", description: company.name, name: "logo" },
            }),
          ],
        }),
      );
    } catch {
      // ignoruj nieprawidłowe dane logo i użyj tekstowego nagłówka
    }
  } else {
    headerChildren.push(p(company.name, { bold: true, size: 22, color: PRIMARY }));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: PRIMARY },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: PRIMARY },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1000, right: 1000, bottom: 1200, left: 1000 },
          },
        },
        headers: { default: new Header({ children: headerChildren }) },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${company.name} | ${company.street}, ${company.city} | NIP ${company.nip} | REGON ${company.regon} | KRS ${company.krs}`,
                    size: 16,
                    color: MUTED,
                    font: "Arial",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Strona ", size: 16, color: MUTED, font: "Arial" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: MUTED,
                    font: "Arial",
                  }),
                  new TextRun({ text: " / ", size: 16, color: MUTED, font: "Arial" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: MUTED,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "OFERTA HANDLOWA",
                bold: true,
                color: PRIMARY,
                size: 40,
                font: "Arial",
              }),
            ],
          }),
          p(`Oferta nr: ${offer.number}    Data: ${offer.date}`, { color: MUTED }),
          sectionHeading("KLIENT"),
          p(offer.clientName || "—", { bold: true }),
          p(offer.clientAddress || ""),
          sectionHeading("OPRACOWAŁ"),
          p(offer.preparedBy, { bold: true }),
          p(`tel: ${offer.preparedPhone}   e-mail: ${offer.preparedEmail}`, { color: MUTED }),
          sectionHeading("INWESTYCJA"),
          p(offer.investmentName || "—"),
          sectionHeading("LOKALIZACJA"),
          p(offer.locationAddress || "—"),
          ...(offer.scope.length
            ? [
                sectionHeading("ZAKRES PRAC"),
                ...offer.scope.map((s, i) => p(`${i + 1}. ${s.text}`)),
              ]
            : []),
          ...linesToTable("URZĄDZENIA I MATERIAŁY", offer.deviceLines, offer.hideUnitPrices),
          sectionHeading("PODSUMOWANIE"),
          p(`Razem urządzenia netto: ${fmt(totals.dev)} zł`),
          p(`Łącznie netto: ${fmt(totals.total)} zł`, { bold: true, color: PRIMARY, size: 24 }),
          sectionHeading("INFORMACJE DODATKOWE"),
          p(`Termin realizacji: ${commercialTerms.deliveryTerm}`),
          p(`Warunki płatności: ${commercialTerms.paymentTerms}`),
          p(`Gwarancja na urządzenia: ${commercialTerms.deviceWarranty}`),
          p(`Gwarancja na wykonanie: ${commercialTerms.workmanshipWarranty}`),
          p(offer.vatNote, { color: MUTED }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, buildOfferFilename(offer, "docx"));
}
