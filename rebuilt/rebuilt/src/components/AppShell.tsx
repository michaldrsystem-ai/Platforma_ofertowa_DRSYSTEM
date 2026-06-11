import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FileText, Library, ListChecks, Settings, Sparkles, Users, Building2 } from "lucide-react";
import { useStore } from "@/lib/drsystem-store";

const nav = [
  { to: "/sites", label: "Obiekty", icon: Building2 },
  { to: "/contacts", label: "Kontakty", icon: Users },
  { to: "/", label: "Oferty", icon: FileText },
  { to: "/new", label: "Nowa oferta", icon: Sparkles },
  { to: "/devices", label: "Urządzenia", icon: Library },
  { to: "/templates", label: "Szablony", icon: ListChecks },
  { to: "/settings", label: "Ustawienia", icon: Settings },
] as const;

export function AppShell({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}) {
  const company = useStore((s) => s.company);
  const router = useRouter();
  const current = router.state.location.pathname;

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex items-center gap-3 border-b p-4">
          {company.logoDataUrl ? (
            <img
              src={company.logoDataUrl}
              alt="logo"
              className="h-10 w-auto max-w-[170px] object-contain"
            />
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
                DR
              </div>
              <div>
                <div className="text-sm font-bold">DRSYSTEM</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Offer Creator
                </div>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.to === "/" ? current === "/" : current.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 text-[10px] text-muted-foreground">
          {company.name}
          <br />
          NIP {company.nip}
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur">
          <h1 className="text-lg font-bold">{title}</h1>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <main className="w-full px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
