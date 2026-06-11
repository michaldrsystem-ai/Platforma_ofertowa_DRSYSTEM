import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/drsystem-store";
import {
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
import { generatePurpose } from "@/lib/purpose-generator";
import { generateOfferPdf } from "@/lib/drsystem-pdf";
import { buildOfferFilename } from "@/lib/offer-filename";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileDown,
  Layers,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  Library,
  ListChecks,
  Star,
  Clock,
  Building2,
  ArrowUpDown,
  GripVertical,
  Wand2,
} from "lucide-react";

type NewOfferSearch = { id?: string };

export const Route = createFileRoute("/new")({
  validateSearch: (search: Record<string, unknown>): NewOfferSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [{ title: "DRSYSTEM — Edytor oferty" }],
  }),
  component: NewOfferWizard,
});

const STEPS = [
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

function NewOfferWizard() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const offers = useStore((s) => s.offers);
  const clients = useStore((s) => s.clients);
  const facilityCompanies = useStore((s) => s.facilityCompanies);
  const contactPersons = useStore((s) => s.contactPersons);
  const templates = useStore((s) => s.templates);
  const devices = useStore((s) => s.devices);
  const toggleDeviceFavorite = useStore((s) => s.toggleDeviceFavorite);
  const dismissDeviceFromTop = useStore((s) => s.dismissDeviceFromTop);
  const dismissDeviceFromRecent = useStore((s) => s.dismissDeviceFromRecent);
  const clearTopDevices = useStore((s) => s.clearTopDevices);
  const clearRecentDevices = useStore((s) => s.clearRecentDevices);
  const categories = useStore((s) => s.categories);
  const company = useStore((s) => s.company);
  const createOffer = useStore((s) => s.createOffer);
  const updateOffer = useStore((s) => s.updateOffer);
  const applySiteRecordToOffer = useStore((s) => s.applySiteRecordToOffer);
  const sites = useStore((s) => s.sites);
  const linkContactToSite = useStore((s) => s.linkContactToSite);
  const upsertClient = useStore((s) => s.upsertClient);
  const upsertFacilityCompany = useStore((s) => s.upsertFacilityCompany);
  const upsertContactPerson = useStore((s) => s.upsertContactPerson);
  const updateClientLocation = useStore((s) => s.updateClientLocation);
  const addClientLocation = useStore((s) => s.addClientLocation);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const addDeviceLine = useStore((s) => s.addDeviceLineFromDevice);
  const saveOfferAsTemplate = useStore((s) => s.saveOfferAsTemplate);
  const deleteOffer = useStore((s) => s.deleteOffer);

  const [offerId, setOfferId] = useState<string | null>(search.id ?? null);
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  // Ładowanie istniejącej oferty do stanu kreatora
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

  const [draggedDeviceId, setDraggedDeviceId] = useState<string | null>(null);
  const [cartHover, setCartHover] = useState(false);

  // Step 1 — dane klienta / obiektu
  const [pickedSiteId, setPickedSiteId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [facilityId, setFacilityId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [contactName, setContactName] = useState("");
  const [offerDate, setOfferDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // dialogi szybkiego dodania
  const [newClientName, setNewClientName] = useState("");
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", objectName: "", address: "" });
  const [newFmOpen, setNewFmOpen] = useState(false);
  const [newFmName, setNewFmName] = useState("");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", position: "", phone: "", email: "" });

  // Step 3/4 search
  const [devQ, setDevQ] = useState("");
  const [devCat, setDevCat] = useState<string>("all");
  type DeviceSortKey =
    | "favorites"
    | "name-asc"
    | "name-desc"
    | "price-asc"
    | "price-desc"
    | "usage"
    | "recent";
  const [devSort, setDevSort] = useState<DeviceSortKey>("favorites");
  const addDeviceWithSuggest = (devId: string) => {
    if (!offerId) return;
    addDeviceLine(offerId, devId);
  };

  // Template save dialog
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");

  const offer = useStore((s) => (offerId ? s.offers.find((o) => o.id === offerId) : undefined));
  const offerTerms = useMemo(() => (offer ? getOfferCommercialTerms(offer) : null), [offer]);
  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const selectedSite = useMemo(
    () =>
      selectedClient && siteId ? selectedClient.locations.find((l) => l.id === siteId) : undefined,
    [selectedClient, siteId],
  );
  const pickedSite = useMemo(() => sites.find((s) => s.id === pickedSiteId), [sites, pickedSiteId]);

  // Konsumpcja oczekującego siteId z /sites
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("drsystem-pending-site");
      if (pending) {
        sessionStorage.removeItem("drsystem-pending-site");
        setPickedSiteId(pending);
      }
    } catch {
      // brak dostępu do sessionStorage poza przeglądarką
    }
  }, []);

  // Po wyborze OBIEKTU z bazy obiektów — auto-uzupełnij klienta, adres, kontakt
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

  // Auto-uzupełnienie po wyborze KLIENTA — telefon/e-mail klienta + domyślna osoba kontaktowa
  useEffect(() => {
    if (!selectedClient) return;
    if (!contactPhone.trim() && selectedClient.phone) setContactPhone(selectedClient.phone);
    if (!contactEmail.trim() && selectedClient.email) setContactEmail(selectedClient.email);
    if (!contactId && selectedClient.defaultContactPersonId) {
      setContactId(selectedClient.defaultContactPersonId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);

  // Auto-uzupełnienie po wyborze LOKALIZACJI — FM, adres, kontakty
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

  // Lista osób kontaktowych: te przypisane do lokalizacji + te z wybranej firmy FM + z klienta
  const availableContacts = useMemo(() => {
    const ids = new Set<string>();
    const out: typeof contactPersons = [];
    const pushIf = (p: (typeof contactPersons)[number]) => {
      if (!ids.has(p.id)) {
        ids.add(p.id);
        out.push(p);
      }
    };
    if (selectedSite?.contactPersonIds) {
      for (const id of selectedSite.contactPersonIds) {
        const p = contactPersons.find((x) => x.id === id);
        if (p) pushIf(p);
      }
    }
    if (facilityId) {
      for (const p of contactPersons) if (p.facilityCompanyId === facilityId) pushIf(p);
    }
    if (selectedSite) {
      for (const p of contactPersons) if (p.siteId === selectedSite.id) pushIf(p);
    }
    if (selectedClient) {
      for (const p of contactPersons) if (p.clientId === selectedClient.id) pushIf(p);
    }
    return out;
  }, [contactPersons, selectedSite, facilityId, selectedClient]);

  // Po wyborze OSOBY — auto-uzupełnienie telefonu/maila/stanowiska.
  // UWAGA: jeżeli osoba nie ma zapisanego pola w bazie, NIE czyścimy istniejącej
  // wartości (np. telefonu pobranego wcześniej z karty klienta) — pozostawiamy
  // to, co już jest w formularzu, żeby użytkownik nie tracił danych.
  useEffect(() => {
    if (!contactId) return;
    const p = contactPersons.find((x) => x.id === contactId);
    if (!p) return;
    if (p.phone) setContactPhone(p.phone);
    if (p.email) setContactEmail(p.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  // Wskaźniki "brak danych w bazie"
  const selectedContact = useMemo(
    () => (contactId ? contactPersons.find((x) => x.id === contactId) : undefined),
    [contactId, contactPersons],
  );
  const upsertSiteRec = useStore((s) => s.upsertSite);

  /**
   * Jedna ścieżka zapisu do bazy: klient → FM → kontakt → obiekt (Site + lokalizacja klienta).
   * Tworzy brakujące rekordy, aktualizuje istniejące, dowiązuje wszystkie relacje
   * i odświeża lokalne ID-y, żeby selekty natychmiast pokazały zapisane dane.
   * Rzuca błąd z konkretnym komunikatem przy braku wymaganych danych.
   */
  const saveAllToDb = () => {
    try {
      const cName = (selectedClient?.name || "").trim();
      const sName = (
        pickedSite?.name ||
        selectedSite?.objectName ||
        selectedSite?.name ||
        ""
      ).trim();
      const cpName = (contactName || selectedContact?.name || "").trim();

      if (!cName) throw new Error("Brak nazwy klienta. Wybierz klienta lub dodaj nowego.");
      if (!sName && !siteAddress.trim()) throw new Error("Brak nazwy/adresu obiektu.");

      // 1) KLIENT
      const clientRec = upsertClient({
        ...(selectedClient || {
          id: "",
          name: cName,
          address: "",
          contactPerson: "",
          email: "",
          phone: "",
          locations: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
        name: cName,
        phone: contactPhone || selectedClient?.phone || "",
        email: contactEmail || selectedClient?.email || "",
      });

      // 2) FACILITY MANAGEMENT (opcjonalnie)
      let fcId = facilityId;
      if (!fcId) {
        const existingFm = facilityCompanies.find(
          (f) => f.name.toLowerCase() === cName.toLowerCase(),
        );
        if (existingFm) fcId = existingFm.id;
      }
      const fcRec = fcId ? facilityCompanies.find((f) => f.id === fcId) : undefined;

      // 3) KONTAKT
      let contactRec =
        selectedContact || (contactId ? contactPersons.find((c) => c.id === contactId) : undefined);
      if (cpName) {
        contactRec = upsertContactPerson({
          ...(contactRec || { id: "" }),
          name: cpName,
          phone: contactPhone || contactRec?.phone,
          email: contactEmail || contactRec?.email,
          clientId: clientRec.id,
          facilityCompanyId: fcRec?.id || contactRec?.facilityCompanyId,
        });
      }

      // 4) OBIEKT — rekord w bazie obiektów (nowy model)
      const siteRec = upsertSiteRec({
        id: pickedSite?.id,
        name: sName || siteAddress.trim(),
        company: clientRec.name,
        clientId: clientRec.id,
        address: siteAddress || pickedSite?.address || "",
        city: pickedSite?.city || "",
        region: pickedSite?.region || "",
        description: pickedSite?.description || "",
        notes: pickedSite?.notes || "",
        contactIds: Array.from(
          new Set([...(pickedSite?.contactIds || []), ...(contactRec ? [contactRec.id] : [])]),
        ),
      });
      // przypisz kontakt do rekordu obiektu (idempotentne)
      if (contactRec) linkContactToSite(siteRec.id, contactRec.id);

      // 5) LOKALIZACJA pod klientem (legacy zgodność)
      let locId = siteId;
      const refreshed = useStore.getState().clients.find((c) => c.id === clientRec.id);
      const existingLoc =
        refreshed?.locations.find((l) => l.id === siteId) ||
        refreshed?.locations.find(
          (l) => (l.objectName || l.name).toLowerCase() === sName.toLowerCase(),
        );
      if (existingLoc) {
        const ids = existingLoc.contactPersonIds || [];
        const mergedIds =
          contactRec && !ids.includes(contactRec.id) ? [...ids, contactRec.id] : ids;
        updateClientLocation(clientRec.id, existingLoc.id, {
          name: existingLoc.name || sName,
          objectName: sName || existingLoc.objectName,
          address: siteAddress || existingLoc.address,
          facilityCompanyId: fcRec?.id || existingLoc.facilityCompanyId,
          contactPersonIds: mergedIds,
        });
        locId = existingLoc.id;
      } else {
        addClientLocation(clientRec.id, {
          name: sName,
          objectName: sName,
          address: siteAddress || undefined,
          facilityCompanyId: fcRec?.id,
          contactPersonIds: contactRec ? [contactRec.id] : [],
        });
        const after = useStore.getState().clients.find((c) => c.id === clientRec.id);
        const justAdded = after?.locations[after.locations.length - 1];
        if (justAdded) locId = justAdded.id;
      }

      // 6) Ustaw klienta domyślnym kontaktem
      if (contactRec) {
        upsertClient({ ...clientRec, defaultContactPersonId: contactRec.id });
      }

      // 7) Odśwież lokalne ID-y, żeby selecty pokazały zapisane wartości
      setClientId(clientRec.id);
      if (locId) setSiteId(locId);
      setPickedSiteId(siteRec.id);
      if (fcRec) setFacilityId(fcRec.id);
      if (contactRec) setContactId(contactRec.id);

      toast.success("Dane zapisano do bazy.");
    } catch (e) {
      toast.error(`Błąd zapisu: ${(e as Error).message}`);
    }
  };

  // Ensure a draft offer exists once user starts.
  const ensureOffer = () => {
    if (offerId) return offerId;
    const o = createOffer();
    setOfferId(o.id);
    return o.id;
  };

  useEffect(() => {
    return () => {
      // Nie kasujemy oferty otwartej do edycji z listy
      if (search.id) return;
      const o = offerId ? useStore.getState().offers.find((x) => x.id === offerId) : null;
      if (o && !o.investmentName && o.scope.length === 0 && o.deviceLines.length === 0) {
        deleteOffer(o.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId]);

  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const ensureSelectedSiteContact = () => {
    if (!pickedSite) return null;

    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedPhone = contactPhone.trim();
    const selectedExisting = contactId ? contactPersons.find((x) => x.id === contactId) : undefined;

    if (!trimmedName && !selectedExisting) return null;

    const duplicate =
      selectedExisting ||
      contactPersons.find((x) => {
        if (trimmedEmail && x.email?.toLowerCase() === trimmedEmail.toLowerCase()) return true;
        if (
          trimmedPhone &&
          x.phone === trimmedPhone &&
          trimmedName &&
          x.name.toLowerCase() === trimmedName.toLowerCase()
        )
          return true;
        return false;
      });

    const saved = upsertContactPerson({
      ...(duplicate || { id: "" }),
      name: trimmedName || duplicate?.name || "",
      email: trimmedEmail || duplicate?.email || undefined,
      phone: trimmedPhone || duplicate?.phone || undefined,
      clientId: pickedSite.clientId,
      notes: duplicate?.notes,
    });

    linkContactToSite(pickedSite.id, saved.id);
    setContactId(saved.id);
    setContactName(saved.name);
    setContactEmail(saved.email || trimmedEmail);
    setContactPhone(saved.phone || trimmedPhone);
    return saved;
  };

  // === STEP 1 — Obiekt + kontakt + inwestycja ===
  const commitStep1 = () => {
    if (!pickedSite) {
      toast.error("Wybierz obiekt");
      return;
    }
    if (!investmentName.trim()) {
      toast.error("Podaj nazwę inwestycji");
      return;
    }

    const id = ensureOffer();
    const savedContact = ensureSelectedSiteContact();
    const resolvedContactId = savedContact?.id || contactId || undefined;

    applySiteRecordToOffer(id, pickedSite.id, resolvedContactId);
    const facilityCompanyName =
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

    if (pickedSite.clientId) setClientId(pickedSite.clientId);
    setPickedSiteId(pickedSite.id);
    if (savedContact) setContactId(savedContact.id);

    goNext();
  };

  // Quick-create handlers
  const createClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    const c = upsertClient({
      id: "",
      name,
      address: "",
      contactPerson: "",
      email: "",
      phone: "",
      locations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setClientId(c.id);
    setNewClientName("");
    setNewClientOpen(false);
    toast.success(`Klient „${name}" dodany`);
  };

  const createSite = () => {
    if (!selectedClient) return;
    const n = newSite.name.trim();
    if (!n) return;
    addClientLocation(selectedClient.id, {
      name: n,
      objectName: newSite.objectName.trim() || undefined,
      address: newSite.address.trim() || undefined,
    });
    // pick newest
    setTimeout(() => {
      const updated = useStore.getState().clients.find((c) => c.id === selectedClient.id);
      const justAdded = updated?.locations[updated.locations.length - 1];
      if (justAdded) setSiteId(justAdded.id);
    }, 0);
    setNewSite({ name: "", objectName: "", address: "" });
    setNewSiteOpen(false);
  };

  const createFm = () => {
    const n = newFmName.trim();
    if (!n) return;
    const f = upsertFacilityCompany({ id: "", name: n });
    setFacilityId(f.id);
    setNewFmName("");
    setNewFmOpen(false);
  };

  const createContact = () => {
    const n = newContact.name.trim();
    if (!n) return;
    const p = upsertContactPerson({
      id: "",
      name: n,
      position: newContact.position.trim() || undefined,
      phone: newContact.phone.trim() || undefined,
      email: newContact.email.trim() || undefined,
      facilityCompanyId: facilityId || undefined,
      siteId: siteId || undefined,
      clientId: pickedSite?.clientId || clientId || undefined,
    });
    if (pickedSite) {
      linkContactToSite(pickedSite.id, p.id);
    }
    if (selectedClient && selectedSite) {
      const ids = selectedSite.contactPersonIds || [];
      updateClientLocation(selectedClient.id, selectedSite.id, {
        contactPersonIds: [...ids, p.id],
      });
    }
    setContactId(p.id);
    setContactName(p.name);
    setContactPhone(p.phone || "");
    setContactEmail(p.email || "");
    setNewContact({ name: "", position: "", phone: "", email: "" });
    setNewContactOpen(false);
  };

  // === STEP 2 — szablon ===
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [lastApplied, setLastApplied] = useState<{
    name: string;
    scope: string[];
    devices: string[];
    mode: "replace" | "append";
  } | null>(null);
  const [showTplDetails, setShowTplDetails] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [replaceMode, setReplaceMode] = useState<"replace" | "append">("replace");

  const activeTemplate = useMemo(
    () => (activeTemplateId ? (templates.find((t) => t.id === activeTemplateId) ?? null) : null),
    [templates, activeTemplateId],
  );
  const pendingTemplate = useMemo(
    () => (pendingTemplateId ? (templates.find((t) => t.id === pendingTemplateId) ?? null) : null),
    [templates, pendingTemplateId],
  );

  const resolveTemplateDetails = (t: OfferTemplate) => {
    const deviceNames = t.deviceCodes.map(
      (c) => devices.find((d) => d.code === c || d.id === c)?.name || c,
    );
    return {
      name: t.name,
      scope: t.scope.map((item) => (typeof item === "string" ? item : item.text)).filter(Boolean),
      devices: deviceNames,
    };
  };

  const performApply = (tid: string, mode: "replace" | "append") => {
    if (!offerId) return;
    const t = templates.find((x) => x.id === tid);
    if (!t) return;
    if (mode === "replace") {
      updateOffer(offerId, { scope: [], deviceLines: [] });
    }
    setTimeout(() => {
      applyTemplate(offerId, tid);
      const det = resolveTemplateDetails(t);
      setActiveTemplateId(tid);
      setLastApplied({ ...det, mode });
      setShowTplDetails(false);
      toast.success(
        mode === "replace"
          ? `Załadowano szablon: „${t.name}"`
          : `Dołączono szablon: „${t.name}" do istniejących pozycji`,
        {
          description: `Dodano: ${det.devices.length} urządzeń · ${det.scope.length} pozycji zakresu`,
          duration: 6000,
        },
      );
    }, 0);
  };

  const onApplyTemplate = (tid: string) => {
    if (!offerId) return;
    if (activeTemplateId && activeTemplateId !== tid) {
      setReplaceMode("replace");
      setPendingTemplateId(tid);
      return;
    }
    performApply(tid, "replace");
  };

  const confirmPendingTemplate = () => {
    if (!pendingTemplateId) return;
    performApply(pendingTemplateId, replaceMode);
    setPendingTemplateId(null);
  };

  // === STEP 3 — Urządzenia ===
  const devicePool = useMemo(() => {
    const active = devices.filter((d) => d.active);
    const filtered = active.filter((d) => {
      if (devCat !== "all" && d.category !== devCat) return false;
      if (!devQ.trim()) return true;
      const q = devQ.toLowerCase();
      return [d.name, d.code, d.manufacturer, d.description].some((x) =>
        x?.toLowerCase().includes(q),
      );
    });
    const sorted = [...filtered];
    switch (devSort) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "pl"));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name, "pl"));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "usage":
        sorted.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "recent":
        sorted.sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0));
        break;
      case "favorites":
      default:
        sorted.sort((a, b) => {
          const fa = a.favorite ? 1 : 0;
          const fb = b.favorite ? 1 : 0;
          if (fa !== fb) return fb - fa;
          return a.name.localeCompare(b.name, "pl");
        });
        break;
    }
    return sorted;
  }, [devices, devQ, devCat, devSort]);

  const topDevices = useMemo(
    () =>
      [...devices]
        .filter((d) => d.active && d.usageCount > 0)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 8),
    [devices],
  );
  const recentDevices = useMemo(
    () =>
      [...devices]
        .filter((d) => d.active && d.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, 8),
    [devices],
  );

  // === STEP 5 — Edycja zakresu i pozycji ===
  const patchLine = (lineId: string, patch: Partial<OfferLine>) => {
    if (!offer) return;
    const deviceLines = offer.deviceLines.map((l) => (l.id === lineId ? { ...l, ...patch } : l));
    updateOffer(offer.id, { deviceLines });
  };
  const removeLine = (lineId: string) => {
    if (!offer) return;
    updateOffer(offer.id, { deviceLines: offer.deviceLines.filter((l) => l.id !== lineId) });
  };
  const moveLine = (lineId: string, dir: -1 | 1) => {
    if (!offer) return;
    const arr = [...offer.deviceLines];
    const i = arr.findIndex((l) => l.id === lineId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updateOffer(offer.id, { deviceLines: arr });
  };

  const addCustomLine = () => {
    if (!offer) return;
    const newLine: OfferLine = {
      id: Math.random().toString(36).slice(2),
      kind: "device",
      name: "Nowa pozycja — urządzenie",
      qty: 1,
      unit: "szt",
      price: 0,
      discount: 0,
    };
    updateOffer(offer.id, { deviceLines: [...offer.deviceLines, newLine] });
  };

  const addScopeItem = () => {
    if (!offer) return;
    updateOffer(offer.id, {
      scope: [
        ...offer.scope,
        { id: Math.random().toString(36).slice(2), text: "", qty: 1, price: 0 },
      ],
    });
  };
  const patchScope = (id: string, patch: { text?: string; qty?: number; price?: number }) => {
    if (!offer) return;
    updateOffer(offer.id, {
      scope: offer.scope.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };
  const removeScope = (id: string) => {
    if (!offer) return;
    updateOffer(offer.id, { scope: offer.scope.filter((s) => s.id !== id) });
  };

  // === STEP 6 — PDF ===
  const exportPdf = async () => {
    if (!offer) return;
    if (!offer.clientName.trim() || !offer.investmentName.trim() || !offer.locationAddress.trim()) {
      toast.error("Uzupełnij klienta, inwestycję i lokalizację");
      return;
    }
    const doc = await generateOfferPdf(offer, company);
    doc.save(buildOfferFilename(offer, "pdf"));
    toast.success(`PDF zapisany — ${offer.number}`);
  };

  const onSaveTemplate = () => {
    if (!offer) return;
    const tpl = saveOfferAsTemplate(offer.id, tplName);
    if (tpl) {
      toast.success(`Szablon „${tpl.name}" zapisany`);
      setSaveTplOpen(false);
      setTplName("");
    }
  };

  const totals = offer ? calcTotals(offer) : { dev: 0, scope: 0, total: 0 };

  const cartCounts = useMemo(() => {
    const dev: Record<string, number> = {};
    if (offer) {
      for (const l of offer.deviceLines) {
        if (l.refId) dev[l.refId] = (dev[l.refId] || 0) + Number(l.qty || 1);
      }
    }
    return { device: dev };
  }, [offer]);

  return (
    <AppShell
      title="Nowa oferta — kreator"
      actions={
        <>
          {offer && (
            <Button variant="outline" onClick={() => navigate({ to: "/" })} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Lista ofert
            </Button>
          )}
        </>
      }
    >
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.key;
          const done = step > s.key;
          return (
            <button
              key={s.key}
              onClick={() => offerId && setStep(s.key)}
              disabled={!offerId && s.key !== 1}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
              } disabled:opacity-50`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="font-medium">
                {s.key}. {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold">Krok 1 — Obiekt i kontakt</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            To jest nowa, uproszczona ścieżka: zaczynasz od wyboru obiektu, a klient i adres
            uzupełniają się automatycznie z bazy.
          </p>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4" /> Obiekt *
              </Label>
              <Select value={pickedSiteId} onValueChange={setPickedSiteId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="— wybierz obiekt z bazy —" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.city ? ` · ${s.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {pickedSite ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{pickedSite.company || "Brak firmy"}</Badge>
                    {pickedSite.city ? <Badge variant="outline">{pickedSite.city}</Badge> : null}
                    {pickedSite.region ? (
                      <Badge variant="outline">{pickedSite.region}</Badge>
                    ) : null}
                    <Badge variant="outline">{pickedSite.contactIds.length} kontaktów</Badge>
                  </div>

                  <div className="rounded-md border bg-background/80 p-3 text-sm">
                    <div className="font-medium">{pickedSite.name}</div>
                    <div className="mt-1 text-muted-foreground">
                      {pickedSite.address || "Adres obiektu nie został jeszcze uzupełniony."}
                    </div>
                    {pickedSite.description ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {pickedSite.description}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border bg-background/80 p-3 text-sm">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Klient końcowy
                      </div>
                      <div className="mt-1 font-medium">{pickedSite.company || "—"}</div>
                    </div>
                    <div className="rounded-md border bg-background/80 p-3 text-sm">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Adres oferty
                      </div>
                      <div className="mt-1 font-medium">
                        {siteAddress || pickedSite.address || pickedSite.name}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Wybierz obiekt, aby od razu wczytać klienta, lokalizację i dostępne kontakty.
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-semibold">Kontakt dla oferty</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewContactOpen(true)}
                  disabled={!pickedSite}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Nowy kontakt
                </Button>
              </div>

              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Kontakt z przypisanych do obiektu</Label>
                  <Select
                    value={contactId}
                    onValueChange={(v) => {
                      setContactId(v);
                      const cp = contactPersons.find((p) => p.id === v);
                      if (cp) {
                        setContactName(cp.name);
                        setContactPhone(cp.phone || "");
                        setContactEmail(cp.email || "");
                      }
                    }}
                    disabled={!pickedSite}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={pickedSite ? "— wybierz kontakt —" : "Najpierw wybierz obiekt"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContacts.length ? (
                        availableContacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.email ? ` · ${c.email}` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Brak przypisanych kontaktów
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Imię i nazwisko</Label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="jan.kowalski@firma.pl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefon</Label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="600 000 000"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!pickedSite || (!contactName.trim() && !contactId)}
                  onClick={() => {
                    const saved = ensureSelectedSiteContact();
                    if (saved)
                      toast.success(`Kontakt „${saved.name}" zapisany w książce adresowej`);
                  }}
                >
                  <Save className="h-4 w-4" /> Zapisz kontakt do książki adresowej
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t pt-4 md:grid-cols-[2fr_1fr]">
            <div>
              <Label>Nazwa inwestycji *</Label>
              <Input
                className="mt-2"
                placeholder="np. Wymiana uszkodzonych czujek systemu sygnalizacji pożarowej"
                value={investmentName}
                onChange={(e) => setInvestmentName(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center justify-between">
                <span>Data oferty</span>
                <button
                  type="button"
                  onClick={() => setOfferDate(new Date().toISOString().slice(0, 10))}
                  className="text-[11px] font-normal text-primary hover:underline"
                >
                  ustaw dzisiejszą
                </button>
              </Label>
              <Input
                className="mt-2"
                type="date"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button onClick={commitStep1} className="gap-2">
              Dalej <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
      {/* Dialogi szybkiego dodawania */}
      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy klient</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nazwa klienta</Label>
            <Input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="np. Amazon"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewClientOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={createClient} disabled={!newClientName.trim()}>
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newSiteOpen} onOpenChange={setNewSiteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowa lokalizacja / obiekt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Krótka nazwa</Label>
              <Input
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                placeholder="np. Głuchów"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nazwa obiektu</Label>
              <Input
                value={newSite.objectName}
                onChange={(e) => setNewSite({ ...newSite, objectName: e.target.value })}
                placeholder="np. Centrum Logistyczne Zalando Głuchów"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Adres</Label>
              <Input
                value={newSite.address}
                onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                placeholder="ul., miasto, kod"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewSiteOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={createSite} disabled={!newSite.name.trim()}>
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFmOpen} onOpenChange={setNewFmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowa firma facility management</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nazwa firmy</Label>
            <Input
              value={newFmName}
              onChange={(e) => setNewFmName(e.target.value)}
              placeholder="np. SPIE, Apleona, ISS"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewFmOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={createFm} disabled={!newFmName.trim()}>
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowa osoba kontaktowa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Imię i nazwisko</Label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Stanowisko</Label>
              <Input
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                placeholder="np. Kierownik obiektu"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <p className="md:col-span-2 text-xs text-muted-foreground">
              Osoba zostanie przypisana do aktualnie wybranego obiektu i będzie dostępna przy
              kolejnych ofertach.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewContactOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={createContact} disabled={!newContact.name.trim()}>
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {offer && step >= 2 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            {/* STEP 2 */}
            {step === 2 && (
              <Card className="p-6">
                <h2 className="mb-1 text-base font-semibold">Krok 2 — Szablon oferty</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Wybierz gotowy szablon, aby automatycznie uzupełnić zakres prac i pozycje
                  kosztorysu. Możesz też pominąć ten krok.
                </p>

                {activeTemplate && (
                  <div className="mb-4 rounded-md border border-primary/40 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                          Aktywny szablon
                        </div>
                        <div className="mt-0.5 text-base font-semibold">{activeTemplate.name}</div>
                        {lastApplied && (
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                              Dodano:
                            </div>
                            <ul className="space-y-0.5">
                              <li className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-primary" />
                                {lastApplied.scope.length} pozycji zakresu
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-primary" />
                                {lastApplied.devices.length} pozycji materiałowych
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-primary" />
                                {lastApplied.scope.length}{" "}
                                {lastApplied.scope.length === 1 ? "zakres prac" : "punktów zakresu"}
                              </li>
                            </ul>
                            {lastApplied.mode === "append" && (
                              <div className="text-xs italic text-muted-foreground">
                                (dołączono do istniejących pozycji)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant="default" className="shrink-0">
                        Aktywny
                      </Badge>
                    </div>

                    {lastApplied && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-3 gap-1 px-2"
                          onClick={() => setShowTplDetails((v) => !v)}
                        >
                          {showTplDetails ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          {showTplDetails ? "Ukryj szczegóły" : "Pokaż szczegóły"}
                        </Button>
                        {showTplDetails && (
                          <div className="mt-3 grid gap-4 border-t pt-3 md:grid-cols-2">
                            <div>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Urządzenia
                              </div>
                              {lastApplied.devices.length === 0 ? (
                                <div className="text-xs text-muted-foreground">— brak —</div>
                              ) : (
                                <ul className="space-y-0.5 text-sm">
                                  {lastApplied.devices.map((n, i) => (
                                    <li key={i}>• {n}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Zakres prac
                              </div>
                              {lastApplied.scope.length === 0 ? (
                                <div className="text-xs text-muted-foreground">— brak —</div>
                              ) : (
                                <ul className="space-y-0.5 text-sm">
                                  {lastApplied.scope.map((n, i) => (
                                    <li key={i}>• {n}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {templates.map((t) => {
                    const isActive = t.id === activeTemplateId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onApplyTemplate(t.id)}
                        className={`relative rounded-md border p-4 text-left transition hover:border-primary hover:shadow-sm ${
                          isActive
                            ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                            : "bg-background"
                        }`}
                      >
                        {isActive && (
                          <Badge variant="default" className="absolute right-2 top-2 gap-1">
                            <Check className="h-3 w-3" />
                            Aktywny
                          </Badge>
                        )}
                        <div className="mb-1 pr-16 font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.scope.length} poz. zakresu · {t.deviceCodes.length} urządz.
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Wstecz
                  </Button>
                  <Button onClick={goNext} className="gap-2">
                    Dalej <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 3 — devices */}
            {step === 3 && (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                {/* LEWA KOLUMNA — biblioteka */}
                <Card className="p-4 md:p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Krok 3 — Urządzenia i materiały</h2>
                      <p className="text-sm text-muted-foreground">
                        Klikaj{" "}
                        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">+ Dodaj</kbd>{" "}
                        lub <strong>przeciągnij kafelek</strong> do koszyka po prawej.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => navigate({ to: "/devices" })}
                      >
                        <Library className="h-4 w-4" /> Biblioteka / Import cennika
                      </Button>
                      {devices.some((d) => d.isSample) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive"
                          onClick={() => {
                            if (
                              !confirm(
                                "Usunąć wszystkie urządzenia oznaczone jako dane przykładowe?",
                              )
                            )
                              return;
                            const n = useStore.getState().removeSampleDevices();
                            toast.success(`Usunięto ${n} pozycji przykładowych`);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Usuń dane przykładowe
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Kategorie */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {(["all", ...categories] as string[]).map((c) => {
                      const count =
                        c === "all"
                          ? devices.filter((d) => d.active).length
                          : devices.filter((d) => d.active && d.category === c).length;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDevCat(c)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            devCat === c
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background hover:bg-accent"
                          }`}
                        >
                          {c === "all" ? "Wszystkie" : c}{" "}
                          <span className="opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Wyszukiwarka + sortowanie */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={devQ}
                        onChange={(e) => setDevQ(e.target.value)}
                        placeholder="Szukaj: nazwa, indeks, producent, opis…"
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <select
                        value={devSort}
                        onChange={(e) => setDevSort(e.target.value as DeviceSortKey)}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        title="Sortuj"
                      >
                        <option value="favorites">★ Ulubione na górze</option>
                        <option value="name-asc">Nazwa A → Z</option>
                        <option value="name-desc">Nazwa Z → A</option>
                        <option value="price-asc">Cena: rosnąco</option>
                        <option value="price-desc">Cena: malejąco</option>
                        <option value="usage">Najczęściej używane</option>
                        <option value="recent">Ostatnio używane</option>
                      </select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCustomLine()}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Własna pozycja
                    </Button>
                  </div>

                  {/* Najczęściej / ostatnio używane jako pasek u góry */}
                  {(topDevices.length > 0 || recentDevices.length > 0) && (
                    <div className="mb-3 rounded-md border bg-muted/30 p-3">
                      {topDevices.length > 0 && (
                        <div className="mb-2">
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-amber-500" /> Najczęściej używane
                            </div>
                            <button
                              type="button"
                              onClick={clearTopDevices}
                              className="text-[10px] font-medium normal-case text-muted-foreground hover:text-foreground"
                            >
                              Wyczyść listę
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {topDevices.map((d) => (
                              <div key={d.id} className="group relative">
                                <DeviceChip
                                  d={d}
                                  count={cartCounts.device[d.id] || 0}
                                  onAdd={() => addDeviceWithSuggest(d.id)}
                                />
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    dismissDeviceFromTop(d.id);
                                    toast.success(`Usunięto „${d.name}” z najczęściej używanych`);
                                  }}
                                  className="absolute -right-1 -top-1 hidden h-5 min-w-[20px] items-center justify-center rounded-full border bg-background px-1 text-[10px] text-muted-foreground shadow-sm transition hover:border-destructive hover:text-destructive group-hover:flex"
                                  title="Usuń z najczęściej używanych"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {recentDevices.length > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" /> Ostatnio używane
                            </div>
                            <button
                              type="button"
                              onClick={clearRecentDevices}
                              className="text-[10px] font-medium normal-case text-muted-foreground hover:text-foreground"
                            >
                              Wyczyść listę
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {recentDevices.map((d) => (
                              <div key={d.id} className="group relative">
                                <DeviceChip
                                  d={d}
                                  count={cartCounts.device[d.id] || 0}
                                  onAdd={() => addDeviceWithSuggest(d.id)}
                                />
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    dismissDeviceFromRecent(d.id);
                                    toast.success(`Usunięto „${d.name}” z ostatnio używanych`);
                                  }}
                                  className="absolute -right-1 -top-1 hidden h-5 min-w-[20px] items-center justify-center rounded-full border bg-background px-1 text-[10px] text-muted-foreground shadow-sm transition hover:border-destructive hover:text-destructive group-hover:flex"
                                  title="Usuń z ostatnio używanych"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mb-2 text-xs text-muted-foreground">
                    {devicePool.length} {devicePool.length === 1 ? "pozycja" : "pozycji"}
                    {devicePool.length > 80 ? " — zawęź wyszukiwaniem (pokazuję pierwsze 80)" : ""}
                  </div>

                  {/* SIATKA kafelków z drag & drop */}
                  {devicePool.length === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Brak wyników. Sprawdź inny cennik lub zaimportuj cennik w bibliotece.
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {devicePool.slice(0, 80).map((d) => {
                        const cnt = cartCounts.device[d.id] || 0;
                        const isDragged = draggedDeviceId === d.id;
                        return (
                          <div
                            key={d.id}
                            draggable
                            onDragStart={(ev) => {
                              ev.dataTransfer.setData("text/plain", d.id);
                              ev.dataTransfer.effectAllowed = "copy";
                              setDraggedDeviceId(d.id);
                            }}
                            onDragEnd={() => setDraggedDeviceId(null)}
                            className={`group relative flex flex-col rounded-lg border bg-background p-3 transition ${
                              cnt > 0
                                ? "border-primary/60 bg-primary/5"
                                : "hover:border-primary hover:bg-primary/5"
                            } ${isDragged ? "opacity-40" : ""} cursor-grab active:cursor-grabbing`}
                          >
                            {cnt > 0 && (
                              <div className="absolute -right-2 -top-2 flex h-6 min-w-[28px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-md">
                                ×{cnt}
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm font-semibold leading-tight">
                                    {d.name}
                                  </span>
                                  {d.isSample && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                      przykład
                                    </Badge>
                                  )}
                                </div>
                                {(d.code || d.manufacturer) && (
                                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                    {d.code && <span className="font-mono">{d.code}</span>}
                                    {d.manufacturer && <span>{d.manufacturer}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    toggleDeviceFavorite(d.id);
                                  }}
                                  className={`rounded-md p-1 transition hover:bg-muted ${
                                    d.favorite
                                      ? "text-amber-500"
                                      : "text-muted-foreground/40 hover:text-amber-500"
                                  }`}
                                  title={d.favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                                >
                                  <Star className={`h-4 w-4 ${d.favorite ? "fill-current" : ""}`} />
                                </button>
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                              </div>
                            </div>

                            {d.description && (
                              <p className="mt-2 text-xs text-muted-foreground">{d.description}</p>
                            )}

                            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  toggleDeviceFavorite(d.id);
                                  toast.success(
                                    d.favorite
                                      ? `Usunięto „${d.name}” z ulubionych`
                                      : `Dodano „${d.name}” do ulubionych`,
                                  );
                                }}
                                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${
                                  d.favorite
                                    ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "text-muted-foreground hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                {d.favorite ? "W ulubionych" : "Dodaj do ulubionych"}
                              </button>
                              <div className="ml-auto text-base font-bold tabular-nums">
                                {d.price.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addDeviceWithSuggest(d.id)}
                                className="h-7 gap-1 px-3"
                              >
                                <Plus className="h-3.5 w-3.5" /> Dodaj
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* PRAWA KOLUMNA — sticky koszyk (drop target) */}
                <div className="xl:sticky xl:top-20 xl:self-start">
                  <Card
                    onDragOver={(ev) => {
                      ev.preventDefault();
                      ev.dataTransfer.dropEffect = "copy";
                      setCartHover(true);
                    }}
                    onDragLeave={() => setCartHover(false)}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      setCartHover(false);
                      const id = ev.dataTransfer.getData("text/plain");
                      if (id) addDeviceWithSuggest(id);
                    }}
                    className={`flex max-h-[calc(100vh-7rem)] flex-col p-0 transition ${
                      cartHover ? "ring-4 ring-primary/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Koszyk oferty
                        </div>
                        <div className="text-sm font-semibold">
                          {offer.deviceLines.length}{" "}
                          {offer.deviceLines.length === 1 ? "pozycja" : "pozycji"} · urządzenia i
                          materiały
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Razem netto
                        </div>
                        <div className="text-base font-bold tabular-nums">
                          {totals.dev.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                      {offer.deviceLines.length === 0 ? (
                        <div
                          className={`rounded-md border-2 border-dashed p-8 text-center text-sm transition ${
                            cartHover
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          {cartHover ? (
                            <span className="font-semibold">⬇️ Upuść tutaj</span>
                          ) : (
                            <>
                              <div className="mb-1 font-medium">Koszyk pusty</div>
                              <div className="text-xs">
                                Przeciągnij kafelek z lewej lub kliknij „+ Dodaj"
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {offer.deviceLines.map((l) => {
                            const total = calcLine(l).net;
                            return (
                              <li
                                key={l.id}
                                className="group rounded-md border bg-background p-2.5 text-sm transition hover:border-primary/40"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <Input
                                    value={l.name}
                                    onChange={(e) => patchLine(l.id, { name: e.target.value })}
                                    className="h-7 flex-1 border-0 bg-transparent px-0 text-sm font-semibold focus-visible:bg-muted/40"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 shrink-0 text-destructive opacity-60 hover:opacity-100"
                                    onClick={() => removeLine(l.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="mt-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        patchLine(l.id, {
                                          qty: Math.max(0, Number(l.qty) - 1),
                                        })
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded border bg-background text-sm hover:bg-muted"
                                    >
                                      −
                                    </button>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="1"
                                      value={l.qty}
                                      onChange={(e) =>
                                        patchLine(l.id, {
                                          qty: Number(e.target.value),
                                        })
                                      }
                                      className="h-7 w-12 text-center text-xs tabular-nums"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        patchLine(l.id, {
                                          qty: Number(l.qty) + 1,
                                        })
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded border bg-background text-sm hover:bg-muted"
                                    >
                                      +
                                    </button>
                                    <Input
                                      value={l.unit}
                                      onChange={(e) => patchLine(l.id, { unit: e.target.value })}
                                      className="h-7 w-12 text-xs"
                                    />
                                  </div>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={l.price}
                                    onChange={(e) =>
                                      patchLine(l.id, {
                                        price: Number(e.target.value),
                                      })
                                    }
                                    className="h-7 w-full text-right text-xs tabular-nums"
                                  />
                                  <div className="whitespace-nowrap text-sm font-semibold tabular-nums">
                                    {total.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2.5">
                      <Button variant="ghost" size="sm" onClick={goBack}>
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Wstecz
                      </Button>
                      <Button onClick={goNext} className="gap-1.5">
                        Dalej (Zakres i ceny) <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}
            {/* STEP 5 — review */}
            {step === 4 && offer && (
              <div className="space-y-6">
                <PurposeEditor
                  offer={offer}
                  onApply={(g) => {
                    updateOffer(offer.id, {
                      purpose: g.purpose,
                      benefits: g.benefits,
                      responsibilities: g.responsibilities,
                      showPurpose: true,
                      showResponsibilities: true,
                    });
                    toast.success("Cel i zakres odpowiedzialności zaktualizowane");
                  }}
                  onPatch={(patch) => updateOffer(offer.id, patch)}
                />

                <Card className="p-6">
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
                    <div>
                      <h2 className="text-base font-semibold">Zakres prac z cenami</h2>
                      <p className="text-sm text-muted-foreground">
                        Tutaj wyceniasz zakres prac w jednej, spójnej liście pozycji.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={addScopeItem}>
                      <Plus className="mr-1 h-4 w-4" />
                      Dodaj pozycję
                    </Button>
                  </div>
                  {offer.scope.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Brak pozycji zakresu. Wróć do kroku 2 lub dodaj ręcznie.
                    </p>
                  )}
                  <ol className="space-y-3">
                    {offer.scope.map((s, i) => (
                      <li key={s.id} className="rounded-lg border p-3">
                        <div className="flex items-start gap-3">
                          <span className="mt-2 w-6 shrink-0 text-right text-xs font-semibold text-primary">
                            {i + 1}.
                          </span>
                          <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_110px_160px_130px_auto]">
                            <Textarea
                              value={s.text}
                              onChange={(e) => patchScope(s.id, { text: e.target.value })}
                              className="min-h-[56px]"
                              placeholder="np. Wymiana uszkodzonych czujek i ponowne uruchomienie systemu"
                            />
                            <div>
                              <Label className="mb-1 block text-xs text-muted-foreground">
                                Ilość
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={s.qty ?? 1}
                                onChange={(e) => patchScope(s.id, { qty: Number(e.target.value) })}
                                className="text-right tabular-nums"
                              />
                            </div>
                            <div>
                              <Label className="mb-1 block text-xs text-muted-foreground">
                                Cena netto
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={s.price ?? 0}
                                onChange={(e) =>
                                  patchScope(s.id, { price: Number(e.target.value) })
                                }
                                className="text-right tabular-nums"
                              />
                            </div>
                            <div>
                              <Label className="mb-1 block text-xs text-muted-foreground">
                                Wartość
                              </Label>
                              <div className="flex h-10 items-center justify-end rounded-md border bg-muted/40 px-3 text-right text-sm font-semibold tabular-nums">
                                {(Number(s.qty ?? 1) * Number(s.price ?? 0)).toLocaleString(
                                  "pl-PL",
                                  {
                                    minimumFractionDigits: 2,
                                  },
                                )}{" "}
                                zł
                              </div>
                            </div>
                            <div className="flex items-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => removeScope(s.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>

                <LinesEditor
                  title="Urządzenia i materiały"
                  lines={offer.deviceLines}
                  onPatch={(id, p) => patchLine(id, p)}
                  onRemove={(id) => removeLine(id)}
                  onMove={(id, d) => moveLine(id, d)}
                  onAdd={() => addCustomLine()}
                />

                <Card className="flex items-center justify-between bg-foreground p-5 text-background">
                  <div className="space-y-0.5 text-sm opacity-80">
                    <div>
                      Urządzenia: {totals.dev.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}{" "}
                      zł
                    </div>
                    <div>
                      Zakres: {totals.scope.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}{" "}
                      zł
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide opacity-70">Łącznie netto</div>
                    <div className="text-3xl font-bold">
                      {totals.total.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Wstecz
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSaveTplOpen(true)}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Zapisz jako szablon
                    </Button>
                    <Button onClick={goNext} className="gap-2">
                      Dalej <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6 — PDF */}
            {step === 5 && offer && (
              <Card className="p-8 text-center">
                <h2 className="text-lg font-semibold">Krok 5 — Generuj PDF</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Oferta <strong>{offer.number}</strong> dla <strong>{offer.clientName}</strong>
                </p>

                <div className="mt-6 grid gap-3 text-left text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Zakres prac</div>
                    <div className="text-xl font-bold">{offer.scope.length}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Urządzenia</div>
                    <div className="text-xl font-bold">{offer.deviceLines.length}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Pozycje wycenione</div>
                    <div className="text-xl font-bold">
                      {offer.scope.filter((s) => Number(s.price ?? 0) > 0).length}
                    </div>
                  </Card>
                </div>

                <div className="mt-6 rounded-md bg-foreground p-5 text-background">
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
                  <Button variant="ghost" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Wstecz
                  </Button>
                  <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                    Lista ofert
                  </Button>
                  <Button onClick={exportPdf} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Pobierz PDF
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* PANEL — Aktywne elementy oferty */}
          <aside className="lg:sticky lg:top-4 h-fit">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Aktywne elementy oferty
              </div>

              <div className="mb-3 rounded-md border bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Szablon
                </div>
                <div className="text-sm font-semibold">
                  {activeTemplate ? (
                    activeTemplate.name
                  ) : (
                    <span className="text-muted-foreground">— brak —</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                <PanelRow label="Urządzenia" value={offer.deviceLines.length} />
                <PanelRow label="Zakres prac" value={offer.scope.length} />
                <PanelRow
                  label="Wartość zakresu"
                  value={`${totals.scope.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł`}
                />
              </ul>

              <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Oferta: <span className="font-mono text-foreground">{offer.number}</span>
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* Dialog — zmiana aktywnego szablonu */}
      <Dialog open={!!pendingTemplateId} onOpenChange={(o) => !o && setPendingTemplateId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmiana szablonu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Aktualny szablon</div>
              <div className="font-semibold">{activeTemplate?.name}</div>
              <div className="mt-2 text-xs text-muted-foreground">Nowy szablon</div>
              <div className="font-semibold">{pendingTemplate?.name}</div>
            </div>
            <p className="text-sm">Co zrobić?</p>
            <RadioGroup
              value={replaceMode}
              onValueChange={(v) => setReplaceMode(v as "replace" | "append")}
            >
              <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                <RadioGroupItem value="replace" id="rep" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Zastąp obecny szablon nowym</div>
                  <div className="text-xs text-muted-foreground">
                    Wyczyści zakres i urządzenia, a następnie wgra nowy szablon.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                <RadioGroupItem value="append" id="app" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">
                    Dodaj nowy szablon do istniejących pozycji
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Zostawi obecne pozycje i doda do nich elementy z nowego szablonu.
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingTemplateId(null)}>
              Anuluj
            </Button>
            <Button onClick={confirmPendingTemplate}>Zastosuj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveTplOpen} onOpenChange={setSaveTplOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zapisz układ jako szablon</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nazwa szablonu</Label>
            <Input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="np. Wymiana czujek SSP"
            />
            <p className="text-xs text-muted-foreground">
              Zapisany zostanie zakres prac, lista urządzeń i lista prac (bez danych klienta).
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveTplOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={onSaveTemplate} disabled={!tplName.trim()}>
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PanelRow({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </li>
  );
}

function DeviceChip({ d, onAdd, count = 0 }: { d: Device; onAdd: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={`group relative inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs hover:border-primary hover:bg-primary/5 ${
        count > 0 ? "border-primary/60 bg-primary/5" : ""
      }`}
    >
      <span className="font-medium">{d.name}</span>
      <span className="text-muted-foreground">· {d.price.toFixed(2)} zł</span>
      {count > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          ×{count}
        </span>
      ) : (
        <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
      )}
    </button>
  );
}

function LinesEditor({
  title,
  lines,
  onPatch,
  onRemove,
  onMove,
  onAdd,
}: {
  title: string;
  lines: OfferLine[];
  onPatch: (id: string, patch: Partial<OfferLine>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAdd: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Dodaj wiersz
        </Button>
      </div>
      {lines.length === 0 && <p className="text-sm text-muted-foreground">Brak pozycji.</p>}
      <div className="space-y-2">
        {lines.map((l, i) => {
          const { afterDiscount } = calcLine(l);
          return (
            <div key={l.id} className="grid grid-cols-12 items-center gap-2 rounded-md border p-2">
              <div className="col-span-12 md:col-span-5">
                <Input
                  value={l.description?.trim() || l.name}
                  onChange={(e) => onPatch(l.id, { description: e.target.value })}
                  placeholder="Opis z cennika"
                />
              </div>
              <Input
                className="col-span-3 md:col-span-1"
                type="number"
                min="1"
                step="1"
                value={l.qty}
                onChange={(e) => onPatch(l.id, { qty: Number(e.target.value) })}
              />
              <Input
                className="col-span-3 md:col-span-1"
                value={l.unit}
                onChange={(e) => onPatch(l.id, { unit: e.target.value })}
              />
              <Input
                className="col-span-3 md:col-span-2"
                type="number"
                step="0.01"
                value={l.price}
                onChange={(e) => onPatch(l.id, { price: Number(e.target.value) })}
              />
              <div className="col-span-3 md:col-span-2 text-right text-sm font-semibold tabular-nums">
                {afterDiscount.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
              </div>
              <div className="col-span-12 flex justify-end gap-1 md:col-span-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onMove(l.id, -1)}
                  disabled={i === 0}
                  title="Wyżej"
                >
                  ↑
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onMove(l.id, 1)}
                  disabled={i === lines.length - 1}
                  title="Niżej"
                >
                  ↓
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => onRemove(l.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PurposeEditor({
  offer,
  onApply,
  onPatch,
}: {
  offer: import("@/lib/drsystem-types").Offer;
  onApply: (g: { purpose: string; benefits: string[]; responsibilities: string[] }) => void;
  onPatch: (p: Partial<import("@/lib/drsystem-types").Offer>) => void;
}) {
  const [hint, setHint] = useState("");
  const [open, setOpen] = useState(false);

  const handleGenerate = () => {
    const g = generatePurpose({ hint, offer });
    onApply(g);
    setHint("");
  };

  const showPurpose = offer.showPurpose === true;
  const showResponsibilities = offer.showResponsibilities === true;

  return (
    <Card className="p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Dodatkowe sekcje (opcjonalne)</h2>
          <p className="text-sm text-muted-foreground">
            Te bloki <strong>nie są pokazywane w PDF</strong>, dopóki ich nie włączysz checkboxem.
            Domyślnie oferta jest krótka i rzeczowa.
          </p>
        </div>
        <Button
          variant={open ? "secondary" : "default"}
          onClick={() => setOpen((v) => !v)}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" />
          {open ? "Schowaj AI" : "AI: opisz mi cel"}
        </Button>
      </div>

      {open && (
        <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-4">
          <Label className="text-xs font-semibold text-primary">
            Opisz swoimi słowami, czego dotyczy oferta
          </Label>
          <Textarea
            autoFocus
            rows={3}
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={
              "np. „awaria czujek w hali magazynowej, klient chce wymianę na nowsze” — albo zostaw puste, AI rozpozna kontekst z urządzeń i zakresu prac w ofercie."
            }
            className="mt-2 bg-background"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              💡 AI bierze pod uwagę urządzenia i zakres prac dodane w krokach 3-4.
            </p>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Wygeneruj
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Cel prac (główny opis)
            </Label>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={showPurpose}
                onChange={(e) => onPatch({ showPurpose: e.target.checked })}
              />
              Pokaż w PDF
            </label>
          </div>
          <Textarea
            rows={5}
            value={offer.purpose || ""}
            onChange={(e) => onPatch({ purpose: e.target.value })}
            placeholder="Opis celu prac, który trafi do oferty PDF. Możesz wygenerować przez AI lub napisać ręcznie."
          />

          <Label className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
            Korzyści (lista, każda w nowej linii)
          </Label>
          <Textarea
            rows={4}
            value={(offer.benefits || []).join("\n")}
            onChange={(e) =>
              onPatch({
                benefits: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Każda korzyść w nowej linii"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Zakres odpowiedzialności DRSYSTEM (lista)
            </Label>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={showResponsibilities}
                onChange={(e) => onPatch({ showResponsibilities: e.target.checked })}
              />
              Pokaż w PDF
            </label>
          </div>
          <Textarea
            rows={10}
            value={(offer.responsibilities || []).join("\n")}
            onChange={(e) =>
              onPatch({
                responsibilities: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Co DRSYSTEM zapewnia w ramach zlecenia. Każdy punkt w nowej linii."
          />
        </div>
      </div>
    </Card>
  );
}
