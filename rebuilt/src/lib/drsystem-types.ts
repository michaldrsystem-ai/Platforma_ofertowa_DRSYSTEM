export type SystemCategory = string;

export const DEFAULT_CATEGORIES: SystemCategory[] = [
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

export interface Device {
  id: string;
  name: string;
  manufacturer: string;
  category: SystemCategory;
  code: string;
  description: string;
  unit: string;
  price: number;
  vatRate: number;
  active: boolean;
  usageCount: number;
  lastUsedAt: number | null;
  favorite?: boolean;
  /** Pozycja wprowadzona jako dane przykładowe — można hurtowo usunąć */
  isSample?: boolean;
}

export type LineKind = "device";

export interface OfferLine {
  id: string;
  kind: LineKind;
  refId?: string;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  price: number;
  discount: number; // percent
}

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected";

export interface ScopeItem {
  id: string;
  text: string;
  qty?: number;
  price?: number;
}

export interface ScopeTemplateItem {
  text: string;
  qty?: number;
  price?: number;
}

export interface OfferTemplate {
  id: string;
  name: string;
  scope: Array<string | ScopeTemplateItem>;
  deviceCodes: string[]; // by device.code or id
}

export interface FacilityCompany {
  id: string;
  name: string;
  address?: string;
  notes?: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  facilityCompanyId?: string;
  clientId?: string;
  siteId?: string;
  notes?: string;
}

export interface ClientLocation {
  id: string;
  name: string; // krótka nazwa, np. "Głuchów"
  objectName?: string; // pełna nazwa obiektu
  address?: string;
  facilityCompanyId?: string;
  contactPersonIds?: string[];
  notes?: string;
}

export type ClientTier = "A" | "B" | "C";

export interface Client {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  locations: ClientLocation[];
  notes?: string;
  /** Segmentacja CRM: A = strategiczni, B = rozwojowi, C = pozostali */
  tier?: ClientTier;
  /** Adresy funkcyjne (faktury, finanse, dyspozytornie itd.) */
  functionalEmails?: string[];
  /** ID domyślnej osoby kontaktowej dla tego klienta */
  defaultContactPersonId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Offer {
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

  benefits?: string[];
  showBenefits?: boolean;
  purpose?: string;
  responsibilities?: string[];
  showPurpose?: boolean;
  showResponsibilities?: boolean;

  createdAt: number;
  updatedAt: number;
}

// ============================================================
// REALNA BAZA KLIENTÓW DRSYSTEM
// (z książki adresowej; oznaczenia A/B/C wg priorytetu CRM)
// ============================================================

export const SEED_FACILITY_COMPANIES: FacilityCompany[] = [
  { id: "fc-spie", name: "SPIE Building Solutions" },
  { id: "fc-zinel", name: "ZINEL" },
  { id: "fc-engie", name: "ENGIE" },
  { id: "fc-elektroklim", name: "Elektro-Klim" },
];

// Pomocnicze id-y kontaktów (stabilne, użyte także w lokalizacjach)
const C = (id: string) => `cp-${id}`;

export const SEED_CONTACT_PERSONS: ContactPerson[] = [
  // SPIE Building Solutions (klient + firma FM)
  {
    id: C("spie-bobrowski"),
    name: "Łukasz Bobrowski",
    email: "lukasz.bobrowski@spie.pl",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-bobrowski2"),
    name: "Łukasz Bobrowski",
    email: "lukasz.bobrowski@spie.com",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-lewandowski"),
    name: "Robert Lewandowski",
    email: "robert.lewandowski@spie.pl",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-lewandowski2"),
    name: "Robert Lewandowski",
    email: "robert.lewandowski@spie.com",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-golebiewski"),
    name: "Rafał Gołębiewski",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-kopyciel"),
    name: "Rafał Kopyciel",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-kmiotek"),
    name: "Grzegorz Kmiotek",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  { id: C("spie-miler"), name: "Dominik Miler", clientId: "cl-spie", facilityCompanyId: "fc-spie" },
  {
    id: C("spie-capiga"),
    name: "Mieczysław Capiga",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  { id: C("spie-pernal"), name: "Jacek Pernal", clientId: "cl-spie", facilityCompanyId: "fc-spie" },
  {
    id: C("spie-walczak"),
    name: "Mateusz Walczak",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-wolczyk"),
    name: "Łukasz Wołczyk",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-zygier"),
    name: "Wojciech Zygier",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },
  {
    id: C("spie-rozynek"),
    name: "Rafał Różynek",
    clientId: "cl-spie",
    facilityCompanyId: "fc-spie",
  },

  // ZALANDO (kontakty wewnętrzne)
  {
    id: C("zal-stepinski"),
    name: "Kacper Stępiński",
    email: "kacper.stempinski@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-koczan"),
    name: "Jan Koczan",
    email: "jan.koczan.external@zalando.de",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-kwiatkowski"),
    name: "Dominik Kwiatkowski",
    email: "dominik.kwiatkowski@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-jablonski"),
    name: "Michał Jabłoński",
    email: "michal.jablonski@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-suzynowicz"),
    name: "Michał Sużynowicz",
    email: "michal.suzynowicz@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-kubiak"),
    name: "Konrad Kubiak",
    email: "k.kubiak@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-psujek"),
    name: "Krzysztof Psujek",
    email: "krzysztof.psujek@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-hewusz"),
    name: "Marek Hewusz",
    email: "marek.hewusz@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-gwiazda"),
    name: "Maciej Gwiazda",
    email: "maciej.gwiazda@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-koralewska"),
    name: "Kamila Koralewska",
    email: "kamila.koralewska@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-kade"),
    name: "Piotr Kade",
    email: "piotr.kade.external@zalando.pl",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-janasik"),
    name: "Patryk Janasik",
    email: "patryk.janasik.external@zalando.de",
    clientId: "cl-zalando",
  },
  {
    id: C("zal-warton"),
    name: "Tomasz Warton",
    email: "tomasz.warton.external@zalando.de",
    clientId: "cl-zalando",
  },

  // VEOLIA
  {
    id: C("veo-suchocki"),
    name: "Michał Suchocki",
    email: "michal.suchocki@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-stankiewicz"),
    name: "Michał Stankiewicz",
    email: "michal.stankiewicz@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-jozwiak"),
    name: "Arkadiusz Jóźwiak",
    email: "arkadiusz.jozwiak@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-kupski"),
    name: "Damian Kupski",
    email: "damian.kupski@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-luciak"),
    name: "Anna Luciak",
    email: "anna.luciak@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-wisniewski"),
    name: "Grzegorz Wiśniewski",
    email: "grzegorz.wisniewski@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-niemczyk"),
    name: "Jacek Niemczyk",
    email: "jacek.niemczyk@veolia.com",
    clientId: "cl-veolia",
  },
  {
    id: C("veo-stozek"),
    name: "Robert Stożek",
    email: "robert.stozek@veolia.com",
    clientId: "cl-veolia",
  },

  // CTP
  {
    id: C("ctp-bilski"),
    name: "Dominik Bilski",
    email: "dominik.bilski@ctp.eu",
    clientId: "cl-ctp",
  },
  {
    id: C("ctp-blaszczyk"),
    name: "Paweł Błaszczyk",
    email: "pawel.blaszczyk@ctp.eu",
    clientId: "cl-ctp",
  },
  {
    id: C("ctp-stroinski"),
    name: "Bartłomiej Stroiński",
    email: "bartlomiej.stroinski@ctp.eu",
    clientId: "cl-ctp",
  },
  { id: C("ctp-wojsz"), name: "Tomasz Wojsz", email: "tomasz.wojsz@ctp.eu", clientId: "cl-ctp" },

  // ZINEL (klient + firma FM)
  {
    id: C("zinel-rzepka"),
    name: "Paweł Rzepka",
    email: "pawel.rzepka@zinel-fm.pl",
    clientId: "cl-zinel",
    facilityCompanyId: "fc-zinel",
  },
  {
    id: C("zinel-bozek"),
    name: "Rafał Bożek",
    email: "rafal.bozek@zinel-fm.pl",
    clientId: "cl-zinel",
    facilityCompanyId: "fc-zinel",
  },

  // ELEKTRO-KLIM (klient + firma FM)
  {
    id: C("ek-urbaniak"),
    name: "Grzegorz Urbaniak",
    email: "grzegorz.urbaniak@elektro-klim.pl",
    clientId: "cl-elektroklim",
    facilityCompanyId: "fc-elektroklim",
  },
  {
    id: C("ek-nadaj"),
    name: "Marcin Nadaj",
    email: "marcin.nadaj@elektro-klim.pl",
    clientId: "cl-elektroklim",
    facilityCompanyId: "fc-elektroklim",
  },
  {
    id: C("ek-augustyniak"),
    name: "Mateusz Augustyniak",
    email: "mateusz.augustyniak@elektro-klim.pl",
    clientId: "cl-elektroklim",
    facilityCompanyId: "fc-elektroklim",
  },
  {
    id: C("ek-szreiber"),
    name: "Tomasz Szreiber",
    email: "tomasz.szreiber@elektro-klim.pl",
    clientId: "cl-elektroklim",
    facilityCompanyId: "fc-elektroklim",
  },

  // DHL Supply Chain
  { id: C("dhl-andrzejczak"), name: "Agata Andrzejczak", clientId: "cl-dhl" },
  { id: C("dhl-rogozinska"), name: "Agnieszka Rogozińska-Kryszewska", clientId: "cl-dhl" },
  { id: C("dhl-kulczycki"), name: "Krzysztof Kulczycki", clientId: "cl-dhl" },
  { id: C("dhl-rozniakowska"), name: "Magdalena Rożniakowska", clientId: "cl-dhl" },
  { id: C("dhl-rybarczyk"), name: "Mariusz Rybarczyk", clientId: "cl-dhl" },
  { id: C("dhl-michalski"), name: "Sebastian Michalski", clientId: "cl-dhl" },
  { id: C("dhl-kade"), name: "Piotr Kade", clientId: "cl-dhl" },

  // ARVATO
  {
    id: C("arv-gesiarz"),
    name: "Tomasz Gęsiarz",
    email: "tomasz.gesiarz@arvato.com",
    clientId: "cl-arvato",
  },
  {
    id: C("arv-masztalerz"),
    name: "Bartosz Masztalerz",
    email: "bartosz.masztalerz@arvato-scs.com",
    clientId: "cl-arvato",
  },

  // ENGIE (klient + firma FM)
  {
    id: C("engie-haniszewski"),
    name: "Błażej Haniszewski",
    email: "blazej.haniszewski@engie.com",
    clientId: "cl-engie",
    facilityCompanyId: "fc-engie",
  },
  {
    id: C("engie-amerek"),
    name: "Julia Amerek",
    email: "julia.amerek@engie.com",
    clientId: "cl-engie",
    facilityCompanyId: "fc-engie",
  },
  {
    id: C("engie-jaworska"),
    name: "Katarzyna Jaworska",
    email: "katarzyna.jaworska@engie.com",
    clientId: "cl-engie",
    facilityCompanyId: "fc-engie",
  },
  {
    id: C("engie-nymka"),
    name: "Paweł Nymka",
    email: "pawel.nymka@engie.com",
    clientId: "cl-engie",
    facilityCompanyId: "fc-engie",
  },
];

