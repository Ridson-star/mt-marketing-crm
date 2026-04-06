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
| **Lokaal** | Bestand `.env` in de projectmap: `ANTHROPIC_API_KEY=sk-ant-...` |
| **GitHub (alleen de repo)** | Nergens in code of commits. Optioneel: **Repo → Settings → Secrets and variables → Actions** als een workflow de key nodig heeft (bijv. geautomatiseerde deploy). |
| **Productie (API draait op Railway, Render, Fly.io, VPS, …)** | In het **Environment / Variables**-scherm van die hosting: `ANTHROPIC_API_KEY` (en optioneel `ANTHROPIC_MODEL`, `PORT`). |

De frontend (statische build) heeft **geen** Anthropic-key nodig; alleen de Node-server op je hosting.

## Productie: frontend + API gescheiden

1. Deploy **`server/`** als Node-service en zet daar `ANTHROPIC_API_KEY`.
2. Bouw de frontend met de publieke API-URL:

   ```bash
   set VITE_API_BASE_URL=https://jouw-api-voorbeeld.up.railway.app
   npm run build
   ```

   (Op macOS/Linux: `export VITE_API_BASE_URL=...`)

3. Upload `dist/` naar GitHub Pages, Vercel, Netlify, etc.

Zorg dat je API CORS toelaat voor je frontend-domein (nu staat `origin: true` open; voor productie kun je dit strakker zetten in `server/index.js`).
