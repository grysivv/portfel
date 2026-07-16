# Serwer cen na Firebase (alternatywa dla Cloudflare Worker)

Ta funkcja pobiera notowania ze **stooq / Yahoo Finance** po stronie serwera i zwraca je
z nagłówkami CORS, dzięki czemu aplikacja Portfel (statyczna, na github.io) może z nich
korzystać bez blokady CORS. Wdrażasz ją w **tym samym projekcie Firebase**, co logowanie
i synchronizacja.

## ⚠️ Wymagany plan Blaze

Cloud Functions mogą wykonywać zapytania do usług spoza Google **tylko na planie Blaze**
(pay-as-you-go). Dla jednego użytkownika koszt jest praktycznie zerowy — mieścisz się
w darmowym limicie (~2 mln wywołań/mies.). Kartę trzeba jednak podpiąć.
Zalecane: ustaw alert budżetowy (np. 1 zł) w Google Cloud Console → Billing → Budgets.

> Jeśli nie chcesz podpinać karty — użyj **Cloudflare Worker** (`cloudflare-worker.js`
> w głównym katalogu repo): jest darmowy i nie wymaga karty.

## Wdrożenie (jednorazowo)

Potrzebujesz [Node.js](https://nodejs.org) i Firebase CLI.

```bash
# 1. Zainstaluj Firebase CLI (jeśli nie masz)
npm install -g firebase-tools
firebase login

# 2. W dowolnym pustym katalogu zainicjuj funkcje
firebase init functions
#    - wybierz swój istniejący projekt (ten sam co aplikacja)
#    - język: JavaScript
#    - nie nadpisuj, gdy zapyta o pliki

# 3. Podmień zawartość:
#    - functions/index.js         <- index.js z tego katalogu
#    - functions/package.json     <- package.json z tego katalogu (albo dodaj zależność)

# 4. W konsoli Firebase włącz plan Blaze (Ustawienia → Usage and billing)

# 5. Wdróż
firebase deploy --only functions
```

Po wdrożeniu w konsoli/CLI zobaczysz adres funkcji, np.:

```
https://europe-central2-<twoj-projekt>.cloudfunctions.net/priceProxy
```

(dla 2. generacji może to być adres w stylu `https://priceproxy-xxxx-lz.a.run.app`).

## Podłączenie w aplikacji

Aplikacja → **Ustawienia → „Serwer cen (własne proxy)"** → wklej ten adres →
**Zapisz** → **Testuj**. Gotowe — ceny będą pobierane przez Twoją funkcję.

## Test ręczny

```
https://…/priceProxy?url=https%3A%2F%2Fstooq.com%2Fq%2Fl%2F%3Fs%3Dpko%26f%3Dsd2t2ohlcv%26h%26e%3Dcsv
```

Powinno zwrócić wiersz CSV z ceną PKO.
