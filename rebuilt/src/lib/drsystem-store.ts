/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Client,
  type ClientLocation,
  type CompanyData,
  type ContactPerson,
  type Device,
  type FacilityCompany,
  type Offer,
  type OfferLine,
  type OfferTemplate,
  type Site,
  type SystemCategory,
  DEFAULT_CATEGORIES,
  DEFAULT_COMPANY,
  DEFAULT_DELIVERY_TERM,
  DEFAULT_DEVICE_WARRANTY,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_VALIDITY,
  DEFAULT_VAT_NOTE,
  DEFAULT_WARRANTY,
  DEFAULT_WORKMANSHIP_WARRANTY,
  SEED_CLIENTS,
  SEED_CONTACT_PERSONS,
  SEED_DEVICES,
  SEED_FACILITY_COMPANIES,
  SEED_SITES,
  SEED_TEMPLATES,
} from "./drsystem-types";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const ymd = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface Store {
  company: CompanyData;
  categories: SystemCategory[];
  devices: Device[];
  templates: OfferTemplate[];
  clients: Client[];
  facilityCompanies: FacilityCompany[];
  contactPersons: ContactPerson[];
  offers: Offer[];
  sites: Site[];

  upsertSite: (s: Partial<Site> & { id?: string }) => Site;
  deleteSite: (id: string) => void;
  linkContactToSite: (siteId: string, contactId: string) => void;
  unlinkContactFromSite: (siteId: string, contactId: string) => void;
  applySiteRecordToOffer: (offerId: string, siteId: string, contactId?: string) => void;

  setCompany: (c: Partial<CompanyData>) => void;
  addCategory: (c: string) => void;

  upsertDevice: (d: Device) => void;
  deleteDevice: (id: string) => void;
  importDevices: (
    rows: Omit<Device, "id" | "usageCount" | "lastUsedAt">[],
    category: SystemCategory,
  ) => number;
  toggleDeviceFavorite: (id: string) => void;
  dismissDeviceFromTop: (id: string) => void;
  dismissDeviceFromRecent: (id: string) => void;
  clearTopDevices: () => void;
  clearRecentDevices: () => void;
  removeSampleDevices: () => number;

  upsertTemplate: (t: OfferTemplate) => void;
  deleteTemplate: (id: string) => void;
  saveOfferAsTemplate: (offerId: string, name: string) => OfferTemplate | null;

  upsertClient: (c: Client) => Client;
  deleteClient: (id: string) => void;
  addClientLocation: (clientId: string, loc: Omit<ClientLocation, "id">) => void;
  updateClientLocation: (clientId: string, locId: string, patch: Partial<ClientLocation>) => void;
  removeClientLocation: (clientId: string, locId: string) => void;
  applyClientToOffer: (offerId: string, clientId: string, locationId?: string) => void;
  applySiteToOffer: (
    offerId: string,
    opts: {
      clientId: string;
      siteId?: string;
      facilityCompanyId?: string;
      contactPersonId?: string;
    },
  ) => void;
  syncClientFromOffer: (offerId: string) => void;

  upsertFacilityCompany: (f: FacilityCompany) => FacilityCompany;
  deleteFacilityCompany: (id: string) => void;

  upsertContactPerson: (p: ContactPerson) => ContactPerson;
  deleteContactPerson: (id: string) => void;

  createOffer: (init?: Partial<Offer>) => Offer;
  cloneOffer: (id: string) => Offer | null;
  updateOffer: (id: string, patch: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;

  // helpers used in editor
  addDeviceLineFromDevice: (offerId: string, deviceId: string, qty?: number) => void;
  applyTemplate: (offerId: string, templateId: string) => void;
}

function nextOfferNumber(offers: Offer[]): string {
  const today = ymd();
  const sameDay = offers.filter((o) => o.number.endsWith("/" + today));
  const n = sameDay.length + 1;
  return `${String(n).padStart(3, "0")}/${today}`;
}

function seedDevices(): Device[] {
  return SEED_DEVICES.map((d) => ({
    ...d,
    id: uid(),
    usageCount: 0,
    lastUsedAt: null,
    isSample: true,
  }));
}
function seedTemplates(): OfferTemplate[] {
  return SEED_TEMPLATES.map((t) => ({ ...t, id: uid() }));
}
function seedClients(): Client[] {
  const now = Date.now();
  return SEED_CLIENTS.map((c) => ({
    ...c,
    id: c.id || uid(),
    locations: c.locations.map((l) => ({ ...l, id: l.id || uid() })),
    createdAt: now,
    updatedAt: now,
  }));
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      company: DEFAULT_COMPANY,
      categories: DEFAULT_CATEGORIES,
      devices: seedDevices(),
      templates: seedTemplates(),
      clients: seedClients(),
      facilityCompanies: SEED_FACILITY_COMPANIES.map((f) => ({ ...f })),
      contactPersons: SEED_CONTACT_PERSONS.map((p) => ({ ...p })),
      offers: [],
      sites: SEED_SITES.map((s) => ({ ...s, createdAt: Date.now(), updatedAt: Date.now() })),

      upsertSite: (input) => {
        const now = Date.now();
        const exists = input.id ? get().sites.find((x) => x.id === input.id) : undefined;
        const next: Site = exists
          ? ({ ...exists, ...input, updatedAt: now } as Site)
          : {
              id: input.id || uid(),
              name: input.name || "",
              company: input.company || "",
              clientId: input.clientId,
              address: input.address || "",
              city: input.city || "",
              region: input.region || "",
              description: input.description || "",
              notes: input.notes || "",
              sspType: input.sspType,
              sspManufacturer: input.sspManufacturer,
              dsoType: input.dsoType,
              dsoManufacturer: input.dsoManufacturer,
              smokeSystem: input.smokeSystem,
              vesdaSystem: input.vesdaSystem,
              contactIds: input.contactIds || [],
              createdAt: now,
              updatedAt: now,
            };
        set({
          sites: exists
            ? get().sites.map((x) => (x.id === next.id ? next : x))
            : [...get().sites, next],
        });
        return next;
      },
      deleteSite: (id) => {
        const now = Date.now();
        set({
          sites: get().sites.filter((s) => s.id !== id),
          offers: get().offers.map((o) =>
            o.siteId === id ? { ...o, siteId: undefined, siteObjectName: "", updatedAt: now } : o,
          ),
        });
      },
      linkContactToSite: (siteId, contactId) =>
        set({
          sites: get().sites.map((s) =>
            s.id === siteId && !s.contactIds.includes(contactId)
              ? { ...s, contactIds: [...s.contactIds, contactId], updatedAt: Date.now() }
              : s,
          ),
        }),
      unlinkContactFromSite: (siteId, contactId) =>
        set({
          sites: get().sites.map((s) =>
            s.id === siteId
              ? {
                  ...s,
                  contactIds: s.contactIds.filter((c) => c !== contactId),
                  updatedAt: Date.now(),
                }
              : s,
          ),
        }),
      applySiteRecordToOffer: (offerId, siteId, contactId) => {
        const site = get().sites.find((s) => s.id === siteId);
        if (!site) return;
        const cp = contactId ? get().contactPersons.find((p) => p.id === contactId) : undefined;
        set({
          offers: get().offers.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  siteId: site.id,
                  siteObjectName: site.name,
                  clientId: site.clientId || o.clientId,
                  clientName: site.company || o.clientName,
                  locationAddress: site.address || o.locationAddress,
                  contactPersonId: cp?.id,
                  clientContact: cp?.name || o.clientContact,
                  clientPhone: cp?.phone || o.clientPhone,
                  clientEmail: cp?.email || o.clientEmail,
                  updatedAt: Date.now(),
                }
              : o,
          ),
        });
      },

      upsertFacilityCompany: (f) => {
        const id = f.id || uid();
        const next: FacilityCompany = { ...f, id };
        const exists = get().facilityCompanies.some((x) => x.id === id);
        set({
          facilityCompanies: exists
            ? get().facilityCompanies.map((x) => (x.id === id ? next : x))
            : [...get().facilityCompanies, next],
        });
        return next;
      },
      deleteFacilityCompany: (id) =>
        set({
          facilityCompanies: get().facilityCompanies.filter((f) => f.id !== id),
          // odpina również od lokalizacji i osób
          clients: get().clients.map((c) => ({
            ...c,
            locations: c.locations.map((l) =>
              l.facilityCompanyId === id ? { ...l, facilityCompanyId: undefined } : l,
            ),
          })),
          contactPersons: get().contactPersons.map((p) =>
            p.facilityCompanyId === id ? { ...p, facilityCompanyId: undefined } : p,
          ),
        }),

      upsertContactPerson: (p) => {
        const id = p.id || uid();
        const next: ContactPerson = { ...p, id };
        const exists = get().contactPersons.some((x) => x.id === id);
        set({
          contactPersons: exists
            ? get().contactPersons.map((x) => (x.id === id ? next : x))
            : [...get().contactPersons, next],
        });
        return next;
      },
      deleteContactPerson: (id) => {
        const now = Date.now();
        set({
          contactPersons: get().contactPersons.filter((p) => p.id !== id),
          clients: get().clients.map((c) => ({
            ...c,
            locations: c.locations.map((l) => ({
              ...l,
              contactPersonIds: (l.contactPersonIds || []).filter((x) => x !== id),
            })),
          })),
          sites: get().sites.map((s) => ({
            ...s,
            contactIds: s.contactIds.filter((x) => x !== id),
            updatedAt: s.contactIds.includes(id) ? now : s.updatedAt,
          })),
          offers: get().offers.map((o) =>
            o.contactPersonId === id
              ? {
                  ...o,
                  contactPersonId: undefined,
                  clientContact: "",
                  clientPhone: "",
                  clientEmail: "",
                  updatedAt: now,
                }
              : o,
          ),
        });
      },

      applySiteToOffer: (offerId, { clientId, siteId, facilityCompanyId, contactPersonId }) => {
        const client = get().clients.find((c) => c.id === clientId);
        if (!client) return;
        const site = siteId ? client.locations.find((l) => l.id === siteId) : undefined;
        const fcId = facilityCompanyId ?? site?.facilityCompanyId;
        const fc = fcId ? get().facilityCompanies.find((f) => f.id === fcId) : undefined;
        const cp = contactPersonId
          ? get().contactPersons.find((p) => p.id === contactPersonId)
          : undefined;
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer) return;
        const siteAddress = site?.address || offer.locationAddress;
        const siteObject = site?.objectName || site?.name || "";
        set({
          offers: get().offers.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  clientId: client.id,
                  clientName: client.name,
                  clientAddress: client.address,
                  siteId: site?.id,
                  siteObjectName: siteObject,
                  locationId: site?.id,
                  locationAddress: siteAddress,
                  facilityCompanyId: fc?.id,
                  facilityCompanyName: fc?.name || "",
                  contactPersonId: cp?.id,
                  clientContact: cp?.name || (cp ? o.clientContact : ""),
                  clientPhone: cp?.phone ?? o.clientPhone,
                  clientEmail: cp?.email ?? o.clientEmail,
                  updatedAt: Date.now(),
                }
              : o,
          ),
        });
      },

      upsertClient: (c) => {
        const now = Date.now();
        const exists = get().clients.find((x) => x.id === c.id);
        const next: Client = exists
          ? { ...exists, ...c, updatedAt: now }
          : {
              ...c,
              id: c.id || uid(),
              createdAt: c.createdAt || now,
              updatedAt: now,
              locations: c.locations || [],
            };
        set({
          clients: exists
            ? get().clients.map((x) => (x.id === c.id ? next : x))
            : [...get().clients, next],
        });
        return next;
      },
      deleteClient: (id) => {
        const now = Date.now();
        set({
          clients: get().clients.filter((c) => c.id !== id),
          sites: get().sites.map((s) =>
            s.clientId === id ? { ...s, clientId: undefined, updatedAt: now } : s,
          ),
          contactPersons: get().contactPersons.map((p) =>
            p.clientId === id ? { ...p, clientId: undefined } : p,
          ),
          offers: get().offers.map((o) =>
            o.clientId === id
              ? {
                  ...o,
                  clientId: undefined,
                  updatedAt: now,
                }
              : o,
          ),
        });
      },
      addClientLocation: (clientId, loc) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? { ...c, locations: [...c.locations, { ...loc, id: uid() }], updatedAt: Date.now() }
              : c,
          ),
        }),
      updateClientLocation: (clientId, locId, patch) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  locations: c.locations.map((l) => (l.id === locId ? { ...l, ...patch } : l)),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }),
      removeClientLocation: (clientId, locId) =>
        set({
          clients: get().clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  locations: c.locations.filter((l) => l.id !== locId),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }),
      applyClientToOffer: (offerId, clientId, locationId) => {
        const client = get().clients.find((c) => c.id === clientId);
        if (!client) return;
        const loc = locationId ? client.locations.find((l) => l.id === locationId) : undefined;
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer) return;
        const locText = loc
          ? [loc.name, loc.address].filter(Boolean).join(", ")
          : offer.locationAddress;
        set({
          offers: get().offers.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  clientId: client.id,
                  clientName: client.name,
                  clientAddress: client.address,
                  clientContact: client.contactPerson,
                  clientPhone: client.phone,
                  clientEmail: client.email,
                  locationId: loc?.id,
                  locationAddress: locText,
                  updatedAt: Date.now(),
                }
              : o,
          ),
        });
      },
      syncClientFromOffer: (offerId) => {
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer || !offer.clientName.trim()) return;
        const clients = get().clients;
        const existing =
          (offer.clientId && clients.find((c) => c.id === offer.clientId)) ||
          clients.find((c) => c.name.toLowerCase() === offer.clientName.toLowerCase());
        const now = Date.now();
        if (existing) {
          const updated: Client = {
            ...existing,
            name: offer.clientName || existing.name,
            address: offer.clientAddress || existing.address,
            contactPerson: offer.clientContact || existing.contactPerson,
            phone: offer.clientPhone || existing.phone,
            email: offer.clientEmail || existing.email,
            updatedAt: now,
          };
          // ensure location is registered
          if (
            offer.locationAddress &&
            !existing.locations.some(
              (l) => l.name.toLowerCase() === offer.locationAddress.toLowerCase(),
            )
          ) {
            updated.locations = [...existing.locations, { id: uid(), name: offer.locationAddress }];
          }
          set({
            clients: clients.map((c) => (c.id === existing.id ? updated : c)),
            offers: get().offers.map((o) =>
              o.id === offerId ? { ...o, clientId: existing.id } : o,
            ),
          });
        } else {
          const id = uid();
          const created: Client = {
            id,
            name: offer.clientName,
            address: offer.clientAddress,
            contactPerson: offer.clientContact,
            phone: offer.clientPhone,
            email: offer.clientEmail,
            locations: offer.locationAddress ? [{ id: uid(), name: offer.locationAddress }] : [],
            createdAt: now,
            updatedAt: now,
          };
          set({
            clients: [...clients, created],
            offers: get().offers.map((o) => (o.id === offerId ? { ...o, clientId: id } : o)),
          });
        }
      },

      setCompany: (c) => set({ company: { ...get().company, ...c } }),
      addCategory: (c) => {
        if (!c || get().categories.includes(c)) return;
        set({ categories: [...get().categories, c] });
      },

      upsertDevice: (d) =>
        set({
          devices: get().devices.some((x) => x.id === d.id)
            ? get().devices.map((x) => (x.id === d.id ? d : x))
            : [...get().devices, { ...d, id: d.id || uid() }],
        }),
      deleteDevice: (id) => set({ devices: get().devices.filter((d) => d.id !== id) }),
      importDevices: (rows, category) => {
        const existing = get().devices;
        const out = [...existing];
        let added = 0;
        for (const r of rows) {
          const dup = existing.find((d) => d.code && d.code === r.code && d.category === category);
          if (dup) {
            // update price/name
            Object.assign(dup, {
              name: r.name || dup.name,
              price: r.price ?? dup.price,
              description: r.description || dup.description,
              unit: r.unit || dup.unit,
              manufacturer: r.manufacturer || dup.manufacturer,
            });
          } else {
            out.push({ ...r, category, id: uid(), usageCount: 0, lastUsedAt: null });
            added++;
          }
        }
        set({ devices: out });
        return added;
      },
      toggleDeviceFavorite: (id) =>
        set({
          devices: get().devices.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d)),
        }),
      dismissDeviceFromTop: (id) =>
        set({
          devices: get().devices.map((d) => (d.id === id ? { ...d, usageCount: 0 } : d)),
        }),
      dismissDeviceFromRecent: (id) =>
        set({
          devices: get().devices.map((d) => (d.id === id ? { ...d, lastUsedAt: null } : d)),
        }),
      clearTopDevices: () =>
        set({
          devices: get().devices.map((d) => ({ ...d, usageCount: 0 })),
        }),
      clearRecentDevices: () =>
        set({
          devices: get().devices.map((d) => ({ ...d, lastUsedAt: null })),
        }),
      removeSampleDevices: () => {
        const before = get().devices.length;
        const remaining = get().devices.filter((d) => !d.isSample);
        set({ devices: remaining });
        return before - remaining.length;
      },

      upsertTemplate: (t) =>
        set({
          templates: get().templates.some((x) => x.id === t.id)
            ? get().templates.map((x) => (x.id === t.id ? t : x))
            : [...get().templates, { ...t, id: t.id || uid() }],
        }),
      deleteTemplate: (id) => set({ templates: get().templates.filter((t) => t.id !== id) }),
      saveOfferAsTemplate: (offerId, name) => {
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer || !name.trim()) return null;
        const devices = get().devices;
        const tpl: OfferTemplate = {
          id: uid(),
          name: name.trim(),
          scope: offer.scope
            .filter((s) => s.text.trim().length > 0)
            .map((s) => ({
              text: s.text,
              qty: Number(s.qty ?? 1),
              price: Number(s.price ?? 0),
            })),
          deviceCodes: offer.deviceLines
            .map((l) => {
              const d = devices.find((x) => x.id === l.refId);
              return d?.code || d?.id || "";
            })
            .filter(Boolean),
        };
        set({ templates: [...get().templates, tpl] });
        return tpl;
      },

      createOffer: (init) => {
        const c = get().company;
        const now = Date.now();
        const offer: Offer = {
          id: uid(),
          number: nextOfferNumber(get().offers),
          date: ymd(),
          status: "draft",
          clientName: "",
          clientAddress: "",
          clientContact: "",
          clientPhone: "",
          clientEmail: "",
          investmentName: "",
          locationAddress: "",
          preparedBy: c.preparedBy,
          preparedPhone: c.preparedPhone,
          preparedEmail: c.preparedEmail,
          scope: [],
          deviceLines: [],
          deliveryTerm: DEFAULT_DELIVERY_TERM,
          paymentTerms: DEFAULT_PAYMENT_TERMS,
          deviceWarranty: DEFAULT_DEVICE_WARRANTY,
          workmanshipWarranty: DEFAULT_WORKMANSHIP_WARRANTY,
          warranty: DEFAULT_WARRANTY,
          validity: DEFAULT_VALIDITY,
          vatNote: DEFAULT_VAT_NOTE,
          hideUnitPrices: false,
          internalNote: "",
          createdAt: now,
          updatedAt: now,
          ...init,
        };
        set({ offers: [offer, ...get().offers] });
        return offer;
      },
      cloneOffer: (id) => {
        const src = get().offers.find((o) => o.id === id);
        if (!src) return null;
        const now = Date.now();
        const clone: Offer = {
          ...src,
          id: uid(),
          number: nextOfferNumber(get().offers),
          date: ymd(),
          status: "draft",
          createdAt: now,
          updatedAt: now,
          scope: src.scope.map((s) => ({ ...s, id: uid() })),
          deviceLines: src.deviceLines.map((l) => ({ ...l, id: uid() })),
        };
        set({ offers: [clone, ...get().offers] });
        return clone;
      },
      updateOffer: (id, patch) =>
        set({
          offers: get().offers.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: Date.now() } : o,
          ),
        }),
      deleteOffer: (id) => set({ offers: get().offers.filter((o) => o.id !== id) }),

      addDeviceLineFromDevice: (offerId, deviceId, qty = 1) => {
        const dev = get().devices.find((d) => d.id === deviceId);
        if (!dev) return;
        const line: OfferLine = {
          id: uid(),
          kind: "device",
          refId: dev.id,
          name: dev.name + (dev.code ? ` [${dev.code}]` : ""),
          description: dev.description,
          qty,
          unit: dev.unit || "szt",
          price: dev.price,
          discount: 0,
        };
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer) return;
        get().updateOffer(offerId, { deviceLines: [...offer.deviceLines, line] });
        set({
          devices: get().devices.map((d) =>
            d.id === deviceId ? { ...d, usageCount: d.usageCount + 1, lastUsedAt: Date.now() } : d,
          ),
        });
      },
      applyTemplate: (offerId, templateId) => {
        const t = get().templates.find((x) => x.id === templateId);
        if (!t) return;
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer) return;

        const templateScope = (t.scope as any[]).map((item) =>
          typeof item === "string"
            ? { id: uid(), text: item, qty: 1, price: 0 }
            : {
                id: uid(),
                text: String(item?.text ?? ""),
                qty: Number(item?.qty ?? 1),
                price: Number(item?.price ?? 0),
              },
        );

        get().updateOffer(offerId, {
          scope: [...offer.scope, ...templateScope],
        });

        for (const code of t.deviceCodes) {
          const d = get().devices.find((x) => x.code === code || x.id === code);
          if (d) get().addDeviceLineFromDevice(offerId, d.id);
        }
      },
    }),
    {
      name: "drsystem-store-v10",
      version: 10,
      migrate: (persistedState) => persistedState as Store,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Korekta literówki: "Odróbny" -> "Odrobny" (zachowuje ręcznie wpisane wartości innych użytkowników)
        if ((state as any).company?.preparedBy === "Michał Odróbny") {
          (state as any).company.preparedBy = "Michał Odrobny";
        }
        // Uzupełnij brakujące dane kontaktowe firmy z nowych domyślnych wartości
        if ((state as any).company) {
          const c = (state as any).company;
          if (!c.phone || c.phone.trim() === "") c.phone = "+48 513 024 922";
          if (!c.email || c.email.trim() === "") c.email = "drsystem@drsystem.pl";
          if (!c.www || c.www.trim() === "") c.www = "www.drsystem.pl";
        }
        if (!Array.isArray((state as any).facilityCompanies)) {
          (state as any).facilityCompanies = SEED_FACILITY_COMPANIES.map((f) => ({ ...f }));
        }
        if (!Array.isArray((state as any).contactPersons)) {
          (state as any).contactPersons = SEED_CONTACT_PERSONS.map((p) => ({ ...p }));
        }
        if (Array.isArray((state as any).offers)) {
          (state as any).offers = (state as any).offers.map((offer: any) => {
            const normalizedScope = Array.isArray(offer.scope)
              ? offer.scope.map((item: any) =>
                  typeof item === "string"
                    ? { id: uid(), text: item, qty: 1, price: 0 }
                    : {
                        ...item,
                        qty: Number(item?.qty ?? 1),
                        price: Number(item?.price ?? 0),
                      },
                )
              : [];
            return {
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
          });
        }
        if (Array.isArray((state as any).templates)) {
          (state as any).templates = (state as any).templates.map((tpl: any) => ({
            ...tpl,
            scope: Array.isArray(tpl.scope)
              ? tpl.scope.map((item: any) =>
                  typeof item === "string"
                    ? { text: item, qty: 1, price: 0 }
                    : {
                        text: String(item?.text ?? ""),
                        qty: Number(item?.qty ?? 1),
                        price: Number(item?.price ?? 0),
                      },
                )
              : [],
          }));
        }
        if (!Array.isArray((state as any).sites)) {
          (state as any).sites = SEED_SITES.map((s) => ({
            ...s,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
        } else {
          for (const s of SEED_SITES) {
            if (!(state as any).sites.some((x: Site) => x.id === s.id || x.name === s.name)) {
              (state as any).sites.push({ ...s, createdAt: Date.now(), updatedAt: Date.now() });
            }
          }
        }
        for (const f of SEED_FACILITY_COMPANIES) {
          if (!state.facilityCompanies.some((x) => x.id === f.id || x.name === f.name)) {
            state.facilityCompanies.push({ ...f });
          }
        }
        for (const p of SEED_CONTACT_PERSONS) {
          if (!state.contactPersons.some((x) => x.id === p.id)) {
            state.contactPersons.push({ ...p });
          }
        }
        // Aktualizacja kategorii do nowego zestawu
        const need = [
          "Esser SSP",
          "Polon-Alfa SSP",
          "Honeywell SSP",
          "SSP inne",
          "Variodyn DSO",
          "Bosch DSO",
          "DSO inne",
          "Materiały instalacyjne",
          "Inne",
        ];
        const cats = Array.isArray(state.categories) ? state.categories : [];
        state.categories = Array.from(new Set([...need, ...cats]));
        // Dosiew brakujących urządzeń (oznaczone jako przykładowe)
        for (const d of SEED_DEVICES) {
          if (!state.devices.some((x) => x.code === d.code || x.name === d.name)) {
            state.devices.push({
              ...d,
              id: uid(),
              usageCount: 0,
              lastUsedAt: null,
              isSample: true,
            });
          }
        }
        for (const t of SEED_TEMPLATES) {
          if (!state.templates.some((x) => x.name === t.name)) {
            state.templates.push({ ...t, id: uid() });
          }
        }
      },
    },
  ),
);

export { uid };
