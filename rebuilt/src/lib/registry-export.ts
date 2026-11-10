/**
 * Eksport ofert do rejestru (Sales partner).
 * Pojedyncza oferta: plik JSON z polami rejestru.
 * Wiele ofert: plik Excel (.xlsx) w układzie rejestru.
 */
import { calcTotals, type Offer, type OfferStatus } from "./drsystem-types";

const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: "robocza",
  sent: "wysłana",
  accepted: "zaakceptowana",
  rejected: "odrzucona",
};

export interface RegistryRow {
  numer: string;
  data: string;
  klient: string;
  obiekt: string;
  inwestycja: string;
  lokalizacja: string;
  temat: string;
  kwotaNetto: number;
  status: string;
  opracowal: string;
  plik: string;
}

export function toRegistryRow(o: Offer, filename: string): RegistryRow {
  return {
    numer: o.number,
    data: o.date,
    klient: o.clientName,
    obiekt: o.siteObjectName ?? "",
    inwestycja: o.investmentName,
    lokalizacja: o.locationAddress,
    temat: o.purpose ?? o.investmentName,
    kwotaNetto: Math.round(calcTotals(o).total * 100) / 100,
    status: STATUS_LABEL[o.status],
    opracowal: o.preparedBy,
    plik: filename,
  };
}

/** Dokument w układzie bazy strony Sales partner (kolekcja offers). Id stałe, więc zapis jest idempotentny. */
export function toSalesPartnerDoc(o: Offer) {
  const status =
    o.status === "draft" ? "utworzona" : o.status === "sent" ? "wyslana" : o.status === "accepted" ? "przyjeta" : "nieweszla";
  return {
    id: `app-${o.id}`,
    nr: o.number,
    object: o.siteObjectName || o.locationAddress,
    subject: o.purpose?.trim() || o.investmentName,
    client: o.clientName,
    person: o.clientContact,
    net: Math.round(calcTotals(o).total * 100) / 100,
    status,
    date: o.date,
    inquiryDate: o.inquiryDate ?? "",
    sentDate: o.sentDate ?? "",
    acceptedDate: o.acceptedDate ?? "",
    note: "z aplikacji ofertowej",
  };
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportOfferJson(o: Offer, filename: string) {
  const row = toRegistryRow(o, filename);
  const safe = (o.number || "oferta").replace(/[^a-zA-Z0-9-]+/g, "-");
  download(
    new Blob([JSON.stringify({ ...row, salesPartner: toSalesPartnerDoc(o) }, null, 2)], { type: "application/json" }),
    `rejestr_${safe}.json`,
  );
}

export async function exportRegistryXlsx(rows: RegistryRow[]) {
  const XLSX = await import("xlsx");
  const head = [
    "Numer",
    "Data",
    "Klient",
    "Obiekt",
    "Inwestycja",
    "Lokalizacja",
    "Temat",
    "Kwota netto",
    "Status",
    "Opracował",
    "Plik",
  ];
  const data = rows.map((r) => [
    r.numer,
    r.data,
    r.klient,
    r.obiekt,
    r.inwestycja,
    r.lokalizacja,
    r.temat,
    r.kwotaNetto,
    r.status,
    r.opracowal,
    r.plik,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([head, ...data]);
  ws["!cols"] = head.map((h) => ({ wch: Math.max(12, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rejestr ofert");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `rejestr_ofert_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
