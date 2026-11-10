import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/drsystem-store";
import type { OfferLine } from "@/lib/drsystem-types";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/montaz")({
  component: MontazPage,
});

interface Row {
  id: string;
  name: string;
  qty: number;
  unit: string;
  cost: number; // koszt wewnętrzny całej pozycji (od dołu), nie trafia do oferty
}

const uid = () => Math.random().toString(36).slice(2, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const START: Row[] = [
  { id: uid(), name: "Materiały instalacyjne (kable, korytka, osprzęt)", qty: 1, unit: "kpl.", cost: 0 },
  { id: uid(), name: "Okablowanie, część łatwa", qty: 1, unit: "kpl.", cost: 0 },
  { id: uid(), name: "Okablowanie, część trudna", qty: 1, unit: "kpl.", cost: 0 },
  { id: uid(), name: "Montaż ROP", qty: 1, unit: "kpl.", cost: 0 },
  { id: uid(), name: "Konstrukcje wsporcze", qty: 1, unit: "kpl.", cost: 0 },
  { id: uid(), name: "Programowanie, konfiguracja i testy", qty: 1, unit: "kpl.", cost: 0 },
  {
    id: uid(),
    name: "Dokumentacja powykonawcza z aktualizacją matrycy i scenariusza",
    qty: 1,
    unit: "kpl.",
    cost: 0,
  },
];

function MontazPage() {
  const navigate = useNavigate();
  const createOffer = useStore((s) => s.createOffer);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [target, setTarget] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<Row[]>(START);

  const costSum = useMemo(() => rows.reduce((a, r) => a + (r.cost || 0), 0), [rows]);

  // Rozkład docelowej kwoty proporcjonalnie do kosztów; ostatnia pozycja bierze resztę z zaokrągleń.
  const distributed = useMemo(() => {
    const active = rows.filter((r) => r.cost > 0);
    let left = target;
    return rows.map((r) => {
      if (r.cost <= 0 || costSum <= 0 || target <= 0) return 0;
      const isLast = r === active[active.length - 1];
      const v = isLast ? r2(left) : r2((target * r.cost) / costSum);
      left = r2(left - v);
      return v;
    });
  }, [rows, costSum, target]);

  const margin = target - costSum;
  const upd = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const create = () => {
    if (target <= 0 || costSum <= 0) {
      toast.error("Podaj kwotę docelową i koszty pozycji");
      return;
    }
    const lines: OfferLine[] = rows
      .map((r, i) => ({ r, v: distributed[i] }))
      .filter((x) => x.v > 0)
      .map(({ r, v }) => ({
        id: uid(),
        kind: "device" as const,
        name: r.name,
        qty: r.qty || 1,
        unit: r.unit || "kpl.",
        price: r2(v / (r.qty || 1)),
        discount: 0,
      }));
    const note =
      `Duży montaż, kalkulacja wewnętrzna (nie dla klienta). Koszt od dołu: ${fmt(costSum)} zł, ` +
      `kwota oferty: ${fmt(target)} zł, narzut: ${fmt(margin)} zł (${costSum ? ((margin / costSum) * 100).toFixed(1) : 0}%).\n` +
      rows.map((r) => `- ${r.name}: koszt ${fmt(r.cost)} zł`).join("\n");
    const offer = createOffer({
      clientName: client,
      investmentName: title,
      locationAddress: location,
      deviceLines: lines,
      deviceWarranty: "60 miesięcy",
      workmanshipWarranty: "24 miesiące",
      paymentTerms: "14 dni",
      validity: `do 31.12.${year}`,
      internalNote: note,
    });
    toast.success("Oferta utworzona");
    navigate({ to: "/new", search: { id: offer.id } as never });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Kalkulator dużego montażu</h1>
          <p className="text-sm text-muted-foreground">
            Wpisz koszty od dołu i kwotę docelową. Kwota zostanie rozłożona na pozycje oferty
            proporcjonalnie do kosztów. Koszty zostają tylko w notatce wewnętrznej, klient ich nie widzi.
          </p>
        </div>

        <Card className="grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <Label>Tytuł oferty</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Klient</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div>
            <Label>Lokalizacja</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kwota docelowa netto (zł)</Label>
              <Input
                type="number"
                value={target || ""}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Ważna do końca roku</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <div className="hidden grid-cols-[1fr_70px_70px_120px_120px_36px] gap-2 text-xs text-muted-foreground sm:grid">
            <span>Pozycja</span>
            <span>Ilość</span>
            <span>Jedn.</span>
            <span>Koszt (zł)</span>
            <span>W ofercie (zł)</span>
            <span />
          </div>
          {rows.map((r, i) => (
            <div key={r.id} className="grid gap-2 sm:grid-cols-[1fr_70px_70px_120px_120px_36px]">
              <Input value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} />
              <Input
                type="number"
                value={r.qty}
                onChange={(e) => upd(r.id, { qty: Number(e.target.value) })}
              />
              <Input value={r.unit} onChange={(e) => upd(r.id, { unit: e.target.value })} />
              <Input
                type="number"
                value={r.cost || ""}
                onChange={(e) => upd(r.id, { cost: Number(e.target.value) })}
              />
              <div className="flex items-center text-sm tabular-nums">{fmt(distributed[i])}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((rs) => [...rs, { id: uid(), name: "", qty: 1, unit: "kpl.", cost: 0 }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Dodaj pozycję
          </Button>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
          <div className="space-y-1">
            <div>Koszt od dołu: <b>{fmt(costSum)} zł</b></div>
            <div>
              Narzut: <b className={margin < 0 ? "text-destructive" : ""}>{fmt(margin)} zł</b>
              {costSum > 0 && ` (${((margin / costSum) * 100).toFixed(1)}%)`}
            </div>
            <div className="text-muted-foreground">
              Gwarancja 60 mies. na urządzenia i 24 mies. na wykonanie, ważność do 31.12.{year}.
            </div>
          </div>
          <Button onClick={create}>Utwórz ofertę</Button>
        </Card>
      </div>
    </AppShell>
  );
}
