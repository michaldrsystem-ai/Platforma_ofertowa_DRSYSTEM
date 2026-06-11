import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/drsystem-store";

export const Route = createFileRoute("/database")({
  head: () => ({ meta: [{ title: "DRSYSTEM — Klienci i obiekty" }] }),
  component: DatabasePage,
});

function DatabasePage() {
  const clients = useStore((s) => s.clients);
  const sites = useStore((s) => s.sites);
  const contacts = useStore((s) => s.contactPersons);
  const fms = useStore((s) => s.facilityCompanies);
  const [q, setQ] = useState("");

  const data = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return clients
      .map((c) => {
        const cSites = sites.filter((s) => s.clientId === c.id);
        const cLocs = c.locations;
        return { client: c, sites: cSites, locs: cLocs };
      })
      .filter(({ client, sites: cs, locs }) => {
        if (!qq) return true;
        const hay = [
          client.name,
          ...cs.map((s) => s.name + " " + s.city),
          ...locs.map((l) => l.name + " " + (l.objectName || "") + " " + (l.address || "")),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(qq);
      });
  }, [clients, sites, q]);

  const cpById = (id: string) => contacts.find((c) => c.id === id);
  const fmById = (id?: string) => (id ? fms.find((f) => f.id === id) : undefined);

  return (
    <AppShell title="Klienci i obiekty">
      <Card className="mb-4 p-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj klienta, obiektu, adresu…" />
        <div className="mt-2 text-xs text-muted-foreground">
          {clients.length} klientów · {sites.length} obiektów w bazie · {contacts.length} kontaktów
        </div>
      </Card>

      <div className="space-y-3">
        {data.map(({ client, sites: cSites, locs }) => (
          <Card key={client.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-base font-semibold">{client.name}</div>
                <div className="text-xs text-muted-foreground">
                  {client.email || "—"} · {client.phone || "—"}
                </div>
              </div>
              <Badge variant="outline">{cSites.length + locs.length} obiektów</Badge>
            </div>

            {cSites.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Obiekty (baza obiektów)</div>
                <div className="space-y-2">
                  {cSites.map((s) => (
                    <div key={s.id} className="rounded-md border p-2 text-sm">
                      <div className="font-medium">
                        {s.name}
                        {s.city ? <span className="text-muted-foreground"> · {s.city}</span> : null}
                      </div>
                      {s.address && <div className="text-xs text-muted-foreground">{s.address}</div>}
                      {s.contactIds.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {s.contactIds.map((cid) => {
                            const cp = cpById(cid);
                            if (!cp) return null;
                            return (
                              <li key={cid}>
                                <strong>{cp.name}</strong>
                                {cp.position ? ` — ${cp.position}` : ""}
                                <span className="text-muted-foreground">
                                  {" · "}
                                  {cp.phone || "brak tel."} · {cp.email || "brak e-mail"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {locs.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Lokalizacje (legacy)</div>
                <div className="space-y-2">
                  {locs.map((l) => (
                    <div key={l.id} className="rounded-md border p-2 text-sm">
                      <div className="font-medium">{l.objectName || l.name}</div>
                      {l.address && <div className="text-xs text-muted-foreground">{l.address}</div>}
                      {l.facilityCompanyId && (
                        <div className="text-xs text-muted-foreground">
                          FM: {fmById(l.facilityCompanyId)?.name || "—"}
                        </div>
                      )}
                      {(l.contactPersonIds || []).length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {(l.contactPersonIds || []).map((cid) => {
                            const cp = cpById(cid);
                            if (!cp) return null;
                            return (
                              <li key={cid}>
                                <strong>{cp.name}</strong>
                                {cp.position ? ` — ${cp.position}` : ""}
                                <span className="text-muted-foreground">
                                  {" · "}
                                  {cp.phone || "brak tel."} · {cp.email || "brak e-mail"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
