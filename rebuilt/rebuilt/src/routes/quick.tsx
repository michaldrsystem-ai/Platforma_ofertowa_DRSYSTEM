import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { useStore } from "@/lib/drsystem-store";
import { generateOfferPdf } from "@/lib/drsystem-pdf";
import { buildOfferFilename } from "@/lib/offer-filename";
import { toast } from "sonner";
import { calcTotals } from "@/lib/drsystem-types";
import { FileDown, Star, Zap, ListChecks } from "lucide-react";

export const Route = createFileRoute("/quick")({
  head: () => ({
    meta: [
      { title: "DRSYSTEM — Szybka oferta" },
      { name: "description", content: "Szybkie tworzenie standardowych ofert DRSYSTEM" },
    ],
  }),
  component: QuickOffer,
});

function QuickOffer() {
  const navigate = useNavigate();
  const company = useStore((s) => s.company);
  const devices = useStore((s) => s.devices);
  const templates = useStore((s) => s.templates);
  const clients = useStore((s) => s.clients);
  const createOffer = useStore((s) => s.createOffer);
  const addDeviceLine = useStore((s) => s.addDeviceLineFromDevice);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const applyClientToOffer = useStore((s) => s.applyClientToOffer);
  const syncClientFromOffer = useStore((s) => s.syncClientFromOffer);
  const offers = useStore((s) => s.offers);

  const [draftId, setDraftId] = useState<string | null>(null);
  const draft = useMemo(() => offers.find((o) => o.id === draftId) ?? null, [offers, draftId]);

  const [clientId, setClientId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [investment, setInvestment] = useState("");

  const pickedClient = clients.find((c) => c.id === clientId);

  const ensureDraft = () => {
    if (draft) return draft;
    const o = createOffer({
      clientName: client,
      locationAddress: location,
      investmentName: investment,
    });
    setDraftId(o.id);
    return o;
  };

  const updatePrimary = () => {
    if (!draft) return;
    useStore.getState().updateOffer(draft.id, {
      clientName: client,
      locationAddress: location,
      investmentName: investment,
    });
    syncClientFromOffer(draft.id);
  };

  const pickClient = (cid: string) => {
    setClientId(cid);
    setLocationId("");
    const c = clients.find((x) => x.id === cid);
    if (!c) return;
    setClient(c.name);
    setLocation("");
    const o = ensureDraft();
    applyClientToOffer(o.id, cid);
  };
  const pickLocation = (lid: string) => {
    setLocationId(lid);
    const loc = pickedClient?.locations.find((l) => l.id === lid);
    if (!loc) return;
    setLocation([loc.name, loc.address].filter(Boolean).join(", "));
    if (clientId) {
      const o = ensureDraft();
      applyClientToOffer(o.id, clientId, lid);
    }
  };

  const favDevices = devices.filter((d) => d.favorite && d.active);

  const handleAddDevice = (id: string) => {
    const o = ensureDraft();
    addDeviceLine(o.id, id);
    toast.success("Dodano urządzenie");
  };
  const handleTemplate = (tid: string) => {
    const o = ensureDraft();
    applyTemplate(o.id, tid);
    toast.success("Szablon zastosowany");
  };

  const exportNow = async () => {
    if (!client || !investment) {
      toast.error("Uzupełnij klienta i nazwę inwestycji");
      return;
    }
    const o = ensureDraft();
    updatePrimary();
    const latest = useStore.getState().offers.find((x) => x.id === o.id)!;
    const doc = await generateOfferPdf(latest, company);
    doc.save(buildOfferFilename(latest, "pdf"));
    toast.success(`Oferta ${latest.number} gotowa`);
  };

  const totals = draft ? calcTotals(draft) : { dev: 0, scope: 0, act: 0, total: 0 };

  return (
    <AppShell
      title="Szybka oferta"
      actions={
        <>
          {draft && (
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/new", search: { id: draft.id } })}
            >
              Otwórz edytor
            </Button>
          )}
          <Button onClick={exportNow} className="gap-2">
            <FileDown className="h-4 w-4" /> Generuj PDF
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Standardowa oferta w 2 minuty</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Wybierz klienta z bazy">
              <Select value={clientId} onValueChange={pickClient}>
                <SelectTrigger>
                  <SelectValue placeholder="— wybierz —" />
                </SelectTrigger>
                <SelectContent>
                  {[...clients]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lokalizacja klienta">
              <Select
                value={locationId}
                onValueChange={pickLocation}
                disabled={!pickedClient || pickedClient.locations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      pickedClient ? "— wybierz lokalizację —" : "Najpierw wybierz klienta"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {pickedClient?.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Klient">
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                onBlur={updatePrimary}
                placeholder="np. ABC sp. z o.o."
              />
            </Field>
            <Field label="Lokalizacja">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={updatePrimary}
                placeholder="np. Warszawa, ul..."
              />
            </Field>
            <Field label="Nazwa inwestycji">
              <Input
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                onBlur={updatePrimary}
                placeholder="np. Przegląd SSP"
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ListChecks className="h-4 w-4" /> Szablon oferty
            </div>
            <Select onValueChange={handleTemplate}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Wybierz szablon..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-muted-foreground">
              ⭐ Najczęściej używane urządzenia
            </div>
            <div className="flex flex-wrap gap-2">
              {favDevices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Oznacz urządzenia gwiazdką w bibliotece, aby pojawiły się tutaj.
                </p>
              )}
              {favDevices.map((d) => (
                <Button
                  key={d.id}
                  variant="outline"
                  className="h-auto flex-col items-start gap-1 py-3 text-left"
                  onClick={() => handleAddDevice(d.id)}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <Star className="h-3 w-3 fill-current text-primary" /> {d.name}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {d.price.toLocaleString("pl-PL")} zł / {d.unit}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-6">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Podgląd oferty</h3>
          {draft ? (
            <>
              <div className="text-xs text-muted-foreground">Numer</div>
              <div className="font-mono font-semibold">{draft.number}</div>
              <div className="mt-2 text-xs text-muted-foreground">Pozycji</div>
              <div>
                <Badge variant="secondary" className="mr-1">
                  Urządzenia: {draft.deviceLines.length}
                </Badge>
                <Badge variant="secondary">Zakres: {draft.scope.length}</Badge>
              </div>
              <div className="border-t pt-2">
                <Row label="Urządzenia" value={totals.dev} />
                <Row label="Zakres" value={totals.scope} />
                <Row label="Łącznie netto" value={totals.total} bold />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dodaj pierwszą pozycję, aby utworzyć ofertę.
            </p>
          )}
        </Card>
      </div>
    </AppShell>
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
function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between text-sm ${bold ? "text-base font-bold text-primary" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">
        {value.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
      </span>
    </div>
  );
}