export const SEED_CLIENTS: (Omit<Client, "createdAt" | "updatedAt"> & { id: string })[] = [
  {
    id: "cl-zalando",
    name: "Zalando",
    tier: "A",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    functionalEmails: [
      "faktury@zalando.pl",
      "invoices@zalando.de",
      "finance@communication.zalando.com",
      "szc-wfm@zalando.pl",
    ],
    locations: [
      {
        id: "loc-zal-gardno",
        name: "Gardno",
        objectName: "Centrum Logistyczne Zalando Gardno",
        facilityCompanyId: "fc-spie",
        contactPersonIds: [C("spie-bobrowski"), C("spie-lewandowski"), C("zinel-rzepka")],
      },
      {
        id: "loc-zal-gluchow",
        name: "Głuchów",
        objectName: "Centrum Logistyczne Zalando Głuchów",
        facilityCompanyId: "fc-spie",
        contactPersonIds: [C("spie-bobrowski"), C("spie-lewandowski"), C("zinel-bozek")],
      },
      {
        id: "loc-zal-bydgoszcz",
        name: "Bydgoszcz",
        objectName: "Centrum Logistyczne Zalando Bydgoszcz",
      },
      { id: "loc-zal-ameryka", name: "Ameryka", objectName: "Centrum Logistyczne Zalando Ameryka" },
    ],
  },
  {
    id: "cl-veolia",
    name: "Veolia",
    tier: "A",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    locations: [
      { id: "loc-veo-strykow", name: "Gamma Stryków", objectName: "Veolia Gamma Stryków" },
      { id: "loc-veo-komorniki", name: "Komorniki", objectName: "Veolia Komorniki" },
      { id: "loc-veo-gliwice", name: "Gliwice", objectName: "Veolia Gliwice" },
    ],
  },
  {
    id: "cl-ctp",
    name: "CTP",
    tier: "A",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    functionalEmails: ["ctp.ilowa@online.engie.com"],
    locations: [
      {
        id: "loc-ctp-ilowa",
        name: "CTPark Iłowa",
        objectName: "CTPark Iłowa",
        facilityCompanyId: "fc-engie",
      },
    ],
  },
  {
    id: "cl-zinel",
    name: "ZINEL",
    tier: "A",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    functionalEmails: ["faktury@zinel-fm.pl", "pdc217@zinel-fm.pl"],
    locations: [
      {
        id: "loc-zinel-zal-gardno",
        name: "Zalando Gardno",
        objectName: "ZINEL — obsługa Zalando Gardno",
      },
      {
        id: "loc-zinel-zal-gluchow",
        name: "Zalando Głuchów",
        objectName: "ZINEL — obsługa Zalando Głuchów",
      },
    ],
  },
  {
    id: "cl-elektroklim",
    name: "Elektro-Klim",
    tier: "A",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    locations: [],
  },
  {
    id: "cl-spie",
    name: "SPIE Building Solutions",
    tier: "A",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    locations: [],
  },
  {
    id: "cl-dhl",
    name: "DHL Supply Chain",
    tier: "B",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    locations: [],
  },
  {
    id: "cl-arvato",
    name: "Arvato",
    tier: "B",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    locations: [],
  },
  {
    id: "cl-engie",
    name: "ENGIE",
    tier: "B",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    locations: [],
  },
];

