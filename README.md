# 🥗 MålPlan

Smart måltidsplanering som hämtar veckans erbjudanden från svenska butiker och föreslår hälsosamma maträtter med hjälp av AI.

**Live-app:** [moorrss.github.io/malplan](https://moorrss.github.io/malplan/)

---

## Funktioner

- **Måltidslogg** – Logga frukost, lunch, middag och snack per dag med automatisk kaloriberäkning
- **Veckovyn** – Navigera mellan dagar och se din planering för hela veckan
- **Livsmedelsdatabas** – Sök bland tusentals produkter via Open Food Facts, eller välj bland vanliga svenska livsmedel
- **Butikserbjudanden** – Hämtar veckans aktuella erbjudanden från Lidl, Willys, ICA, Coop och Hemköp
- **AI-måltidsplanerare** – Genererar hälsosamma måltidsförslag baserade på veckans erbjudanden via Claude AI

---

## Kom igång

### Krav
- [Node.js](https://nodejs.org/) v18+
- En [Anthropic API-nyckel](https://console.anthropic.com/settings/keys) för AI-förslagen

### Installation

```bash
git clone https://github.com/moorrss/malplan.git
cd malplan
npm install
npm run dev
```

Appen öppnas på `http://localhost:5173`.

### API-nyckel i appen

Klicka på 🔑-knappen i headern och klistra in din Anthropic API-nyckel. Nyckeln sparas lokalt i din webbläsare och skickas aldrig vidare till någon server.

---

## Teknikstack

| Del | Teknologi |
|---|---|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build | Vite |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Livsmedeldata | [Open Food Facts](https://world.openfoodfacts.org/) |
| Butikserbjudanden | [Tjek.com API](https://tjek.com/) |
| Deploy | GitHub Pages via GitHub Actions |

---

## Projektstruktur

```
src/
├── components/
│   ├── AISuggestions.tsx   # AI-måltidsplaneraren
│   ├── AddFoodModal.tsx     # Modal för att lägga till mat
│   ├── ApiKeyModal.tsx      # Inställningar för API-nyckel
│   ├── CalorieSummary.tsx   # Kalorier & makros för dagen
│   ├── MealSection.tsx      # Måltidssektion (frukost/lunch/etc.)
│   ├── OffersPanel.tsx      # Butikserbjudanden
│   └── WeekNav.tsx          # Veckonavigering
├── services/
│   ├── aiService.ts         # Anthropic API-anrop (klient-side)
│   ├── foodService.ts       # Open Food Facts-sökning
│   ├── mealPlanService.ts   # Lokal lagring av måltidsplanen
│   └── offerService.ts      # Tjek.com erbjudanden
└── types/
    └── index.ts             # TypeScript-typer
```

---

## Deploy

Varje push till `main` triggar automatisk deploy via GitHub Actions till GitHub Pages.
