import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/drsystem-store";
import type { OfferTemplate, ScopeTemplateItem } from "@/lib/drsystem-types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "DRSYSTEM — Szablony ofert" }] }),
  component: TemplatesPage,
});

const blank = (): OfferTemplate => ({
  id: "",
  name: "",
  scope: [],
  deviceCodes: [],
});

const toScopeItem = (item: string | ScopeTemplateItem): ScopeTemplateItem =>
  typeof item === "string" ? { text: item, qty: 1, price: 0 } : item;

const formatScopeLine = (item: string | ScopeTemplateItem): string => {
  const normalized = toScopeItem(item);
  return `${normalized.text || ""} | ${Number(normalized.qty ?? 1)} | ${Number(normalized.price ?? 0).toFixed(2)}`;
};

const parseScopeLines = (value: string): ScopeTemplateItem[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((x) => x.trim());
      const [text = "", qtyRaw = "1", priceRaw = "0"] = parts;
      const qty = Math.max(1, Number(qtyRaw.replace(",", ".")) || 1);
      const price = Math.max(0, Number(priceRaw.replace(",", ".")) || 0);
      return { text, qty, price };
    })
    .filter((item) => item.text.length > 0);

function TemplatesPage() {
  const templates = useStore((s) => s.templates);
  const upsert = useStore((s) => s.upsertTemplate);
  const del = useStore((s) => s.deleteTemplate);
  const [edit, setEdit] = useState<OfferTemplate | null>(null);
  const editScopeText = useMemo(
    () => (edit ? edit.scope.map((item) => formatScopeLine(item)).join("\n") : ""),
    [edit],
  );

  return (
    <AppShell
      title="Szablony ofert"
      actions={
        <Button onClick={() => setEdit(blank())} className="gap-2">
          <Plus className="h-4 w-4" /> Nowy szablon
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{t.name}</h3>
              <div className="flex">
                <Button size="icon" variant="ghost" onClick={() => setEdit(t)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => confirm("Usunąć szablon?") && del(t.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <ul className="mt-2 list-decimal pl-4 text-sm text-muted-foreground">
              {t.scope.slice(0, 5).map((s, i) => {
                const item = toScopeItem(s);
                return (
                  <li key={i}>
                    {item.text}
                    <span className="ml-1 text-xs">
                      · ilość: {Number(item.qty ?? 1)} · cena: {Number(item.price ?? 0).toFixed(2)}{" "}
                      zł
                    </span>
                  </li>
                );
              })}
              {t.scope.length > 5 && <li>… +{t.scope.length - 5} więcej</li>}
            </ul>
          </Card>
        ))}
      </div>

      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{edit.id ? "Edytuj szablon" : "Nowy szablon"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nazwa szablonu</Label>
                <Input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Zakres prac</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Każda linia w formacie: opis | ilość | cena netto
                </p>
                <Textarea
                  rows={10}
                  value={editScopeText}
                  onChange={(e) => setEdit({ ...edit, scope: parseScopeLines(e.target.value) })}
                  placeholder="Przegląd centrali SSP | 1 | 450.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEdit(null)}>
                Anuluj
              </Button>
              <Button
                onClick={() => {
                  upsert(edit);
                  setEdit(null);
                  toast.success("Zapisano");
                }}
              >
                Zapisz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