// ============================================================
// BAZA OBIEKTÓW (centralna jednostka aplikacji)
// ============================================================

export interface Site {
  id: string;
  name: string; // "Zalando Gardno"
  company: string; // "Zalando"
  clientId?: string; // luźne powiązanie z klientem
  address: string;
  city: string;
  region: string;
  description: string;
  notes: string;
  sspType?: string;
  sspManufacturer?: string;
  dsoType?: string;
  dsoManufacturer?: string;
  smokeSystem?: string;
  vesdaSystem?: string;
  contactIds: string[];
  createdAt: number;
  updatedAt: number;
}

export const SEED_SITES: Omit<Site, "createdAt" | "updatedAt">[] = [
  {
    id: "s-zal-gardno",
    name: "Zalando Gardno",
    company: "Zalando",
    clientId: "cl-zalando",
    address: "",
    city: "Gardno",
    region: "wielkopolskie",
    description: "",
    notes: "",
    contactIds: [C("spie-bobrowski"), C("spie-lewandowski"), C("zinel-rzepka"), C("zal-stepinski")],
  },
  {
    id: "s-zal-gluchow",
    name: "Zalando Głuchów",
    company: "Zalando",
    clientId: "cl-zalando",
    address: "",
    city: "Głuchów",
    region: "łódzkie",
    description: "",
    notes: "",
    contactIds: [C("spie-bobrowski"), C("spie-lewandowski"), C("zinel-bozek"), C("zal-stepinski")],
  },
  {
    id: "s-zal-bydgoszcz",
    name: "Zalando Bydgoszcz",
    company: "Zalando",
    clientId: "cl-zalando",
    address: "",
    city: "Bydgoszcz",
    region: "kujawsko-pomorskie",
    description: "",
    notes: "",
    contactIds: [C("zal-kwiatkowski"), C("zal-jablonski")],
  },
  {
    id: "s-zal-ameryka",
    name: "Zalando Ameryka",
    company: "Zalando",
    clientId: "cl-zalando",
    address: "",
    city: "Ameryka",
    region: "warmińsko-mazurskie",
    description: "",
    notes: "",
    contactIds: [C("zal-suzynowicz"), C("zal-kubiak")],
  },
  {
    id: "s-veo-komorniki",
    name: "Veolia Komorniki",
    company: "Veolia",
    clientId: "cl-veolia",
    address: "",
    city: "Komorniki",
    region: "wielkopolskie",
    description: "",
    notes: "",
    contactIds: [C("veo-suchocki"), C("veo-stankiewicz")],
  },
  {
    id: "s-veo-strykow",
    name: "Veolia Gamma Stryków",
    company: "Veolia",
    clientId: "cl-veolia",
    address: "",
    city: "Stryków",
    region: "łódzkie",
    description: "",
    notes: "",
    contactIds: [C("veo-jozwiak"), C("veo-kupski")],
  },
  {
    id: "s-ctp-ilowa",
    name: "CTPark Iłowa",
    company: "CTP",
    clientId: "cl-ctp",
    address: "",
    city: "Iłowa",
    region: "lubuskie",
    description: "",
    notes: "",
    contactIds: [C("ctp-bilski"), C("ctp-blaszczyk"), C("engie-haniszewski")],
  },
  {
    id: "s-zinel-fm",
    name: "Zinel FM",
    company: "ZINEL",
    clientId: "cl-zinel",
    address: "",
    city: "",
    region: "",
    description: "",
    notes: "",
    contactIds: [C("zinel-rzepka"), C("zinel-bozek")],
  },
  {
    id: "s-elektroklim",
    name: "Elektro-Klim",
    company: "Elektro-Klim",
    clientId: "cl-elektroklim",
    address: "",
    city: "",
    region: "",
    description: "",
    notes: "",
    contactIds: [C("ek-urbaniak"), C("ek-nadaj"), C("ek-augustyniak"), C("ek-szreiber")],
  },
  {
    id: "s-dhl",
    name: "DHL Supply Chain",
    company: "DHL",
    clientId: "cl-dhl",
    address: "",
    city: "",
    region: "",
    description: "",
    notes: "",
    contactIds: [C("dhl-andrzejczak"), C("dhl-kulczycki"), C("dhl-rybarczyk")],
  },
  {
    id: "s-arvato",
    name: "Arvato",
    company: "Arvato",
    clientId: "cl-arvato",
    address: "",
    city: "",
    region: "",
    description: "",
    notes: "",
    contactIds: [C("arv-gesiarz"), C("arv-masztalerz")],
  },
  {
    id: "s-engie",
    name: "ENGIE",
    company: "ENGIE",
    clientId: "cl-engie",
    address: "",
    city: "",
    region: "",
    description: "",
    notes: "",
    contactIds: [C("engie-haniszewski"), C("engie-amerek"), C("engie-jaworska"), C("engie-nymka")],
  },
];

