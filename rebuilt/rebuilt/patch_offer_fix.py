from pathlib import Path

root = Path('/home/user/Platforma_ofertowa_DRSYSTEM/rebuilt')

# --- src/lib/drsystem-types.ts ---
path = root / 'src/lib/drsystem-types.ts'
text = path.read_text()
text = text.replace(
'''export interface Offer {
  id: string;
  number: string; // 001/YYYY-MM-DD
  date: string; // ISO date
  status: OfferStatus;

  clientId?: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
  clientPhone: string;
  clientEmail: string;

  // Powiązania z lokalizacją, firmą FM i osobą kontaktową
  siteId?: string;
  siteObjectName?: string;
  facilityCompanyId?: string;
  facilityCompanyName?: string;
  contactPersonId?: string;

  investmentName: string;
  locationId?: string;
  locationAddress: string;

  preparedBy: string;
  preparedPhone: string;
  preparedEmail: string;

  scope: ScopeItem[];
  deviceLines: OfferLine[];

  warranty: string;
  validity: string;
  vatNote: string;
  hideUnitPrices: boolean;
  internalNote: string;
''',
'''export interface Offer {
  id: string;
  number: string; // 001/YYYY-MM-DD
  date: string; // ISO date
  status: OfferStatus;

  clientId?: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
  clientPhone: string;
  clientEmail: string;

  // Powiązania z lokalizacją, firmą FM i osobą kontaktową
  siteId?: string;
  siteObjectName?: string;
  facilityCompanyId?: string;
  facilityCompanyName?: string;
  contactPersonId?: string;

  investmentName: string;
  locationId?: string;
  locationAddress: string;

  preparedBy: string;
  preparedPhone: string;
  preparedEmail: string;

  scope: ScopeItem[];
  deviceLines: OfferLine[];

  deliveryTerm: string;
  paymentTerms: string;
  deviceWarranty: string;
  workmanshipWarranty: string;

  warranty: string;
  validity: string;
  vatNote: string;
  hideUnitPrices: boolean;
  internalNote: string;
''')
text = text.replace(
'''export const DEFAULT_WARRANTY = "60 miesięcy";
export const DEFAULT_VALIDITY = "14 dni";
export const DEFAULT_VAT_NOTE = "Do cen należy doliczyć podatek VAT według obowiązujących stawek.";
''',
'''export const DEFAULT_DELIVERY_TERM = "do uzgodnienia";
export const DEFAULT_PAYMENT_TERMS = "14 dni";
export const DEFAULT_DEVICE_WARRANTY = "zgodnie z gwarancją producenta";
export const DEFAULT_WORKMANSHIP_WARRANTY = "12 miesięcy";

// Zachowane dla zgodności wstecznej ze starszymi rekordami / eksportami.
export const DEFAULT_WARRANTY = DEFAULT_DEVICE_WARRANTY;
export const DEFAULT_VALIDITY = DEFAULT_PAYMENT_TERMS;
export const DEFAULT_VAT_NOTE = "Do cen należy doliczyć podatek VAT według obowiązujących stawek.";
''')
text = text.replace(
'''export function calcTotals(offer: Offer) {
  const dev = offer.deviceLines.reduce((s, l) => s + calcLine(l).afterDiscount, 0);
  const scope = offer.scope.reduce(
    (s, item) => s + Number(item.qty ?? 1) * Number(item.price ?? 0),
    0,
  );
  return { dev, scope, total: dev + scope };
}
''',
'''export function calcTotals(offer: Offer) {
  const dev = offer.deviceLines.reduce((s, l) => s + calcLine(l).afterDiscount, 0);
  const scope = offer.scope.reduce(
    (s, item) => s + Number(item.qty ?? 1) * Number(item.price ?? 0),
    0,
  );
  return { dev, scope, total: dev + scope };
}

export function getOfferCommercialTerms(
  offer: Partial<
    Pick<Offer, "deliveryTerm" | "paymentTerms" | "deviceWarranty" | "workmanshipWarranty" | "warranty" | "validity">
  >,
) {
  const deliveryTerm = offer.deliveryTerm?.trim() || DEFAULT_DELIVERY_TERM;
  const paymentTerms = offer.paymentTerms?.trim() || offer.validity?.trim() || DEFAULT_PAYMENT_TERMS;
  const deviceWarranty =
    offer.deviceWarranty?.trim() || offer.warranty?.trim() || DEFAULT_DEVICE_WARRANTY;
  const workmanshipWarranty = offer.workmanshipWarranty?.trim() || DEFAULT_WORKMANSHIP_WARRANTY;

  return {
    deliveryTerm,
    paymentTerms,
    deviceWarranty,
    workmanshipWarranty,
  };
}
''')
path.write_text(text)

