import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/drsystem-store";
import { calcTotals, type ContactPerson, type Site } from "@/lib/drsystem-types";
import { Pencil, Plus, Save, Search, Sparkles, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sites")({
  head: () => ({ meta: [{ title: "DRSYSTEM — Obiekty" }] }),
  component: SitesPage,
});

function emptySite(): Partial<Site> {
  return {
    name: "",
    company: "",
    address: "",
    city: "",
    region: "",
    description: "",
    notes: "",
    contactIds: [],
  };
}

function SitesPage() {
  const navigate = useNavigate();
  const sites = useStore((s) => s.sites);
  const contacts = useStore((s) => s.contactPersons);
  const upsertSite = useStore((s) => s.upsertSite);
  const deleteSite = useStore((s) => s.deleteSite);
  const linkContact = useStore((s) => s.linkContactToSite);
  const unlinkContact = useStore((s) => s.unlinkContactFromSite);
  const upsertContact = useStore((s) => s.upsertContactPerson);
  const deleteContact = useStore((s) => s.deleteContactPerson);
  const offers = useStore((s) => s.offers);

  const [q, setQ] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Site>>(emptySite());
  const [open, setOpen] = useState(false);

  const [addContactName, setAddContactName] = useState("");
  const [addContactEmail, setAddContactEmail] = useState("");
  const [addContactPhone, setAddContactPhone] = useState("");

  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<{ name: string; email: string; phone: string }>({
    name: "",
    email: "",
    phone: "",
  });

  const companies = useMemo(
    () => Array.from(new Set(sites.map((s) => s.company).filter(Boolean))).sort(),
    [sites],
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return sites
      .filter((s) => !companyFilter || s.company === companyFilter)
      .filter(
        (s) =>
          !qq || [s.name, s.company, s.city, s.address].some((x) => x?.toLowerCase().includes(qq)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sites, q, companyFilter]);

  const stats = (siteId: string) => {
    const oo = offers.filter((o) => o.siteId === siteId);
    const last = oo.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const total = oo.reduce((s, o) => s + calcTotals(o).total, 0);
    return { count: oo.length, last, total };
  };

  // Zawsze bierzemy aktualną wersję obiektu z bazy (świeże contactIds).
  const editing = useMemo(
    () => (editId ? (sites.find((s) => s.id === editId) ?? null) : null),
    [editId, sites],
  );

  // Synchronizuj draft z aktualnym stanem obiektu w bazie,
  // ale nie nadpisuj pól tekstowych, które użytkownik mógł właśnie edytować.
  useEffect(() => {
    if (!editing) return;
    setDraft((prev) => ({
      ...editing,
      // Zachowaj edytowane przez użytkownika wartości pól tekstowych.
      name: prev.name ?? editing.name,
      company: prev.company ?? editing.company,
      address: prev.address ?? editing.address,
      city: prev.city ?? editing.city,
      region: prev.region ?? editing.region,
      description: prev.description ?? editing.description,
      notes: prev.notes ?? editing.notes,
      sspType: prev.sspType ?? editing.sspType,
      sspManufacturer: prev.sspManufacturer ?? editing.sspManufacturer,
      dsoType: prev.dsoType ?? editing.dsoType,
      dsoManufacturer: prev.dsoManufacturer ?? editing.dsoManufacturer,
      smokeSystem: prev.smokeSystem ?? editing.smokeSystem,
      vesdaSystem: prev.vesdaSystem ?? editing.vesdaSystem,
      // contactIds zawsze prosto z bazy — to jest źródło prawdy.
      contactIds: editing.contactIds,
    }));
  }, [editing]);

  const openEdit = (s: Site | null) => {
    if (s) {
      setEditId(s.id);
      setDraft({ ...s });
    } else {
      setEditId(null);
      setDraft(emptySite());
    }
    setEditingContactId(null);
    setContactDraft({ name: "", email: "", phone: "" });
    setAddContactName("");
    setAddContactEmail("");
    setAddContactPhone("");
    setOpen(true);
  };

  const save = () => {
    if (!draft.name?.trim()) {
      toast.error("Podaj nazwę obiektu");
      return;
    }
    // Zapisujemy WYŁĄCZNIE pola obiektu, bez dotykania contactIds —
    // contactIds są zarządzane przez dedykowane akcje (link/unlink).
    const currentContactIds = editing?.contactIds ?? draft.contactIds ?? [];
    const saved = upsertSite({
      ...draft,
      id: editId || undefined,
      contactIds: currentContactIds,
    });
    toast.success(`Obiekt „${saved.name}” zapisany`);
    setOpen(false);
    setEditId(null);
  };

  const startOffer = (siteId: string) => {
    try {
      sessionStorage.setItem("drsystem-pending-site", siteId);
    } catch {}
    navigate({ to: "/new" });
  };

  const addExistingContact = (contactId: string) => {
    if (!editing) return;
    linkContact(editing.id, contactId);
    toast.success("Kontakt dodany do obiektu");
  };

  const addNewContact = () => {
    if (!editing || !addContactName.trim()) return;
    const c = upsertContact({
      id: "",
      name: addContactName.trim(),
      email: addContactEmail.trim() || undefined,
      phone: addContactPhone.trim() || undefined,
    });
    linkContact(editing.id, c.id);
    setAddContactName("");
    setAddContactEmail("");
    setAddContactPhone("");
    toast.success(`Kontakt „${c.name}” dodany`);
  };

  const startEditContact = (c: ContactPerson) => {
    setEditingContactId(c.id);
    setContactDraft({ name: c.name, email: c.email || "", phone: c.phone || "" });
  };

  const cancelEditContact = () => {
    setEditingContactId(null);
    setContactDraft({ name: "", email: "", phone: "" });
  };

  const saveEditContact = () => {
    if (!editingContactId || !contactDraft.name.trim()) {
      toast.error("Podaj imię i nazwisko");
      return;
    }
    const existing = contacts.find((x) => x.id === editingContactId);
    if (!existing) return;
    upsertContact({
      ...existing,
      name: contactDraft.name.trim(),
      email: contactDraft.email.trim() || undefined,
      phone: contactDraft.phone.trim() || undefined,
    });
    toast.success("Kontakt zaktualizowany");
    cancelEditContact();
  };

  const removeContactFromSite = (cid: string) => {
    if (!editing) return;
    unlinkContact(editing.id, cid);
    toast.success("Kontakt odpięty od obiektu");
  };

  const fullyDeleteContact = (cid: string) => {
    if (!confirm("Usunąć kontakt z książki adresowej? Zniknie też z innych obiektów i ofert."))
      return;
    deleteContact(cid);
    toast.success("Kontakt usunięty z bazy");
  };

  return (
    <AppShell
      title="Obiekty"
      actions={
        <Button onClick={() => openEdit(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nowy obiekt
        </Button>
      }
    >
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Szukaj obiektu, firmy, miasta…"
              className="pl-8"
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Wszystkie firmy</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Badge variant="outline">{filtered.length} obiektów</Badge>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => {
          const st = stats(s.id);
          return (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold leading-tight">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.company}
                    {s.city ? ` · ${s.city}` : ""}
                  </div>
                </div>
                <Badge variant="secondary">{s.contactIds.length} kont.</Badge>
              </div>
              {s.address && <div className="mt-2 text-xs text-muted-foreground">{s.address}</div>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Ofert</div>
                  <div className="font-semibold">{st.count}</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Ostatnia</div>
                  <div className="font-semibold">{st.last ? st.last.date : "—"}</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Wartość</div>
                  <div className="font-semibold">
                    {st.total
                      ? st.total.toLocaleString("pl-PL", { maximumFractionDigits: 0 }) + " zł"
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                  Szczegóły
                </Button>
                <Button size="sm" className="gap-1" onClick={() => startOffer(s.id)}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Nowa oferta
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Obiekt: ${editing.name}` : "Nowy obiekt"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2 py-2">
            <div className="space-y-1.5">
              <Label>Nazwa obiektu *</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Firma</Label>
              <Input
                value={draft.company || ""}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Adres</Label>
              <Input
                value={draft.address || ""}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Miasto</Label>
              <Input
                value={draft.city || ""}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Województwo</Label>
              <Input
                value={draft.region || ""}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Opis obiektu</Label>
              <Textarea
                rows={2}
                value={draft.description || ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Uwagi</Label>
              <Textarea
                rows={2}
                value={draft.notes || ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 mt-2 border-t pt-3">
              <div className="mb-2 text-sm font-semibold">Pola techniczne</div>
            </div>
            <div className="space-y-1.5">
              <Label>Typ SSP</Label>
              <Input
                value={draft.sspType || ""}
                onChange={(e) => setDraft({ ...draft, sspType: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Producent SSP</Label>
              <Input
                value={draft.sspManufacturer || ""}
                onChange={(e) => setDraft({ ...draft, sspManufacturer: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Typ DSO</Label>
              <Input
                value={draft.dsoType || ""}
                onChange={(e) => setDraft({ ...draft, dsoType: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Producent DSO</Label>
              <Input
                value={draft.dsoManufacturer || ""}
                onChange={(e) => setDraft({ ...draft, dsoManufacturer: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>System oddymiania</Label>
              <Input
                value={draft.smokeSystem || ""}
                onChange={(e) => setDraft({ ...draft, smokeSystem: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>System VESDA</Label>
              <Input
                value={draft.vesdaSystem || ""}
                onChange={(e) => setDraft({ ...draft, vesdaSystem: e.target.value })}
              />
            </div>
          </div>

          {editing && (
            <div className="border-t pt-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Kontakty przypisane do obiektu
                </span>
                <Badge variant="secondary">{editing.contactIds.length}</Badge>
              </div>

              <div className="space-y-1.5">
                {editing.contactIds.length === 0 && (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    Brak kontaktów. Dodaj nowy poniżej albo przypisz istniejący.
                  </div>
                )}
                {editing.contactIds.map((cid) => {
                  const c = contacts.find((x) => x.id === cid);
                  if (!c) return null;
                  const isEditing = editingContactId === cid;
                  return (
                    <div key={cid} className="rounded-md border bg-background px-3 py-2 text-sm">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid gap-2 md:grid-cols-3">
                            <Input
                              autoFocus
                              placeholder="Imię i nazwisko"
                              value={contactDraft.name}
                              onChange={(e) =>
                                setContactDraft({ ...contactDraft, name: e.target.value })
                              }
                            />
                            <Input
                              placeholder="E-mail"
                              value={contactDraft.email}
                              onChange={(e) =>
                                setContactDraft({ ...contactDraft, email: e.target.value })
                              }
                            />
                            <Input
                              placeholder="Telefon"
                              value={contactDraft.phone}
                              onChange={(e) =>
                                setContactDraft({ ...contactDraft, phone: e.target.value })
                              }
                            />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] text-muted-foreground">
                              Edycja zapisuje się w książce adresowej — zmiana będzie widoczna we
                              wszystkich obiektach i ofertach.
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={cancelEditContact}>
                                <X className="mr-1 h-3.5 w-3.5" /> Anuluj
                              </Button>
                              <Button size="sm" onClick={saveEditContact}>
                                <Save className="mr-1 h-3.5 w-3.5" /> Zapisz
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.email || "brak e-maila"} · {c.phone || "brak telefonu"}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditContact(c)}
                              className="gap-1"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edytuj
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeContactFromSite(cid)}
                              title="Odepnij od tego obiektu"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => fullyDeleteContact(cid)}
                              title="Usuń całkowicie z bazy"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-md border bg-muted/30 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dodaj nowy kontakt
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input
                    placeholder="Imię i nazwisko"
                    value={addContactName}
                    onChange={(e) => setAddContactName(e.target.value)}
                  />
                  <Input
                    placeholder="E-mail"
                    value={addContactEmail}
                    onChange={(e) => setAddContactEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Telefon"
                    value={addContactPhone}
                    onChange={(e) => setAddContactPhone(e.target.value)}
                  />
                  <Button onClick={addNewContact} disabled={!addContactName.trim()}>
                    Dodaj
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs">Lub przypisz istniejący kontakt z książki:</Label>
                <select
                  className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value=""
                  onChange={(e) => e.target.value && addExistingContact(e.target.value)}
                >
                  <option value="">— wybierz —</option>
                  {contacts
                    .filter((c) => !editing.contactIds.includes(c.id))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.email ? ` · ${c.email}` : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {editing && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Usunąć obiekt?")) {
                    deleteSite(editing.id);
                    setOpen(false);
                  }
                }}
              >
                Usuń obiekt
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Zamknij
            </Button>
            <Button onClick={save}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