export interface CompanyData {
  name: string;
  street: string;
  city: string;
  nip: string;
  regon: string;
  krs: string;
  phone: string;
  email: string;
  www: string;
  preparedBy: string;
  preparedPhone: string;
  preparedEmail: string;
  logoDataUrl: string | null;
}

export const DEFAULT_COMPANY: CompanyData = {
  name: "DRSYSTEM sp. z o.o.",
  street: "ul. Rokietnicka 6/3",
  city: "62-090 Rostworowo",
  nip: "9231693114",
  regon: "302316590",
  krs: "0000445616",
  phone: "+48 513 024 922",
  email: "drsystem@drsystem.pl",
  www: "www.drsystem.pl",
  preparedBy: "Michał Odrobny",
  preparedPhone: "513 024 922",
  preparedEmail: "michal.odrobny@drsystem.pl",
  logoDataUrl: null,
};

export const DEFAULT_WARRANTY = "60 miesięcy";
export const DEFAULT_VALIDITY = "14 dni";
export const DEFAULT_VAT_NOTE = "Do cen należy doliczyć podatek VAT według obowiązujących stawek.";

export const SEED_DEVICES: Omit<Device, "id" | "usageCount" | "lastUsedAt">[] = [
  // === SSP — uniwersalne ===
  {
    name: "Czujka optyczna dymu",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-CZP-OPT",
    description: "Adresowalna czujka punktowa optyczna dymu",
    unit: "szt",
    price: 240,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Czujka termiczna",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-CZP-TERM",
    description: "Adresowalna czujka termiczna",
    unit: "szt",
    price: 230,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka multisensorowa",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-CZP-MULTI",
    description: "Czujka multisensorowa (dym + temperatura)",
    unit: "szt",
    price: 310,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka O2T",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-CZP-O2T",
    description: "Czujka multisensorowa O2T",
    unit: "szt",
    price: 360,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka liniowa dymu",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-CZP-LIN",
    description: "Liniowa czujka dymu z reflektorem (nadajnik+odbiornik)",
    unit: "kpl",
    price: 3200,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "ROP — ręczny ostrzegacz pożarowy",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-ROP",
    description: "Adresowalny ROP z osłoną",
    unit: "szt",
    price: 220,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Sygnalizator akustyczny",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-SYG-A",
    description: "Sygnalizator akustyczny",
    unit: "szt",
    price: 240,
    vatRate: 23,
    active: true,
  },
  {
    name: "Sygnalizator optyczny",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-SYG-O",
    description: "Sygnalizator optyczny (lampa błyskowa)",
    unit: "szt",
    price: 260,
    vatRate: 23,
    active: true,
  },
  {
    name: "Sygnalizator akustyczno-optyczny",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-SYG-AO",
    description: "Sygnalizator akustyczno-optyczny",
    unit: "szt",
    price: 310,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Moduł wejść",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-MOD-IN",
    description: "Adresowalny moduł wejść",
    unit: "szt",
    price: 380,
    vatRate: 23,
    active: true,
  },
  {
    name: "Moduł wyjść",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-MOD-OUT",
    description: "Adresowalny moduł wyjść",
    unit: "szt",
    price: 380,
    vatRate: 23,
    active: true,
  },
  {
    name: "Moduł sterujący",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-MOD-CTRL",
    description: "Moduł sterujący (np. klapy, oddymianie)",
    unit: "szt",
    price: 420,
    vatRate: 23,
    active: true,
  },
  {
    name: "Izolator zwarć",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-IZ",
    description: "Izolator zwarć pętli dozorowej",
    unit: "szt",
    price: 110,
    vatRate: 23,
    active: true,
  },
  {
    name: "Akumulator 12V/7Ah",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-AKU-7",
    description: "Akumulator żelowy 12V 7Ah",
    unit: "szt",
    price: 95,
    vatRate: 23,
    active: true,
  },
  {
    name: "Akumulator 12V/17Ah",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-AKU-17",
    description: "Akumulator żelowy 12V 17Ah",
    unit: "szt",
    price: 180,
    vatRate: 23,
    active: true,
  },
  {
    name: "Zasilacz pożarowy 24V",
    manufacturer: "—",
    category: "SSP inne",
    code: "SSP-PSU-24",
    description: "Certyfikowany zasilacz pożarowy 24VDC",
    unit: "szt",
    price: 1850,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka pożarowa kompatybilna z istniejącym SSP",
    manufacturer: "—",
    category: "Inne",
    code: "CZP-KOMPAT",
    description: "Dostawa czujki pożarowej kompatybilnej z istniejącym systemem SSP",
    unit: "szt",
    price: 291.2,
    vatRate: 23,
    active: true,
    favorite: true,
  },

  // === ESSER ===
  {
    name: "Czujka IQ8 Quad",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-802374",
    description: "Multisensor IQ8 Quad",
    unit: "szt",
    price: 290,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Czujka IQ8 O2T",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-O2T",
    description: "Czujka multisensorowa O2T (Esser)",
    unit: "szt",
    price: 360,
    vatRate: 23,
    active: true,
  },
  {
    name: "ROP Esser IQ8MCP",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-IQ8MCP",
    description: "Ręczny ostrzegacz pożarowy IQ8MCP",
    unit: "szt",
    price: 320,
    vatRate: 23,
    active: true,
  },
  {
    name: "Centrala Esser FlexES Control",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-FLEXES",
    description: "Centrala sygnalizacji pożarowej FlexES Control",
    unit: "szt",
    price: 24500,
    vatRate: 23,
    active: true,
  },
  {
    name: "Moduł 12R",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-12R",
    description: "Moduł 12 przekaźników (Esser)",
    unit: "szt",
    price: 980,
    vatRate: 23,
    active: true,
  },
  {
    name: "Karta sieciowa Essernet",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-ESSERNET",
    description: "Karta sieciowa Essernet",
    unit: "szt",
    price: 1850,
    vatRate: 23,
    active: true,
  },
  {
    name: "Karta SEI2",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-SEI2",
    description: "Karta interfejsu szeregowego SEI2",
    unit: "szt",
    price: 1450,
    vatRate: 23,
    active: true,
  },
  {
    name: "Mikromoduł sieciowy",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-MIKRO",
    description: "Mikromoduł sieciowy Essernet",
    unit: "szt",
    price: 980,
    vatRate: 23,
    active: true,
  },
  {
    name: "WINMAG — licencja stanowiska",
    manufacturer: "Esser",
    category: "Esser SSP",
    code: "ESS-WINMAG",
    description: "Licencja stanowiska WINMAG",
    unit: "kpl",
    price: 6500,
    vatRate: 23,
    active: true,
  },

  // === HONEYWELL ===
  {
    name: "Centrala Honeywell Notifier",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "HW-NOTIFIER",
    description: "Centrala sygnalizacji pożarowej Notifier",
    unit: "szt",
    price: 19500,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka punktowa Honeywell",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "ESM-DOTM",
    description: "Adresowalna czujka punktowa optyczna",
    unit: "szt",
    price: 180,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "ROP Honeywell",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "ESM-DMN700K",
    description: "Adresowalny ROP",
    unit: "szt",
    price: 220,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Sygnalizator Honeywell",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "ESM-WHSB",
    description: "Sygnalizator akustyczno-optyczny ścienny",
    unit: "szt",
    price: 310,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Moduł sterujący Honeywell",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "HW-MOD",
    description: "Moduł sterujący Honeywell",
    unit: "szt",
    price: 420,
    vatRate: 23,
    active: true,
  },
  {
    name: "Zasilacz Honeywell",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "HW-PSU",
    description: "Certyfikowany zasilacz pożarowy Honeywell",
    unit: "szt",
    price: 1950,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka liniowa FireRay 100",
    manufacturer: "Honeywell",
    category: "Honeywell SSP",
    code: "FFE-FIRERAY-100",
    description: "Liniowa czujka dymu FireRay 100",
    unit: "kpl",
    price: 3200,
    vatRate: 23,
    active: true,
  },

  // === POLON-ALFA ===
  {
    name: "Centrala IGNIS",
    manufacturer: "Polon-Alfa",
    category: "Polon-Alfa SSP",
    code: "PA-IGNIS",
    description: "Centrala sygnalizacji pożarowej IGNIS",
    unit: "szt",
    price: 11500,
    vatRate: 23,
    active: true,
  },
  {
    name: "Centrala POLON 6000",
    manufacturer: "Polon-Alfa",
    category: "Polon-Alfa SSP",
    code: "POLON-6000",
    description: "Centrala sygnalizacji pożarowej POLON 6000",
    unit: "szt",
    price: 14500,
    vatRate: 23,
    active: true,
  },
  {
    name: "Czujka Polon DOR-4046",
    manufacturer: "Polon-Alfa",
    category: "Polon-Alfa SSP",
    code: "DOR-4046",
    description: "Adresowalna czujka optyczna Polon",
    unit: "szt",
    price: 165,
    vatRate: 23,
    active: true,
  },
  {
    name: "ROP Polon",
    manufacturer: "Polon-Alfa",
    category: "Polon-Alfa SSP",
    code: "PA-ROP",
    description: "Ręczny ostrzegacz pożarowy Polon",
    unit: "szt",
    price: 195,
    vatRate: 23,
    active: true,
  },
  {
    name: "Moduł Polon EKS",
    manufacturer: "Polon-Alfa",
    category: "Polon-Alfa SSP",
    code: "PA-EKS",
    description: "Element kontrolno-sterujący Polon",
    unit: "szt",
    price: 380,
    vatRate: 23,
    active: true,
  },

  // === DSO ===
  {
    name: "Głośnik sufitowy 6W",
    manufacturer: "Bosch",
    category: "Bosch DSO",
    code: "LBC-3090/31",
    description: "Głośnik sufitowy 100V/6W",
    unit: "szt",
    price: 240,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Głośnik tubowy",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-TUB",
    description: "Głośnik tubowy 100V do zastosowań zewnętrznych",
    unit: "szt",
    price: 320,
    vatRate: 23,
    active: true,
  },
  {
    name: "Głośnik naścienny",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-NAS",
    description: "Głośnik naścienny 100V",
    unit: "szt",
    price: 280,
    vatRate: 23,
    active: true,
  },
  {
    name: "Wzmacniacz DSO",
    manufacturer: "Bosch",
    category: "Bosch DSO",
    code: "DSO-AMP",
    description: "Wzmacniacz mocy DSO",
    unit: "szt",
    price: 6500,
    vatRate: 23,
    active: true,
  },
  {
    name: "Kontroler INC",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-INC",
    description: "Kontroler stref DSO",
    unit: "szt",
    price: 4200,
    vatRate: 23,
    active: true,
  },
  {
    name: "Stanowisko SCU",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-SCU",
    description: "Stanowisko obsługi DSO (SCU)",
    unit: "szt",
    price: 7800,
    vatRate: 23,
    active: true,
  },
  {
    name: "Mikrofon strażaka",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-MIC",
    description: "Mikrofon strażaka z przyciskami stref",
    unit: "szt",
    price: 2400,
    vatRate: 23,
    active: true,
  },
  {
    name: "Centrala DSO Paviro",
    manufacturer: "Bosch",
    category: "Bosch DSO",
    code: "PAVIRO-PVA-4CR12",
    description: "Centrala dźwiękowego systemu ostrzegawczego",
    unit: "szt",
    price: 18500,
    vatRate: 23,
    active: true,
  },
  {
    name: "Przewód PH90 2x1,5",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-PH90-2x15",
    description: "Przewód głośnikowy odporny ogniowo PH90 2x1,5mm²",
    unit: "m",
    price: 14.5,
    vatRate: 23,
    active: true,
  },
  {
    name: "Przewód HTKSH 1x2x1",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-HTKSH-1x2x1",
    description: "Przewód sygnalizacyjny HTKSH 1x2x1mm²",
    unit: "m",
    price: 8.5,
    vatRate: 23,
    active: true,
  },
  {
    name: "Akumulator DSO 12V/100Ah",
    manufacturer: "—",
    category: "DSO inne",
    code: "DSO-AKU-100",
    description: "Akumulator zasilania awaryjnego DSO",
    unit: "szt",
    price: 850,
    vatRate: 23,
    active: true,
  },

  // === VARIODYN ===
  {
    name: "Centrala Variodyn D1",
    manufacturer: "Honeywell Esser",
    category: "Variodyn DSO",
    code: "VAR-D1",
    description: "Centrala DSO Variodyn D1 (DOM4)",
    unit: "szt",
    price: 22500,
    vatRate: 23,
    active: true,
    favorite: true,
  },
  {
    name: "Wzmacniacz Variodyn DPA",
    manufacturer: "Honeywell Esser",
    category: "Variodyn DSO",
    code: "VAR-DPA-2240",
    description: "Wzmacniacz mocy Variodyn DPA 2x240W",
    unit: "szt",
    price: 7800,
    vatRate: 23,
    active: true,
  },
  {
    name: "Mikrofon DCS Variodyn",
    manufacturer: "Honeywell Esser",
    category: "Variodyn DSO",
    code: "VAR-DCS",
    description: "Mikrofon strażaka DCS dla Variodyn",
    unit: "szt",
    price: 2600,
    vatRate: 23,
    active: true,
  },
  {
    name: "Moduł routingu DOM",
    manufacturer: "Honeywell Esser",
    category: "Variodyn DSO",
    code: "VAR-DOM",
    description: "Moduł routingu wiadomości Variodyn",
    unit: "szt",
    price: 3400,
    vatRate: 23,
    active: true,
  },

  // === INNE / okablowanie i mocowania ===
  {
    name: "Kabel YnTKSY 1x2x0,8",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "KAB-YnTKSY-1x2x08",
    description: "Kabel sygnalizacyjny pożarowy YnTKSY 1x2x0,8",
    unit: "m",
    price: 4.2,
    vatRate: 23,
    active: true,
  },
  {
    name: "Kabel HDGs 3x1,5",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "KAB-HDGS-3x15",
    description: "Kabel ognioodporny HDGs 3x1,5mm²",
    unit: "m",
    price: 18,
    vatRate: 23,
    active: true,
  },
  {
    name: "Kabel PH90 3x2,5",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "KAB-PH90-3x25",
    description: "Kabel ognioodporny PH90 3x2,5mm²",
    unit: "m",
    price: 24,
    vatRate: 23,
    active: true,
  },
  {
    name: "Listwa instalacyjna 25x16",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-LISTWA",
    description: "Listwa instalacyjna PCV 25x16mm",
    unit: "m",
    price: 7,
    vatRate: 23,
    active: true,
  },
  {
    name: "Koryto kablowe 100mm",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-KORYTO-100",
    description: "Koryto kablowe perforowane 100mm",
    unit: "m",
    price: 32,
    vatRate: 23,
    active: true,
  },
  {
    name: "Uchwyt kablowy",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-UCHWYT",
    description: "Uchwyt mocujący kabel",
    unit: "szt",
    price: 1.2,
    vatRate: 23,
    active: true,
  },
  {
    name: "Puszka instalacyjna",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-PUSZKA",
    description: "Puszka instalacyjna z osłoną ogniową",
    unit: "szt",
    price: 18,
    vatRate: 23,
    active: true,
  },
  {
    name: "Konstrukcja wsporcza",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-KONSTR",
    description: "Konstrukcja wsporcza stalowa",
    unit: "kpl",
    price: 280,
    vatRate: 23,
    active: true,
  },
  {
    name: "Światłowód 4J SM",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-FO-4J",
    description: "Światłowód jednomodowy 4J",
    unit: "m",
    price: 12,
    vatRate: 23,
    active: true,
  },
  {
    name: "Switch przemysłowy",
    manufacturer: "—",
    category: "Materiały instalacyjne",
    code: "MAT-SWITCH",
    description: "Switch przemysłowy DIN",
    unit: "szt",
    price: 1450,
    vatRate: 23,
    active: true,
  },
];