# --- src/lib/drsystem-store.ts ---
path = root / 'src/lib/drsystem-store.ts'
text = path.read_text()
if not text.startswith('/* eslint-disable @typescript-eslint/no-explicit-any */'):
    text = '/* eslint-disable @typescript-eslint/no-explicit-any */\n' + text
text = text.replace(
'''  DEFAULT_CATEGORIES,
  DEFAULT_COMPANY,
  DEFAULT_VALIDITY,
  DEFAULT_VAT_NOTE,
  DEFAULT_WARRANTY,
''',
'''  DEFAULT_CATEGORIES,
  DEFAULT_COMPANY,
  DEFAULT_DELIVERY_TERM,
  DEFAULT_DEVICE_WARRANTY,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_VALIDITY,
  DEFAULT_VAT_NOTE,
  DEFAULT_WARRANTY,
  DEFAULT_WORKMANSHIP_WARRANTY,
''')
text = text.replace(
'''          scope: [],
          deviceLines: [],
          warranty: DEFAULT_WARRANTY,
          validity: DEFAULT_VALIDITY,
          vatNote: DEFAULT_VAT_NOTE,
''',
'''          scope: [],
          deviceLines: [],
          deliveryTerm: DEFAULT_DELIVERY_TERM,
          paymentTerms: DEFAULT_PAYMENT_TERMS,
          deviceWarranty: DEFAULT_DEVICE_WARRANTY,
          workmanshipWarranty: DEFAULT_WORKMANSHIP_WARRANTY,
          warranty: DEFAULT_WARRANTY,
          validity: DEFAULT_VALIDITY,
          vatNote: DEFAULT_VAT_NOTE,
''')
text = text.replace('name: "drsystem-store-v9",\n      version: 9,', 'name: "drsystem-store-v10",\n      version: 10,')
text = text.replace(
'''        const templateScope = (t.scope as any[]).map((item) =>
''',
'''        const templateScope = (t.scope as any[]).map((item) =>
''')
text = text.replace(
'''            return {
              ...offer,
              scope: normalizedScope,
            };
''',
'''            return {
              ...offer,
              scope: normalizedScope,
              deliveryTerm: offer.deliveryTerm?.trim() || DEFAULT_DELIVERY_TERM,
              paymentTerms: offer.paymentTerms?.trim() || offer.validity?.trim() || DEFAULT_PAYMENT_TERMS,
              deviceWarranty:
                offer.deviceWarranty?.trim() || offer.warranty?.trim() || DEFAULT_DEVICE_WARRANTY,
              workmanshipWarranty:
                offer.workmanshipWarranty?.trim() || DEFAULT_WORKMANSHIP_WARRANTY,
              warranty: offer.warranty?.trim() || DEFAULT_WARRANTY,
              validity: offer.validity?.trim() || DEFAULT_VALIDITY,
              vatNote: offer.vatNote?.trim() || DEFAULT_VAT_NOTE,
            };
''')
path.write_text(text)

