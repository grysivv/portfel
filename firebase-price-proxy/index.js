/*
 * Portfel — serwer cen (Firebase Cloud Function, 2. generacja)
 * ------------------------------------------------------------
 * Alternatywa dla Cloudflare Worker, w tym samym projekcie co reszta aplikacji.
 * Pobiera notowania ze stooq / Yahoo Finance po stronie serwera i zwraca je
 * z nagłówkiem Access-Control-Allow-Origin, więc statyczna aplikacja (github.io)
 * może z nich korzystać bez problemu z CORS.
 *
 * UWAGA: funkcje Cloud Functions wymagają planu Blaze (pay-as-you-go), ponieważ
 * darmowy plan Spark blokuje wychodzące zapytania do usług spoza Google.
 * Dla jednego użytkownika koszt jest praktycznie zerowy (darmowy limit ~2 mln
 * wywołań/mies.) — ustaw budżet/alert w konsoli, jeśli chcesz mieć pewność.
 *
 * Instrukcja wdrożenia w README.md w tym katalogu.
 */

const { onRequest } = require("firebase-functions/v2/https");

const ALLOWED_HOSTS = [
  "stooq.com", "stooq.pl",
  "query1.finance.yahoo.com", "query2.finance.yahoo.com",
];

exports.priceProxy = onRequest(
  { region: "europe-central2", cors: true, memory: "128MiB", maxInstances: 3 },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const target = req.query.url;
    if (!target || typeof target !== "string") { res.status(400).send("Brak parametru ?url="); return; }

    let host;
    try { host = new URL(target).hostname.toLowerCase(); }
    catch { res.status(400).send("Nieprawidłowy adres docelowy"); return; }

    const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
    if (!ok) { res.status(403).send("Host niedozwolony: " + host); return; }

    try {
      const upstream = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PortfelPriceProxy/1.0)",
          "Accept": "text/csv,application/json,text/plain,*/*",
        },
      });
      const body = await upstream.text();
      res.set("Content-Type", upstream.headers.get("Content-Type") || "text/plain; charset=utf-8");
      res.set("Cache-Control", "public, max-age=30");
      res.status(upstream.status).send(body);
    } catch (e) {
      res.status(502).send("Błąd pobierania ze źródła: " + e.message);
    }
  }
);
