# DR SYSTEM — wdrożenie etapu 1 na Vercel

Ten dokument dotyczy wyłącznie etapu 1:
- wdrożenie frontendu jako aplikacji webowej na Vercel,
- bez Supabase,
- bez logowania,
- bez PWA, 
- bez migracji danych.

## 1. Wymagania wstępne

Przed wdrożeniem upewnij się, że:
- kod znajduje się w repozytorium GitHub, GitLab albo Bitbucket,
- w repo jest plik `package.json`,
- w repo jest plik `bun.lock`,
- w repo jest plik `vite.config.ts`,
- w repo są pliki `vercel.json` i `.env.example`.

## 2. Założenie konta Vercel

1. Wejdź na stronę https://vercel.com/
2. Kliknij **Sign Up**.
3. Zaloguj się najlepiej przez **GitHub**.
4. Jeśli projekt ma być firmowy, utwórz zespół (Team) lub użyj firmowego konta.

## 3. Przygotowanie repozytorium

1. Umieść projekt DR SYSTEM w repozytorium Git.
2. Wypchnij aktualny kod do głównej gałęzi, np. `main`.
3. Upewnij się, że w repo znajdują się pliki:
   - `vercel.json`
   - `.env.example`
   - `package.json`
   - `bun.lock`
   - `vite.config.ts`

## 4. Dodanie projektu w Vercel

1. Zaloguj się do panelu Vercel.
2. Kliknij **Add New** → **Project**.
3. Wybierz dostawcę Git (np. GitHub).
4. Nadaj Vercel dostęp do repozytorium DR SYSTEM.
5. Wybierz repo i kliknij **Import**.

## 5. Ustawienia pierwszego deployu

W formularzu projektu ustaw lub sprawdź:

- **Framework Preset**: `Vite`
- **Install Command**: `bun install`
- **Build Command**: `bun run build`
- **Output Directory**: `dist`

Jeśli Vercel poprawnie wykryje projekt, część pól może ustawić automatycznie.

## 6. Zmienne środowiskowe

Na etapie 1 nie ma obowiązkowych sekretów.

Opcjonalnie możesz dodać:
- `VITE_APP_NAME=DR SYSTEM`
- `VITE_APP_ENV=production`
- `VITE_APP_BASE_URL=https://app.drsystem.pl`

Jeśli nie chcesz ich dodawać od razu, zostaw ten krok pusty.

## 7. Pierwszy deploy

1. Kliknij **Deploy**.
2. Poczekaj, aż Vercel zakończy build.
3. Otwórz adres preview wygenerowany przez Vercel, np. `https://twoj-projekt.vercel.app`.

## 8. Test po deployu

Po pierwszym deployu ręcznie sprawdź:

1. Czy otwiera się strona główna `/`
2. Czy działa menu aplikacji
3. Czy działa bezpośrednie wejście na adresy:
   - `/new`
   - `/sites`
   - `/contacts`
   - `/devices`
   - `/templates`
   - `/settings`
4. Czy odświeżenie strony na tych adresach nie daje błędu 404
5. Czy można otworzyć edytor oferty
6. Czy można wygenerować PDF

## 9. Podpięcie domeny `app.drsystem.pl`

1. W panelu projektu Vercel przejdź do **Settings** → **Domains**.
2. Kliknij **Add Domain**.
3. Wpisz: `app.drsystem.pl`
4. Zatwierdź dodanie domeny.
5. Vercel pokaże, jakie rekordy DNS trzeba ustawić u operatora domeny.
6. Dodaj wskazane rekordy DNS u operatora domeny `drsystem.pl`.
7. Poczekaj na propagację DNS.
8. Po aktywacji sprawdź, czy aplikacja otwiera się pod `https://app.drsystem.pl`.

## 10. Gotowość etapu 1

Etap 1 jest zakończony, jeśli:
- aplikacja działa pod publicznym adresem URL,
- działa routing SPA,
- można wejść bezpośrednio na główne ścieżki,
- użytkownik nie musi uruchamiać aplikacji przez terminal.
