import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { ONBOARD_SYSTEM } from "./methodology.js";
import {
  backendConfigured,
  readAppState,
  writeAppState,
  resolveSupabaseUrl,
  resolveSupabaseUrlSource,
  resolveServiceRoleKey,
  resolveServiceRoleKeySource,
} from "./appStateStorage.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const ALLOWED_ICONS = new Set([
  "sparkles", "heart", "car", "user", "star", "shield", "crown", "activity", "search", "briefcase", "rocket",
  "calendar", "eye", "gift", "fileText", "dollarSign", "layout", "layers", "mapPin", "handshake", "hash", "radio", "award",
]);
const ALLOWED_COLOR_KEYS = new Set(["blue", "rose", "purple", "green", "amber", "gold", "cyan"]);

function extractJson(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw);
}

function normalizeClient(parsed) {
  const id = typeof parsed.id === "string" && parsed.id ? parsed.id : `client_${Date.now()}`;
  const icon = ALLOWED_ICONS.has(parsed.icon) ? parsed.icon : "sparkles";
  const colorKey = ALLOWED_COLOR_KEYS.has(parsed.colorKey) ? parsed.colorKey : "purple";

  const frameworks = Array.isArray(parsed.frameworks) ? parsed.frameworks.slice(0, 5) : [];

  while (frameworks.length < 5) {
    frameworks.push({
      id: `pillar_${frameworks.length + 1}`,
      icon: "star",
      name: `Pijler ${frameworks.length + 1}`,
      subtitle: "Aan te vullen",
      colorKey: "blue",
      description: "Beschrijf hier het klantresultaat.",
      steps: ["Stap 1", "Stap 2", "Stap 3", "Stap 4"],
      freeValue: [],
      lowTicket: [],
      coreOffer: [],
      highTicket: [],
      microFrameworks: [
        { name: "Proces A", icon: "calendar", steps: ["Stap a", "Stap b", "Stap c"] },
        { name: "Proces B", icon: "calendar", steps: ["Stap a", "Stap b", "Stap c"] },
      ],
    });
  }

  const normalizedFw = frameworks.map((fw, i) => {
    const cid = typeof fw.id === "string" && fw.id ? fw.id : `fw_${i + 1}`;
    const mfRaw = Array.isArray(fw.microFrameworks) ? fw.microFrameworks.slice(0, 2) : [];
    while (mfRaw.length < 2) {
      mfRaw.push({ name: `Micro ${mfRaw.length + 1}`, icon: "calendar", steps: ["Stap 1", "Stap 2", "Stap 3"] });
    }
    return {
      id: cid,
      icon: ALLOWED_ICONS.has(fw.icon) ? fw.icon : "star",
      name: String(fw.name || `Core Result ${i + 1}`),
      subtitle: String(fw.subtitle || ""),
      colorKey: ALLOWED_COLOR_KEYS.has(fw.colorKey) ? fw.colorKey : ["blue", "amber", "green", "rose", "gold"][i % 5],
      description: String(fw.description || ""),
      steps: Array.isArray(fw.steps) && fw.steps.length ? fw.steps.map(String) : ["", "", "", ""],
      freeValue: Array.isArray(fw.freeValue) ? fw.freeValue.map(String) : [],
      lowTicket: Array.isArray(fw.lowTicket) ? fw.lowTicket.map(String) : [],
      coreOffer: Array.isArray(fw.coreOffer) ? fw.coreOffer.map(String) : [],
      highTicket: Array.isArray(fw.highTicket) ? fw.highTicket.map(String) : [],
      microFrameworks: mfRaw.map((m, j) => ({
        name: String(m.name || `Framework ${j + 1}`),
        icon: ALLOWED_ICONS.has(m.icon) ? m.icon : "calendar",
        steps: Array.isArray(m.steps) && m.steps.length ? m.steps.map(String) : ["Stap 1", "Stap 2", "Stap 3"],
      })),
    };
  });

  return {
    id,
    name: String(parsed.name || "Nieuwe Klant"),
    type: String(parsed.type || ""),
    location: String(parsed.location || ""),
    owner: String(parsed.owner || ""),
    products: String(parsed.products || ""),
    audience: String(parsed.audience || ""),
    targetRevenue: String(parsed.targetRevenue ?? "10000"),
    currentRevenue: String(parsed.currentRevenue ?? "0"),
    status: String(parsed.status || "Startend"),
    dreamGoal: String(parsed.dreamGoal || ""),
    modelName: String(parsed.modelName || "Methode™"),
    notes: String(parsed.notes || ""),
    colorKey,
    icon,
    frameworks: normalizedFw,
  };
}

