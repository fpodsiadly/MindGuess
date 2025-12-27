## MindGuess (Akinator mode)

Teraz aplikacja korzysta wyłącznie z Akinator API (bez lokalnej bazy danych i bez własnego silnika). Strona główna oferuje tryb PL/EN i 5 odpowiedzi Akinatora.

### Stack

- Next.js App Router, TypeScript, Tailwind, shadcn/ui
- Akinator API (`@aqul/akinator-api`)

### Setup

1. Zainstaluj zależności:

```

```

```

2. Uruchom dev server:
```

```
Otwórz http://localhost:3000. Wybierz język (domyślnie PL) i kliknij Start.

### Gameplay flow
- Silnik pyta przez Akinator API; odpowiadasz: Tak / Nie / Nie wiem / Prawdopodobnie / Raczej nie.
- Gdy Akinator zgadnie, pokazuje propozycję z opisem/zdjęciem.

### Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run built app
- `npm run lint` – lint

### Notatki
- Lokalna baza i seedy są niewykorzystywane w tym trybie (Akinator ma własne dane).
npx prisma generate
```
