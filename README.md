# MT Marketing — Growth System

React (Vite) + kleine Express API voor AI klant-setup (Claude).

## Lokaal draaien

1. `npm install`
2. Kopieer `.env.example` naar `.env` en zet **alleen lokaal** je `ANTHROPIC_API_KEY`.
3. `npm run dev:all` — API op [http://localhost:8787](http://localhost:8787), app op [http://localhost:5173](http://localhost:5173).

## Code naar GitHub

```bash
git add .
git commit -m "Jouw bericht"
git push origin master
```

**De API-sleutel hoort nooit in Git.** `.env` staat in `.gitignore` en wordt niet gepusht.

## Waar zet je de API key?

| Situatie | Waar |
|----------|------|
| **Lokaal** | Bestand `.env`: `ANTHROPIC_API_KEY=sk-ant-...` |
| **Vercel (deze repo)** | [Vercel Dashboard](https://vercel.com) → jouw project → **Settings** → **Environment Variables** → voeg toe: `ANTHROPIC_API_KEY` (Production + Preview als je previews wilt testen). Optioneel: `ANTHROPIC_MODEL`. Daarna **nieuwe deploy** (Redeploy). Gebruik **nooit** de prefix `VITE_` voor de Anthropic-key (dan zou hij in de browser belanden). |
| **GitHub Actions** | Alleen als een workflow de key nodig heeft: **Repo → Settings → Secrets and variables → Actions**. |

De **frontend-build** heeft geen Anthropic-key nodig. Alleen de **serverless API** (`api/index.js` → `server/app.js`) leest `ANTHROPIC_API_KEY`.

## Vercel-deploy (één project: site + API)

- Dit project gebruikt **Vite** (`dist/`) en **`api/index.js`** (Express onder `/api`).
- Endpoints: `POST /api/onboard-client`, `GET /api/health`.
- Zelfde domein als je app: je hoeft **`VITE_API_BASE_URL` niet te zetten** (leeg = relatieve URLs).
- Zet alleen **`ANTHROPIC_API_KEY`** in Vercel Environment Variables.

## Aparte API-host (optioneel)

Als de API ergens anders draait, bouw met `VITE_API_BASE_URL=https://jouw-backend...`:

```bash
set VITE_API_BASE_URL=https://jouw-api.voorbeeld.nl
npm run build
```
