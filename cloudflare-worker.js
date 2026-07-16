/*
 * Portfel — serwer cen (Cloudflare Worker)
 * ----------------------------------------
 * Darmowe, niezawodne proxy do pobierania notowań ze stooq / Yahoo Finance.
 * Pobiera dane po stronie serwera (brak problemu CORS i limitów przeglądarki)
 * i zwraca je z nagłówkiem Access-Control-Allow-Origin, więc aplikacja
 * hostowana na github.io może z nich korzystać.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * JAK WDROŻYĆ (ok. 3 minuty, za darmo):
 *
 *  1. Załóż darmowe konto na https://dash.cloudflare.com  (jeśli nie masz).
 *  2. W panelu: „Workers & Pages” → „Create application” → „Create Worker”.
 *  3. Nadaj nazwę (np. „portfel-ceny”) i kliknij „Deploy”.
 *  4. Kliknij „Edit code”, USUŃ domyślny kod i wklej CAŁĄ zawartość tego pliku.
 *  5. Kliknij „Deploy”.
 *  6. Skopiuj adres workera, np. https://portfel-ceny.twojekonto.workers.dev
 *  7. W aplikacji: Ustawienia → „Serwer cen (własne proxy)” → wklej adres,
 *     kliknij „Zapisz”, potem „Testuj”. Gotowe — ceny będą szły przez Twój worker.
 * ─────────────────────────────────────────────────────────────────────────
 */

const ALLOWED_HOSTS = [
  "stooq.com", "stooq.pl",
  "query1.finance.yahoo.com", "query2.finance.yahoo.com",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const target = new URL(request.url).searchParams.get("url");
    if (!target) return json(400, "Brak parametru ?url=");

    let host;
    try { host = new URL(target).hostname.toLowerCase(); }
    catch { return json(400, "Nieprawidłowy adres docelowy"); }

    const ok = ALLOWED_HOSTS.some(h => host === h || host.endsWith("." + h));
    if (!ok) return json(403, "Host niedozwolony: " + host);

    try {
      const upstream = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PortfelPriceProxy/1.0)",
          "Accept": "text/csv,application/json,text/plain,*/*",
        },
        cf: { cacheTtl: 30, cacheEverything: true }, // krótki cache = mniej zapytań do źródła
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...CORS, "Content-Type": upstream.headers.get("Content-Type") || "text/plain; charset=utf-8" },
      });
    } catch (e) {
      return json(502, "Błąd pobierania ze źródła: " + e.message);
    }
  },
};

function json(status, msg) {
  return new Response(msg, { status, headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
}
