import { toast } from "sonner";
import { useStore } from "./drsystem-store";

/**
 * Synchronizacja stanu aplikacji z chmurą (/api/state).
 * Przeglądarka zostaje kopią podręczną: przy starcie bierzemy nowszą wersję z chmury,
 * każdą zmianę wysyłamy z opóźnieniem. Konflikt (zapis z innego urządzenia) = bierzemy chmurę.
 */

const KEY = "drsystem-store-v10";
const AT_KEY = "drsystem-cloud-savedAt";
let started = false;
let applying = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let failedToasted = false;

const getAt = () => Number(localStorage.getItem(AT_KEY) || 0);
const setAt = (n: number) => localStorage.setItem(AT_KEY, String(n));

async function applyRemote(value: string, savedAt: number) {
  applying = true;
  try {
    localStorage.setItem(KEY, value);
    setAt(savedAt);
    await useStore.persist.rehydrate();
  } finally {
    applying = false;
  }
}

async function pull(): Promise<"applied" | "empty" | "same" | "error"> {
  const res = await fetch("/api/state", { cache: "no-store" });
  if (!res.ok) return "error";
  const j = await res.json();
  if (j.empty) return "empty";
  if (j.savedAt <= getAt()) return "same";
  await applyRemote(j.value, j.savedAt);
  return "applied";
}

async function push() {
  const value = localStorage.getItem(KEY);
  if (!value) return;
  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value, baseSavedAt: getAt() }),
    });
    if (res.status === 409) {
      await pull();
      toast.warning("Dane zmieniono na innym urządzeniu, wczytano nowszą wersję z chmury.");
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    setAt(j.savedAt);
    failedToasted = false;
  } catch {
    if (!failedToasted) {
      failedToasted = true;
      toast.error("Nie udało się zapisać w chmurze. Dane są w przeglądarce, spróbuję ponownie przy następnej zmianie.");
    }
  }
}

export async function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const r = await pull();
    if (r === "applied") toast.success("Wczytano dane z chmury");
    if (r === "empty") await push(); // pierwsze uruchomienie: przenieś dane z przeglądarki do chmury
    if (r === "error") return; // baza niedostępna: pracujemy lokalnie, bez synchronizacji
  } catch {
    return;
  }
  useStore.subscribe(() => {
    if (applying) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(push, 1500);
  });
}
