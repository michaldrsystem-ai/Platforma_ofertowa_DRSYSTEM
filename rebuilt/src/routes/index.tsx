import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/drsystem-store";
import { calcTotals, type Offer, type OfferStatus } from "@/lib/drsystem-types";
import { Copy, FileDown, Plus, Search, Trash2, Zap, Pencil } from "lucide-react";
import { toast } from "sonner";
import { generateOfferPdf } from "@/lib/drsystem-pdf";
import { buildOfferFilename } from "@/lib/offer-filename";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DRSYSTEM — Oferty" },
      { name: "description", content: "Lista ofert handlowych DRSYSTEM" },
    ],
  }),
  component: OffersList,
});

const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: "Robocza",
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
};
const STATUS_VARIANT: Record<OfferStatus, "secondary" | "default" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  rejected: "destructive",
};

function OffersList() {
  const navigate = useNavigate();
  const offers = useStore((s) => s.offers);
  const company = useStore((s) => s.company);

  const cloneOffer = useStore((s) => s.cloneOffer);
  const deleteOffer = useStore((s) => s.deleteOffer);
  const updateOffer = useStore((s) => s.updateOffer);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | OfferStatus>("all");

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return offers.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!query) return true;
      return [o.number, o.clientName, o.locationAddress, o.siteObjectName, o.investmentName, o.date]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [offers, q, status]);

  const handleNew = () => {
    navigate({ to: "/new" });
  };

  const handleClone = (id: string) => {
    const o = cloneOffer(id);
    if (o) {
      toast.success("Oferta skopiowana");
      navigate({ to: "/new", search: { id: o.id } });
    }
  };

  const handlePdf = async (o: Offer) => {
    const doc = await generateOfferPdf(o, company);
    doc.save(buildOfferFilename(o, "pdf"));
  };

  return (
    <AppShell
      title="Oferty handlowe"
      actions={
        <>
          <Button variant="outline" onClick={() => navigate({ to: "/quick" })} className="gap-2">
            <Zap className="h-4 w-4" /> Szybka oferta
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nowa oferta
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj po kliencie, lokalizacji, numerze..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="draft">Robocza</SelectItem>
            <SelectItem value="sent">Wysłana</SelectItem>
            <SelectItem value="accepted">Zaakceptowana</SelectItem>
            <SelectItem value="rejected">Odrzucona</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numer</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Inwestycja</TableHead>
              <TableHead>Lokalizacja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Wartość netto</TableHead>
              <TableHead className="w-44 text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Brak ofert. Kliknij „Nowa oferta" lub „Szybka oferta", aby zacząć.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => {
              const t = calcTotals(o);
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    <button
                      onClick={() => navigate({ to: "/new", search: { id: o.id } })}
                      className="font-semibold text-primary hover:underline"
                    >
                      {o.number}
                    </button>
                    <div className="text-muted-foreground">{o.date}</div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{o.clientName || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{o.investmentName || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {o.locationAddress || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={o.status}
                      onValueChange={(v) => updateOffer(o.id, { status: v as OfferStatus })}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Robocza</SelectItem>
                        <SelectItem value="sent">Wysłana</SelectItem>
                        <SelectItem value="accepted">Zaakceptowana</SelectItem>
                        <SelectItem value="rejected">Odrzucona</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {t.total.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate({ to: "/new", search: { id: o.id } })}
                        title="Edytuj"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePdf(o)}
                        title="Pobierz PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleClone(o.id)}
                        title="Kopiuj"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Usunąć ofertę?")) deleteOffer(o.id);
                        }}
                        title="Usuń"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