/**
 * Lokaal (Vite-proxy strip /api): POST /onboard-client
 * Vercel: POST /api/onboard-client — zelfde router dubbel gemount
 */
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

function requireSyncAuth(req, res, next) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return res.status(503).json({
      error: "SYNC_SECRET ontbreekt. Zet SYNC_SECRET in Vercel + Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) of Vercel KV.",
    });
  }
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return res.status(401).json({ error: "Ongeldige sync-token (moet gelijk zijn aan SYNC_SECRET op de server)." });
  }
  next();
}

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  const s = (k) => Boolean(process.env[k] && String(process.env[k]).trim());
  const checks = {
    SYNC_SECRET: s("SYNC_SECRET"),
    SUPABASE_URL: s("SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_URL: s("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_PROJECT_REF: s("SUPABASE_PROJECT_REF"),
    SUPABASE_SERVICE_ROLE_KEY: s("SUPABASE_SERVICE_ROLE_KEY"),
    KV_REST_API_URL: s("KV_REST_API_URL"),
    KV_REST_API_TOKEN: s("KV_REST_API_TOKEN"),
  };
  const urlResolved = Boolean(resolveSupabaseUrl());
  const roleResolved = Boolean(resolveServiceRoleKey());
  const supabaseOk = urlResolved && roleResolved;
  const kvOk = checks.KV_REST_API_URL && checks.KV_REST_API_TOKEN;
  res.json({
    ok: true,
    model: MODEL,
    vercelEnv: process.env.VERCEL_ENV || null,
    cloudSync: Boolean(checks.SYNC_SECRET && backendConfigured()),
    storage: supabaseOk ? "supabase" : kvOk ? "kv" : "none",
    checks,
    /** Welke env-naam gebruikt wordt (na fallbacks). Geen waarden. */
    supabase: {
      urlFromEnv: resolveSupabaseUrlSource(),
      serviceKeyFromEnv: resolveServiceRoleKeySource(),
      urlOk: urlResolved,
    },
    hint:
      !checks.SYNC_SECRET || !supabaseOk
        ? "Vercel Production: SYNC_SECRET + SUPABASE_SERVICE_ROLE_KEY + (SUPABASE_URL of SUPABASE_PROJECT_REF=je-project-id). Als URL-variabelen onzichtbaar blijven: zet SUPABASE_PROJECT_REF=axsqkzjxfjtbsypmieoy (jouw Project ID). Redeploy."
        : null,
  });
});

apiRouter.get("/app-state", requireSyncAuth, async (_req, res) => {
  if (!backendConfigured()) {
    return res.status(503).json({
      error:
        "Geen cloud-storage: zet Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, zie supabase/schema.sql) of Vercel KV (KV_REST_*).",
    });
  }
  try {
    const data = await readAppState();
    if (data == null) {
      return res.json({ clients: null, activeId: null });
    }
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

apiRouter.put("/app-state", requireSyncAuth, async (req, res) => {
  if (!backendConfigured()) {
    return res.status(503).json({
      error: "Geen cloud-storage: Supabase of Vercel KV vereist.",
    });
  }
  const body = req.body;
  if (!body || !Array.isArray(body.clients) || !body.clients.every((c) => c && typeof c.id === "string")) {
    return res.status(400).json({ error: "Verwacht { clients: [...], activeId?: string }" });
  }
  const activeId = typeof body.activeId === "string" ? body.activeId : body.clients[0]?.id ?? "";
  try {
    await writeAppState({ clients: body.clients, activeId });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

apiRouter.post("/onboard-client", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY ontbreekt. Zet deze in Vercel Environment Variables of lokaal in .env" });
  }

  const brief = typeof req.body?.brief === "string" ? req.body.brief.trim() : "";
  if (brief.length < 20) {
    return res.status(400).json({ error: "brief moet minimaal 20 tekens zijn (bedrijf, aanbod, doelgroep, locatie)." });
  }

  const client = new Anthropic({ apiKey });

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: ONBOARD_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Maak een volledig ingevuld klant-object volgens het schema op basis van deze briefing:\n\n${brief}`,
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return res.status(502).json({ error: "Geen tekstantwoord van Claude." });
    }

    let parsed;
    try {
      parsed = extractJson(textBlock.text);
    } catch (e) {
      return res.status(502).json({
        error: "JSON parse mislukt",
        detail: e instanceof Error ? e.message : String(e),
        raw: textBlock.text.slice(0, 2000),
      });
    }

    const clientObj = normalizeClient(parsed);
    return res.json({ client: clientObj });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(e);
    return res.status(500).json({ error: msg });
  }
});

app.use(apiRouter);
app.use("/api", apiRouter);

export default app;
export { normalizeClient, extractJson, MODEL };
