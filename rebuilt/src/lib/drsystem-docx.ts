import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from "docx";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import {
  calcLine,
  calcTotals,
  getOfferCommercialTerms,
  type CompanyData,
  type Offer,
} from "./drsystem-types";
import { buildOfferFilename } from "./offer-filename";
import logoUrl from "@/assets/logo-drsystem.png?url";
import watermarkUrl from "@/assets/znak-wodny.jpg?url";

/**
 * Oferta w Wordzie na papierze firmowym DRSYSTEM (wzór: szablon oferty Michała).
 * Logo w prawym górnym rogu, pod nim "systemy teletechniczne", e-mail i www,
 * znak wodny ze strzałkami, stopka z logo, NIP, REGON, KRS, telefonem, e-mailem i www.
 * W lewym górnym rogu: Oferta nr, Dla, Opracował, Kontakt.
 */

const FONT = "Calibri";
const FOOTER_PHONE = "tel. +48 68 384 54 62";
const FOOTER_EMAIL = "drsystem@drsystem.pl";
const FOOTER_WWW = "www.drsystem.pl";

const fmt = (n: number) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

async function loadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

/** Tekst ze znacznikiem **pogrubienie** na przebiegi TextRun. */
function runs(text: string, opts: { size?: number; bold?: boolean; italics?: boolean } = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((x) => x !== "");
  return parts.map((part) => {
    const isBold = part.startsWith("**") && part.endsWith("**") && part.length > 4;
    return new TextRun({
      text: isBold ? part.slice(2, -2) : part,
      bold: opts.bold || isBold,
      italics: opts.italics,
      size: opts.size ?? 22,
      font: FONT,
    });
  });
}

function para(
  text: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    align?: Align;
    before?: number;
    after?: number;
  } = {},
) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 80 },
    children: runs(text, opts),
  });
}

function label(text: string, before = 200) {
  return para(text, { bold: true, before, after: 80 });
}

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const NO_BORDERS_TABLE = {
  ...NO_BORDER,
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function plainCell(children: Paragraph[], width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: NO_BORDER,
    children,
  });
}

function infoLine(key: string, value: string) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 20 },
    children: [
      new TextRun({ text: `${key} `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: value, size: 20, font: FONT }),
    ],
  });
}

function dateIso(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || "";
}

interface Row {
  name: string;
  qty: string;
  price: string;
  total: string;
}

function itemRows(offer: Offer): Row[] {
  const rows: Row[] = [];
  for (const l of offer.deviceLines) {
    const { afterDiscount } = calcLine(l);
    const unitNet = l.qty ? afterDiscount / l.qty : l.price;
    rows.push({
      name: l.name + (l.description ? `\n${l.description}` : ""),
      qty: `${fmtInt(l.qty)}${l.unit ? " " + l.unit : ""}`,
      price: `${fmt(unitNet)} zł`,
      total: `${fmt(afterDiscount)} zł`,
    });
  }
  for (const s of offer.scope) {
    const price = Number(s.price ?? 0);
    if (!price) continue;
    const qty = Number(s.qty ?? 1);
    rows.push({
      name: s.text,
      qty: fmtInt(qty),
      price: `${fmt(price)} zł`,
      total: `${fmt(qty * price)} zł`,
    });
  }
  return rows;
}

function itemsTable(offer: Offer): Table | null {
  const rows = itemRows(offer);
  if (rows.length === 0) return null;
  const hide = offer.hideUnitPrices;
  const cols = hide ? [600, 6900, 1500] : [600, 4300, 1000, 1500, 1700];
  const heads = hide ? ["Lp.", "Nazwa", "Ilość"] : ["Lp.", "Nazwa", "Ilość", "Cena netto", "Kwota razem"];
  const border = { style: BorderStyle.SINGLE, size: 4, color: "7F7F7F" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const mk = (text: string, w: number, align: Align, shade?: string, bold = false) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders,
      shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: "auto" } : undefined,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: text.split("\n").map(
        (line) =>
          new Paragraph({
            alignment: align,
            spacing: { after: 0 },
            children: [new TextRun({ text: line, size: 18, font: FONT, bold })],
          }),
      ),
    });

  const alignFor = (i: number): Align =>
    i === 0 ? AlignmentType.CENTER : i === 1 ? AlignmentType.LEFT : AlignmentType.RIGHT;

  return new Table({
    width: { size: cols.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({
        tableHeader: true,
        children: heads.map((h, i) => mk(h, cols[i], i === 1 ? AlignmentType.LEFT : AlignmentType.CENTER, "F2F2F2", true)),
      }),
      ...rows.map(
        (r, idx) =>
          new TableRow({
            cantSplit: true,
            children: (hide ? [String(idx + 1), r.name, r.qty] : [String(idx + 1), r.name, r.qty, r.price, r.total]).map(
              (t, i) => mk(t, cols[i], alignFor(i)),
            ),
          }),
      ),
    ],
  });
}

const NUMBERING_REF = "zakres-prac";

