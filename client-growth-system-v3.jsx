import { useState, useRef, useEffect } from "react";

/** Productie: zet VITE_API_BASE_URL (bv. https://jouw-api.railway.app) — lokaal leeg laten voor Vite-proxy. */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const SHARED = {
  radius: 12, radiusSm: 8, radiusLg: 16, radiusXl: 20,
  fontBase: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'Fira Code', 'JetBrains Mono', 'SF Mono', monospace",
  // Semantic accent colors (same in both themes)
  accent: "#6366F1", accentLight: "#818CF8",
  accentDim: "rgba(99,102,241,0.12)", accentGlow: "rgba(99,102,241,0.20)",
  green: "#22C55E", greenDim: "rgba(34,197,94,0.12)",
  amber: "#F59E0B", amberDim: "rgba(245,158,11,0.12)",
  rose: "#F43F5E", roseDim: "rgba(244,63,94,0.12)",
  blue: "#3B82F6", blueDim: "rgba(59,130,246,0.12)",
  purple: "#A855F7", purpleDim: "rgba(168,85,247,0.12)",
  gold: "#EAB308", goldDim: "rgba(234,179,8,0.12)",
  cyan: "#06B6D4", cyanDim: "rgba(6,182,212,0.12)",
};

const THEMES = {
  dark: {
    ...SHARED,
    bg: "#060608", bgSub: "#0B0B0F",
    surface: "#111116", surfaceHover: "#16161D", surface2: "#1A1A22", elevated: "#1F1F29",
    border: "rgba(255,255,255,0.06)", borderLight: "rgba(255,255,255,0.10)",
    borderAccent: "rgba(99,102,241,0.25)",
    text: "#EDEDEF", textSecondary: "#8A8F98", textMuted: "#55586A", textDim: "#3D3F4E",
    headerBg: "#060608E6",
    stepCircleText: "#fff",
    glowOpacity: 0.5,
  },
  light: {
    ...SHARED,
    bg: "#F8F9FB", bgSub: "#FFFFFF",
    surface: "#FFFFFF", surfaceHover: "#F1F3F8", surface2: "#EEF0F5", elevated: "#FFFFFF",
    border: "rgba(0,0,0,0.08)", borderLight: "rgba(0,0,0,0.12)",
    borderAccent: "rgba(99,102,241,0.20)",
    text: "#1A1D27", textSecondary: "#5A6071", textMuted: "#8B90A0", textDim: "#B0B5C3",
    headerBg: "#F8F9FBE6",
    stepCircleText: "#fff",
    glowOpacity: 0.25,
  },
};

// Client colors — adjusted per theme for contrast
const CLIENT_COLORS_MAP = {
  dark: {
    blue: { main: "#3B82F6", dim: "rgba(59,130,246,0.12)", glow: "rgba(59,130,246,0.20)" },
    rose: { main: "#F43F5E", dim: "rgba(244,63,94,0.12)", glow: "rgba(244,63,94,0.20)" },
    purple: { main: "#A855F7", dim: "rgba(168,85,247,0.12)", glow: "rgba(168,85,247,0.20)" },
    green: { main: "#22C55E", dim: "rgba(34,197,94,0.12)", glow: "rgba(34,197,94,0.20)" },
    amber: { main: "#F59E0B", dim: "rgba(245,158,11,0.12)", glow: "rgba(245,158,11,0.20)" },
    gold: { main: "#EAB308", dim: "rgba(234,179,8,0.12)", glow: "rgba(234,179,8,0.20)" },
    cyan: { main: "#06B6D4", dim: "rgba(6,182,212,0.12)", glow: "rgba(6,182,212,0.20)" },
  },
  light: {
    blue: { main: "#2563EB", dim: "rgba(37,99,235,0.08)", glow: "rgba(37,99,235,0.12)" },
    rose: { main: "#E11D48", dim: "rgba(225,29,72,0.08)", glow: "rgba(225,29,72,0.12)" },
    purple: { main: "#9333EA", dim: "rgba(147,51,234,0.08)", glow: "rgba(147,51,234,0.12)" },
    green: { main: "#16A34A", dim: "rgba(22,163,74,0.08)", glow: "rgba(22,163,74,0.12)" },
    amber: { main: "#D97706", dim: "rgba(217,119,6,0.08)", glow: "rgba(217,119,6,0.12)" },
    gold: { main: "#CA8A04", dim: "rgba(202,138,4,0.08)", glow: "rgba(202,138,4,0.12)" },
    cyan: { main: "#0891B2", dim: "rgba(8,145,178,0.08)", glow: "rgba(8,145,178,0.12)" },
  },
};

// ─── SVG ICONS (Lucide-style) ───────────────────────────────────────────────
function Icon({ name, size = 18, color = "currentColor", style: s }) {
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    calendar: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>,
    map: <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></>,
    fileText: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    grid: <><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></>,
    plus: <><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronUp: <polyline points="18 15 12 9 6 15"/>,
    arrowLeft: <><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    copy: <><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    trendUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    barChart: <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>,
    crown: <><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></>,
    layout: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    briefcase: <><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    dollarSign: <><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    radio: <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></>,
    hash: <><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    gift: <><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></>,
    sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
    car: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></>,
    heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>,
    package: <><line x1="16.5" x2="7.5" y1="9.4" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></>,
    handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></>,
    compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...s }}>
      {paths[name] || null}
    </svg>
  );
}

// ─── ROADMAP DATA ───────────────────────────────────────────────────────────
function buildRoadmap(targetRevenue, themeKey = "dark") {
  const rev = parseInt(String(targetRevenue), 10) || 10000;
  const pal = THEMES[themeKey] || THEMES.dark;
  return [
    {
      phase: 1, name: "Fundament", icon: "layers",
      timeline: "Maand 1-3", color: pal.green, colorKey: "green",
      revenueTarget: Math.round(rev * 0.35),
      tagline: "Digitale basis, eerste betalende klanten, systemen opzetten",
      status: "active",
      goals: [
        "Google Business Profile 100% geoptimaliseerd",
        "Eerste 30-50 klanten via Founding Member deal",
        "WhatsApp Business + booking systeem live",
        "15+ Google reviews",
        "Content ritme: 3-4x per week actief",
      ],
      weeks: [
        { label: "Week 1-2", title: "Digitale basis", tasks: ["Google Business: foto's, uren, beschrijving, keywords", "WhatsApp Business: catalogus, welkomstbericht, auto-reply", "Instagram bio + highlights + eerste 9 posts", "Booking tool activeren (Fresha of Calendly)"] },
        { label: "Week 3-4", title: "Founding Member lancering", tasks: ["Founding Member deal: max 25 plekken, tijdlimiet", "Deel via Instagram Stories, WhatsApp status, Facebook buurtgroepen", "Eerste Meta Ad: \u20AC5-10/dag, gratis analyse als lead", "5 micro-influencers (1k-15k) benaderen voor gratis sessie"] },
        { label: "Week 5-8", title: "Content & Reviews", tasks: ["Content kalender live: ma/wo/vr/za vaste posting", "Before & after machine: toestemmingsformulier + foto's", "Review-systeem: automatisch WhatsApp 4u na afspraak", "Lokale outreach: 5 ondernemers bezoeken met intro"] },
        { label: "Week 9-12", title: "Eerste evaluatie + abonnement", tasks: ["Evalueren: boekingen per product, cost per lead", "Abonnement lanceren (Founding Members als eerste doelgroep)", "Meta Ad budget verhogen als CPL <\u20AC8", "Maand 3 target: \u20AC" + Math.round(rev * 0.35).toLocaleString("nl-NL") + " bereikt"] },
      ],
      channels: [
        { name: "Google Business", icon: "search", budget: "\u20AC0", intensity: 100, active: true, note: "Prioriteit #1 \u2014 lokale SEO basis" },
        { name: "Instagram Organisch", icon: "eye", budget: "\u20AC0", intensity: 90, active: true, note: "3-4x/week posten, focus op Reels" },
        { name: "WhatsApp Business", icon: "radio", budget: "\u20AC0", intensity: 85, active: true, note: "Primair contactkanaal, automations" },
        { name: "Meta Ads", icon: "activity", budget: "\u20AC150-300/mnd", intensity: 50, active: true, note: "Klein budget, Lead Gen campagne" },
        { name: "Lokale Outreach", icon: "mapPin", budget: "\u20AC0", intensity: 60, active: true, note: "5 partners benaderen in maand 1" },
        { name: "TikTok", icon: "hash", budget: "\u20AC0", intensity: 0, active: false, note: "Nog niet actief" },
        { name: "Google Ads", icon: "search", budget: "\u20AC0", intensity: 0, active: false, note: "Start in fase 2" },
        { name: "Email/Nieuwsbrief", icon: "fileText", budget: "\u20AC0", intensity: 0, active: false, note: "Start in fase 2" },
      ],
      kpis: [
        { label: "Nieuwe klanten", target: "30-50", icon: "users" },
        { label: "Google reviews", target: "15+", icon: "star" },
        { label: "Instagram followers", target: "200-500", icon: "trendUp" },
        { label: "Cost per lead (Meta)", target: "<\u20AC8", icon: "dollarSign" },
        { label: "Omzet", target: "\u20AC" + Math.round(rev * 0.35).toLocaleString("nl-NL"), icon: "barChart" },
      ],
    },
    {
      phase: 2, name: "Momentum", icon: "rocket",
      timeline: "Maand 4-6", color: pal.amber, colorKey: "amber",
      revenueTarget: Math.round(rev * 0.70),
      tagline: "Ads opschalen, abonnement groeit, systemen draaien automatisch",
      status: "upcoming",
      goals: [
        "Meta Ads budget naar \u20AC15-30/dag, retargeting live",
        "Google Ads live op zoekintentie keywords",
        "Membership model: 15-25 actieve abonnees",
        "TikTok account gestart (organisch bereik)",
        "E-mail/nieuwsbrief maandelijks actief",
      ],
      weeks: [
        { label: "Week 13-16", title: "Ads opschalen", tasks: ["Meta budget verhogen: \u20AC15/dag als CPL <\u20AC8", "A/B test: 2 creatives (before/after vs. video behandeling)", "Retargeting campagne: bezoekers zonder booking", "Aparte ad per product/Core Result met eigen angle"] },
        { label: "Week 17-20", title: "Google Ads + TikTok", tasks: ["Google Ads: \u20AC5-10/dag op zoekintentie keywords", "TikTok: raw video's van behandelingen/service", "Lookalike audiences op bestaande klanten (50+ leads nodig)", "Abonnement pitch verfijnen: besparing in euro's communiceren"] },
        { label: "Week 21-24", title: "Systemen automatiseren", tasks: ["E-mail nieuwsbrief maandelijks: tip + deal + story", "Verjaardagscampagne: automatisch WhatsApp in geboortemaand", "Refer-a-friend flow uitwerken (volle promotie start in fase 3)", "60-dagen heractivering: automatisch WhatsApp inactieve klanten"] },
      ],
      channels: [
        { name: "Google Business", icon: "search", budget: "\u20AC0", intensity: 100, active: true, note: "Actief houden, reviews blijven groeien" },
        { name: "Instagram Organisch", icon: "eye", budget: "\u20AC0", intensity: 85, active: true, note: "Consistent ritme, Reels prioriteit" },
        { name: "WhatsApp Business", icon: "radio", budget: "\u20AC0", intensity: 90, active: true, note: "Automations volledig live" },
        { name: "Meta Ads", icon: "activity", budget: "\u20AC450-900/mnd", intensity: 85, active: true, note: "Schalen + retargeting + per product" },
        { name: "Google Ads", icon: "search", budget: "\u20AC150-300/mnd", intensity: 60, active: true, note: "Start: zoekintentie keywords" },
        { name: "TikTok", icon: "hash", budget: "\u20AC0", intensity: 50, active: true, note: "Organisch starten, raw content" },
        { name: "Email/Nieuwsbrief", icon: "fileText", budget: "\u20AC20-50/mnd", intensity: 55, active: true, note: "Maandelijks: 1 tip + 1 deal" },
        { name: "Lokale Outreach", icon: "mapPin", budget: "\u20AC0", intensity: 40, active: true, note: "Partnerships onderhouden" },
      ],
      kpis: [
        { label: "Actieve abonnees", target: "15-25", icon: "crown" },
        { label: "Totale klanten", target: "80-120", icon: "users" },
        { label: "Google reviews", target: "30+", icon: "star" },
        { label: "MRR (abonnementen)", target: "\u20AC1.200-\u20AC3.700", icon: "activity" },
        { label: "Omzet", target: "\u20AC" + Math.round(rev * 0.70).toLocaleString("nl-NL"), icon: "barChart" },
      ],
    },
    {
      phase: 3, name: "Dominantie", icon: "crown",
      timeline: "Maand 7-9", color: pal.rose, colorKey: "rose",
      revenueTarget: Math.round(rev * 1.05),
      tagline: "Target bereikt, loyaliteitssysteem draait, lokale marktleider worden",
      status: "upcoming",
      goals: [
        "Revenue target bereikt en stabiel",
        "30+ actieve abonnees (vaste MRR)",
        "Loyaliteitsprogramma + referral machine actief",
        "Eerste high-ticket verkopen gerealiseerd",
        "Overweeg: tweede medewerker of uitbreiding",
      ],
      weeks: [
        { label: "Week 25-28", title: "Loyaliteit & Retentie", tasks: ["Loyaliteitssysteem lanceren (stempelkaart app of Fresha)", "Refer a friend actief promoten via WhatsApp blast", "High-ticket pitch aan loyale klanten (top 20%)", "Seizoenscampagne: bundel aanbieding met schaarste"] },
        { label: "Week 29-32", title: "High Ticket & Schaalslag", tasks: ["VIP/transformatietraject pitch verfijnen", "Testimonial campagne: 3 video testimonials als advertentie", "B2B outreach: bedrijven voor personeelsgeschenken/pakketten", "Omzetanalyse: welke behandeling/service heeft hoogste marge?"] },
        { label: "Week 33-36", title: "Optimaliseren & Uitbreiden", tasks: ["Capaciteitscheck: kan je meer klanten aan?", "Tweede behandelkamer of medewerker onderzoeken", "Google Ads budget verhogen op best presterende keywords", "Jaarplan Q4 opstellen"] },
      ],
      channels: [
        { name: "Google Business", icon: "search", budget: "\u20AC0", intensity: 100, active: true, note: "50+ reviews target, domineer lokaal" },
        { name: "Instagram Organisch", icon: "eye", budget: "\u20AC0", intensity: 88, active: true, note: "Organisch blijven bouwen naast paid" },
        { name: "Meta Ads", icon: "activity", budget: "\u20AC600-1.200/mnd", intensity: 90, active: true, note: "Video testimonials als beste creative" },
        { name: "Google Ads", icon: "search", budget: "\u20AC300-600/mnd", intensity: 80, active: true, note: "Schalen op best presterende keywords" },
        { name: "TikTok", icon: "hash", budget: "\u20AC0", intensity: 75, active: true, note: "Viral content strategie verfijnen" },
        { name: "WhatsApp Business", icon: "radio", budget: "\u20AC0", intensity: 95, active: true, note: "Loyaliteit + heractivering automations" },
        { name: "Email/Nieuwsbrief", icon: "fileText", budget: "\u20AC50/mnd", intensity: 70, active: true, note: "Maandelijks + seizoenscampagnes" },
        { name: "Referral Programma", icon: "handshake", budget: "\u20AC20 pp", intensity: 80, active: true, note: "\u20AC20 korting per doorverwezen klant" },
        { name: "B2B Partnerships", icon: "briefcase", budget: "\u20AC0", intensity: 55, active: true, note: "Bedrijven voor cadeaubonnen/pakketten" },
      ],
      kpis: [
        { label: "Actieve abonnees", target: "30-50", icon: "crown" },
        { label: "High ticket sales", target: "3-8/kwartaal", icon: "award" },
        { label: "Google reviews", target: "50+", icon: "star" },
        { label: "MRR (abonnementen)", target: "\u20AC2.400-\u20AC7.500", icon: "activity" },
        { label: "Omzet", target: "\u20AC" + Math.round(rev * 1.05).toLocaleString("nl-NL"), icon: "rocket" },
      ],
    },
    {
      phase: 4, name: "Schaalslag", icon: "zap",
      timeline: "Maand 10-12", color: pal.gold, colorKey: "gold",
      revenueTarget: Math.round(rev * 1.40),
      tagline: "Peak season, team uitbreiden, jaar 2 plannen",
      status: "upcoming",
      goals: [
        "Record omzet in november/december (cadeaubonnen + kerst)",
        "Tweede medewerker of locatie (als capaciteit vol)",
        "MRR stabiel als fundering voor groei",
        "Jaarreview: stop/start/meer analyse",
        "Jaar 2 plan uitschrijven met hogere targets",
      ],
      weeks: [
        { label: "Week 37-40", title: "Q4 Voorbereiding", tasks: ["Black Friday campagne voorbereiden (2-3 weken vooruit)", "Cadeaubon campagne: Sinterklaas + Kerst positioneren", "Seizoensgebonden bundels maken met schaarste + datum", "Jaar 2 eerste doelstellingen formuleren"] },
        { label: "Week 41-44", title: "Peak Season", tasks: ["Black Friday deal uitvoeren: 48-72u schaarste", "Cadeaubon push via WhatsApp blast + Meta Ads", "B2B: jaar-end geschenken voor bedrijven actief promoten", "Capaciteit bewaken: geen overboeking"] },
        { label: "Week 45-48", title: "Jaarafsluiting & Jaar 2", tasks: ["Kerst/Nieuwjaar campagne: 'Nieuw jaar, nieuwe start'", "Jaarreview: welke kanalen leverden beste ROI?", "Stoppen met wat niet werkt, verdubbelen op wat wel werkt", "Jaar 2 plan: nieuw target, uitbreiding, nieuw product?"] },
      ],
      channels: [
        { name: "Meta Ads", icon: "activity", budget: "\u20AC900-2.000/mnd", intensity: 100, active: true, note: "Peak budget voor Black Friday + Kerst" },
        { name: "Instagram Organisch", icon: "eye", budget: "\u20AC0", intensity: 82, active: true, note: "Peak content + UGC / testimonials" },
        { name: "Google Ads", icon: "search", budget: "\u20AC450-900/mnd", intensity: 90, active: true, note: "Seizoensgebonden keywords" },
        { name: "WhatsApp Business", icon: "radio", budget: "\u20AC0", intensity: 100, active: true, note: "Cadeaubon push + loyalty blast" },
        { name: "Email/Nieuwsbrief", icon: "fileText", budget: "\u20AC50/mnd", intensity: 85, active: true, note: "Kerst + jaarafsluiting campagnes" },
        { name: "B2B Partnerships", icon: "briefcase", budget: "\u20AC0", intensity: 90, active: true, note: "Jaar-end geschenken voor bedrijven" },
        { name: "TikTok", icon: "hash", budget: "\u20AC0", intensity: 70, active: true, note: "Seizoens content + viral momenten" },
        { name: "Google Business", icon: "search", budget: "\u20AC0", intensity: 80, active: true, note: "Actief houden tijdens drukke periode" },
        { name: "Referral Programma", icon: "handshake", budget: "\u20AC20 pp", intensity: 70, active: true, note: "Kerst: dubbele referral bonus" },
      ],
      kpis: [
        { label: "Record maandomzet (dec)", target: "\u20AC" + Math.round(rev * 1.6).toLocaleString("nl-NL"), icon: "award" },
        { label: "Cadeaubonnen verkocht", target: "30-60 stuks", icon: "gift" },
        { label: "MRR einde jaar", target: "\u20AC" + Math.round(rev * 0.45).toLocaleString("nl-NL"), icon: "activity" },
        { label: "Totale jaaromzet", target: "\u20AC" + Math.round(rev * 12 * 0.72).toLocaleString("nl-NL") + "+", icon: "dollarSign" },
        { label: "Jaar 2 target/maand", target: "\u20AC" + Math.round(rev * 1.5).toLocaleString("nl-NL"), icon: "rocket" },
      ],
    },
  ];
}

