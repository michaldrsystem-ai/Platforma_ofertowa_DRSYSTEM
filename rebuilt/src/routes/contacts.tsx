import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/drsystem-store";
import type { ContactPerson } from "@/lib/drsystem-types";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "DRSYSTEM — Książka adresowa" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const contacts = useStore((s) => s.contactPersons);
  const sites = useStore((s) => s.sites);
  const offers = useStore((s) => s.offers);
  const upsert = useStore((s) => s.upsertContactPerson);
  const remove = useStore((s) => s.deleteContactPerson);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<ContactPerson>>({ name: "", email: "", phone: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return [...contacts]
      .filter((c) => !qq || [c.name, c.email, c.phone].some((x) => x?.toLowerCase().includes(qq)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, q]);

  const contactInfo = (cid: string) => {
    const linkedSites = sites.filter((s) => s.contactIds.includes(cid));
    const linkedOffers = offers.filter((o) => o.contactPersonId === cid);
    const last = linkedOffers.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return { linkedSites, count: linkedOffers.length, last };
  };

  const openEdit = (c: ContactPerson | null) => {
    if (c) { setEditId(c.id); setDraft({ ...c }); }
    else { setEditId(null); setDraft({ name: "", email: "", phone: "", notes: "" }); }
    setOpen(true);
  };

  const save = () => {
    if (!draft.name?.trim()) return toast.error("Podaj imię i nazwisko");
    upsert({
      id: editId || "",
      name: draft.name!.trim(),
      email: draft.email?.trim() || undefined,
      phone: draft.phone?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
    });
    toast.success("Zapisano");
    setOpen(false);
  };

  return (
    <AppShell title="Książka adresowa" actions={<Button onClick={() => openEdit(null)} className="gap-2"><Plus className="h-4 w-4" />Nowy kontakt</Button>}>
      <Card className="mb-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj…" className="pl-8" />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{filtered.length} kontaktów</div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const info = contactInfo(c.id);
          return (
            <Card key={c.id} className="p-4">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.email || "—"}</div>
              <div className="text-xs text-muted-foreground">{c.phone || "—"}</div>
              {info.linkedSites.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {info.linkedSites.slice(0, 4).map((s) => <Badge key={s.id} variant="secondary" className="text-[10px]">{s.name}</Badge>)}
                  {info.linkedSites.length > 4 && <Badge variant="outline" className="text-[10px]">+{info.linkedSites.length - 4}</Badge>}
                </div>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/40 p-1.5"><span className="text-muted-foreground">Ofert:</span> <strong>{info.count}</strong></div>
                <div className="rounded-md bg-muted/40 p-1.5"><span className="text-muted-foreground">Ostatnia:</span> <strong>{info.last?.date || "—"}</strong></div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edytuj</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Usunąć kontakt?")) remove(c.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edytuj kontakt" : "Nowy kontakt"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Imię i nazwisko *</Label><Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Telefon</Label><Input value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Notatki</Label><Textarea rows={3} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Anuluj</Button>
            <Button onClick={save}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