export async function generateOfferDocx(offer: Offer, company: CompanyData) {
  const totals = calcTotals(offer);
  const terms = getOfferCommercialTerms(offer);
  const [logo, watermark] = await Promise.all([loadBytes(logoUrl), loadBytes(watermarkUrl)]);

  const dla = [offer.clientContact, offer.clientName].filter((x) => x && x.trim()).join(", ");
  const phone = (offer.preparedPhone || company.preparedPhone || "").replace(/ /g, " ");

  // Nagłówek: po lewej dane oferty, po prawej logo i dane firmy; znak wodny za tekstem.
  const left = [
    infoLine("Oferta nr:", offer.number || ""),
    infoLine("Dla:", dla),
    infoLine("Opracował:", offer.preparedBy || company.preparedBy || ""),
    infoLine("Kontakt:", phone),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: offer.preparedEmail || company.preparedEmail || "",
          size: 20,
          font: FONT,
        }),
      ],
    }),
  ];
  const right = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new ImageRun({
          type: "png",
          data: logo,
          transformation: { width: 190, height: 40 },
          altText: { title: "DRSYSTEM", description: "Logo DRSYSTEM", name: "logo" },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: "systemy teletechniczne", italics: true, size: 26, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: FOOTER_EMAIL, bold: true, italics: true, size: 22, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: FOOTER_WWW, bold: true, italics: true, size: 22, font: FONT })],
    }),
  ];

  const watermarkPara = new Paragraph({
    spacing: { after: 0 },
    children: [
      new ImageRun({
        type: "jpg",
        data: watermark,
        transformation: { width: 440, height: 380 },
        altText: { title: "Znak wodny", description: "Znak wodny DRSYSTEM", name: "znak-wodny" },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            align: HorizontalPositionAlign.CENTER,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            align: VerticalPositionAlign.CENTER,
          },
          behindDocument: true,
          allowOverlap: true,
        },
      }),
    ],
  });

  const header = new Header({
    children: [
      watermarkPara,
      new Table({
        width: { size: 9070, type: WidthType.DXA },
        columnWidths: [4535, 4535],
        borders: NO_BORDERS_TABLE,
        rows: [new TableRow({ children: [plainCell(left, 4535), plainCell(right, 4535)] })],
      }),
    ],
  });

  // Stopka: logo + dane firmy w trzech kolumnach.
  const fl = (text: string, align: Align = AlignmentType.LEFT, bold = false) =>
    new Paragraph({
      alignment: align,
      spacing: { after: 0 },
      children: [new TextRun({ text, size: 14, font: FONT, bold })],
    });
  const footer = new Footer({
    children: [
      new Table({
        width: { size: 9070, type: WidthType.DXA },
        columnWidths: [2400, 2300, 2300, 2070],
        borders: NO_BORDERS_TABLE,
        rows: [
          new TableRow({
            children: [
              plainCell(
                [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        type: "png",
                        data: logo,
                        transformation: { width: 120, height: 25 },
                        altText: { title: "DRSYSTEM", description: "Logo DRSYSTEM", name: "logo-stopka" },
                      }),
                    ],
                  }),
                ],
                2400,
              ),
              plainCell(
                [fl("DRSYSTEM sp. z o.o.", AlignmentType.LEFT, true), fl(company.street), fl(company.city)],
                2300,
              ),
              plainCell(
                [fl(`NIP ${company.nip}`), fl(`REGON ${company.regon}`), fl(`KRS ${company.krs}`)],
                2300,
              ),
              plainCell(
                [
                  fl(FOOTER_PHONE, AlignmentType.RIGHT),
                  fl(FOOTER_EMAIL, AlignmentType.RIGHT),
                  fl(FOOTER_WWW, AlignmentType.RIGHT),
                ],
                2070,
              ),
            ],
          }),
        ],
      }),
    ],
  });

  const table = itemsTable(offer);
  const purpose = offer.showPurpose === false ? "" : (offer.purpose || "").trim();
  const infoLines = [
    `Termin realizacji: ${terms.deliveryTerm}`,
    `Warunki płatności: ${terms.paymentTerms}`,
    `Gwarancja na urządzenia: ${terms.deviceWarranty}`,
    `Gwarancja na wykonanie: ${terms.workmanshipWarranty}`,
  ];

  const body: (Paragraph | Table)[] = [
    para(`Rostworowo, ${dateIso(offer.date)}`, { align: AlignmentType.RIGHT, before: 200, after: 200 }),
    para("Oferta DRSYSTEM", { bold: true, size: 28, align: AlignmentType.CENTER, after: 200 }),
    new Paragraph({
      spacing: { after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } },
      children: [new TextRun({ text: "INWESTYCJA:", bold: true, size: 22, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } },
      children: runs(offer.investmentName || "", { bold: true }),
    }),
    ...(purpose ? [label("Przedmiot oferty:", 120), para(purpose, { after: 120 })] : []),
    ...(offer.scope.length
      ? [
          label("Zakres prac:", 160),
          ...offer.scope.map(
            (s) =>
              new Paragraph({
                numbering: { reference: NUMBERING_REF, level: 0 },
                spacing: { after: 60 },
                children: runs(s.text),
              }),
          ),
        ]
      : []),
    label("Lokalizacja:", 200),
    para(offer.locationAddress || "", { after: 120 }),
    ...(table
      ? [
          label("Wyszczególnienie:", 160),
          table,
          para(`Łączny przewidywany koszt netto: ${fmt(totals.total)} zł`, {
            bold: true,
            size: 20,
            align: AlignmentType.RIGHT,
            before: 80,
            after: 120,
          }),
        ]
      : []),
    para(`* ${offer.vatNote}`, { size: 18, before: 80, after: 160 }),
    label("Dodatkowe informacje:", 160),
    ...infoLines.map((t) => para(t, { size: 20, after: 40 })),
  ];

  const doc = new Document({
    creator: "DRSYSTEM",
    title: `Oferta ${offer.number}`,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    numbering: {
      config: [
        {
          reference: NUMBERING_REF,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              // wcięcie wiszące: kolejne linie punktu równo z pierwszą
              style: { paragraph: { indent: { left: 567, hanging: 340 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1500, right: 1418, bottom: 1500, left: 1418, header: 500, footer: 400 },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: body,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, buildOfferFilename(offer, "docx"));
}