const MARKETING_CHANNELS = [
  { id: "google_biz", name: "Google Business", icon: "search", type: "Organisch", phases: [1,2,3,4], desc: "Basis van lokale vindbaarheid. Optimaliseer profiel, verzamel reviews, post updates.", cost: "Gratis", timeToResult: "2-4 weken", difficulty: "Laag" },
  { id: "instagram", name: "Instagram / Reels", icon: "eye", type: "Organisch", phases: [1,2,3,4], desc: "Portfolio en social proof machine. Reels zijn prioriteit voor organisch bereik.", cost: "Gratis", timeToResult: "4-8 weken", difficulty: "Medium" },
  { id: "whatsapp", name: "WhatsApp Business", icon: "radio", type: "Retentie", phases: [1,2,3,4], desc: "Primair contactkanaal. Booking, reminders, nazorg, reviews, heractivering.", cost: "Gratis", timeToResult: "Direct", difficulty: "Laag" },
  { id: "meta_ads", name: "Meta Ads (FB/IG)", icon: "activity", type: "Betaald", phases: [1,2,3,4], desc: "Lead Generation campagnes per Core Result. Start klein, schaal op basis van CPL.", cost: "\u20AC150-2.000/mnd", timeToResult: "1-2 weken", difficulty: "Medium" },
  { id: "tiktok", name: "TikTok Organisch", icon: "hash", type: "Organisch", phases: [2,3,4], desc: "Viral potentieel voor visuele diensten. Raw, authentieke content.", cost: "Gratis", timeToResult: "4-12 weken", difficulty: "Medium" },
  { id: "google_ads", name: "Google Ads (Search)", icon: "search", type: "Betaald", phases: [2,3,4], desc: "Zoekintentie traffic. Mensen die al zoeken naar jouw dienst.", cost: "\u20AC150-900/mnd", timeToResult: "1-3 weken", difficulty: "Hoog" },
  { id: "email", name: "Email/Nieuwsbrief", icon: "fileText", type: "Retentie", phases: [2,3,4], desc: "Maandelijkse nieuwsbrief: 1 tip + 1 deal + 1 verhaal.", cost: "\u20AC20-50/mnd", timeToResult: "2-6 maanden", difficulty: "Laag" },
  { id: "referral", name: "Referral Programma", icon: "handshake", type: "Organisch", phases: [3,4], desc: "\u20AC20 korting voor beide partijen bij doorverwezen nieuwe klant.", cost: "\u20AC20 pp", timeToResult: "Direct", difficulty: "Laag" },
  { id: "b2b", name: "B2B Partnerships", icon: "briefcase", type: "Organisch", phases: [3,4], desc: "Bedrijven benaderen voor personeelsgeschenken, pakketten en samenwerking.", cost: "Gratis", timeToResult: "1-3 maanden", difficulty: "Medium" },
  { id: "local", name: "Lokale Outreach", icon: "mapPin", type: "Organisch", phases: [1,2], desc: "5 lokale ondernemers bezoeken: kapper, gym, boetiek. Cross-promotie.", cost: "Gratis", timeToResult: "2-6 weken", difficulty: "Medium" },
];