# --- src/lib/drsystem-pdf.ts ---
path = root / 'src/lib/drsystem-pdf.ts'
text = path.read_text()
text = text.replace(
'''  calcLine,
  calcTotals,
  type CompanyData,
  type Offer,
  type OfferLine,
} from "./drsystem-types";
''',
'''  calcLine,
  calcTotals,
  getOfferCommercialTerms,
  type CompanyData,
  type Offer,
  type OfferLine,
} from "./drsystem-types";
''')
needle = '''const fmt = (n: number) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
'''
if 'type AutoTableDoc' not in text:
    text = text.replace(needle, needle + '''
type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};
''')
text = text.replace('y = (doc as any).lastAutoTable?.finalY ?? y;', 'y = (doc as AutoTableDoc).lastAutoTable?.finalY ?? y;')
text = text.replace(
'''  // ===== WARUNKI =====
  const warTerms: [string, string][] = [];
  if (offer.warranty?.trim()) warTerms.push(["Gwarancja", offer.warranty.trim()]);
  if (offer.validity?.trim()) warTerms.push(["Ważność oferty", offer.validity.trim()]);
''',
'''  // ===== WARUNKI =====
  const commercialTerms = getOfferCommercialTerms(offer);
  const warTerms: [string, string][] = [
    ["Termin realizacji", commercialTerms.deliveryTerm],
    ["Warunki płatności", commercialTerms.paymentTerms],
    ["Gwarancja na urządzenia", commercialTerms.deviceWarranty],
    ["Gwarancja na wykonanie", commercialTerms.workmanshipWarranty],
  ];
''')
path.write_text(text)

# --- src/lib/drsystem-docx.ts ---
path = root / 'src/lib/drsystem-docx.ts'
text = path.read_text()
text = text.replace(
'''  calcLine,
  calcTotals,
  type CompanyData,
  type Offer,
  type OfferLine,
} from "./drsystem-types";
''',
'''  calcLine,
  calcTotals,
  getOfferCommercialTerms,
  type CompanyData,
  type Offer,
  type OfferLine,
} from "./drsystem-types";
''')
text = text.replace('    } catch {}\n', '    } catch {\n      // ignoruj nieprawidłowe dane logo i użyj tekstowego nagłówka\n    }\n')
text = text.replace(
'''export async function generateOfferDocx(offer: Offer, company: CompanyData) {
  const totals = calcTotals(offer);
''',
'''export async function generateOfferDocx(offer: Offer, company: CompanyData) {
  const totals = calcTotals(offer);
  const commercialTerms = getOfferCommercialTerms(offer);
''')
text = text.replace(
'''          sectionHeading("INFORMACJE DODATKOWE"),
          p(`Gwarancja: ${offer.warranty}`),
          p(`Ważność oferty: ${offer.validity}`),
          p(offer.vatNote, { color: MUTED }),
''',
'''          sectionHeading("INFORMACJE DODATKOWE"),
          p(`Termin realizacji: ${commercialTerms.deliveryTerm}`),
          p(`Warunki płatności: ${commercialTerms.paymentTerms}`),
          p(`Gwarancja na urządzenia: ${commercialTerms.deviceWarranty}`),
          p(`Gwarancja na wykonanie: ${commercialTerms.workmanshipWarranty}`),
          p(offer.vatNote, { color: MUTED }),
''')
path.write_text(text)

