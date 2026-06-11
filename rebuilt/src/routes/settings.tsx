import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/drsystem-store";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "DRSYSTEM — Dane firmy" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const company = useStore((s) => s.company);
  const setCompany = useStore((s) => s.setCompany);
  const [local, setLocal] = useState(company);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = async (f: File) => {
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Logo max 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocal({ ...local, logoDataUrl: dataUrl });
    };
    reader.readAsDataURL(f);
  };

  const save = () => {
    setCompany(local);
    toast.success("Zapisano dane firmy");
  };

  return (
    <AppShell
      title="Dane firmy"
      actions={<Button onClick={save}>Zapisz zmiany</Button>}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Identyfikacja firmy</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["name", "Nazwa firmy"],
              ["street", "Ulica"],
              ["city", "Miasto, kod"],
              ["nip", "NIP"],
              ["regon", "REGON"],
              ["krs", "KRS"],
              ["phone", "Telefon"],
              ["email", "E-mail"],
              ["www", "Strona www"],
              ["preparedBy", "Opracował (domyślnie)"],
              ["preparedPhone", "Telefon (opracował)"],
              ["preparedEmail", "E-mail (opracował)"],
            ] as const).map(([k, label]) => (
              <div key={k} className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
                <Input value={local[k] ?? ""} onChange={(e) => setLocal({ ...local, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Logo</h2>
          <div className="flex aspect-video items-center justify-center rounded border bg-muted/50 p-4">
            {local.logoDataUrl ? (
              <img src={local.logoDataUrl} alt="logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">Brak logo</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 flex-1" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Wgraj logo
            </Button>
            {local.logoDataUrl && (
              <Button variant="outline" size="icon" className="text-destructive" onClick={() => setLocal({ ...local, logoDataUrl: null })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Logo jest skalowane proporcjonalnie i automatycznie wstawiane do nagłówka PDF/DOCX. Max 2 MB. PNG/JPG/SVG.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
