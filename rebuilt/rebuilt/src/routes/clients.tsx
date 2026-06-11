import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "DRSYSTEM — Przekierowanie" },
      { name: "description", content: "Stary widok klientów został zastąpiony widokiem obiektów." },
    ],
  }),
  component: ClientsRedirectPage,
});

function ClientsRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/sites", replace: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <AppShell title="Stary widok klientów">
      <div className="max-w-xl rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Ten ekran został wycofany</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aplikacja działa teraz w modelu obiektowym. Zarządzanie bazą zaczyna się od obiektów, a
          nie od starej listy klientów.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate({ to: "/sites", replace: true })}>
            Przejdź do obiektów
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