# --- src/routes/new.tsx ---
path = root / 'src/routes/new.tsx'
text = path.read_text()
text = text.replace(
'''import {
  calcLine,
  calcTotals,
  type Device,
  type OfferLine,
  type OfferTemplate,
  type Site,
} from "@/lib/drsystem-types";
''',
'''import {
  calcLine,
  calcTotals,
  DEFAULT_DELIVERY_TERM,
  DEFAULT_DEVICE_WARRANTY,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_WORKMANSHIP_WARRANTY,
  getOfferCommercialTerms,
  type Device,
  type OfferLine,
  type OfferStatus,
  type OfferTemplate,
  type Site,
} from "@/lib/drsystem-types";
''')
text = text.replace(
'''const STEPS = [
  { key: 1, label: "Obiekt", icon: Users },
  { key: 2, label: "Szablon", icon: ListChecks },
  { key: 3, label: "Urządzenia", icon: Library },
  { key: 4, label: "Zakres i ceny", icon: Wrench },
  { key: 5, label: "PDF", icon: FileDown },
] as const;
''',
'''const STEPS = [
  { key: 1, label: "Obiekt", icon: Users },
  { key: 2, label: "Szablon", icon: ListChecks },
  { key: 3, label: "Urządzenia", icon: Library },
  { key: 4, label: "Zakres i ceny", icon: Wrench },
  { key: 5, label: "PDF", icon: FileDown },
] as const;

const STATUS_OPTIONS: Array<{ value: OfferStatus; label: string }> = [
  { value: "draft", label: "Robocza" },
  { value: "sent", label: "Wysłana" },
  { value: "accepted", label: "Zaakceptowana" },
  { value: "rejected", label: "Odrzucona" },
];
''')
text = text.replace(
'''  const updateOffer = useStore((s) => s.updateOffer);
  const applySiteToOffer = useStore((s) => s.applySiteToOffer);
  const applySiteRecordToOffer = useStore((s) => s.applySiteRecordToOffer);
''',
'''  const updateOffer = useStore((s) => s.updateOffer);
  const applySiteRecordToOffer = useStore((s) => s.applySiteRecordToOffer);
''')
text = text.replace(
'''  // Ładowanie istniejącej oferty do stanu kreatora
  useEffect(() => {
    if (!search.id || hydrated) return;
    const existing = useStore.getState().offers.find((o) => o.id === search.id);
    if (!existing) return;
    setOfferId(existing.id);
    setInvestmentName(existing.investmentName || "");
    setOfferDate(existing.date || new Date().toISOString().slice(0, 10));
    setContactName(existing.clientContact || "");
    setContactEmail(existing.clientEmail || "");
    setContactPhone(existing.clientPhone || "");
    setSiteAddress(existing.locationAddress || "");
    if (existing.siteId) {
      const allSites = useStore.getState().sites;
      const site = allSites.find((s) => s.id === existing.siteId);
      if (site) setPickedSiteId(site.id);
    }
    if (existing.clientId) setClientId(existing.clientId);
    if (existing.locationId) setSiteId(existing.locationId);
    if (existing.facilityCompanyId) setFacilityId(existing.facilityCompanyId);
    if (existing.contactPersonId) setContactId(existing.contactPersonId);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.id]);
''',
'''  // Ładowanie istniejącej oferty do stanu kreatora
  useEffect(() => {
    if (!search.id || hydrated) return;
    const existing = useStore.getState().offers.find((o) => o.id === search.id);
    if (!existing) return;
    setOfferId(existing.id);
    setInvestmentName(existing.investmentName || "");
    setOfferDate(existing.date || new Date().toISOString().slice(0, 10));
    setContactName(existing.clientContact || "");
    setContactEmail(existing.clientEmail || "");
    setContactPhone(existing.clientPhone || "");
    setSiteAddress(existing.locationAddress || existing.siteObjectName || "");
    setPickedSiteId(existing.siteId || "");
    setClientId(existing.clientId || "");
    setSiteId(existing.locationId || "");
    setFacilityId(existing.facilityCompanyId || "");
    setContactId(existing.contactPersonId || "");
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.id]);
''')
text = text.replace(
'''  const offer = useStore((s) => (offerId ? s.offers.find((o) => o.id === offerId) : undefined));
  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
''',
'''  const offer = useStore((s) => (offerId ? s.offers.find((o) => o.id === offerId) : undefined));
  const offerTerms = useMemo(() => (offer ? getOfferCommercialTerms(offer) : null), [offer]);
  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
''')
text = text.replace('    } catch {}\n', '    } catch {\n      // brak dostępu do sessionStorage poza przeglądarką\n    }\n')
text = text.replace(
'''  // Po wyborze OBIEKTU z bazy obiektów — auto-uzupełnij klienta, adres, kontakt
  useEffect(() => {
    if (!pickedSite) return;
    if (pickedSite.clientId) {
      setClientId(pickedSite.clientId);
      // dopasuj lokalizację klienta po mieście/nazwie
      const client = clients.find((c) => c.id === pickedSite.clientId);
      const match = client?.locations.find((l) =>
        [l.objectName, l.name].some(
          (n) => n && pickedSite.name.toLowerCase().includes(n.toLowerCase()),
        ),
      );
      if (match) setSiteId(match.id);
    }
    if (pickedSite.address) setSiteAddress(pickedSite.address);
    if (pickedSite.contactIds.length > 0) {
      const firstContact = pickedSite.contactIds[0];
      setContactId(firstContact);
      const cp = contactPersons.find((p) => p.id === firstContact);
      if (cp?.phone) setContactPhone(cp.phone);
      if (cp?.email) setContactEmail(cp.email);
      if (cp?.name) setContactName(cp.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedSiteId]);
''',
'''  // Po wyborze OBIEKTU z bazy obiektów — auto-uzupełnij klienta, adres, kontakt
  useEffect(() => {
    if (!pickedSite) return;
    if (pickedSite.clientId && !clientId) {
      setClientId(pickedSite.clientId);
      // dopasuj lokalizację klienta po mieście/nazwie
      const client = clients.find((c) => c.id === pickedSite.clientId);
      const match = client?.locations.find((l) =>
        [l.objectName, l.name].some(
          (n) => n && pickedSite.name.toLowerCase().includes(n.toLowerCase()),
        ),
      );
      if (match) setSiteId(match.id);
    }
    if (!siteAddress.trim() && pickedSite.address) setSiteAddress(pickedSite.address);
    if (pickedSite.contactIds.length > 0 && !contactId) {
      const firstContact = pickedSite.contactIds[0];
      setContactId(firstContact);
      const cp = contactPersons.find((p) => p.id === firstContact);
      if (!contactPhone.trim() && cp?.phone) setContactPhone(cp.phone);
      if (!contactEmail.trim() && cp?.email) setContactEmail(cp.email);
      if (!contactName.trim() && cp?.name) setContactName(cp.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedSiteId]);
''')
text = text.replace(
'''  // Auto-uzupełnienie po wyborze KLIENTA — telefon/e-mail klienta + domyślna osoba kontaktowa
  useEffect(() => {
    if (!selectedClient) {
      setContactPhone("");
      setContactEmail("");
      setContactId("");
      return;
    }
    // Telefon/e-mail z karty klienta (jeśli zapisane)
    setContactPhone(selectedClient.phone || "");
    setContactEmail(selectedClient.email || "");
    // Domyślna osoba kontaktowa (jeśli przypisana)
    if (selectedClient.defaultContactPersonId) {
      setContactId(selectedClient.defaultContactPersonId);
    } else {
      setContactId("");
    }
  }, [selectedClient?.id]);
''',
'''  // Auto-uzupełnienie po wyborze KLIENTA — telefon/e-mail klienta + domyślna osoba kontaktowa
  useEffect(() => {
    if (!selectedClient) return;
    if (!contactPhone.trim() && selectedClient.phone) setContactPhone(selectedClient.phone);
    if (!contactEmail.trim() && selectedClient.email) setContactEmail(selectedClient.email);
    if (!contactId && selectedClient.defaultContactPersonId) {
      setContactId(selectedClient.defaultContactPersonId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);
''')
text = text.replace(
'''  // Auto-uzupełnienie po wyborze LOKALIZACJI — FM, adres, kontakty
  useEffect(() => {
    if (selectedSite) {
      setFacilityId(selectedSite.facilityCompanyId || "");
      setSiteAddress(selectedSite.address || "");
      // Jeśli lokalizacja ma przypisane osoby — wybierz pierwszą jako domyślną,
      // chyba że już mamy wybraną osobę z tej puli.
      const siteContactIds = selectedSite.contactPersonIds || [];
      if (siteContactIds.length > 0 && !siteContactIds.includes(contactId)) {
        setContactId(siteContactIds[0]);
      }
    } else {
      setFacilityId("");
      setSiteAddress("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite?.id]);
''',
'''  // Auto-uzupełnienie po wyborze LOKALIZACJI — FM, adres, kontakty
  useEffect(() => {
    if (!selectedSite) return;
    if (!facilityId && selectedSite.facilityCompanyId) {
      setFacilityId(selectedSite.facilityCompanyId);
    }
    if (!siteAddress.trim() && selectedSite.address) {
      setSiteAddress(selectedSite.address);
    }
    // Jeśli lokalizacja ma przypisane osoby — wybierz pierwszą jako domyślną,
    // chyba że już mamy wybraną osobę z tej puli.
    const siteContactIds = selectedSite.contactPersonIds || [];
    if (siteContactIds.length > 0 && !contactId) {
      setContactId(siteContactIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite?.id]);
''')
text = text.replace(
'''    updateOffer(id, {
      siteId: pickedSite.id,
      siteObjectName: pickedSite.name,
      clientId: pickedSite.clientId,
      clientName: pickedSite.company || "",
      locationAddress: siteAddress || pickedSite.address || pickedSite.name,
      investmentName: investmentName.trim(),
      date: offerDate || new Date().toISOString().slice(0, 10),
      clientContact: contactName.trim(),
      clientPhone: contactPhone.trim(),
      clientEmail: contactEmail.trim(),
    });
''',
'''    const facilityCompanyName =
      (facilityId ? facilityCompanies.find((f) => f.id === facilityId)?.name : undefined) ||
      offer?.facilityCompanyName ||
      "";

    updateOffer(id, {
      siteId: pickedSite.id,
      siteObjectName: pickedSite.name,
      clientId: pickedSite.clientId,
      clientName: pickedSite.company || offer?.clientName || "",
      locationId: siteId || offer?.locationId,
      locationAddress: siteAddress || pickedSite.address || pickedSite.name,
      facilityCompanyId: facilityId || offer?.facilityCompanyId,
      facilityCompanyName,
      contactPersonId: resolvedContactId,
      investmentName: investmentName.trim(),
      date: offerDate || new Date().toISOString().slice(0, 10),
      clientContact: contactName.trim(),
      clientPhone: contactPhone.trim(),
      clientEmail: contactEmail.trim(),
    });
''')
text = text.replace(
'''                      {pickedSite?.contactIds.length ? (
                        pickedSite.contactIds.map((cid) => {
                          const c = contactPersons.find((p) => p.id === cid);
                          if (!c) return null;
                          return (
                            <SelectItem key={cid} value={cid}>
                              {c.name}
                              {c.email ? ` · ${c.email}` : ""}
                            </SelectItem>
                          );
                        })
                      ) : (
''',
'''                      {availableContacts.length ? (
                        availableContacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.email ? ` · ${c.email}` : ""}
                          </SelectItem>
                        ))
                      ) : (
''')
text = text.replace(
'''                <Card className="p-6">
                  <div className="mb-3 flex items-center justify-between">
''',
'''                <Card className="p-6">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold">Warunki handlowe i zapis oferty</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Te wartości zapisują się indywidualnie dla tej oferty i trafiają do eksportu.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Status oferty</Label>
                      <Select
                        value={offer.status}
                        onValueChange={(value) => updateOffer(offer.id, { status: value as OfferStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Termin realizacji</Label>
                      <Input
                        value={offer.deliveryTerm}
                        onChange={(e) => updateOffer(offer.id, { deliveryTerm: e.target.value })}
                        placeholder={DEFAULT_DELIVERY_TERM}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Warunki płatności</Label>
                      <Input
                        value={offer.paymentTerms}
                        onChange={(e) => updateOffer(offer.id, { paymentTerms: e.target.value })}
                        placeholder={DEFAULT_PAYMENT_TERMS}
                        inputMode="text"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gwarancja na urządzenia</Label>
                      <Input
                        value={offer.deviceWarranty}
                        onChange={(e) => updateOffer(offer.id, { deviceWarranty: e.target.value })}
                        placeholder={DEFAULT_DEVICE_WARRANTY}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Gwarancja na wykonanie</Label>
                      <Input
                        value={offer.workmanshipWarranty}
                        onChange={(e) => updateOffer(offer.id, { workmanshipWarranty: e.target.value })}
                        placeholder={DEFAULT_WORKMANSHIP_WARRANTY}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Notatki wewnętrzne</Label>
                      <Textarea
                        value={offer.internalNote}
                        onChange={(e) => updateOffer(offer.id, { internalNote: e.target.value })}
                        placeholder="Widoczne po ponownym wejściu w edycję tej oferty"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="mb-3 flex items-center justify-between">
''')
text = text.replace(
'''                <div className="mt-6 grid grid-cols-3 gap-3 text-left text-sm">
''',
'''                <div className="mt-6 grid gap-3 text-left text-sm sm:grid-cols-2 xl:grid-cols-3">
''')
text = text.replace(
'''                <div className="mt-6 rounded-md bg-foreground p-5 text-background">
                  <div className="text-xs opacity-70">Łączny koszt oferty netto</div>
                  <div className="text-4xl font-bold">
                    {totals.total.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                  </div>
                  <div className="mt-1 text-[11px] opacity-70">{offer.vatNote}</div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
''',
'''                <div className="mt-6 rounded-md bg-foreground p-5 text-background">
                  <div className="text-xs opacity-70">Łączny koszt oferty netto</div>
                  <div className="text-4xl font-bold">
                    {totals.total.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                  </div>
                  <div className="mt-1 text-[11px] opacity-70">{offer.vatNote}</div>
                </div>

                {offerTerms && (
                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                    <Card className="p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Termin realizacji
                      </div>
                      <div className="mt-1 font-medium">{offerTerms.deliveryTerm}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Warunki płatności
                      </div>
                      <div className="mt-1 font-medium">{offerTerms.paymentTerms}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Gwarancja na urządzenia
                      </div>
                      <div className="mt-1 font-medium">{offerTerms.deviceWarranty}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Gwarancja na wykonanie
                      </div>
                      <div className="mt-1 font-medium">{offerTerms.workmanshipWarranty}</div>
                    </Card>
                  </div>
                )}

                {offer.internalNote?.trim() ? (
                  <Card className="mt-4 p-4 text-left">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Notatki wewnętrzne
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">{offer.internalNote}</div>
                  </Card>
                ) : null}

                <div className="mt-6 flex flex-wrap justify-center gap-2">
''')
text = text.replace(
'''function PanelRow({ label, value }: { label: string; value: number }) {
''',
'''function PanelRow({ label, value }: { label: string; value: string | number }) {
''')
path.write_text(text)

# --- small lint/typing fixes in other files ---
path = root / 'src/routes/sites.tsx'
text = path.read_text().replace('    } catch {}\n', '    } catch {\n      // sessionStorage może być niedostępne poza przeglądarką\n    }\n')
path.write_text(text)

path = root / 'src/routes/settings.tsx'
text = path.read_text().replace('(local as any)[k] ?? ""', 'local[k] ?? ""')
path.write_text(text)

path = root / 'src/routes/devices.tsx'
text = path.read_text()
text = text.replace('const [rows, setRows] = useState<Array<Record<string, any>>>([]);', 'const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);')
text = text.replace('const data: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {', 'const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {')
path.write_text(text)

print('patched offer files')
