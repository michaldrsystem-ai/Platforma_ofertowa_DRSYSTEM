import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/drsystem-store";
import type { Device } from "@/lib/drsystem-types";
import { Plus, Pencil, Trash2, Star, Search, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "DRSYSTEM — Biblioteka urządzeń" }] }),
  component: DevicesPage,
});

const blank = (cat: string): Device => ({
  id: "",
  name: "",
  manufacturer: "",
  category: cat,
  code: "",
  description: "",
  unit: "szt",
  price: 0,
  vatRate: 23,
  active: true,
  usageCount: 0,
  lastUsedAt: null,
});

function DevicesPage() {
  const devices = useStore((s) => s.devices);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const upsertDevice = useStore((s) => s.upsertDevice);
  const deleteDevice = useStore((s) => s.deleteDevice);
  const toggleFav = useStore((s) => s.toggleDeviceFavorite);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [editing, setEditing] = useState<Device | null>(null);

  const favorites = useMemo(() => devices.filter((d) => d.favorite && d.active), [devices]);
  const recent = useMemo(
    () => [...devices].filter((d) => d.lastUsedAt).sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)).slice(0, 8),
    [devices],
  );

  const filtered = devices.filter((d) => {
    if (cat !== "all" && d.category !== cat) return false;
    const t = q.toLowerCase().trim();
    if (!t) return true;
    return (d.name + " " + d.code + " " + d.manufacturer + " " + d.description).toLowerCase().includes(t);
  });

  return (
    <AppShell
      title="Biblioteka urządzeń"
      actions={
        <>
          <ImportDialog />
          <Button onClick={() => setEditing(blank(categories[0] ?? "Inne"))} className="gap-2">
            <Plus className="h-4 w-4" /> Nowe urządzenie
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {favorites.length > 0 && (
          <Card className="p-4">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">⭐ Najczęściej używane</div>
            <div className="flex flex-wrap gap-2">
              {favorites.map((d) => (
                <Badge key={d.id} variant="outline" className="cursor-pointer" onClick={() => setEditing(d)}>
                  <Star className="mr-1 h-3 w-3 fill-current text-primary" /> {d.name}
                </Badge>
              ))}
            </div>
          </Card>
        )}
        {recent.length > 0 && (
          <Card className="p-4">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Ostatnio używane</div>
            <div className="flex flex-wrap gap-2">
              {recent.map((d) => (
                <Badge key={d.id} variant="secondary" className="cursor-pointer" onClick={() => setEditing(d)}>{d.name}</Badge>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj urządzenia, kodu, producenta..." />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie cenniki</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <AddCategoryButton onAdd={addCategory} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="w-8 py-2"></th>
                  <th className="py-2">Nazwa</th>
                  <th className="py-2">Producent</th>
                  <th className="py-2">Cennik</th>
                  <th className="py-2">Kod</th>
                  <th className="py-2">Jm</th>
                  <th className="py-2 text-right">Cena netto</th>
                  <th className="py-2 text-right">Użycia</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className={`border-b ${!d.active ? "opacity-50" : ""}`}>
                    <td className="py-2">
                      <button onClick={() => toggleFav(d.id)} title="Najczęściej używane">
                        <Star className={`h-4 w-4 ${d.favorite ? "fill-current text-primary" : "text-muted-foreground"}`} />
                      </button>
                    </td>
                    <td className="py-2 font-medium">{d.name}</td>
                    <td className="py-2 text-muted-foreground">{d.manufacturer}</td>
                    <td className="py-2"><Badge variant="secondary">{d.category}</Badge></td>
                    <td className="py-2 font-mono text-xs">{d.code}</td>
                    <td className="py-2">{d.unit}</td>
                    <td className="py-2 text-right tabular-nums">{d.price.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right text-muted-foreground">{d.usageCount}</td>
                    <td className="py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(d)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Usunąć?") && deleteDevice(d.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Brak urządzeń.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <DeviceEditDialog
        device={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSave={(d) => {
          upsertDevice(d);
          setEditing(null);
          toast.success("Zapisano");
        }}
      />
    </AppShell>
  );
}

function AddCategoryButton({ onAdd }: { onAdd: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nowy cennik</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Dodaj cennik / system</DialogTitle></DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Schrack SSP" />
        <DialogFooter>
          <Button onClick={() => { onAdd(name.trim()); setName(""); setOpen(false); }}>Dodaj</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeviceEditDialog({
  device,
  categories,
  onClose,
  onSave,
}: {
  device: Device | null;
  categories: string[];
  onClose: () => void;
  onSave: (d: Device) => void;
}) {
  const [d, setD] = useState<Device | null>(device);
  // sync when prop changes
  useMemo(() => setD(device), [device]);
  if (!d) return null;

  return (
    <Dialog open={!!device} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{d.id ? "Edytuj urządzenie" : "Nowe urządzenie"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nazwa"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
          <Field label="Producent"><Input value={d.manufacturer} onChange={(e) => setD({ ...d, manufacturer: e.target.value })} /></Field>
          <Field label="Cennik / system">
            <Select value={d.category} onValueChange={(v) => setD({ ...d, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Kod / indeks"><Input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} /></Field>
          <Field label="Jednostka"><Input value={d.unit} onChange={(e) => setD({ ...d, unit: e.target.value })} /></Field>
          <Field label="Cena netto"><Input type="number" step="0.01" value={d.price} onChange={(e) => setD({ ...d, price: Number(e.target.value) })} /></Field>
          <Field label="Stawka VAT (%)"><Input type="number" value={d.vatRate} onChange={(e) => setD({ ...d, vatRate: Number(e.target.value) })} /></Field>
          <Field label="Aktywne">
            <Select value={String(d.active)} onValueChange={(v) => setD({ ...d, active: v === "true" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Tak</SelectItem>
                <SelectItem value="false">Nie</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2">
            <Field label="Opis"><Textarea rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={() => onSave(d)}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mapping, setMapping] = useState({
    name: "",
    code: "",
    manufacturer: "",
    description: "",
    unit: "",
    price: "",
  });
  const categories = useStore((s) => s.categories);
  const [category, setCategory] = useState(categories[0] ?? "Inne");
  const importDevices = useStore((s) => s.importDevices);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (data.length === 0) {
      toast.error("Plik jest pusty");
      return;
    }
    const hdrs = Object.keys(data[0]);
    setHeaders(hdrs);
    setRows(data);
    const find = (...keys: string[]) => hdrs.find((h) => keys.some((k) => h.toLowerCase().includes(k))) ?? "";
    setMapping({
      name: find("nazwa", "name", "opis", "produkt"),
      code: find("kod", "indeks", "symbol", "code", "sku"),
      manufacturer: find("producent", "manufacturer"),
      description: find("opis długi", "description", "uwagi"),
      unit: find("jednostka", "jm", "unit"),
      price: find("cena", "price", "netto"),
    });
  };

  const reset = () => {
    setRows([]);
    setHeaders([]);
    setShowAdvanced(false);
  };

  const doImport = () => {
    if (!mapping.name || !mapping.price) {
      toast.error("Wskaż przynajmniej kolumnę nazwy i ceny");
      return;
    }
    const parsed = rows
      .map((r) => ({
        name: String(r[mapping.name] ?? "").trim(),
        code: String(mapping.code ? r[mapping.code] ?? "" : "").trim(),
        manufacturer: String(mapping.manufacturer ? r[mapping.manufacturer] ?? "" : "").trim() || category,
        description: String(mapping.description ? r[mapping.description] ?? "" : "").trim(),
        unit: String(mapping.unit ? r[mapping.unit] ?? "szt" : "szt").trim() || "szt",
        price: Number(String(r[mapping.price]).replace(/\s/g, "").replace(",", ".")) || 0,
        category,
        vatRate: 23,
        active: true,
      }))
      .filter((r) => r.name);
    const added = importDevices(parsed, category);
    toast.success(`Zaimportowano ${parsed.length} pozycji (${added} nowych)`);
    reset();
    setOpen(false);
  };

  const quickFields: Array<["code" | "name" | "price", string, boolean]> = [
    ["code", "Symbol / indeks", false],
    ["name", "Nazwa urządzenia", true],
    ["price", "Cena netto", true],
  ];
  const advancedFields: Array<["manufacturer" | "unit" | "description", string]> = [
    ["manufacturer", "Producent (domyślnie: nazwa cennika)"],
    ["unit", "Jednostka (domyślnie: szt.)"],
    ["description", "Opis (domyślnie: pusty)"],
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Importuj cennik</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Importuj cennik (Excel / CSV)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Plik (.xlsx, .xls, .csv)</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
          {headers.length > 0 && (
            <>
              <div>
                <Label className="text-xs">Cennik / system</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {quickFields.map(([k, label, req]) => (
                  <div key={k}>
                    <Label className="text-xs">{label}{req ? " *" : ""}</Label>
                    <Select value={mapping[k]} onValueChange={(v) => setMapping({ ...mapping, [k]: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Ukryj" : "Pokaż"} ustawienia zaawansowane
              </Button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed p-3">
                  {advancedFields.map(([k, label]) => (
                    <div key={k}>
                      <Label className="text-xs">{label}</Label>
                      <Select value={mapping[k] || "__none__"} onValueChange={(v) => setMapping({ ...mapping, [k]: v === "__none__" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— (użyj domyślnej)</SelectItem>
                          {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">Wczytano {rows.length} wierszy. Duplikaty (po kodzie + cenniku) zaktualizują cenę.</p>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Anuluj</Button>
          <Button onClick={doImport} disabled={!rows.length}>Importuj</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

