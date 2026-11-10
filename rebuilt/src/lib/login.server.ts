import process from "node:process";
import logoData from "../assets/logo-drsystem.png?inline";

/**
 * Logowanie do aplikacji (styl aplikacji serwisowej i audytowej DRSYSTEM).
 * Włącza się, gdy w Vercel ustawiono APP_PASSWORD. APP_USER (domyślnie "drsystem")
 * i APP_SECRET (opcjonalny klucz podpisu sesji) są opcjonalne.
 * Zmienne czytamy przy każdym żądaniu, nie na poziomie modułu.
 */

const COOKIE = "drs_session";
const MAX_AGE = 60 * 60 * 12; // 12 godzin

function cfg() {
  const password = process.env.APP_PASSWORD || "";
  return {
    enabled: password.length > 0,
    password,
    user: process.env.APP_USER || "drsystem",
    secret: process.env.APP_SECRET || `drsystem-session:${password}`,
  };
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function makeToken(user: string, secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${user}.${exp}`;
  return `${payload}.${await sign(payload, secret)}`;
}

async function validToken(token: string, user: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [u, exp, sig] = parts;
  if (u !== user || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(`${u}.${exp}`, secret));
}

function getCookie(request: Request, name: string): string {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function loginPage(error: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DRSYSTEM Oferty, logowanie</title>
<meta name="robots" content="noindex,nofollow">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#05070a radial-gradient(1200px 600px at 75% -10%,rgba(232,140,28,.13),transparent 60%) no-repeat;color:#fff;font:16px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
.top{border-bottom:1px solid rgba(232,163,81,.28)}
.top .in{max-width:1040px;margin:0 auto;padding:12px 16px;display:flex;gap:12px;align-items:center}
.top img{height:30px;display:block}
.top span{font-weight:600;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#e88c1c;border-left:1px solid rgba(255,255,255,.18);padding-left:12px}
.wrap{max-width:1040px;margin:0 auto;padding:20px 16px 48px}
.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;min-height:calc(100vh - 170px)}
@media(max-width:820px){.grid{grid-template-columns:1fr;gap:24px;min-height:0;padding-top:16px}}
.eyebrow{font-weight:600;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#e88c1c;margin-bottom:14px}
h1{font-weight:600;font-size:clamp(34px,5vw,56px);line-height:1.05;letter-spacing:-1.2px;margin:0 0 18px}
h1 span{color:#e88c1c}
.intro p{color:#b9b4ad;max-width:460px;margin:0;line-height:1.6}
.card{background:rgba(12,15,18,.72);border:1px solid rgba(232,163,81,.28);border-radius:14px;padding:28px;box-shadow:0 20px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06)}
.card h2{font-weight:600;font-size:24px;margin:0 0 16px}
label{display:grid;gap:4px;font-size:14px;color:#a39e97;margin-bottom:12px}
input{font:inherit;background:#0c0f12;border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:10px;padding:12px;width:100%}
input:focus{outline:none;border-color:#e88c1c;box-shadow:0 0 0 3px rgba(232,140,28,.18)}
button{width:100%;min-height:48px;border-radius:11px;border:1px solid #e88c1c;background:#e88c1c;color:#05070a;font:700 16px inherit;font-family:inherit;cursor:pointer;margin-top:4px}
button:hover{background:#f39a2c}
.err{background:#3b1512;color:#ffb4ab;padding:10px 12px;border-radius:8px;margin-bottom:12px}
.foot{text-align:center;color:#6f6a64;font-size:12px;padding:20px}
</style></head><body>
<div class="top"><div class="in"><img src="${logoData}" alt="DRSYSTEM"><span>Oferty</span></div></div>
<div class="wrap"><div class="grid">
<div class="intro"><div class="eyebrow">Platforma ofertowa</div>
<h1>Oferty SSP i DSO <span>w jednym miejscu</span></h1>
<p>Aplikacja do przygotowywania ofert DRSYSTEM. Zaloguj się, aby wejść do bazy ofert, klientów i obiektów.</p></div>
<form class="card" method="post" action="/login" autocomplete="on">
<h2>Logowanie</h2>
${error ? `<div class="err">${esc(error)}</div>` : ""}
<label>Login<input name="login" autocomplete="username" required autofocus></label>
<label>Hasło<input name="password" type="password" autocomplete="current-password" required></label>
<button type="submit">Zaloguj</button>
</form></div></div>
<div class="foot">DRSYSTEM sp. z o.o. - platforma ofertowa</div>
</body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Zwraca Response, gdy żądanie obsłużono (logowanie, przekierowanie), lub null, gdy można iść dalej. */
export async function handleLogin(request: Request): Promise<Response | null> {
  const c = cfg();
  if (!c.enabled) return null;
  const url = new URL(request.url);

  if (url.pathname === "/logout") {
    return new Response(null, {
      status: 302,
      headers: {
        location: "/login",
        "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      },
    });
  }

  if (url.pathname === "/login") {
    if (request.method === "POST") {
      const form = await request.formData().catch(() => null);
      const login = String(form?.get("login") ?? "");
      const password = String(form?.get("password") ?? "");
      if (safeEqual(login, c.user) && safeEqual(password, c.password)) {
        const token = await makeToken(c.user, c.secret);
        return new Response(null, {
          status: 303,
          headers: {
            location: "/",
            "set-cookie": `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
          },
        });
      }
      await new Promise((r) => setTimeout(r, 1000)); // spowolnij zgadywanie hasła
      return loginPage("Nieprawidłowy login lub hasło.", 401);
    }
    return loginPage("");
  }

  const token = getCookie(request, COOKIE);
  if (token && (await validToken(token, c.user, c.secret))) return null;

  // Wywołania funkcji serwerowych i zasobów bez sesji: 401, reszta: przekierowanie do logowania.
  if (request.method !== "GET" || url.pathname.startsWith("/_serverFn")) {
    return new Response("Wymagane logowanie", { status: 401, headers: { "cache-control": "no-store" } });
  }
  return new Response(null, {
    status: 302,
    headers: { location: "/login", "cache-control": "no-store" },
  });
}

/** Czy logowanie jest włączone (ustawiono APP_PASSWORD). */
export function isLoginEnabled(): boolean {
  return cfg().enabled;
}