// ─── CLIENTS DATA ───────────────────────────────────────────────────────────
const CLIENTS = [
  {
    id: "auto", name: "Ridaa Auto", type: "Autoservice / Dealership",
    location: "Nederland", owner: "Ridaa",
    products: "Aankoopbegeleiding, Diagnose, APK, Onderhoud, Reparatie, Abonnement",
    audience: "Autobezitters die controle willen over hun auto-uitgaven zonder verrast te worden",
    targetRevenue: "15000", currentRevenue: "0", status: "Startend",
    dreamGoal: "Genieten van je auto, zonder stress, onverwachte kosten of onzekerheid \u2014 met alles onder controle.",
    modelName: "Slimme Autobezitter Methode\u2122", notes: "",
    colorKey: "blue", icon: "car",
    frameworks: [
      { id: "start", icon: "search", name: "Slimme Start", subtitle: "Aankoopbegeleiding", colorKey: "blue",
        description: "De juiste auto kopen zonder spijt of verborgen gebreken \u2014 van orientatie tot handtekening.",
        steps: ["Orienteren", "Beoordelen", "Onderhandelen", "Afronden"],
        freeValue: ["Occasion-checklist (PDF)", "Mini video: '5-minuten aankoopscan'"],
        lowTicket: ["Aankoopscan / Occasion-check voor \u20AC29"],
        coreOffer: ["Persoonlijke aankoopbegeleiding of aankoopdiagnose \u2014 meegaan naar auto (\u20AC150-\u20AC250)"],
        highTicket: ["Volledige aankoopservice 'Slimme Start Pakket' incl. begeleiding, papierwerk, onderhandelen (\u20AC500+)"],
        microFrameworks: [
          { name: "Orientatie & Selectie", icon: "search", steps: ["Vragenlijst: budget, gebruik, wensen vaststellen", "Top 3 modellen shortlisten op basis van profiel", "Occasion-checklist meesturen per mail", "Video: '5 dingen die dealers je niet vertellen'"] },
          { name: "Aankoopscan", icon: "eye", steps: ["Visuele inspectie + BOVAG checklist", "Technische check: motor, remmen, banden, vloeistoffen", "Kentekenbewijs + historiecheck (RDW)", "Mondelinge toelichting + schriftelijk rapport"] },
          { name: "Onderhandelen & Afronden", icon: "fileText", steps: ["Onderhandelingsstrategie bepalen op basis van bevindingen", "Maximaalprijs berekenen + NWWT-argument opbouwen", "Papierwerk controleren: koopcontract, garantie, NAP", "Overdrachtsmoment begeleiden indien gewenst"] },
        ]
      },
      { id: "inzicht", icon: "eye", name: "Inzicht & Begrip", subtitle: "Diagnose & Kennis", colorKey: "amber",
        description: "Begrijpen wat er met je auto aan de hand is \u2014 en nooit meer betalen voor iets wat je niet snapt.",
        steps: ["Signaal herkennen", "Diagnose", "Uitleg", "Beslissing"],
        freeValue: ["Dashboard-lampjes gids (PDF)", "Mini-gids: 'Wat betekent dat lampje?'"],
        lowTicket: ["Diagnose Scan voor \u20AC19"],
        coreOffer: ["Volledige diagnose met uitlegrapport (\u20AC75-\u20AC120)"],
        highTicket: ["AutoCoach Jaarplan: 1-op-1 uitleg + diagnoseplanning"],
        microFrameworks: [
          { name: "Symptoom Diagnose", icon: "activity", steps: ["OBD-uitlezen + foutencoderapport", "Fysieke inspectie op klacht", "Foto + videodocumentatie", "Prioritering: urgent / planbaar / informatief"] },
          { name: "Klant Uitleg Systeem", icon: "fileText", steps: ["Bevinding in begrijpelijke taal uitleggen", "Kosteninschatting + alternatief advies", "Beslissingsmatrix: repareren vs. verkopen", "Schriftelijk rapport meegeven"] },
        ]
      },
      { id: "kosten", icon: "dollarSign", name: "Voorspelbare Kosten", subtitle: "Onderhoud & Budget", colorKey: "green",
        description: "Onderhoud plannen, kosten beheersen en nooit meer verrast worden door een grote rekening.",
        steps: ["Plannen", "Begroten", "Uitvoeren", "Evalueren"],
        freeValue: ["E-book: '10 Slimme Gewoontes die Elke Autobezitter Moet Weten'", "Onderhoudskalender template (PDF)"],
        lowTicket: ["Wintercheck voor \u20AC24", "Oliebeurt + filter voor \u20AC99"],
        coreOffer: ["Onderhoudsbeurt / reparatie / APK-combideal (\u20AC150-\u20AC400)"],
        highTicket: ["Onderhoudsabonnement (\u20AC30-\u20AC50/maand) of All-in Jaarservice"],
        microFrameworks: [
          { name: "Onderhoudsplanning", icon: "calendar", steps: ["Onderhoudshistorie ophalen via kenteken", "Kalender per klant opstellen", "Herinnering instellen via WhatsApp/mail", "Jaarlijkse check: wat komt er aan?"] },
          { name: "Abonnement Model", icon: "crown", steps: ["Basisabonnement: APK + oliebeurt (\u20AC30/maand)", "Premium: alles incl. reparatiekorting (\u20AC50/maand)", "Pitch: 'gemiddelde autobezitter bespaart \u20ACX per jaar'", "MRR als stabiele omzetbasis"] },
        ]
      },
      { id: "partners", icon: "handshake", name: "Eerlijke Partners", subtitle: "Transparantie & Vertrouwen", colorKey: "rose",
        description: "Altijd weten wat er gedaan wordt, waarom, en wat het kost \u2014 geen verrassingen.",
        steps: ["Transparantie", "Vertrouwen", "Vaste relatie", "Loyaliteit"],
        freeValue: ["Checklist: 'Hoe herken je een eerlijke garage?'", "Factuuranalyse voorbeeldrapport"],
        lowTicket: ["Gratis Factuuranalyse of kleine check voor \u20AC9-\u20AC19"],
        coreOffer: ["Onderhoud & reparatie met vaste pakketten en transparante tarieven"],
        highTicket: ["Loyaliteitsprogramma / vaste klantenkorting / VIP onderhoudspas"],
        microFrameworks: [
          { name: "Factuuranalyse Service", icon: "fileText", steps: ["Klant stuurt factuur via WhatsApp of mail", "Analyse: correct? Te duur? Onnodig?", "Feedbackrapport binnen 24u", "Lead magnet voor vertrouwen"] },
          { name: "Transparantie Systeem", icon: "eye", steps: ["Foto's voor/tijdens reparatie standaard", "Videotoelichting per WhatsApp", "Vaste prijslijst op website", "Nooit meerwerk zonder goedkeuring"] },
        ]
      },
      { id: "zorgeloos", icon: "shield", name: "Zorgeloos Rijden", subtitle: "Premium Zekerheid", colorKey: "gold",
        description: "De ultieme staat: rijden zonder zorgen, met een vertrouwde partner die alles regelt.",
        steps: ["Zekerheid", "Comfort", "Prioriteit", "Lidmaatschap"],
        freeValue: ["Checklist: 'Altijd Klaar Checklist' (seizoensgebonden)", "Gratis community of nieuwsbrief"],
        lowTicket: ["1-maand gratis proeflidmaatschap 'Slimme Autobezitter Club'"],
        coreOffer: ["Premium onderhoudsplan (jaarplan of halfjaarplan)"],
        highTicket: ["All-in membership 'Zorgeloos Rijden Pakket' (\u20AC500-\u20AC1.000/jaar)"],
        microFrameworks: [
          { name: "Slimme Autobezitter Club", icon: "award", steps: ["Maandelijks nieuwsbrief: tips, recalls, seizoenstips", "Exclusieve ledenprijzen op onderhoud", "Prioriteit planning: leden voor vaste klanten", "Community: vragen stellen, ervaringen delen"] },
          { name: "All-in Membership", icon: "sparkles", steps: ["Jaarplan: alles voor vaste prijs", "Inclusief: APK, oliebeurten, remcheck, bandencheck", "Bonus: 1x gratis diagnose per jaar", "Hoge retentie: lage opzegkans door hoge waarde"] },
        ]
      },
    ]
  },
  {
    id: "beauty", name: "Bloom Beauty Studio", type: "Schoonheidssalon",
    location: "Amsterdam", owner: "Sarah",
    products: "IPL Behandeling, Japanese Head Spa, Micro Needling, Massage",
    audience: "Vrouwen 25-50, bewust bezig met huidverzorging en welzijn \u2014 vaak overweldigd door keuze tussen behandelingen en het willen van een duidelijke route",
    targetRevenue: "10000", currentRevenue: "0", status: "Startend",
    dreamGoal: "Altijd stralend, verzorgd en zelfverzekerd eruitzien \u2014 met een helder, persoonlijk plan zodat je precies weet welke behandelingen en volgorde bij jouw huid en doelen passen, zonder giswerk.",
    modelName: "Glow Growth Methode\u2122", notes: "",
    colorKey: "rose", icon: "heart",
    frameworks: [
      { id: "huid", icon: "star", name: "Stralende Huid", subtitle: "Zichtbaar resultaat dat je in de spiegel ziet", colorKey: "rose",
        description: "De klant ziet en voelt dat haar huid er beter uitziet \u2014 gladder, egaler, stralender. Resultaat dat je niet kunt missen.",
        steps: ["Huidprobleem herkennen", "Juiste behandeling kiezen", "Resultaat zien", "Resultaat behouden"],
        freeValue: ["PDF: '5 Dagelijkse Gewoontes voor een Stralende Huid (Zonder Dure Producten)'", "Mini-video serie: 'Huidtype Test \u2014 Ontdek in 60 Seconden Wat Jouw Huid Nodig Heeft' (Instagram Reel)"],
        lowTicket: ["Online huidanalyse + persoonlijk adviesrapport via WhatsApp (\u20AC15)", "Proef Head Spa (30 min) voor \u20AC29 \u2014 alleen te boeken via link in bio"],
        coreOffer: ["IPL behandeling (\u20AC170)", "Micro Needling sessie (\u20AC150)", "Japanese Head Spa compleet (\u20AC100)"],
        highTicket: ["Glow Pakket: 3x IPL + 1x Micro Needling (\u20AC599 i.p.v. \u20AC790)", "6-Maanden Huidtransformatie Traject: persoonlijk plan + 8 behandelingen (\u20AC1.200)"],
        microFrameworks: [
          { name: "Before & After Machine", icon: "eye", steps: ["Toestemmingsformulier + foto protocol bij elke behandeling", "Before/after foto's als content: Reels, Stories, carrousel posts", "Resultaat-tijdlijn per behandeling: 'Na 1 sessie vs. na 3 sessies'", "Klant-testimonial video (30 sec) bij elke grote transformatie"] },
          { name: "Behandelplan Systeem", icon: "calendar", steps: ["Huidanalyse bij eerste bezoek: type, probleem, doel vastleggen", "Persoonlijk behandelplan: welke behandelingen, hoe vaak, welke volgorde", "Verwachtingsmanagement: 'Na sessie 1 zie je X, na sessie 3 zie je Y'", "Opvolging via WhatsApp: foto-check 2 weken na behandeling"] },
        ]
      },
      { id: "vertrouwen", icon: "shield", name: "In Goede Handen", subtitle: "Weten dat je bij een expert zit", colorKey: "amber",
        description: "De klant voelt zich veilig en begrepen \u2014 ze weet dat haar specialist verstand van zaken heeft en eerlijk adviseert, niet verkoopt.",
        steps: ["Twijfel wegnemen", "Expert herkennen", "Advies vertrouwen", "Overgeven"],
        freeValue: ["FAQ video serie: 'Is IPL Pijnlijk?', 'Past Micro Needling Bij Mij?', 'Hoe Werkt een Head Spa?' (TikTok/Reels)", "Skin Type Quiz: 'Ontdek Jouw Huidtype + Persoonlijk Advies' (via Instagram Stories, leidt naar DM)"],
        lowTicket: ["Kennismakingsgesprek + mini-analyse via videocall (\u20AC0 \u2014 lead magnet, pakt contactgegevens)", "Eerste behandeling naar keuze met \u20AC20 korting (alleen via online booking link)"],
        coreOffer: ["Behandeling naar keuze: massage \u20AC80 / head spa \u20AC100 / IPL \u20AC170", "Founding Member deal: 2 behandelingen voor \u20AC99 (max 25 plekken, tijdlimiet)"],
        highTicket: ["Persoonlijk Transformatie Consult + op maat gemaakt jaarprogramma (\u20AC250 intake, verrekend bij pakket)"],
        microFrameworks: [
          { name: "Expert Content Systeem", icon: "award", steps: ["Wekelijkse educatieve post: 1 huidtip, 1 mythbuster, 1 behandeling uitleg", "FAQ-content per behandeling: bezwaren wegnemen v\u00F3\u00F3r ze ontstaan", "Instagram Highlights per behandeling: Wat is het? Voor wie? Resultaat? Prijs?", "Autoriteit: certificaten tonen, trainingen delen, leveranciers benoemen"] },
          { name: "Social Proof Machine", icon: "star", steps: ["30+ Google reviews target in eerste 3 maanden", "Instagram Highlights: 'Resultaten' album met before/after", "Video-testimonials 30 sec: klant vertelt in eigen woorden", "WhatsApp reviews als screenshot content (met toestemming)"] },
        ]
      },
      { id: "ontspanning", icon: "heart", name: "Even Helemaal Loslaten", subtitle: "Me-time zonder schuldgevoel", colorKey: "purple",
        description: "De klant kiest bewust voor zichzelf \u2014 even weg van de dagelijkse drukte, volledig ontspannen, en er verfrist uitkomen.",
        steps: ["Behoefte voelen", "Toestemming geven", "Onderdompelen", "Herladen"],
        freeValue: ["PDF: 'Jouw 10-Minuten Avondroutine voor Ultieme Ontspanning (Thuis)'", "Guided audio: '5-Minuten Gezichtsmassage Die Je Zelf Kunt Doen' (gratis via link in bio)"],
        lowTicket: ["Intro massage 30 min voor \u20AC39 (alleen eerste bezoek, via online booking link)", "Ontspannings-duoticket: neem een vriendin mee, 2e persoon 50% korting (\u20AC59 totaal)"],
        coreOffer: ["Japanese Head Spa compleet 60 min (\u20AC100)", "Signature Relaxation Treatment: massage + gezichtsbehandeling 90 min (\u20AC140)"],
        highTicket: ["Glow Membership: 1 behandeling per maand + 10% korting (\u20AC79/maand)", "Premium Membership: keuze uit alle behandelingen incl. IPL (\u20AC149/maand)"],
        microFrameworks: [
          { name: "Beleving in de Salon", icon: "sparkles", steps: ["Sfeer: verlichting, muziek, geur \u2014 zintuiglijke ervaring vanaf de deur", "Welkomstritueel: thee/water + kort intakegesprek bij elke afspraak", "Geen haast: 10 min extra ingepland zodat klant rustig kan aankleden", "Nazorg: product sample + persoonlijke tip meegeven bij vertrek"] },
          { name: "Me-Time Marketing", icon: "gift", steps: ["Content angle: 'Je verdient dit' \u2014 selfcare is geen luxe, het is noodzaak", "Instagram: aesthetic Reels van behandelingen (ASMR, close-ups, sfeer)", "Seizoenscampagnes: 'Winter Wellness Weken', 'Zomer Glow Prep'", "Cadeaubon campagne: Moederdag, Kerst, Valentijn \u2014 'Geef ontspanning cadeau'"] },
        ]
      },
      { id: "budget", icon: "dollarSign", name: "Voorspelbaar Mooi", subtitle: "Weten wat het kost, zonder verrassingen", colorKey: "green",
        description: "De klant weet precies wat ze uitgeeft, kan het inplannen in haar budget, en voelt zich nooit gepusht om meer te kopen dan ze wil.",
        steps: ["Prijs weten", "Vergelijken", "Passen in budget", "Vooruit plannen"],
        freeValue: ["Complete prijslijst als PDF download via website/Instagram bio", "Calculator: 'Wat Kost Jouw Glow Traject? Bereken het in 30 Seconden' (online tool/Instagram)"],
        lowTicket: ["Founding Member deal: 2 behandelingen \u20AC99 (max 25 plekken \u2014 alleen online claimbaar)", "Eerste bezoek voucher: \u20AC15 korting op elke behandeling (via Meta Ad lead form)"],
        coreOffer: ["Behandelingspakketten met vaste prijs: 3x Head Spa \u20AC249 (bespaar \u20AC51)", "3x IPL pakket \u20AC399 (bespaar \u20AC111)"],
        highTicket: ["Glow Membership \u20AC79/maand: 1 behandeling + 10% op extra's (voorspelbaar maandbedrag)", "All-in Jaarplan: 12 behandelingen + 2 gratis + 15% productkorting (\u20AC1.800)"],
        microFrameworks: [
          { name: "Transparante Pricing", icon: "eye", steps: ["Alle prijzen online: website, Instagram highlight, Google Business", "Geen verborgen kosten \u2014 prijs op site = prijs die je betaalt", "Besparingsberekening bij pakketten: 'Je bespaart \u20ACX ten opzichte van losse sessies'", "Betaalgemak: pinnen, tikkie, in termijnen bij grote pakketten"] },
          { name: "Abonnement & Pakketten", icon: "crown", steps: ["Membership pitch bij 2e bezoek: 'Je komt toch elke maand \u2014 dit bespaart je \u20ACX/jaar'", "Pakketten als standaard aanbod: altijd 3-pack en 6-pack naast losse prijs", "Seizoenspakketten: 'Zomer Glow Prep 3-pack' als limited offer", "Corporate wellness: pakketten voor bedrijven als personeelsvoordeel"] },
        ]
      },
      { id: "zelfverzekerd", icon: "crown", name: "Zelfverzekerd Stralen", subtitle: "Elke dag mooi voelen, van binnen en buiten", colorKey: "gold",
        description: "De ultieme staat: de klant voelt zich zelfverzekerd, mooi en in controle over hoe ze eruitziet \u2014 niet afhankelijk van make-up of een goede dag.",
        steps: ["Bewustwording", "Investering", "Transformatie", "Nieuw zelfbeeld"],
        freeValue: ["E-book: 'Van Onzeker Over Je Huid Naar Stralend Zonder Make-up \u2014 Het 90-Dagen Plan'", "Instagram Story serie: 'Klant Transformaties \u2014 Hoe Sarah van X naar Y ging in 3 Maanden'"],
        lowTicket: ["Gratis telefonisch consult: 'Vertel me je huidverhaal' (15 min, via Calendly \u2014 pakt contactgegevens)", "Mini Glow Treatment: gezichtsreiniging + masker (\u20AC35, alleen via Instagram link)"],
        coreOffer: ["Combi IPL + Micro Needling pakket (\u20AC750)", "Persoonlijk Glow Traject: 4 behandelingen op maat + thuisroutine plan (\u20AC499)"],
        highTicket: ["VIP Transformatietraject 6 maanden: 12 behandelingen + persoonlijk plan + maandelijks consult (\u20AC1.500+)", "Jaarplan All-in: onbeperkt massage/head spa + 6x IPL + 4x needling (\u20AC2.000)"],
        microFrameworks: [
          { name: "Transformatie Traject", icon: "rocket", steps: ["Intake consult: huidanalyse + doelen + foto dag 1", "Op maat behandelplan: welke combinatie levert het snelste resultaat?", "Maandelijkse check-in: foto vergelijking + plan bijsturen", "Eindresultaat: before/after + testimonial (met toestemming = content)"] },
          { name: "Cadeaubon & Gifting Motor", icon: "gift", steps: ["Digitale cadeaubon via WhatsApp: makkelijk te delen", "Seizoenscampagnes: Moederdag, Kerst, Valentijn, Verjaardagen", "B2B: personeelsgeschenken, kerstpakketten voor bedrijven", "'Geef Zelfvertrouwen Cadeau' als messaging angle"] },
        ]
      },
    ]
  },
  {
    id: "horeca_ma", name: "Horeca Marokko", type: "Restaurant / Caf\u00E9 (Concept TBD)",
    location: "Marokko", owner: "TBD",
    products: "Dine-in, Delivery (Glovo), Catering, Private Events, Iftar Service, Toeristische Ervaringen",
    audience: "Lokale stamgasten (60-70%), internationale toeristen, expats & digital nomads, zakelijke klanten",
    targetRevenue: "80000", currentRevenue: "0", status: "Concept Fase",
    dreamGoal: "Elke keer weer die perfecte plek vinden \u2014 heerlijk eten, warmte voelen, herinneringen maken, en altijd welkom zijn alsof je thuiskomt.",
    modelName: "Tafel Vol Geluk Methode\u2122", notes: "Concept nog te bepalen. Mogelijke richtingen: modern Marokkaans restaurant, rooftop caf\u00E9, fusion concept, street food concept opgeschaald, of experience dining (kookworkshops + eten). Locatiestrategie: start in lokale wijk, bouw merk via social, expandeer naar toeristisch gebied. Valuta: MAD (Marokkaanse Dirham). Target in MAD: ~80.000 MAD/maand.",
    colorKey: "amber", icon: "sparkles",
    frameworks: [
      { id: "smaak", icon: "star", name: "Authentieke Smaak", subtitle: "Echt, eerlijk, onvergetelijk lekker", colorKey: "amber",
        description: "De klant ervaart bij elk bezoek consistente, authentieke smaken die nergens anders zo goed zijn \u2014 gerechten waar je voor terugkomt.",
        steps: ["Ontdekken", "Proeven", "Herkennen", "Verlangen"],
        freeValue: ["PDF: '5 Geheime Kruidencombinaties uit de Marokkaanse Keuken'", "Mini-video serie: 'Hoe Herken Je Echte Tagine vs. Toeristen-Tagine' (Instagram/TikTok)"],
        lowTicket: ["Digitaal receptenboekje: '10 Signature Recepten van Onze Chef' (29 MAD)", "Proefplank voor 2: 5 mini-gerechten om de kaart te ontdekken (49 MAD)"],
        coreOffer: ["Compleet Marokkaans diner voor 2 (250-400 MAD)", "Dagschotel + drankje lunchformule (80-120 MAD)"],
        highTicket: ["5-gangen Chef's Tasting Menu met wijnpairing (500 MAD p.p.)", "Seizoensgebonden Private Tagine Tafel voor 6 (1.500 MAD)"],
        microFrameworks: [
          { name: "Signature Gerechten Systeem", icon: "star", steps: ["3-5 signature dishes ontwikkelen die nergens anders bestaan", "Elk signature gerecht heeft een verhaal (herkomst, traditie, familie)", "Consistente kwaliteit: recepturen vastleggen op gram-niveau", "Seizoensmenu naast vaste kaart: schaarste + nieuwsgierigheid"] },
          { name: "Smaakbeleving Design", icon: "eye", steps: ["Presentatie: elk bord is foto-waardig (kleuren, textuur, hoogte)", "Geur als eerste indruk: open keuken, verse kruiden, versgebakken brood", "Proeverij als verkooptool: 'Chef raadt aan' mini-proefbord bij twijfel", "Ingredi\u00EBnten verhaal op menukaart: waar komt het vandaan?"] },
        ]
      },
      { id: "welkom", icon: "heart", name: "Warm Welkom", subtitle: "Gezien, gewaardeerd, als familie", colorKey: "rose",
        description: "Vanaf het moment dat je binnenkomt voel je je gezien en welkom \u2014 niet als klant, maar als gast die ertoe doet.",
        steps: ["Binnenkomst", "Herkenning", "Persoonlijke aandacht", "Warm afscheid"],
        freeValue: ["Video tour: 'Kijk Binnen in Onze Keuken & Ontmoet het Team' (60 sec Reel)", "Quiz: 'Welk Marokkaans Gerecht Past Bij Jou?' (Instagram Story quiz, leidt naar DM)"],
        lowTicket: ["Eerste bezoek voucher: gratis welkomstthee + amuse bij reservering via Instagram (0 MAD, pakt contactgegevens)", "Intro-deal: 2 hoofdgerechten voor de prijs van 1 bij eerste bezoek (alleen via link in bio)"],
        coreOffer: ["Familie-tafel: gedeeld menu voor 4-8 personen (500-900 MAD)", "Verjaardags-arrangement: taart + decoratie + foto (350 MAD)"],
        highTicket: ["Private dining room met persoonlijke gastheer (2.000+ MAD)", "Bruiloft/feest catering met volledige service (vanaf 25.000 MAD)"],
        microFrameworks: [
          { name: "Welkomst Ritueel", icon: "heart", steps: ["Deur openhouden + oogcontact + 'Marhba bik' bij binnenkomst", "Muntthee serveren binnen 60 seconden na plaatsnemen", "Naam onthouden van terugkerende gasten (notities in reserveringssysteem)", "Kinderen actief verwelkomen: ouders ontspannen = langere tafel + meer besteding"] },
          { name: "Afscheid & Herinnering", icon: "gift", steps: ["Bedankkaartje met handgeschreven 'Shukran' bij rekening", "Kleine meeneem-attentie: koekje, snoepje of munt voor onderweg", "Foto-moment aanbieden bij speciale gelegenheden", "'Tot snel!' + QR-code naar Google review op afscheidskaartje"] },
        ]
      },
      { id: "gemak", icon: "shield", name: "Zorgeloos Genieten", subtitle: "Makkelijk, eerlijk, geen verrassingen", colorKey: "green",
        description: "De klant hoeft nergens over na te denken \u2014 reserveren is simpel, prijzen zijn eerlijk, en alles klopt gewoon.",
        steps: ["Vinden", "Reserveren", "Bestellen", "Betalen"],
        freeValue: ["Volledige menukaart met prijzen als PDF download (geen verrassingen)", "Mini-gids: 'Waar Eet Je het Beste in [Stad]? Insider Tips' (PDF via Instagram bio)"],
        lowTicket: ["Early bird voucher: 15% korting bij reservering voor 18:00 (alleen online te claimen)", "Eerste delivery gratis bezorging via WhatsApp bestelling"],
        coreOffer: ["All-in formules: starter + hoofd + dessert + drankje (150-250 MAD)", "Delivery via Glovo/eigen WhatsApp (80-120 MAD)"],
        highTicket: ["Maandelijks lunch-abonnement voor kantoren: 20 maaltijden (2.500 MAD/maand)", "Corporate stamgast-pas: 20% korting + prioriteit reservering (500 MAD/kwartaal)"],
        microFrameworks: [
          { name: "Frictionless Booking", icon: "calendar", steps: ["WhatsApp Business: stuur 'Tafel voor 2 vanavond' = bevestiging binnen 5 min", "Google reserveer-knop actief op Google Business profiel", "Instagram bio link naar direct reserveren", "Automatische herinnering 4u voor reservering via WhatsApp"] },
          { name: "Transparante Ervaring", icon: "eye", steps: ["Menu met duidelijke prijzen online + in zaak (AR/FR/EN)", "Geen verborgen servicekosten \u2014 prijs = prijs", "Allergenen en dieetwensen duidelijk aangegeven per gerecht", "Betaalopties: cash, kaart, mobiel \u2014 alles werkt, geen gedoe"] },
          { name: "Delivery & Thuis", icon: "package", steps: ["Glovo profiel met professionele foto's en duidelijke menu", "Eigen WhatsApp delivery in directe omgeving (geen commissie)", "Delivery menu: hoge-marge items die goed reizen (wraps, bowls, tagine)", "Iftar-box voor thuis tijdens Ramadan: compleet voor 2-4 personen"] },
        ]
      },
      { id: "momenten", icon: "sparkles", name: "Bijzondere Momenten", subtitle: "De perfecte plek voor herinneringen", colorKey: "blue",
        description: "Voor verjaardagen, date nights, familiefeesten of gewoon een avond die je niet vergeet \u2014 hier worden herinneringen gemaakt.",
        steps: ["Aanleiding", "Verwachting", "Beleving", "Herinnering"],
        freeValue: ["PDF: '10 Idee\u00EBn voor een Onvergetelijke Date Night in [Stad]'", "Instagram highlight: 'Zo Vieren Onze Gasten' (user generated content album)"],
        lowTicket: ["Date night teaser: boek via link en ontvang gratis dessert voor 2 (alleen online)", "Kookworkshop preview: gratis 10-min video 'Maak Thuis je Eigen Msemen' (leidt naar volledige workshop)"],
        coreOffer: ["Date night arrangement: 4-gangen + kaars + muziek (400 MAD voor 2)", "Kookworkshop + diner: zelf je tagine maken (500 MAD p.p.)"],
        highTicket: ["Private rooftop dinner met live muziek voor groepen (3.000+ MAD)", "Complete event hosting: bruiloft, verjaardag, corporate (15.000+ MAD)"],
        microFrameworks: [
          { name: "Seizoen & Event Kalender", icon: "calendar", steps: ["Ramadan: iftar menu + sfeerverlichting + speciale openingstijden", "Zomer: terras opening event, zomerse kaart, live muziek vrijdagavond", "Koningsdag/nationale feestdagen: speciaal thema-menu", "Kerst/NYE: exclusief eindejaars-menu met reservering-only"] },
          { name: "Experience Design", icon: "layout", steps: ["Interieur met 2-3 'Instagrammable' fotospots (muren, verlichting, details)", "Live Gnawa/jazz muziek op weekend-avonden", "Chef's table: koken voor je ogen met uitleg en verhaal", "Kookworkshop voor toeristen: marktbezoek + koken + samen eten (Viator/Airbnb)"] },
        ]
      },
      { id: "thuis", icon: "crown", name: "Tweede Thuis", subtitle: "Meer dan een gast \u2014 je hoort erbij", colorKey: "gold",
        description: "De ultieme staat: je voelt je hier zo thuis dat je het aan iedereen aanraadt, altijd terugkomt, en onderdeel bent van de community.",
        steps: ["Herkenning", "Ritueel", "Community", "Ambassadeur"],
        freeValue: ["WhatsApp community: 'Vrienden van [Naam]' \u2014 join via link in bio voor exclusieve previews en deals", "Wekelijkse nieuwsbrief: 1 recept + 1 verhaal + 1 deal (e-mail opt-in via QR-code)"],
        lowTicket: ["Stempelkaart digitaal (via WhatsApp): 10e bezoek = gratis hoofdgerecht", "Verjaardagsdeal: claim via WhatsApp in je geboortemaand = gratis dessert"],
        coreOffer: ["Stamgast pas: 15% korting + prioriteit + verrassingen (200 MAD/jaar)", "Catering abonnement: wekelijkse levering voor kantoor/thuis (vanaf 1.500 MAD/maand)"],
        highTicket: ["VIP Membership: maandelijks chef's table + 20% korting + events (5.000 MAD/jaar)", "Founding Member: levenslang 25% korting + naamplaat op 'Wall of Fame' (10.000 MAD eenmalig)"],
        microFrameworks: [
          { name: "Stamgast Herkenning", icon: "user", steps: ["Naam en voorkeuren bijhouden in reserveringssysteem", "'Uw vaste tafel?' \u2014 terugkerende gasten krijgen hun plek", "Persoonlijk WhatsApp bericht bij nieuw seizoensmenu: 'Dit moet je proeven'", "Verjaardag/jubileum herinnering: automatisch felicitatie + aanbieding"] },
          { name: "Community & Ambassadeurs", icon: "handshake", steps: ["'Breng een vriend' actie: beide krijgen gratis dessert", "Instagram tag actie: tag + deel foto = kans op gratis diner voor 2", "Google review beloning: review schrijven = gratis koffie bij volgend bezoek", "Trouwe gasten uitnodigen voor exclusieve menu previews en proeverijen"] },
        ]
      },
    ]
  },
];