export const SEED_TEMPLATES: Omit<OfferTemplate, "id">[] = [
  {
    name: "Wymiana czujek SSP",
    scope: [
      "Demontaż istniejących czujek pożarowych.",
      "Dostawa nowych czujek kompatybilnych z systemem SSP.",
      "Adresowanie urządzeń.",
      "Montaż czujek w istniejących miejscach.",
      "Programowanie centrali SSP.",
      "Wykonanie testów funkcjonalnych.",
      "Sporządzenie dokumentacji serwisowej.",
    ],
    deviceCodes: ["CZP-KOMPAT"],
  },
  {
    name: "Wymiana czujki liniowej",
    scope: [
      "Demontaż nadajnika i odbiornika istniejącej czujki liniowej.",
      "Montaż nowego nadajnika i odbiornika.",
      "Kalibracja toru optycznego.",
      "Programowanie i adresowanie w centrali SSP.",
      "Testy zadymieniowe.",
      "Sporządzenie protokołu z prac.",
    ],
    deviceCodes: ["SSP-CZP-LIN"],
  },
  {
    name: "Wymiana elementów SSP",
    scope: [
      "Wymiana ręcznych ostrzegaczy pożarowych (ROP).",
      "Wymiana sygnalizatorów akustyczno-optycznych.",
      "Wymiana modułów wejść/wyjść i sterujących.",
      "Wymiana zasilaczy pożarowych.",
      "Wymiana akumulatorów zasilania rezerwowego.",
      "Adresowanie i programowanie w centrali SSP.",
      "Testy funkcjonalne wymienionych elementów.",
    ],
    deviceCodes: ["SSP-ROP", "SSP-SYG-AO", "SSP-MOD-CTRL", "SSP-AKU-17"],
  },
  {
    name: "Rozbudowa SSP",
    scope: [
      "Dostawa urządzeń (czujki, ROP, sygnalizatory, moduły).",
      "Wykonanie tras kablowych.",
      "Wykonanie okablowania pętli dozorowych.",
      "Montaż urządzeń.",
      "Adresowanie nowych urządzeń.",
      "Konfiguracja centrali SSP.",
      "Aktualizacja matrycy sterowań pożarowych.",
      "Uruchomienie pętli dozorowych.",
      "Testy funkcjonalne.",
      "Sporządzenie dokumentacji powykonawczej.",
    ],
    deviceCodes: [
      "SSP-CZP-OPT",
      "SSP-ROP",
      "SSP-SYG-AO",
      "SSP-MOD-IN",
      "SSP-MOD-OUT",
      "SSP-MOD-CTRL",
      "SSP-IZ",
      "KAB-YnTKSY-1x2x08",
    ],
  },
  {
    name: "Modernizacja SSP",
    scope: [
      "Analiza stanu istniejącego systemu SSP.",
      "Wymiana wybranych elementów liniowych i modułów.",
      "Przeprogramowanie centrali sygnalizacji pożarowej.",
      "Aktualizacja wizualizacji (np. WINMAG).",
      "Integracja z systemami zewnętrznymi.",
      "Testy funkcjonalne.",
      "Uruchomienie zmodernizowanej części systemu.",
    ],
    deviceCodes: ["ESS-FLEXES", "ESS-WINMAG"],
  },
  {
    name: "Przegląd SSP",
    scope: [
      "Przegląd centrali sygnalizacji pożarowej.",
      "Przegląd czujek pożarowych w pętlach dozorowych.",
      "Przegląd ręcznych ostrzegaczy pożarowych.",
      "Przegląd sygnalizatorów akustyczno-optycznych.",
      "Test alarmowania.",
      "Kontrola akumulatorów zasilania rezerwowego.",
      "Sporządzenie protokołu z przeglądu.",
    ],
    deviceCodes: [],
  },
  {
    name: "Przegląd DSO",
    scope: [
      "Kontrola wzmacniaczy mocy DSO.",
      "Kontrola kontrolerów stref (INC).",
      "Kontrola stanowiska SCU.",
      "Test odtwarzania komunikatów ewakuacyjnych.",
      "Test stref nagłośnienia.",
      "Kontrola akumulatorów zasilania awaryjnego.",
      "Sporządzenie protokołu z przeglądu.",
    ],
    deviceCodes: [],
  },
  {
    name: "Rozbudowa DSO",
    scope: [
      "Dostawa głośników (sufitowych, tubowych, naściennych).",
      "Dostawa wzmacniaczy mocy.",
      "Dostawa kontrolerów stref (INC).",
      "Wykonanie okablowania PH90.",
      "Konfiguracja systemu DSO.",
      "Aktualizacja komunikatów ewakuacyjnych.",
      "Testy stref nagłośnienia.",
    ],
    deviceCodes: ["LBC-3090/31", "DSO-TUB", "DSO-AMP", "DSO-INC", "DSO-SCU", "DSO-PH90-2x15"],
  },
  {
    name: "Programowanie centrali SSP",
    scope: [
      "Analiza obecnej konfiguracji centrali.",
      "Modyfikacja programu sterowań.",
      "Aktualizacja matrycy sterowań pożarowych.",
      "Wykonanie testów funkcjonalnych.",
      "Sporządzenie dokumentacji zmian.",
    ],
    deviceCodes: [],
  },
  {
    name: "Uruchomienie systemu SSP",
    scope: [
      "Sprawdzenie poprawności montażu.",
      "Konfiguracja centrali sygnalizacji pożarowej.",
      "Adresowanie elementów pętli dozorowych.",
      "Uruchomienie systemu.",
      "Testy funkcjonalne i testy sterowań.",
      "Sporządzenie dokumentacji powykonawczej.",
    ],
    deviceCodes: [],
  },
  {
    name: "Prace serwisowe awaryjne",
    scope: [
      "Przyjazd awaryjny na obiekt.",
      "Diagnostyka usterki systemu.",
      "Identyfikacja przyczyny awarii.",
      "Usunięcie awarii / wymiana uszkodzonych urządzeń.",
      "Testy poprawności działania.",
      "Sporządzenie raportu serwisowego.",
    ],
    deviceCodes: [],
  },
];

export function calcLine(l: OfferLine): { net: number; afterDiscount: number } {
  const net = (Number(l.qty) || 0) * (Number(l.price) || 0);
  const afterDiscount = net * (1 - (Number(l.discount) || 0) / 100);
  return { net, afterDiscount };
}

export function calcTotals(offer: Offer) {
  const dev = offer.deviceLines.reduce((s, l) => s + calcLine(l).afterDiscount, 0);
  const scope = offer.scope.reduce(
    (s, item) => s + Number(item.qty ?? 1) * Number(item.price ?? 0),
    0,
  );
  return { dev, scope, total: dev + scope };
}
