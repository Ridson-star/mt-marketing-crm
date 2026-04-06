/**
 * Optionele catch-all onder /api — Vercel matched api/index.js vaak alleen exact /api.
 * Hiermee: /api/health, /api/onboard-client, enz.
 */
import app from "../server/app.js";

export default app;