const STORAGE_CLIENTS_KEY = "mt-marketing-clients-v1";
const STORAGE_ACTIVE_ID_KEY = "mt-marketing-active-client-id";
const STORAGE_THEME_KEY = "mt-marketing-theme";
const STORAGE_SYNC_TOKEN_KEY = "mt-marketing-sync-token";

function loadSyncToken() {
  try {
    return localStorage.getItem(STORAGE_SYNC_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function loadStoredClients() {
  try {
    const raw = localStorage.getItem(STORAGE_CLIENTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every(c => c && typeof c.id === "string")) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadStoredActiveId() {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    return typeof raw === "string" && raw.length ? raw : null;
  } catch {
    return null;
  }
}

function loadStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_THEME_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch { /* ignore */ }
  return "dark";
}

function getInitialClientsAndActiveId() {
  const stored = loadStoredClients();
  const aid = loadStoredActiveId();
  if (stored && aid && stored.some(c => c.id === aid)) {
    return { clients: stored, activeId: aid };
  }
  if (stored) {
    return { clients: stored, activeId: stored[0].id };
  }
  return { clients: CLIENTS, activeId: "auto" };
}

function mergeClientsById(existing, incoming) {
  const map = new Map(existing.map(c => [c.id, c]));
  for (const c of incoming) {
    map.set(c.id, c);
  }
  return Array.from(map.values());
}

const TABS = [
  { id: "profiel", label: "Profiel", icon: "user" },
  { id: "ai-setup", label: "AI Klant-setup", icon: "sparkles" },
  { id: "resultaat", label: "Droomresultaat", icon: "target" },
  { id: "matrix", label: "Value Matrix", icon: "grid" },
  { id: "drivers", label: "Primary Drivers", icon: "compass" },
  { id: "roadmap", label: "Roadmap", icon: "calendar" },
  { id: "funnel", label: "Funnel Map", icon: "map" },
  { id: "prompt", label: "Master Prompt", icon: "fileText" },
];

/** Primary drivers: diepe motieven achter koopgedrag — elk valt onder één van drie hoofdcategorieën. */
const PRIMARY_DRIVER_CATEGORIES = {
  financieel: {
    label: "Financieel",
    short: "Geld, zekerheid, groei",
    icon: "dollarSign",
    color: (th) => th.green,
    dim: (th) => th.greenDim,
    intro: "Alles rond inkomen, vermogen, risico en materiële vrijheid: waar mensen voor werken, sparen en investeren.",
  },
  relatie: {
    label: "Relatie",
    short: "Verbinding & erkenning",
    icon: "heart",
    color: (th) => th.rose,
    dim: (th) => th.roseDim,
    intro: "Sociale en emotionele drivers: erbij horen, gezien worden, liefde, familie, reputatie en status bij anderen.",
  },
  gezondheid: {
    label: "Gezondheid",
    short: "Welzijn & vitaliteit",
    icon: "activity",
    color: (th) => th.cyan,
    dim: (th) => th.cyanDim,
    intro: "Lichamelijk en mentaal welzijn: energie, levensduur, herstel, rust en het vermijden van pijn of ziekte.",
  },
};

const PRIMARY_DRIVERS = [
  { name: "Zekerheid & voorspelbaarheid", category: "financieel", description: "Stabiel inkomen, buffer en controle; angst voor financiële onzekerheid wegnemen." },
  { name: "Vrijheid & autonomie", category: "financieel", description: "Zelf kunnen beslissen, minder afhankelijk zijn van één baan of opdrachtgever." },
  { name: "Groei & status (materieel)", category: "financieel", description: "Meer verdienen, opschalen, 'er komen' — vaak zichtbaar in auto, huis of lifestyle." },
  { name: "Erkenning & waardering", category: "relatie", description: "Gezien worden door partner, team of markt; respect en bevestiging." },
  { name: "Verbinding & liefde", category: "relatie", description: "Nabijheid, vertrouwen en emotionele veiligheid in relaties." },
  { name: "Sociale status & prestige", category: "relatie", description: "Horen bij een groep, vooroplopen, invloed en reputatie in het netwerk." },
  { name: "Vitaliteit & energie", category: "gezondheid", description: "Fit voelen, meer energie, beter slapen en duurzaam presteren." },
  { name: "Vermijden van pijn / angst", category: "gezondheid", description: "Chronische klachten, stress of burn-out beperken; controle over het lichaam." },
  { name: "Levensduur & kwaliteit van leven", category: "gezondheid", description: "Gezond oud worden, onafhankelijk blijven, zorg voor jezelf en naasten." },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function getColor(key, theme) {
  const map = CLIENT_COLORS_MAP[theme] || CLIENT_COLORS_MAP.dark;
  return map[key] || map.blue;
}

function Badge({ children, color, bg, t }) {
  const c = color || t.accent;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", color: c, background: bg || c + "18", padding: "3px 10px", borderRadius: 100 }}>
      {children}
    </span>
  );
}

function SectionLabel({ children, style: s, t }) {
  return (
    <p style={{ color: t.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px", ...s }}>{children}</p>
  );
}

function Card({ children, style: s, hover, onClick, t }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? t.surfaceHover : t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: t.radius,
        padding: 20,
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        ...(hovered ? { borderColor: t.borderLight, transform: "translateY(-1px)" } : {}),
        ...s,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, value, onChange, multi, placeholder, t }) {
  const [focused, setFocused] = useState(false);
  const base = {
    width: "100%", background: t.bgSub, border: `1px solid ${focused ? t.accent + "66" : t.border}`,
    borderRadius: t.radiusSm, padding: "10px 14px", color: t.text, fontSize: 14,
    fontFamily: t.fontBase, outline: "none", boxSizing: "border-box",
    resize: multi ? "vertical" : "none", minHeight: multi ? 80 : undefined,
    transition: "border-color 0.2s ease",
    lineHeight: 1.5,
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: t.textSecondary, fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.01em" }}>{label}</label>
      {multi
        ? <textarea style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        : <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      }
    </div>
  );
}

function ProgressBar({ value, color, height = 4, t }) {
  return (
    <div style={{ height, background: t.border, borderRadius: height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: color || t.accent, borderRadius: height, transition: "width 0.4s ease" }} />
    </div>
  );
}

function ThemeToggle({ theme, setTheme, t }) {
  const isDark = theme === "dark";
  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        width: "100%", background: t.surface2, border: `1px solid ${t.border}`,
        borderRadius: t.radiusSm, padding: "8px", cursor: "pointer",
        color: t.textSecondary, fontFamily: t.fontBase, fontSize: 12,
        transition: "all 0.2s ease",
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isDark
          ? <><circle cx="12" cy="12" r="5"/><line x1="12" x2="12" y1="1" y2="3"/><line x1="12" x2="12" y1="21" y2="23"/><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/><line x1="1" x2="3" y1="12" y2="12"/><line x1="21" x2="23" y1="12" y2="12"/><line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/></>
          : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        }
      </svg>
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function ClientSystem() {
  const init = getInitialClientsAndActiveId();
  const [clients, setClients] = useState(init.clients);
  const [activeId, setActiveId] = useState(init.activeId);
  const [tab, setTab] = useState("roadmap");
  const [fwView, setFwView] = useState(null);
  const [activePhase, setActivePhase] = useState(null);
  const [activeWeek, setActiveWeek] = useState(null);
  const [channelView, setChannelView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(loadStoredTheme);
  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const importFileRef = useRef(null);
  const importModeRef = useRef("replace");
  const [syncToken, setSyncToken] = useState(loadSyncToken);
  const [syncTokenDraft, setSyncTokenDraft] = useState(loadSyncToken);
  const [cloudReady, setCloudReady] = useState(() => !loadSyncToken());
  const [cloudSyncError, setCloudSyncError] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(clients));
    } catch (e) {
      console.warn("Kon klanten niet opslaan in browser", e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeId);
    } catch { /* ignore */ }
  }, [activeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch { /* ignore */ }
  }, [theme]);

  /** Eénmalig laden van server bij ingestelde sync-token; lege server = eerste upload van huidige lokale data. */
  useEffect(() => {
    if (!syncToken) {
      setCloudReady(true);
      setCloudSyncError(null);
      return;
    }
    let cancelled = false;
    setCloudReady(false);
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/app-state`, {
          headers: { Authorization: `Bearer ${syncToken}` },
        });
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) {
          setCloudSyncError(typeof data.error === "string" ? data.error : `Cloud sync (${r.status})`);
          setCloudReady(true);
          return;
        }
        setCloudSyncError(null);
        if (Array.isArray(data.clients) && data.clients.length > 0) {
          setClients(data.clients);
          if (data.activeId && data.clients.some(c => c.id === data.activeId)) {
            setActiveId(data.activeId);
          }
        } else {
          const put = await fetch(`${API_BASE}/api/app-state`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${syncToken}` },
            body: JSON.stringify({ clients, activeId }),
          });
          const putData = await put.json().catch(() => ({}));
          if (!put.ok) {
            setCloudSyncError(typeof putData.error === "string" ? putData.error : `Upload (${put.status})`);
          }
        }
      } catch (e) {
        if (!cancelled) setCloudSyncError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setCloudReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncToken]);

  /** Debounced cloud-save na wijzigingen (alleen met sync-token en na eerste pull). */
  useEffect(() => {
    if (!syncToken || !cloudReady) return;
    const tid = setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/app-state`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${syncToken}` },
          body: JSON.stringify({ clients, activeId }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setCloudSyncError(typeof data.error === "string" ? data.error : `Opslaan (${r.status})`);
        } else {
          setCloudSyncError(null);
        }
      } catch (e) {
        setCloudSyncError(e instanceof Error ? e.message : String(e));
      }
    }, 900);
    return () => clearTimeout(tid);
  }, [clients, activeId, syncToken, cloudReady]);

  function saveSyncToken() {
    const t = syncTokenDraft.trim();
    try {
      if (t) localStorage.setItem(STORAGE_SYNC_TOKEN_KEY, t);
      else localStorage.removeItem(STORAGE_SYNC_TOKEN_KEY);
    } catch { /* ignore */ }
    setSyncToken(t);
  }

  function clearSyncToken() {
    try {
      localStorage.removeItem(STORAGE_SYNC_TOKEN_KEY);
    } catch { /* ignore */ }
    setSyncToken("");
    setSyncTokenDraft("");
    setCloudSyncError(null);
    setCloudReady(true);
  }

  const t = THEMES[theme];
  const client = clients.find(c => c.id === activeId) || clients[0];
  const clientColor = getColor(client.colorKey, theme);
  const roadmap = buildRoadmap(client.targetRevenue, theme);

  function updClient(key, val) {
    setClients(prev => prev.map(c => c.id === activeId ? { ...c, [key]: val } : c));
  }

  function addClient() {
    const nc = { id: `client_${Date.now()}`, name: "Nieuwe Klant", type: "", location: "", owner: "", products: "", audience: "", targetRevenue: "10000", currentRevenue: "0", status: "Startend", dreamGoal: "", modelName: "Methode\u2122", notes: "", colorKey: "purple", icon: "sparkles", frameworks: [] };
    setClients(prev => [...prev, nc]);
    setActiveId(nc.id);
    setTab("profiel");
  }

  function exportClientsBackup() {
    const blob = new Blob([JSON.stringify(clients, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mt-marketing-klanten-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onImportFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const mode = importModeRef.current;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed) || !parsed.every(c => c && typeof c.id === "string")) {
          window.alert("Ongeldig bestand: verwacht een JSON-array van klanten, elk met een id.");
          e.target.value = "";
          return;
        }
        if (mode === "replace") {
          if (!window.confirm(`Alle huidige klanten (${clients.length}) vervangen door ${parsed.length} uit het bestand?`)) {
            e.target.value = "";
            return;
          }
          setClients(parsed);
          setActiveId(parsed.some(c => c.id === activeId) ? activeId : parsed[0].id);
        } else {
          const merged = mergeClientsById(clients, parsed);
          setClients(merged);
          setActiveId(prev => (merged.some(c => c.id === prev) ? prev : merged[0]?.id || prev));
          window.alert(`Samengevoegd: ${merged.length} klant(en) totaal.`);
        }
      } catch {
        window.alert("Kon JSON niet lezen. Controleer of het een geldige export is.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  async function runAiOnboard() {
    setAiLoading(true);
    setAiError(null);
    try {
      const r = await fetch(`${API_BASE}/api/onboard-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: aiBrief }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || data.detail || `API ${r.status}`);
      const c = data.client;
      if (!c || !c.id) throw new Error("Antwoord bevat geen client");
      setClients(prev => [...prev, c]);
      setActiveId(c.id);
      setAiBrief("");
      setTab("profiel");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }

  const activeFw = fwView ? client.frameworks.find(f => f.id === fwView.frameworkId) : null;
  const activeMf = (fwView && fwView.microIndex !== undefined && activeFw) ? activeFw.microFrameworks[fwView.microIndex] : null;
  const phaseObj = activePhase !== null ? roadmap[activePhase] : null;

  const prompt = `Je bent een expert marketeer, funnel-architect en groeistrateeg. Jij helpt mij \u2014 een AI-automation consultant \u2014 om voor mijn klant een volledig uitgewerkt groeiplan te maken.

== METHODOLOGIE: DROOMRESULTAAT + CORE RESULTS ==

Dit framework draait om \u00E9\u00E9n principe: de KLANT staat centraal, niet het bedrijf.

DROOMRESULTAAT = De ultieme emotionele staat die de eindklant wil bereiken.
- Altijd geschreven vanuit klantperspectief ("Ik wil...")
- Beschrijft een GEVOEL, niet een product of dienst
- Voorbeeld: "Genieten van je auto, zonder stress, onverwachte kosten of onzekerheid"

CORE RESULTS = De 3-5 deelresultaten die de klant moet BEREIKEN om het droomresultaat te voelen.
- Elke Core Result is een PIJLER vanuit klantperspectief
- Het is GEEN marketingfase (niet: "zichtbaarheid", "retentie", "schaalslag")
- Het is W\u00C1T de klant ervaart/voelt/bereikt
- Samen vormen alle Core Results het complete droomresultaat
- Voorbeeld (auto): "Slimme Start" = juiste auto gekocht zonder spijt; "Voorspelbare Kosten" = nooit verrast door rekeningen

Per Core Result bouw je een VALUE LADDER:
1. Free Value \u2014 gratis weggever die het probleem benoemt en eerste vertrouwen wekt
2. Low Ticket \u2014 kleine betaalde actie die de klant een eerste resultaat geeft
3. Core Offer \u2014 het hoofdproduct dat het Core Result volledig levert
4. High Ticket \u2014 premium versie met maximale zekerheid, gemak of exclusiviteit

Per Core Result heb je MICRO-FRAMEWORKS: stap-voor-stap processen (3-4 stappen) die het bedrijf uitvoert om dat resultaat te leveren.

== KLANTPROFIEL ==
Bedrijfsnaam: ${client.name} | Type: ${client.type} | Locatie: ${client.location}
Eigenaar: ${client.owner} | Status: ${client.status}
Producten & Diensten: ${client.products}
Doelgroep: ${client.audience}
Huidige omzet: \u20AC${client.currentRevenue}/maand | Target: \u20AC${client.targetRevenue}/maand
Framework naam: ${client.modelName}
Droomdoel eindklant: "${client.dreamGoal}"
${client.notes ? `Extra context: ${client.notes}` : ""}

== HUIDIGE CORE RESULTS (${client.frameworks.length} pijlers) ==
${client.frameworks.map((fw, i) => `${i + 1}. ${fw.name} (${fw.subtitle})
   Klantperspectief: ${fw.description}
   Stappen: ${fw.steps.join(" \u2192 ")}
   Free Value: ${fw.freeValue?.join(" / ") || "n.v.t."}
   Low Ticket: ${fw.lowTicket?.join(" / ") || "n.v.t."}
   Core Offer: ${fw.coreOffer?.join(" / ") || "n.v.t."}
   High Ticket: ${fw.highTicket?.join(" / ") || "n.v.t."}
   Micro-Frameworks: ${fw.microFrameworks?.map(mf => mf.name).join(", ") || "n.v.t."}`).join("\n\n")}

== ROADMAP FASEN ==
Fase 1 Fundament (M1-3): Target \u20AC${Math.round(parseInt(client.targetRevenue)*0.35).toLocaleString("nl-NL")}/maand
Fase 2 Momentum (M4-6): Target \u20AC${Math.round(parseInt(client.targetRevenue)*0.70).toLocaleString("nl-NL")}/maand
Fase 3 Dominantie (M7-9): Target \u20AC${Math.round(parseInt(client.targetRevenue)*1.05).toLocaleString("nl-NL")}/maand
Fase 4 Schaalslag (M10-12): Target \u20AC${Math.round(parseInt(client.targetRevenue)*1.40).toLocaleString("nl-NL")}/maand

== OPDRACHT ==
1. DROOMDOEL VALIDATIE \u2014 Is het droomresultaat echt vanuit klantperspectief? Zijn er 3 diepe pijnen en 3 verborgen verlangens die hieronder zitten?
2. CORE RESULTS CHECK \u2014 Zijn alle Core Results vanuit KLANT-perspectief geschreven (niet vanuit bedrijf/marketing)? Vormen ze samen het complete droomresultaat? Mis ik er een? Is er een teveel?
3. VALUE LADDER PER CORE RESULT \u2014 Per Core Result: is de Free Value \u2192 Low Ticket \u2192 Core Offer \u2192 High Ticket logisch opgebouwd? Verbeter waar nodig.
4. MICRO-FRAMEWORKS \u2014 Per Core Result: welke stap-voor-stap processen voert het bedrijf uit om dit resultaat te leveren? (2-3 micro-frameworks per Core Result, elk 3-4 stappen)
5. FASE 1 WEEKPLAN \u2014 Volledig uitgewerkt per week (week 1-12): welke Core Results activeer je wanneer?
6. CONTENT KALENDER \u2014 30 posts uitgeschreven (dag, format, hook, caption) \u2014 elke post gekoppeld aan een Core Result
7. OMZETBEREKENING \u2014 Breakdown per product/Core Result naar \u20AC${client.targetRevenue}/maand

KRITISCHE REGEL: Schrijf ALLES vanuit het perspectief van de eindklant. Core Results zijn geen marketingtermen, maar emotionele resultaten die de klant ervaart.

Schrijf in het Nederlands. Concreet, direct toepasbaar.`;

  function copy() { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2200); }

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: t.fontBase, background: t.bg, minHeight: "100vh", color: t.text, display: "flex" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 260, minWidth: sidebarCollapsed ? 64 : 260,
        background: t.surface, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column", transition: "all 0.25s ease",
        height: "100vh", position: "sticky", top: 0, overflow: "hidden",
      }}>
        {/* Brand */}
        <div style={{ padding: sidebarCollapsed ? "20px 12px" : "20px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 12, minHeight: 64 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${t.accent}, ${t.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="zap" size={16} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{ color: t.text, fontSize: 14, fontWeight: 700, margin: 0, whiteSpace: "nowrap" }}>Growth System</p>
              <p style={{ color: t.textMuted, fontSize: 11, margin: 0, whiteSpace: "nowrap" }}>MT Marketing</p>
            </div>
          )}
        </div>

        {/* Client Switcher */}
        <div style={{ padding: sidebarCollapsed ? "12px 8px" : "16px 12px", borderBottom: `1px solid ${t.border}` }}>
          {!sidebarCollapsed && <SectionLabel t={t} style={{ margin: "0 0 10px", paddingLeft: 8 }}>Klanten</SectionLabel>}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {clients.map(c => {
              const cc = getColor(c.colorKey, theme);
              const isActive = activeId === c.id;
              return (
                <button key={c.id} onClick={() => { setActiveId(c.id); setFwView(null); setActivePhase(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: isActive ? cc.dim : "transparent",
                    border: "none", borderRadius: t.radiusSm,
                    padding: sidebarCollapsed ? "8px" : "8px 12px",
                    cursor: "pointer", color: isActive ? cc.main : t.textSecondary,
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    fontFamily: t.fontBase, transition: "all 0.15s",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    width: "100%", textAlign: "left",
                  }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: isActive ? cc.main + "22" : t.surface2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${isActive ? cc.main + "44" : t.border}` }}>
                    <Icon name={c.icon} size={14} color={isActive ? cc.main : t.textMuted} />
                  </div>
                  {!sidebarCollapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>}
                </button>
              );
            })}
            <button onClick={addClient}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "transparent", border: `1px dashed ${t.border}`,
                borderRadius: t.radiusSm, padding: sidebarCollapsed ? "8px" : "8px 12px",
                cursor: "pointer", color: t.textMuted, fontSize: 13,
                fontFamily: t.fontBase, justifyContent: sidebarCollapsed ? "center" : "flex-start",
                width: "100%", transition: "all 0.15s",
              }}>
              <Icon name="plus" size={14} />
              {!sidebarCollapsed && <span>Nieuwe klant</span>}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: sidebarCollapsed ? "12px 8px" : "16px 12px", flex: 1 }}>
          {!sidebarCollapsed && <SectionLabel t={t} style={{ margin: "0 0 10px", paddingLeft: 8 }}>Navigatie</SectionLabel>}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map(tb => {
              const isActive = tab === tb.id;
              return (
                <button key={tb.id} onClick={() => { setTab(tb.id); setFwView(null); setActivePhase(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: isActive ? t.accentDim : "transparent",
                    border: "none", borderRadius: t.radiusSm,
                    padding: sidebarCollapsed ? "10px" : "10px 12px",
                    cursor: "pointer",
                    color: isActive ? t.accentLight : t.textSecondary,
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    fontFamily: t.fontBase, transition: "all 0.15s",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    width: "100%", textAlign: "left",
                  }}>
                  <Icon name={tb.icon} size={16} color={isActive ? t.accentLight : t.textMuted} />
                  {!sidebarCollapsed && <span>{tb.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Data backup (localStorage + export/import) */}
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${t.border}` }}>
          {!sidebarCollapsed && (
            <SectionLabel t={t} style={{ margin: "0 0 8px", paddingLeft: 4 }}>Gegevens</SectionLabel>
          )}
          <input ref={importFileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onImportFileChange} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button type="button" onClick={exportClientsBackup}
              style={{
                display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: 8,
                width: "100%", background: t.surface2, border: `1px solid ${t.border}`,
                borderRadius: t.radiusSm, padding: sidebarCollapsed ? "8px" : "8px 10px",
                cursor: "pointer", color: t.textSecondary, fontSize: 12, fontFamily: t.fontBase,
              }}
              title="JSON-bestand downloaden als backup">
              <Icon name="fileText" size={14} color={t.textMuted} />
              {!sidebarCollapsed && <span>Export backup (.json)</span>}
            </button>
            <button type="button" onClick={() => { importModeRef.current = "replace"; importFileRef.current?.click(); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: 8,
                width: "100%", background: t.surface2, border: `1px solid ${t.border}`,
                borderRadius: t.radiusSm, padding: sidebarCollapsed ? "8px" : "8px 10px",
                cursor: "pointer", color: t.textSecondary, fontSize: 12, fontFamily: t.fontBase,
              }}
              title="Vervangt alle klanten door het gekozen bestand">
              <Icon name="layout" size={14} color={t.textMuted} />
              {!sidebarCollapsed && <span>Import (vervangen)</span>}
            </button>
            <button type="button" onClick={() => { importModeRef.current = "merge"; importFileRef.current?.click(); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: 8,
                width: "100%", background: t.surface2, border: `1px solid ${t.border}`,
                borderRadius: t.radiusSm, padding: sidebarCollapsed ? "8px" : "8px 10px",
                cursor: "pointer", color: t.textSecondary, fontSize: 12, fontFamily: t.fontBase,
              }}
              title="Voegt klanten toe / overschrijft opzelfde id">
              <Icon name="layers" size={14} color={t.textMuted} />
              {!sidebarCollapsed && <span>Import (samenvoegen)</span>}
            </button>
          </div>
          {!sidebarCollapsed && (
            <>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                <p style={{ color: t.textMuted, fontSize: 11, margin: "0 0 8px", lineHeight: 1.45, fontWeight: 600 }}>Cloud sync (andere browser / PC)</p>
                <p style={{ color: t.textDim, fontSize: 10, margin: "0 0 8px", lineHeight: 1.45 }}>
                  <strong style={{ color: t.textSecondary }}>Beveiliging:</strong> het echte <code style={{ fontSize: 10 }}>SYNC_SECRET</code> staat alleen in Vercel (server), niet in de website-code. Wat je hier typt wordt in <strong>deze browser</strong> bewaard (localStorage) om naar <code style={{ fontSize: 10 }}>/api</code> te sturen over HTTPS — niet in de zichtbare broncode van de pagina.
                </p>
                <p style={{ color: t.textDim, fontSize: 10, margin: "0 0 8px", lineHeight: 1.45 }}>
                  <strong style={{ color: t.textSecondary }}>Incognito / andere browser:</strong> daar is localStorage leeg. Vul <strong>opnieuw</strong> hetzelfde wachtwoord als <code style={{ fontSize: 10 }}>SYNC_SECRET</code> in en klik <strong>Opslaan token</strong> — anders laadt de app geen cloud-data (je ziet dan alleen de voorbeeldklanten).
                </p>
                <input
                  type="password"
                  value={syncTokenDraft}
                  onChange={e => setSyncTokenDraft(e.target.value)}
                  placeholder="Zelfde als SYNC_SECRET op server"
                  autoComplete="off"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: t.bgSub, border: `1px solid ${t.border}`, borderRadius: t.radiusSm,
                    padding: "8px 10px", color: t.text, fontSize: 12, fontFamily: t.fontBase, marginBottom: 6,
                  }}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" onClick={saveSyncToken}
                    style={{
                      flex: 1, minWidth: 80, background: t.accentDim, border: `1px solid ${t.borderAccent}`,
                      borderRadius: t.radiusSm, padding: "6px 10px", cursor: "pointer", color: t.accentLight,
                      fontSize: 12, fontWeight: 600, fontFamily: t.fontBase,
                    }}>
                    Opslaan token
                  </button>
                  <button type="button" onClick={clearSyncToken}
                    style={{
                      background: t.surface2, border: `1px solid ${t.border}`,
                      borderRadius: t.radiusSm, padding: "6px 10px", cursor: "pointer", color: t.textMuted,
                      fontSize: 12, fontFamily: t.fontBase,
                    }}>
                    Wis
                  </button>
                </div>
                {!syncToken && (
                  <p style={{ color: t.amber, fontSize: 10, margin: "8px 0 0", lineHeight: 1.45 }}>
                    Geen token in deze sessie: cloud-data wordt niet geladen tot je hierboven opslaat.
                  </p>
                )}
                {syncToken && (
                  <p style={{ color: cloudSyncError ? t.rose : t.green, fontSize: 10, margin: "8px 0 0", lineHeight: 1.4 }}>
                    {cloudSyncError || (cloudReady ? "Cloud sync actief — wijzigingen worden gesynchroniseerd." : "Laden…")}
                  </p>
                )}
              </div>
              <p style={{ color: t.textDim, fontSize: 10, margin: "10px 4px 0", lineHeight: 1.45 }}>
                Zonder cloud: alleen opgeslagen in deze browser. Gebruik export of zet cloud sync.
              </p>
            </>
          )}
        </div>

        {/* Theme toggle + Collapse */}
        <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
          {!sidebarCollapsed && <ThemeToggle theme={theme} setTheme={setTheme} t={t} />}
          {sidebarCollapsed && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", background: t.surface2, border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: "8px", cursor: "pointer", color: t.textSecondary, transition: "all 0.2s" }}
              aria-label="Toggle theme">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {theme === "dark"
                  ? <><circle cx="12" cy="12" r="5"/><line x1="12" x2="12" y1="1" y2="3"/><line x1="12" x2="12" y1="21" y2="23"/><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/><line x1="1" x2="3" y1="12" y2="12"/><line x1="21" x2="23" y1="12" y2="12"/><line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/></>
                  : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                }
              </svg>
            </button>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", background: t.surface2, border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: "8px", cursor: "pointer", color: t.textMuted, fontFamily: t.fontBase, fontSize: 12, gap: 6, transition: "all 0.15s" }}>
            <Icon name={sidebarCollapsed ? "chevronRight" : "arrowLeft"} size={14} />
            {!sidebarCollapsed && <span>Minimaliseer</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top Bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 10,
          background: t.headerBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${t.border}`,
          padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: clientColor.dim, border: `1px solid ${clientColor.main}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={client.icon} size={18} color={clientColor.main} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ color: t.text, fontSize: 16, fontWeight: 600, margin: 0 }}>{client.name}</h1>
                <Badge t={t} color={clientColor.main}>{client.status}</Badge>
              </div>
              <p style={{ color: t.textMuted, fontSize: 12, margin: 0 }}>{client.type} &middot; {client.location} &middot; {client.modelName}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: t.textMuted, fontSize: 11, margin: "0 0 2px", fontWeight: 500 }}>Maandelijks target</p>
              <p style={{ color: clientColor.main, fontSize: 22, fontWeight: 700, margin: 0, fontFamily: t.fontMono, letterSpacing: "-0.02em" }}>
                &euro;{parseInt(client.targetRevenue || 0).toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px 80px", maxWidth: 1080, width: "100%", margin: "0 auto" }}>

          {/* ══ PROFIEL ══ */}
          {tab === "profiel" && (
            <div>
              <SectionLabel t={t}>Klant Informatie</SectionLabel>
              <Card t={t} style={{ marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                  <Field t={t} label="Bedrijfsnaam" value={client.name} onChange={v => updClient("name", v)} />
                  <Field t={t} label="Type Business" value={client.type} onChange={v => updClient("type", v)} />
                  <Field t={t} label="Locatie" value={client.location} onChange={v => updClient("location", v)} />
                  <Field t={t} label="Eigenaar" value={client.owner} onChange={v => updClient("owner", v)} />
                  <Field t={t} label="Huidige Omzet (\u20AC/maand)" value={client.currentRevenue} onChange={v => updClient("currentRevenue", v)} />
                  <Field t={t} label="Target Omzet (\u20AC/maand)" value={client.targetRevenue} onChange={v => updClient("targetRevenue", v)} />
                </div>
                <Field t={t} label="Producten & Diensten" value={client.products} onChange={v => updClient("products", v)} multi />
                <Field t={t} label="Doelgroep" value={client.audience} onChange={v => updClient("audience", v)} multi />
                <Field t={t} label="Framework Naam" value={client.modelName} onChange={v => updClient("modelName", v)} />
                <Field t={t} label="Meest Gewenste Droomdoel (klantperspectief)" value={client.dreamGoal} onChange={v => updClient("dreamGoal", v)} multi />
                <Field t={t} label="Notities" value={client.notes} onChange={v => updClient("notes", v)} multi />
              </Card>
            </div>
          )}

          {/* ══ AI KLANT-SETUP ══ */}
          {tab === "ai-setup" && (
            <div>
              <SectionLabel t={t}>Claude API &mdash; nieuwe klant uit briefing</SectionLabel>
              <p style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
                Vul een korte briefing in (bedrijfsnaam, aanbod, doelgroep, locatie, omzetdoel). Draai lokaal <code style={{ fontSize: 12, color: t.accentLight }}>npm run dev:all</code> en zet <code style={{ fontSize: 12, color: t.accentLight }}>ANTHROPIC_API_KEY</code> in <code style={{ fontSize: 12, color: t.accentLight }}>.env</code>. De methodologie (droomresultaat, 5 Core Results, Value Ladder, micro-frameworks) staat op de server.
              </p>
              <Card t={t} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: t.textSecondary, fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Briefing</label>
                <textarea
                  value={aiBrief}
                  onChange={e => setAiBrief(e.target.value)}
                  placeholder="Bv. Studio X in Rotterdam, brow lifts en PMU, vrouwen 30-55, target 12k/maand..."
                  style={{
                    width: "100%", minHeight: 180, boxSizing: "border-box",
                    background: t.bgSub, border: `1px solid ${t.border}`, borderRadius: t.radiusSm,
                    padding: "12px 14px", color: t.text, fontSize: 14, fontFamily: t.fontBase, lineHeight: 1.5, resize: "vertical",
                  }}
                />
                {aiError && (
                  <p style={{ color: t.rose, fontSize: 13, margin: "12px 0 0" }}>{aiError}</p>
                )}
                <button type="button" disabled={aiLoading || aiBrief.trim().length < 20}
                  onClick={runAiOnboard}
                  style={{
                    marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
                    background: aiLoading || aiBrief.trim().length < 20 ? t.border : t.accent,
                    border: "none", borderRadius: t.radiusSm, color: "#fff", padding: "12px 22px",
                    cursor: aiLoading || aiBrief.trim().length < 20 ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 600, fontFamily: t.fontBase,
                  }}>
                  <Icon name="sparkles" size={16} color="#fff" />
                  {aiLoading ? "Bezig..." : "Genereer klant met AI"}
                </button>
              </Card>
            </div>
          )}

          {/* ══ DROOMRESULTAAT ══ */}
          {tab === "resultaat" && (
            <div>
              {/* Dream Goal Hero */}
              <div style={{
                background: `linear-gradient(135deg, ${clientColor.dim}, ${t.surface})`,
                border: `1px solid ${clientColor.main}33`,
                borderRadius: t.radiusLg, padding: 28, marginBottom: 24,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: clientColor.glow, filter: "blur(60px)", opacity: 0.5 }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Icon name="star" size={14} color={clientColor.main} />
                    <SectionLabel t={t} style={{ margin: 0 }}>Meest Gewenste Droomdoel</SectionLabel>
                  </div>
                  <p style={{ color: t.text, fontSize: 18, fontStyle: "italic", margin: "0 0 16px", lineHeight: 1.6, fontWeight: 400 }}>"{client.dreamGoal}"</p>
                  <textarea value={client.dreamGoal} onChange={e => updClient("dreamGoal", e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: "10px 14px", color: t.textSecondary, fontSize: 13, fontFamily: t.fontBase, resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.5 }} rows={2} />
                </div>
              </div>

              {/* Framework Cards */}
              {!fwView && (
                <div>
                  <SectionLabel t={t}>Core Results &mdash; {client.frameworks.length} Frameworks</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {client.frameworks.map(fw => {
                      const fwColor = getColor(fw.colorKey, theme);
                      return (
                        <Card t={t} key={fw.id} hover onClick={() => setFwView({ frameworkId: fw.id })}
                          style={{ borderLeft: `3px solid ${fwColor.main}` }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: fwColor.dim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={fw.icon} size={18} color={fwColor.main} />
                            </div>
                            <div>
                              <p style={{ color: fwColor.main, fontWeight: 600, fontSize: 14, margin: 0 }}>{fw.name}</p>
                              <p style={{ color: t.textMuted, fontSize: 12, margin: 0 }}>{fw.subtitle}</p>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                            {[{ l: "Free Value", items: fw.freeValue, c: t.green }, { l: "Low Ticket", items: fw.lowTicket, c: t.amber }].map(tier => (
                              <div key={tier.l} style={{ background: tier.c + "0D", borderRadius: 6, padding: "8px 10px" }}>
                                <p style={{ color: tier.c, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 4px" }}>{tier.l}</p>
                                <p style={{ color: t.textSecondary, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{tier.items?.[0] || "\u2014"}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ color: t.textMuted, fontSize: 11, margin: 0 }}>{fw.microFrameworks.length} micro-frameworks</p>
                            <Icon name="chevronRight" size={14} color={fwColor.main} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Framework Detail */}
              {fwView && !activeMf && activeFw && (() => {
                const fwColor = getColor(activeFw.colorKey, theme);
                return (
                  <div>
                    <button onClick={() => setFwView(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: t.accentLight, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0, fontFamily: t.fontBase, fontWeight: 500 }}>
                      <Icon name="arrowLeft" size={14} /> Terug naar overzicht
                    </button>
                    <Card t={t} style={{ borderTop: `3px solid ${fwColor.main}`, marginBottom: 20, background: `linear-gradient(180deg, ${fwColor.dim}, ${t.surface})` }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: fwColor.dim, border: `1px solid ${fwColor.main}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={activeFw.icon} size={22} color={fwColor.main} />
                        </div>
                        <div>
                          <h2 style={{ color: fwColor.main, fontSize: 20, margin: 0, fontWeight: 600 }}>{activeFw.name}</h2>
                          <p style={{ color: t.textSecondary, fontSize: 13, margin: 0 }}>{activeFw.subtitle}</p>
                        </div>
                      </div>
                      <p style={{ color: t.textSecondary, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>{activeFw.description}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                          { l: "Free Value", items: activeFw.freeValue, c: t.green, ic: "gift" },
                          { l: "Low Ticket", items: activeFw.lowTicket, c: t.amber, ic: "dollarSign" },
                          { l: "Core Offer", items: activeFw.coreOffer, c: fwColor.main, ic: "briefcase" },
                          { l: "High Ticket", items: activeFw.highTicket, c: t.gold, ic: "crown" },
                        ].map(tier => (
                          <div key={tier.l} style={{ background: t.bgSub, border: `1px solid ${tier.c}22`, borderRadius: t.radiusSm, padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                              <Icon name={tier.ic} size={12} color={tier.c} />
                              <p style={{ color: tier.c, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{tier.l}</p>
                            </div>
                            {tier.items?.map((item, k) => <p key={k} style={{ color: t.text, fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>&bull; {item}</p>)}
                          </div>
                        ))}
                      </div>
                    </Card>
                    <SectionLabel t={t}>Micro-Frameworks</SectionLabel>
                    {activeFw.microFrameworks.map((mf, idx) => (
                      <Card t={t} key={idx} hover onClick={() => setFwView({ frameworkId: activeFw.id, microIndex: idx })} style={{ marginBottom: 8, padding: "14px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: fwColor.dim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={mf.icon} size={16} color={fwColor.main} />
                            </div>
                            <div>
                              <p style={{ color: t.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{mf.name}</p>
                              <p style={{ color: t.textMuted, fontSize: 12, margin: 0 }}>{mf.steps.length} stappen</p>
                            </div>
                          </div>
                          <Icon name="chevronRight" size={16} color={fwColor.main} />
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}

              {/* Micro-Framework Detail */}
              {fwView && activeMf && activeFw && (() => {
                const fwColor = getColor(activeFw.colorKey, theme);
                return (
                  <div>
                    <button onClick={() => setFwView({ frameworkId: activeFw.id })} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: t.accentLight, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0, fontFamily: t.fontBase, fontWeight: 500 }}>
                      <Icon name="arrowLeft" size={14} /> Terug naar {activeFw.name}
                    </button>
                    <Card t={t} style={{ background: `linear-gradient(180deg, ${fwColor.dim}, ${t.surface})`, borderTop: `3px solid ${fwColor.main}` }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 24 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: fwColor.dim, border: `1px solid ${fwColor.main}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={activeMf.icon} size={22} color={fwColor.main} />
                        </div>
                        <div>
                          <p style={{ color: t.textMuted, fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{activeFw.name} &middot; Micro-Framework</p>
                          <h2 style={{ color: fwColor.main, fontSize: 20, margin: "4px 0 0", fontWeight: 600 }}>{activeMf.name}</h2>
                        </div>
                      </div>
                      {activeMf.steps.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < activeMf.steps.length - 1 ? `1px solid ${t.border}` : "none" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: fwColor.main, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                          </div>
                          <p style={{ color: t.text, fontSize: 14, lineHeight: 1.6, margin: 0, paddingTop: 3 }}>{step}</p>
                        </div>
                      ))}
                    </Card>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══ VALUE MATRIX ══ */}
          {tab === "matrix" && (
            <div>
              <SectionLabel t={t}>Value Matrix &mdash; {client.modelName}</SectionLabel>
              <Card t={t} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr 1fr", background: t.surface2, padding: "12px 18px", gap: 12, borderBottom: `1px solid ${t.border}` }}>
                  {["Core Result", "Free Value", "Low Ticket", "Core Offer", "High Ticket"].map((h, i) => (
                    <p key={i} style={{ color: i === 0 ? t.textSecondary : [t.green, t.amber, t.accent, t.gold][i - 1], fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{h}</p>
                  ))}
                </div>
                {client.frameworks.map((fw, i) => {
                  const fwColor = getColor(fw.colorKey, theme);
                  return (
                    <div key={fw.id} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr 1fr", padding: "14px 18px", gap: 12, borderBottom: i < client.frameworks.length - 1 ? `1px solid ${t.border}` : "none", background: i % 2 === 0 ? t.bg : t.surface, alignItems: "start" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Icon name={fw.icon} size={14} color={fwColor.main} />
                        <div>
                          <p style={{ color: fwColor.main, fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{fw.name}</p>
                          <p style={{ color: t.textMuted, fontSize: 11, margin: 0 }}>{fw.subtitle}</p>
                        </div>
                      </div>
                      {[fw.freeValue, fw.lowTicket, fw.coreOffer, fw.highTicket].map((items, j) => (
                        <div key={j}>{(items || []).map((item, k) => <p key={k} style={{ color: t.textSecondary, fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>&bull; {item}</p>)}</div>
                      ))}
                    </div>
                  );
                })}
              </Card>
            </div>
          )}

          {/* ══ PRIMARY DRIVERS ══ */}
          {tab === "drivers" && (
            <div>
              <SectionLabel t={t}>Primary Drivers</SectionLabel>
              <Card t={t} style={{ marginBottom: 20, borderLeft: `4px solid ${t.accent}` }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: t.accentDim, border: `1px solid ${t.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="compass" size={22} color={t.accentLight} />
                  </div>
                  <div>
                    <h2 style={{ color: t.text, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Wat zijn primary drivers?</h2>
                    <p style={{ color: t.textSecondary, fontSize: 14, margin: "0 0 12px", lineHeight: 1.65 }}>
                      <strong style={{ color: t.text }}>Primary drivers</strong> zijn de diepste motieven waarom iemand iets wil, koopt of verandert — vaak onuitgesproken. Ze zijn niet hetzelfde als een productfeature: ze verklaren <em>waarom</em> iets belangrijk is. In messaging en positionering koppel je aanbod aan deze drivers; elke driver valt onder één van drie hoofdcategorieën: <strong>financieel</strong>, <strong>relatie</strong> of <strong>gezondheid</strong> (vaak overlap, maar één categorie is meestal dominant).
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                      {["financieel", "relatie", "gezondheid"].map((key) => {
                        const cat = PRIMARY_DRIVER_CATEGORIES[key];
                        const c = cat.color(t);
                        const d = cat.dim(t);
                        return (
                          <div key={key} style={{ background: d, border: `1px solid ${c}33`, borderRadius: t.radiusSm, padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <Icon name={cat.icon} size={16} color={c} />
                              <span style={{ color: c, fontSize: 13, fontWeight: 700 }}>{cat.label}</span>
                            </div>
                            <p style={{ color: t.textMuted, fontSize: 11, margin: "0 0 6px", fontWeight: 600 }}>{cat.short}</p>
                            <p style={{ color: t.textSecondary, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{cat.intro}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              <SectionLabel t={t}>Drivers &mdash; per hoofdcategorie</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PRIMARY_DRIVERS.map((d, i) => {
                  const cat = PRIMARY_DRIVER_CATEGORIES[d.category];
                  const c = cat.color(t);
                  return (
                    <Card key={i} t={t} style={{ padding: "16px 18px", borderLeft: `3px solid ${c}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 240px" }}>
                          <p style={{ color: t.text, fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>{d.name}</p>
                          <p style={{ color: t.textSecondary, fontSize: 13, margin: 0, lineHeight: 1.55 }}>{d.description}</p>
                        </div>
                        <Badge t={t} color={c} bg={cat.dim(t)}>
                          <Icon name={cat.icon} size={12} color={c} />
                          {cat.label}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ROADMAP ══ */}
          {tab === "roadmap" && (
            <div>
              {/* Phase Timeline */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
                {roadmap.map((ph, i) => {
                  const isActive = activePhase === i;
                  return (
                    <div key={ph.phase} onClick={() => { setActivePhase(isActive ? null : i); setActiveWeek(null); setChannelView(false); }}
                      style={{
                        background: isActive ? ph.color + "14" : t.surface,
                        border: `1px solid ${isActive ? ph.color + "55" : t.border}`,
                        borderRadius: t.radius, padding: "18px", cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative", overflow: "hidden",
                      }}>
                      {isActive && <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: ph.color + "15", filter: "blur(20px)" }} />}
                      <div style={{ position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <Icon name={ph.icon} size={20} color={ph.color} />
                          <Badge t={t} color={ph.color} bg={ph.color + "1A"}>Fase {ph.phase}</Badge>
                        </div>
                        <p style={{ color: ph.color, fontWeight: 700, fontSize: 16, margin: "0 0 3px" }}>{ph.name}</p>
                        <p style={{ color: t.textMuted, fontSize: 12, margin: "0 0 12px" }}>{ph.timeline}</p>
                        <p style={{ color: t.text, fontSize: 18, fontWeight: 700, margin: "0 0 8px", fontFamily: t.fontMono }}>&euro;{ph.revenueTarget.toLocaleString("nl-NL")}<span style={{ color: t.textMuted, fontSize: 11, fontWeight: 400 }}>/mo</span></p>
                        <ProgressBar t={t} value={[35, 70, 100, 100][i]} color={ph.color} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Phase Detail */}
              {activePhase !== null && phaseObj && (
                <div>
                  {/* Phase Header */}
                  <Card t={t} style={{ background: `linear-gradient(135deg, ${phaseObj.color}0D, ${t.surface})`, borderTop: `3px solid ${phaseObj.color}`, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Badge t={t} color={phaseObj.color} bg={phaseObj.color + "1A"}>Fase {phaseObj.phase}</Badge>
                          <span style={{ color: t.textMuted, fontSize: 12 }}>{phaseObj.timeline}</span>
                        </div>
                        <h2 style={{ color: t.text, fontSize: 22, margin: "0 0 6px", fontWeight: 600 }}>{phaseObj.name}</h2>
                        <p style={{ color: t.textSecondary, fontSize: 14, margin: 0 }}>{phaseObj.tagline}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ color: t.textMuted, fontSize: 11, margin: "0 0 4px", fontWeight: 500 }}>Omzet target</p>
                        <p style={{ color: phaseObj.color, fontWeight: 700, fontSize: 26, margin: 0, fontFamily: t.fontMono }}>&euro;{phaseObj.revenueTarget.toLocaleString("nl-NL")}</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {phaseObj.goals.map((g, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <Icon name="check" size={14} color={phaseObj.color} style={{ marginTop: 2 }} />
                          <p style={{ color: t.text, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{g}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Sub-nav */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    {[{ id: "week", label: "Weekplan", icon: "calendar" }, { id: "channels", label: "Marketing Kanalen", icon: "radio" }, { id: "kpis", label: "KPI's", icon: "barChart" }].map(sub => (
                      <button key={sub.id} onClick={() => { setChannelView(sub.id); setActiveWeek(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: channelView === sub.id ? phaseObj.color + "18" : t.surface,
                          border: `1px solid ${channelView === sub.id ? phaseObj.color + "44" : t.border}`,
                          borderRadius: 100, padding: "8px 16px", cursor: "pointer",
                          color: channelView === sub.id ? phaseObj.color : t.textSecondary,
                          fontSize: 13, fontWeight: 500, fontFamily: t.fontBase, transition: "all 0.15s",
                        }}>
                        <Icon name={sub.icon} size={14} />
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {/* Weekplan */}
                  {channelView === "week" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {phaseObj.weeks.map((w, wi) => (
                        <div key={wi}>
                          <Card t={t} hover onClick={() => setActiveWeek(activeWeek === wi ? null : wi)}
                            style={{ padding: "14px 18px", borderRadius: activeWeek === wi ? `${t.radius}px ${t.radius}px 0 0` : t.radius }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <Badge t={t} color={phaseObj.color} bg={phaseObj.color + "1A"}>{w.label}</Badge>
                                <p style={{ color: t.text, fontSize: 14, fontWeight: 500, margin: 0 }}>{w.title}</p>
                              </div>
                              <Icon name={activeWeek === wi ? "chevronUp" : "chevronDown"} size={16} color={phaseObj.color} />
                            </div>
                          </Card>
                          {activeWeek === wi && (
                            <div style={{ background: phaseObj.color + "08", border: `1px solid ${phaseObj.color}22`, borderTop: "none", borderRadius: `0 0 ${t.radius}px ${t.radius}px`, padding: "18px 20px" }}>
                              {w.tasks.map((task, ti) => (
                                <div key={ti} style={{ display: "flex", gap: 12, marginBottom: ti < w.tasks.length - 1 ? 12 : 0 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: phaseObj.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{ti + 1}</span>
                                  </div>
                                  <p style={{ color: t.text, fontSize: 13, margin: 0, lineHeight: 1.6, paddingTop: 2 }}>{task}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Marketing Kanalen */}
                  {channelView === "channels" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {phaseObj.channels.map((ch, i) => (
                        <Card t={t} key={i} style={{ padding: "16px 18px", opacity: ch.active ? 1 : 0.45 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: ch.active ? phaseObj.color + "15" : t.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon name={ch.icon} size={14} color={ch.active ? phaseObj.color : t.textMuted} />
                              </div>
                              <p style={{ color: ch.active ? t.text : t.textMuted, fontSize: 13, fontWeight: 600, margin: 0 }}>{ch.name}</p>
                            </div>
                            <Badge t={t} color={ch.active ? t.green : t.textMuted} bg={ch.active ? t.greenDim : t.surface2}>
                              {ch.active ? "Actief" : "Inactief"}
                            </Badge>
                          </div>
                          <p style={{ color: t.textMuted, fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>{ch.note}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ color: t.amber, fontSize: 12, fontWeight: 600, fontFamily: t.fontMono }}>{ch.budget}</span>
                            <span style={{ color: t.textMuted, fontSize: 11 }}>{ch.intensity}%</span>
                          </div>
                          <ProgressBar t={t} value={ch.intensity} color={phaseObj.color} />
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* KPIs */}
                  {channelView === "kpis" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {phaseObj.kpis.map((kpi, i) => (
                        <Card t={t} key={i} style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: phaseObj.color + "15", border: `1px solid ${phaseObj.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={kpi.icon} size={20} color={phaseObj.color} />
                            </div>
                            <div>
                              <p style={{ color: t.textMuted, fontSize: 12, margin: "0 0 4px" }}>{kpi.label}</p>
                              <p style={{ color: phaseObj.color, fontSize: 20, fontWeight: 700, margin: 0, fontFamily: t.fontMono }}>{kpi.target}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {!channelView && (
                    <div style={{ textAlign: "center", padding: 40 }}>
                      <Icon name="layout" size={32} color={t.textDim} style={{ marginBottom: 12, display: "inline-block" }} />
                      <p style={{ color: t.textMuted, fontSize: 14, margin: 0 }}>Kies een weergave: Weekplan, Marketing Kanalen of KPI's</p>
                    </div>
                  )}
                </div>
              )}

              {/* Marketing Channel Overview */}
              {activePhase === null && (
                <div>
                  <SectionLabel t={t}>Marketing Kanalen Overzicht</SectionLabel>
                  <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Klik op een fase hierboven voor het gedetailleerde weekplan en KPI's.</p>
                  <Card t={t} style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", background: t.surface2, padding: "12px 18px", gap: 10, borderBottom: `1px solid ${t.border}` }}>
                      <p style={{ color: t.textSecondary, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Kanaal</p>
                      {roadmap.map(ph => <p key={ph.phase} style={{ color: ph.color, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", margin: 0, textAlign: "center" }}>F{ph.phase}</p>)}
                    </div>
                    {MARKETING_CHANNELS.map((ch, i) => (
                      <div key={ch.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", padding: "12px 18px", gap: 10, borderBottom: i < MARKETING_CHANNELS.length - 1 ? `1px solid ${t.border}` : "none", background: i % 2 === 0 ? t.bg : t.surface, alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                            <Icon name={ch.icon} size={14} color={t.textSecondary} />
                            <p style={{ color: t.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{ch.name}</p>
                            <Badge t={t} color={ch.type === "Betaald" ? t.rose : ch.type === "Retentie" ? t.purple : t.green}>
                              {ch.type}
                            </Badge>
                          </div>
                          <p style={{ color: t.textMuted, fontSize: 11, margin: "0 0 0 22px", lineHeight: 1.4 }}>{ch.desc}</p>
                        </div>
                        {[1,2,3,4].map(ph => (
                          <div key={ph} style={{ textAlign: "center" }}>
                            {ch.phases.includes(ph)
                              ? <div style={{ width: 10, height: 10, borderRadius: "50%", background: roadmap[ph-1].color, margin: "0 auto", boxShadow: `0 0 8px ${roadmap[ph-1].color}44` }} />
                              : <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.border, margin: "0 auto" }} />}
                          </div>
                        ))}
                      </div>
                    ))}
                  </Card>
                  <p style={{ color: t.textDim, fontSize: 11, marginTop: 12, textAlign: "center" }}>F1 = Fundament &middot; F2 = Momentum &middot; F3 = Dominantie &middot; F4 = Schaalslag</p>
                </div>
              )}
            </div>
          )}

          {/* ══ FUNNEL MAP ══ */}
          {tab === "funnel" && (
            <div>
              <SectionLabel t={t}>Funnel Map &mdash; Brunson vs {client.modelName}</SectionLabel>
              <Card t={t} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", background: t.surface2, padding: "12px 18px", gap: 14, borderBottom: `1px solid ${t.border}` }}>
                  <p style={{ color: t.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Element</p>
                  <p style={{ color: t.amber, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>ClickFunnels (Brunson)</p>
                  <p style={{ color: clientColor.main, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{client.name}</p>
                </div>
                {[
                  { el: "Droomresultaat", br: "Meer klanten & omzet, voorspelbaar en zonder technisch gedoe.", cl: client.dreamGoal },
                  ...client.frameworks.map((fw, i) => ({ el: `Core Result ${i + 1}`, br: ["Traffic", "Funnels", "Conversions", "Value Ladder", "Automation"][i] || "\u2014", cl: `${fw.name} \u2014 ${fw.subtitle}` })),
                  { el: "Free Value", br: "Gratis challenge / webinar / lead magnet", cl: client.frameworks.map(fw => fw.freeValue?.[0]).filter(Boolean).join(" / ") || "\u2014" },
                  { el: "Low Ticket", br: "Tripwire / kleine aanbieding", cl: client.frameworks.map(fw => fw.lowTicket?.[0]).filter(Boolean).join(" / ") || "\u2014" },
                  { el: "Core Offer", br: "Software / dienst ($97-$297)", cl: client.frameworks.map(fw => fw.coreOffer?.[0]).filter(Boolean).join(" / ") || "\u2014" },
                  { el: "High Ticket", br: "Coaching / Mastermind ($10k-$25k+)", cl: client.frameworks.map(fw => fw.highTicket?.[0]).filter(Boolean).join(" / ") || "\u2014" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", padding: "12px 18px", gap: 14, borderBottom: `1px solid ${t.border}`, background: i % 2 === 0 ? t.bg : t.surface, alignItems: "start" }}>
                    <p style={{ color: t.accent, fontSize: 13, fontWeight: 600, margin: 0 }}>{row.el}</p>
                    <p style={{ color: t.textMuted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{row.br}</p>
                    <p style={{ color: t.text, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{row.cl}</p>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ══ MASTER PROMPT ══ */}
          {tab === "prompt" && (
            <div>
              <SectionLabel t={t}>Master Prompt</SectionLabel>
              <Card t={t} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name="fileText" size={16} color={t.textMuted} />
                    <p style={{ color: t.textSecondary, fontSize: 13, margin: 0 }}>{client.name} &middot; {client.frameworks.length} frameworks &middot; Fase 1-4 roadmap inbegrepen</p>
                  </div>
                  <button onClick={copy}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: copied ? t.green : t.accent,
                      border: "none", borderRadius: t.radiusSm,
                      color: "#fff", padding: "10px 20px", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, fontFamily: t.fontBase,
                      transition: "all 0.2s ease",
                    }}>
                    <Icon name={copied ? "check" : "copy"} size={14} color="#fff" />
                    {copied ? "Gekopieerd!" : "Kopieer Prompt"}
                  </button>
                </div>
              </Card>
              <pre style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius,
                padding: 24, color: t.textSecondary, fontSize: 13, lineHeight: 1.8,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontFamily: t.fontMono, maxHeight: 520, overflowY: "auto",
              }}>
                {prompt}
              </pre>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
