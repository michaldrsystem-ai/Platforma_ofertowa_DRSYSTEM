import process from "node:process";
import { isLoginEnabled } from "./login.server";

/**
 * Wspólna baza w chmurze (Upstash Redis z Vercel Marketplace).
 * GET/PUT /api/state zapisuje cały stan aplikacji (ten sam JSON, który zustand trzyma w localStorage).
 * Dostępne tylko za loginem (żądania bez sesji odrzuca handleLogin przed tym kodem);
 * bez APP_PASSWORD endpoint jest wyłączony, żeby dane nie były publiczne.
 * Stan dzielimy na kawałki, bo pojedyncze żądanie do Upstash ma limit rozmiaru.
 */

const PREFIX = "drsystem:state";
const CHUNK = 400_000;

function redisCfg() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function cmd(c: { url: string; token: string }, args: unknown[]): Promise<unknown> {
  const res = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const j = (await res.json()) as { result?: unknown; error?: string };
  if (j.error) throw new Error(j.error);
  return j.result;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

interface Meta {
  savedAt: number;
  chunks: number;
  version: number;
}

async function readMeta(c: { url: string; token: string }): Promise<Meta | null> {
  const raw = (await cmd(c, ["GET", `${PREFIX}:meta`])) as string | null;
  return raw ? (JSON.parse(raw) as Meta) : null;
}

export async function handleCloud(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/state") return null;
  if (!isLoginEnabled()) return json({ error: "Wspólna baza wymaga ustawionego APP_PASSWORD" }, 503);
  const c = redisCfg();
  if (!c) return json({ error: "Brak konfiguracji bazy (KV_REST_API_URL, KV_REST_API_TOKEN)" }, 503);

  try {
    if (request.method === "GET") {
      const meta = await readMeta(c);
      if (!meta) return json({ empty: true });
      let value = "";
      for (let i = 0; i < meta.chunks; i++) {
        value += ((await cmd(c, ["GET", `${PREFIX}:${meta.version}:${i}`])) as string) ?? "";
      }
      return json({ value, savedAt: meta.savedAt });
    }

    if (request.method === "PUT") {
      const body = (await request.json()) as { value?: string; baseSavedAt?: number };
      if (typeof body.value !== "string" || body.value.length < 2) return json({ error: "Brak danych" }, 400);
      const current = await readMeta(c);
      // Ktoś (inne urządzenie) zapisał nowszą wersję, niż ta, od której zaczął ten klient.
      if (current && current.savedAt > (body.baseSavedAt ?? 0)) {
        return json({ conflict: true, savedAt: current.savedAt }, 409);
      }
      const version = (current?.version ?? 0) + 1;
      const chunks = Math.ceil(body.value.length / CHUNK);
      for (let i = 0; i < chunks; i++) {
        await cmd(c, ["SET", `${PREFIX}:${version}:${i}`, body.value.slice(i * CHUNK, (i + 1) * CHUNK)]);
      }
      const meta: Meta = { savedAt: Date.now(), chunks, version };
      await cmd(c, ["SET", `${PREFIX}:meta`, JSON.stringify(meta)]);
      // Sprzątanie poprzedniej wersji (po zapisie meta, więc odczyt zawsze trafia na komplet).
      if (current) {
        for (let i = 0; i < current.chunks; i++) await cmd(c, ["DEL", `${PREFIX}:${current.version}:${i}`]);
      }
      return json({ savedAt: meta.savedAt });
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("cloud state", e);
    return json({ error: "Błąd bazy" }, 502);
  }
}
