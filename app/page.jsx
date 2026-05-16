"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#1C1410; --border:#3A2C24; --text:#E4D9CF; --text-dim:#9A8880;
    --text-mute:#5C4E47; --accent:#527252; --red:#8B3A3A;
    --done-bg:#1A2118; --done-text:#527252; --nn-bg:#1F1A2A;
    --nn-border:#3A3050; --input-bg:#221A14;
    --font:'IBM Plex Sans',sans-serif; --mono:'IBM Plex Mono',monospace; --tr:140ms ease;
  }
  html { height:100%; width:100%; overflow:hidden; position:fixed; top:0; left:0;
    touch-action:manipulation; -webkit-text-size-adjust:none; text-size-adjust:none; }
  body { height:100%; width:100%; overflow:hidden; position:fixed; top:0; left:0;
    background:var(--bg); color:var(--text); font-family:var(--font);
    -webkit-font-smoothing:antialiased; user-select:none; overscroll-behavior:none; }
  #root { height:100%; width:100%; overflow:hidden; position:fixed; }
  input, textarea { font-size:16px !important; -webkit-text-size-adjust:none; }

  .app { display:flex; flex-direction:column; height:100dvh; width:100vw;
    overflow:hidden; position:fixed; top:0; left:0; }

  /* OVERLAY */
  .overlay { position:fixed; inset:0; background:var(--bg); z-index:100;
    display:flex; flex-direction:column; padding:52px 44px 44px;
    cursor:pointer; transition:opacity 500ms ease; touch-action:manipulation; }
  .overlay.exit { opacity:0; pointer-events:none; }
  .ov-greeting { font-family:var(--mono); font-size:10px; letter-spacing:0.14em;
    color:var(--text-mute); text-transform:lowercase; margin-bottom:36px; }
  .ov-summary { font-size:clamp(28px,8vw,42px); font-weight:300; line-height:1.3;
    color:var(--text); letter-spacing:-0.025em; max-width:320px; }
  .ov-tap { position:absolute; bottom:44px; left:44px; font-family:var(--mono);
    font-size:9px; letter-spacing:0.12em; color:var(--text-mute); }
  .ov-loader { width:12px; height:12px; border:1px solid var(--border);
    border-top-color:var(--text-mute); border-radius:50%;
    animation:spin 800ms linear infinite; margin-bottom:36px; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* TOPROW */
  .toprow { display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; flex-shrink:0; }
  .toprow-date { font-family:var(--mono); font-size:9px; letter-spacing:0.1em; color:var(--text-mute); }
  .flip-tab { display:flex; border:1px solid var(--border); overflow:hidden; }
  .flip-btn { padding:6px 12px; font-family:var(--mono); font-size:7.5px;
    letter-spacing:0.1em; text-transform:uppercase; color:var(--text-mute);
    background:none; border:none; cursor:pointer; -webkit-tap-highlight-color:transparent;
    touch-action:manipulation; transition:color var(--tr),background var(--tr); }
  .flip-btn+.flip-btn { border-left:1px solid var(--border); }
  .flip-btn.active { color:var(--text); background:rgba(255,255,255,0.04); }

  /* TOP BLOCKS */
  .top-wrap { flex-shrink:0; display:flex; flex-direction:column;
    border-top:1px solid var(--border); position:relative; overflow:hidden; }
  .pri-block { height:33.333%; border-bottom:1px solid var(--border);
    padding:0 56px 0 16px; display:flex; flex-direction:column;
    justify-content:center; position:relative; cursor:pointer;
    -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:background var(--tr),opacity var(--tr); }
  .pri-block.editing { background:var(--input-bg); cursor:default; }
  .pri-block.done { background:var(--done-bg); opacity:0.58; }
  .pri-block.done .pri-title { text-decoration:line-through; color:var(--done-text); }
  .pri-num { font-family:var(--mono); font-size:8px; letter-spacing:0.1em;
    color:var(--text-mute); margin-bottom:4px; }
  .pri-title { font-size:clamp(14px,3.6vw,19px); font-weight:400; line-height:1.2;
    color:var(--text); letter-spacing:-0.01em; }
  .pri-empty { font-size:12px; font-weight:300; color:var(--text-mute); }
  .pri-source { font-family:var(--mono); font-size:7.5px; color:var(--text-mute);
    margin-top:3px; letter-spacing:0.06em; }
  .pri-detecting { font-family:var(--mono); font-size:8px; letter-spacing:0.1em;
    color:var(--accent); margin-top:4px; display:flex; align-items:center; gap:6px; }
  .pri-input { background:none; border:none; outline:none; font-family:var(--font);
    font-size:16px; font-weight:400; color:var(--text); letter-spacing:-0.01em;
    width:100%; caret-color:var(--accent); user-select:text; touch-action:auto; padding:0; }
  .pri-input::placeholder { color:var(--text-mute); font-weight:300; }
  .pri-actions { position:absolute; right:0; top:0; bottom:0;
    display:flex; flex-direction:column; border-left:1px solid var(--border); }
  .pri-action-btn { flex:1; background:none; border:none; border-bottom:1px solid var(--border);
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    display:flex; align-items:center; justify-content:center; width:44px;
    transition:background var(--tr); }
  .pri-action-btn:last-child { border-bottom:none; }
  .pri-action-btn:active { background:rgba(255,255,255,0.04); }

  /* NN panel */
  .nn-panel { position:absolute; inset:0; display:flex; flex-direction:column;
    background:var(--nn-bg); transform:translateX(100%); transition:transform 280ms ease; }
  .nn-panel.visible { transform:translateX(0); }
  .nn-block { height:33.333%; border-bottom:1px solid var(--nn-border);
    padding:0 16px; display:flex; flex-direction:column; justify-content:center;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:opacity var(--tr); }
  .nn-block.done { opacity:0.48; }
  .nn-num { font-family:var(--mono); font-size:8px; letter-spacing:0.1em; color:#6A5E80; margin-bottom:4px; }
  .nn-title { font-size:clamp(14px,3.6vw,19px); font-weight:400; line-height:1.2;
    color:#C4B8D8; letter-spacing:-0.01em; }
  .nn-block.done .nn-title { text-decoration:line-through; color:#6A5E80; }

  /* LOWER */
  .lower { flex:1; display:flex; min-height:0; border-top:1px solid var(--border); }

  /* LEFT — journal */
  .journal-col { width:48%; display:flex; flex-direction:column;
    border-right:1px solid var(--border); min-height:0; position:relative; }

  /* Journal mode tabs */
  .j-mode-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
  .j-mode-tab { flex:1; padding:8px 2px; font-family:var(--mono); font-size:7px;
    letter-spacing:0.1em; text-transform:uppercase; color:var(--text-mute);
    background:none; border:none; border-right:1px solid var(--border);
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:color var(--tr),background var(--tr); }
  .j-mode-tab:last-child { border-right:none; }
  .j-mode-tab.active { color:var(--text); background:rgba(255,255,255,0.016); }

  /* Notes mode */
  .journal-area { flex:1; background:transparent; border:none; color:var(--text);
    font-family:var(--font); font-size:16px; font-weight:300; line-height:1.7;
    padding:14px 14px 44px; resize:none; outline:none; caret-color:var(--accent);
    overflow-y:auto; -webkit-overflow-scrolling:touch; user-select:text; touch-action:pan-y; }
  .journal-area::-webkit-scrollbar { display:none; }
  .journal-area::placeholder { color:var(--text-mute); font-size:13px; }
  .journal-foot { position:absolute; bottom:0; left:0; right:0; padding:7px 12px;
    border-top:1px solid var(--border); background:var(--bg);
    display:flex; align-items:center; justify-content:space-between; }
  .reflect-btn { background:none; border:1px solid var(--border); color:var(--text-mute);
    font-family:var(--mono); font-size:8px; letter-spacing:0.1em; padding:6px 12px;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .mic-btn { background:none; border:none; color:var(--text-mute); font-size:14px;
    cursor:pointer; line-height:1; padding:4px;
    -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .ai-panel { position:absolute; inset:0; background:var(--bg); padding:14px;
    display:flex; flex-direction:column; gap:12px; overflow-y:auto;
    transform:translateY(100%); transition:transform 260ms ease; touch-action:pan-y; }
  .ai-panel.open { transform:translateY(0); }
  .ai-head { display:flex; justify-content:space-between; align-items:center; }
  .ai-label { font-size:8px; font-weight:500; letter-spacing:0.14em;
    text-transform:uppercase; color:var(--text-mute); }
  .ai-back { background:none; border:none; font-family:var(--mono); font-size:8px;
    letter-spacing:0.1em; color:var(--text-mute); cursor:pointer; padding:6px 0;
    -webkit-tap-highlight-color:transparent; }
  .ai-body { font-size:13px; font-weight:300; line-height:1.72;
    color:var(--text-dim); white-space:pre-wrap; }

  /* Reflection mode */
  .refl-wrap { flex:1; display:flex; flex-direction:column; min-height:0; }
  .refl-idle { flex:1; display:flex; align-items:center; justify-content:center;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .refl-idle-label { font-family:var(--mono); font-size:9px; letter-spacing:0.14em;
    color:var(--text-mute); text-transform:uppercase; }
  .refl-generating { flex:1; display:flex; align-items:center; justify-content:center;
    gap:10px; font-family:var(--mono); font-size:9px; letter-spacing:0.1em; color:var(--text-mute); }
  .refl-q-panel { flex:1; display:flex; flex-direction:column; min-height:0; }
  .refl-q-top { padding:12px 14px 10px; border-bottom:1px solid var(--border); flex-shrink:0; }
  .refl-q-prog { font-family:var(--mono); font-size:7.5px; letter-spacing:0.1em;
    color:var(--text-mute); margin-bottom:8px; }
  .refl-q-text { font-size:13px; font-weight:300; line-height:1.6; color:var(--text); }
  .refl-answer { flex:1; background:transparent; border:none; color:var(--text);
    font-family:var(--font); font-size:16px; font-weight:300; line-height:1.7;
    padding:12px 14px; resize:none; outline:none; caret-color:var(--accent);
    overflow-y:auto; -webkit-overflow-scrolling:touch; user-select:text; touch-action:pan-y; }
  .refl-answer::-webkit-scrollbar { display:none; }
  .refl-answer::placeholder { color:var(--text-mute); }
  .refl-footer { padding:7px 12px; border-top:1px solid var(--border); flex-shrink:0;
    display:flex; justify-content:flex-end; }
  .refl-next-btn { background:none; border:1px solid var(--border); color:var(--text-mute);
    font-family:var(--mono); font-size:8px; letter-spacing:0.1em; padding:6px 16px;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .refl-done { flex:1; display:flex; flex-direction:column; align-items:center;
    justify-content:center; gap:10px; padding:20px; text-align:center; }
  .refl-done-label { font-family:var(--mono); font-size:9px; letter-spacing:0.14em;
    color:var(--text-mute); text-transform:uppercase; }
  .refl-done-note { font-size:11px; font-weight:300; color:var(--text-mute); line-height:1.6; }
  .refl-again { background:none; border:1px solid var(--border); color:var(--text-mute);
    font-family:var(--mono); font-size:8px; letter-spacing:0.1em; padding:6px 16px;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; margin-top:4px; }

  /* RIGHT — tasks */
  .task-col { flex:1; display:flex; flex-direction:column; min-height:0; }
  .cat-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
  .cat-tab { flex:1; padding:10px 2px 9px; font-size:7px; font-weight:500;
    letter-spacing:0.1em; text-transform:uppercase; color:var(--text-mute);
    background:none; border:none; border-right:1px solid var(--border);
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:color var(--tr),background var(--tr); }
  .cat-tab:last-child { border-right:none; }
  .cat-tab.active { color:var(--text); background:rgba(255,255,255,0.016); }
  .task-list { flex:1; overflow-y:auto; overflow-x:hidden;
    -webkit-overflow-scrolling:touch; touch-action:pan-y; }
  .task-list::-webkit-scrollbar { display:none; }
  .task-row { display:flex; align-items:center; padding:12px; gap:9px;
    border-bottom:1px solid var(--border); cursor:pointer;
    -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:background var(--tr),opacity var(--tr); }
  .task-row:active { background:rgba(255,255,255,0.02); }
  .task-row.done { opacity:0.42; }
  .task-row.assigned { opacity:0.3; }
  .task-dot { width:5px; height:5px; border-radius:50%;
    border:1px solid var(--text-mute); flex-shrink:0;
    transition:background var(--tr),border-color var(--tr); }
  .task-row.done .task-dot { background:var(--accent); border-color:var(--accent); }
  .task-text { font-size:12px; font-weight:300; line-height:1.45;
    color:var(--text); flex:1; user-select:none; }
  .task-row.done .task-text { text-decoration:line-through; color:var(--text-mute); }
  .task-up { font-size:14px; color:var(--accent); flex-shrink:0; line-height:1; padding:2px 0; }
  .add-row { display:flex; align-items:stretch; border-bottom:1px solid var(--border); }
  .add-input { flex:1; background:none; border:none; color:var(--text);
    font-family:var(--font); font-size:16px; font-weight:300;
    padding:12px; outline:none; caret-color:var(--accent);
    user-select:text; touch-action:auto; }
  .add-input::placeholder { color:var(--text-mute); }
  .add-confirm { padding:0 16px; background:none; border:none;
    border-left:1px solid var(--border); color:var(--accent);
    font-size:18px; cursor:pointer; -webkit-tap-highlight-color:transparent;
    touch-action:manipulation; display:flex; align-items:center; justify-content:center; }
  .add-trigger { width:100%; padding:11px 12px; background:none; border:none;
    border-bottom:1px solid var(--border); color:var(--text-mute);
    font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
    cursor:pointer; text-align:left; -webkit-tap-highlight-color:transparent;
    touch-action:manipulation; }

  /* AUTH */
  .auth { display:flex; flex-direction:column; align-items:center;
    justify-content:center; height:100dvh; padding:48px 44px; }
  .auth-tag { font-family:var(--mono); font-size:9px; letter-spacing:0.14em;
    color:var(--text-mute); text-transform:uppercase; margin-bottom:44px; }
  .auth-hed { font-size:30px; font-weight:300; letter-spacing:-0.02em;
    line-height:1.25; color:var(--text); margin-bottom:56px; text-align:center; }
  .auth-field { width:100%; max-width:280px; margin-bottom:16px; }
  .auth-lbl { font-size:8px; font-weight:500; letter-spacing:0.14em;
    text-transform:uppercase; color:var(--text-mute); display:block; margin-bottom:8px; }
  .auth-inp { width:100%; background:none; border:none;
    border-bottom:1px solid var(--border); color:var(--text); font-family:var(--font);
    font-size:16px; font-weight:300; padding:8px 0; outline:none;
    caret-color:var(--accent); user-select:text; touch-action:auto; }
  .auth-inp::placeholder { color:var(--text-mute); }
  .auth-sub { width:100%; max-width:280px; margin-top:12px; padding:14px;
    background:none; border:1px solid var(--border); color:var(--text-dim);
    font-family:var(--font); font-size:10px; font-weight:500;
    letter-spacing:0.16em; text-transform:uppercase; cursor:pointer;
    -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .auth-sub:disabled { opacity:0.4; cursor:not-allowed; }
  .auth-tog { margin-top:24px; font-size:10px; color:var(--text-mute);
    background:none; border:none; cursor:pointer; font-family:var(--font);
    -webkit-tap-highlight-color:transparent; }
  .auth-msg { font-size:11px; color:var(--text-mute); margin-top:10px;
    max-width:280px; line-height:1.5; text-align:center; }
  .auth-err { font-size:11px; color:#7A3A3A; margin-top:10px;
    max-width:280px; line-height:1.5; text-align:center; }

  .spin-sm { width:9px; height:9px; border:1px solid var(--border);
    border-top-color:var(--accent); border-radius:50%;
    animation:spin 700ms linear infinite; display:inline-block; vertical-align:middle; }
  .toast { position:fixed; bottom:20px; left:50%;
    transform:translateX(-50%) translateY(6px); background:var(--bg);
    border:1px solid var(--border); color:var(--text-dim); font-family:var(--mono);
    font-size:9px; letter-spacing:0.1em; padding:8px 16px; opacity:0;
    transition:opacity 220ms ease,transform 220ms ease;
    pointer-events:none; z-index:200; white-space:nowrap; }
  .toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const LS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  return "good evening";
}

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "short", month: "short", day: "numeric",
}).toUpperCase();

const CATS = ["Work", "Personal", "Business", "Life"];
const EMPTY_SLOT = () => ({ title: "", done: false, sourceId: null, sourceCat: null });

const DEFAULT_NN = [
  { id: "nn1", title: "Cold shower or plunge", done: false },
  { id: "nn2", title: "Workout — no exceptions", done: false },
  { id: "nn3", title: "Journal and reflect", done: false },
];

const DEFAULT_TASKS = {
  Work:     [{ id:"w1", text:"Deep work — no interruptions", done:false }, { id:"w2", text:"Clear inbox", done:false }, { id:"w3", text:"Review open projects", done:false }],
  Personal: [{ id:"p1", text:"Call someone you owe a call", done:false }, { id:"p2", text:"Handle one personal errand", done:false }],
  Business: [{ id:"b1", text:"Move one deal forward", done:false }, { id:"b2", text:"Follow up on open loops", done:false }, { id:"b3", text:"Check financials", done:false }],
  Life:     [{ id:"l1", text:"Sleep by target time", done:false }, { id:"l2", text:"Move — 20 min minimum", done:false }, { id:"l3", text:"Prepare tomorrow", done:false }],
};

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE PROXY
// ─────────────────────────────────────────────────────────────────────────────
async function callClaude(system, userMsg, maxTokens = 300) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, userMsg, maxTokens }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error ?? "API error");
  return d.text || "";
}

async function detectCategory(text) {
  try {
    const r = await callClaude(
      `Classify this task into exactly one: Work, Personal, Business, or Life.
Work=job tasks. Business=your own company/revenue. Personal=family/friends/errands. Life=health/sleep/exercise/habits.
Reply with ONLY the one-word category.`,
      text, 10
    );
    return CATS.find(c => r.toLowerCase().includes(c.toLowerCase())) || "Personal";
  } catch { return "Personal"; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const IconDown = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2L7 12M3 8L7 12L11 8" stroke="#8B3A3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M9 2L11 4L5 10L2 11L3 8Z" stroke="#5C4E47" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {

  // ── AUTH ───────────────────────────────────────────────────────────────────
  const [authed, setAuthed]           = useState(false);
  const [user, setUser]               = useState(null);
  const [authMode, setMode]           = useState("login");
  const [af, setAf]                   = useState({ email: "", password: "", name: "" });
  const [authErr, setAuthErr]         = useState("");
  const [authMsg, setAuthMsg]         = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ── OVERLAY ────────────────────────────────────────────────────────────────
  const [overlayOn, setOverlayOn]           = useState(true);
  const [overlayExit, setOverlayExit]       = useState(false);
  const [overlaySummary, setOverlaySummary] = useState(null);
  const [overlayLoading, setOvLoading]      = useState(true);

  // ── TOP ────────────────────────────────────────────────────────────────────
  const [topMode, setTopMode]         = useState("priority");
  const [priorities, setPriorities]   = useState([EMPTY_SLOT(), EMPTY_SLOT(), EMPTY_SLOT()]);
  const [editingSlot, setEditingSlot] = useState(-1);
  const [slotInputs, setSlotInputs]   = useState(["", "", ""]);
  const [detecting, setDetecting]     = useState([false, false, false]);

  // ── NN ─────────────────────────────────────────────────────────────────────
  const [nn, setNn] = useState(() => LS.get("kw_nn", DEFAULT_NN));

  // ── TASKS ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [cat, setCat]     = useState("Work");
  const [adding, setAdding]   = useState(false);
  const [addText, setAddText] = useState("");

  // ── JOURNAL ────────────────────────────────────────────────────────────────
  const [journalMode, setJournalMode] = useState("notes"); // "notes" | "reflection"
  const [journal, setJournal]         = useState("");
  const [aiText, setAiText]           = useState(null);
  const [aiOpen, setAiOpen]           = useState(false);
  const [aiLoading, setAiLoading]     = useState(false);

  // ── REFLECTION ─────────────────────────────────────────────────────────────
  const [reflStep, setReflStep]           = useState(null); // null | generating | questioning | done
  const [reflQuestions, setReflQuestions] = useState([]);
  const [reflIdx, setReflIdx]             = useState(0);
  const [reflAnswers, setReflAnswers]     = useState([]);
  const [reflAnswer, setReflAnswer]       = useState("");

  // ── TOAST ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: "" });

  const slotRefs   = [useRef(null), useRef(null), useRef(null)];
  const addTextRef = useRef("");
  const reflAnsRef = useRef(null);

  useEffect(() => { addTextRef.current = addText; }, [addText]);
  useEffect(() => { LS.set("kw_nn", nn); }, [nn]);

  // ── SUPABASE AUTH LISTENER ─────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setAuthed(true);
          const name = session.user.user_metadata?.name || session.user.email.split("@")[0];
          // load in parallel
          loadTasks(session.user.id);
          loadOverlay(session.user.id, name);
        } else {
          setUser(null);
          setAuthed(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingSlot >= 0) setTimeout(() => slotRefs[editingSlot]?.current?.focus(), 60);
  }, [editingSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reflStep === "questioning") setTimeout(() => reflAnsRef.current?.focus(), 60);
  }, [reflStep, reflIdx]);

  // ── DATA LOADING ───────────────────────────────────────────────────────────

  async function loadTasks(userId) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      const grouped = {};
      CATS.forEach(c => { grouped[c] = []; });
      data.forEach(t => {
        if (grouped[t.category]) {
          grouped[t.category].push({
            id: t.id,
            text: t.text,
            done: t.done,
            fromSlot: false, // slots don't persist across sessions
          });
        }
      });
      setTasks(grouped);
    }
    // 0 rows = new user, DEFAULT_TASKS stays as the initial hint
  }

  async function loadOverlay(userId, name) {
    setOvLoading(true);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: memories } = await supabase
        .from("memories")
        .select("summary")
        .eq("user_id", userId)
        .gte("memory_date", since)
        .order("created_at", { ascending: false })
        .limit(10);

      const context = memories?.map(m => m.summary).filter(Boolean).join(". ") || "";
      const prompt  = context
        ? `Name: ${name}. Recent context: ${context}`
        : `Name: ${name}`;

      const text = await callClaude(
        `Calm daily briefing. 1-2 lines plain text. No labels. Under 20 words. Grounded. Displayed very large.`,
        prompt
      );
      setOverlaySummary(text);
    } catch {
      setOverlaySummary("Keep your word.\nFinish what you start.");
    }
    setOvLoading(false);
  }

  // ── AUTH HANDLERS ──────────────────────────────────────────────────────────

  async function handleAuth() {
    setAuthErr(""); setAuthMsg("");
    if (!af.email || !af.password) { setAuthErr("Email and password required."); return; }
    if (authMode === "register" && !af.name) { setAuthErr("Name required."); return; }
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        const { error } = await supabase.auth.signUp({
          email: af.email,
          password: af.password,
          options: { data: { name: af.name } },
        });
        if (error) { setAuthErr(error.message); return; }
        setAuthMsg("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: af.email,
          password: af.password,
        });
        if (error) { setAuthErr(error.message); }
        // success → onAuthStateChange fires and handles the rest
      }
    } catch {
      setAuthErr("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function dismissOverlay() {
    if (overlayLoading) return;
    setOverlayExit(true);
    setTimeout(() => setOverlayOn(false), 500);
  }

  // ── SLOT LOGIC ─────────────────────────────────────────────────────────────

  function openSlot(idx) {
    setSlotInputs(prev => { const n = [...prev]; n[idx] = priorities[idx].title || ""; return n; });
    setEditingSlot(idx);
  }

  function tapSlotBody(idx) {
    if (editingSlot !== -1) return;
    const slot = priorities[idx];
    if (slot.title) {
      setPriorities(p => p.map((s, i) => i === idx ? { ...s, done: !s.done } : s));
    } else {
      openSlot(idx);
    }
  }

  async function commitSlot(idx) {
    const text = slotInputs[idx].trim();
    setEditingSlot(-1);
    const existing = priorities[idx];
    if (!text) return;

    // Remove previous task for this slot if it was typed directly (not promoted)
    if (existing.title && existing.sourceId && existing.sourceCat) {
      setTasks(p => ({
        ...p,
        [existing.sourceCat]: (p[existing.sourceCat] || []).filter(t => t.id !== existing.sourceId),
      }));
      if (user) await supabase.from("tasks").delete().eq("id", existing.sourceId);
    }

    // Show title immediately while we detect category
    setPriorities(p => p.map((s, i) =>
      i === idx ? { title: text, done: false, sourceId: null, sourceCat: null } : s
    ));

    setDetecting(prev => { const n = [...prev]; n[idx] = true; return n; });
    const detectedCat = await detectCategory(text);
    setDetecting(prev => { const n = [...prev]; n[idx] = false; return n; });

    // Insert task in DB, use the UUID as canonical ID
    let taskId = `s${idx}_${Date.now()}`;
    if (user) {
      const { data } = await supabase.from("tasks").insert({
        user_id: user.id, text, category: detectedCat, done: false, from_slot: true,
      }).select().single();
      if (data) taskId = data.id;
    }

    setPriorities(p => p.map((s, i) => i === idx ? { ...s, sourceId: taskId, sourceCat: detectedCat } : s));
    setTasks(p => ({
      ...p,
      [detectedCat]: [...(p[detectedCat] || []), { id: taskId, text, done: false, fromSlot: true }],
    }));
    showToast(`→ ${detectedCat}`);
  }

  function cancelSlot(idx) {
    setEditingSlot(-1);
    setSlotInputs(prev => { const n = [...prev]; n[idx] = priorities[idx].title || ""; return n; });
  }

  async function returnSlot(idx) {
    const slot = priorities[idx];
    if (!slot.title) return;
    setPriorities(p => p.map((s, i) => i === idx ? EMPTY_SLOT() : s));
    if (!slot.sourceId) { showToast("cleared"); return; }

    const targetCat = slot.sourceCat || "Personal";
    setTasks(tp => {
      const list = tp[targetCat] || [];
      const exists = list.some(t => t.id === slot.sourceId);
      if (exists) return { ...tp, [targetCat]: list.map(t => t.id === slot.sourceId ? { ...t, fromSlot: false } : t) };
      return { ...tp, [targetCat]: [...list, { id: slot.sourceId, text: slot.title, done: false }] };
    });
    if (user) await supabase.from("tasks").update({ from_slot: false }).eq("id", slot.sourceId);
    setCat(targetCat);
    showToast(`returned to ${targetCat}`);
  }

  // ── TASK LOGIC ─────────────────────────────────────────────────────────────

  function tapTask(task, catName) {
    if (task.done) { toggleTask(catName, task.id); return; }
    const isActuallySlotted = priorities.some(s => s.sourceId === task.id && s.title);
    if (task.fromSlot && isActuallySlotted) { showToast("in priority — use ↓ to return"); return; }
    if (task.fromSlot && !isActuallySlotted) {
      setTasks(p => ({ ...p, [catName]: (p[catName] || []).map(t => t.id === task.id ? { ...t, fromSlot: false } : t) }));
    }
    const emptyIdx = priorities.findIndex(s => !s.title);
    if (emptyIdx === -1) { showToast("all 3 slots filled"); return; }
    setPriorities(p => p.map((s, i) =>
      i === emptyIdx ? { title: task.text, done: false, sourceId: task.id, sourceCat: catName } : s
    ));
    setTasks(p => ({ ...p, [catName]: (p[catName] || []).map(t => t.id === task.id ? { ...t, fromSlot: true } : t) }));
    if (user) supabase.from("tasks").update({ from_slot: true }).eq("id", task.id);
    if (navigator.vibrate) navigator.vibrate(10);
    showToast(`→ priority ${emptyIdx + 1}`);
  }

  function toggleTask(catName, id) {
    const task = (tasks[catName] || []).find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(p => ({ ...p, [catName]: (p[catName] || []).map(t => t.id === id ? { ...t, done: newDone } : t) }));
    if (user) supabase.from("tasks").update({ done: newDone }).eq("id", id);
  }

  async function commitAdd() {
    const val = addTextRef.current.trim();
    if (!val) { setAdding(false); return; }
    if (user) {
      const { data, error } = await supabase.from("tasks").insert({
        user_id: user.id, text: val, category: cat, done: false, from_slot: false,
      }).select().single();
      if (!error && data) {
        setTasks(p => ({ ...p, [cat]: [...(p[cat] || []), { id: data.id, text: val, done: false, fromSlot: false }] }));
      }
    } else {
      setTasks(p => ({ ...p, [cat]: [...(p[cat] || []), { id: `t${Date.now()}`, text: val, done: false }] }));
    }
    setAddText(""); addTextRef.current = "";
    setAdding(false); showToast("added");
  }

  // ── JOURNAL LOGIC ──────────────────────────────────────────────────────────

  // Save entry to DB, then fire-and-forget memory compression
  async function saveJournalEntry(text, type) {
    if (!user || !text.trim()) return;
    await supabase.from("journal_entries").insert({
      user_id: user.id, raw_text: text, entry_type: type,
    });
    compressToMemory(text); // background — does not block
  }

  async function compressToMemory(text) {
    if (!user) return;
    try {
      const result = await callClaude(
        `Extract 3-5 keywords and write one concise sentence capturing the key insight from this journal entry.
Return valid JSON only — no other text: {"keywords":["word1","word2"],"summary":"One sentence."}`,
        text, 150
      );
      const match = result.match(/\{[\s\S]*\}/);
      if (!match) return;
      const { keywords, summary } = JSON.parse(match[0]);
      if (summary) {
        await supabase.from("memories").insert({
          user_id: user.id,
          keywords: keywords || [],
          summary,
          category: "journal",
          memory_date: new Date().toISOString().split("T")[0],
        });
      }
    } catch { /* silent — memory compression is non-critical */ }
  }

  function handleJournalKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (journal.trim()) saveJournalEntry(journal, "note");
      setJournal("");
    }
  }

  async function reflect() {
    if (!journal.trim()) { showToast("write something first"); return; }
    setAiLoading(true); setAiOpen(true); setAiText(null);
    await saveJournalEntry(journal, "note");
    try {
      const text = await callClaude(
        `Observational system. Plain text only.\n\nPatterns:\n[2 lines]\n\nUnresolved:\n[1-2 lines]\n\nTomorrow:\n[1-2 lines]\n\nUnder 60 words. Calm, factual.`,
        journal
      );
      setAiText(text);
    } catch { setAiText("Could not process."); }
    setAiLoading(false);
  }

  // ── REFLECTION LOGIC ───────────────────────────────────────────────────────

  async function startReflection() {
    setReflStep("generating");
    setReflAnswers([]); setReflIdx(0); setReflAnswer("");
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: memories } = user
        ? await supabase.from("memories").select("summary")
            .eq("user_id", user.id).gte("memory_date", since)
            .order("created_at", { ascending: false }).limit(7)
        : { data: [] };

      const recentCtx = memories?.map(m => m.summary).filter(Boolean).join(". ") || "";

      const doneTasks    = Object.entries(tasks).flatMap(([c, list]) => list.filter(t => t.done).map(t => `${t.text} (${c})`));
      const pendingTasks = Object.entries(tasks).flatMap(([c, list]) => list.filter(t => !t.done && !t.fromSlot).map(t => `${t.text} (${c})`));

      const ctx = [
        `Time of day: ${getGreeting()}`,
        doneTasks.length    ? `Completed: ${doneTasks.slice(0, 5).join(", ")}` : "",
        pendingTasks.length ? `Still pending: ${pendingTasks.slice(0, 5).join(", ")}` : "",
        recentCtx           ? `Recent context: ${recentCtx}` : "",
      ].filter(Boolean).join("\n");

      const result = await callClaude(
        `Generate 3 to 5 specific, thoughtful reflection questions for someone at this point in their day.
Ground every question in the context provided — completed tasks, pending items, time of day, recent life context.
Make them introspective but practical. No generic questions.
Return a valid JSON array only — no other text: ["Question 1?","Question 2?","Question 3?"]`,
        ctx, 400
      );

      const match = result.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("no array");
      const questions = JSON.parse(match[0]);
      if (!Array.isArray(questions) || questions.length === 0) throw new Error("empty");

      setReflQuestions(questions);
      setReflStep("questioning");
    } catch {
      showToast("could not generate questions");
      setReflStep(null);
    }
  }

  function submitAnswer() {
    if (!reflAnswer.trim()) return;
    const updated = [...reflAnswers, { q: reflQuestions[reflIdx], a: reflAnswer.trim() }];
    setReflAnswers(updated);
    setReflAnswer("");
    if (reflIdx + 1 < reflQuestions.length) {
      setReflIdx(reflIdx + 1);
    } else {
      finishReflection(updated);
    }
  }

  async function finishReflection(answers) {
    setReflStep("done");
    const fullText = answers.map(({ q, a }) => `Q: ${q}\nA: ${a}`).join("\n\n");
    await saveJournalEntry(fullText, "reflection");
    showToast("reflection saved");
  }

  function resetReflection() {
    setReflStep(null); setReflQuestions([]); setReflIdx(0);
    setReflAnswers([]); setReflAnswer("");
  }

  function showToast(msg) {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2000);
  }

  const currentTasks = tasks[cat] || [];

  // ── AUTH SCREEN ────────────────────────────────────────────────────────────
  if (!authed) return (
    <>
      <style>{CSS}</style>
      <div className="auth">
        <div className="auth-tag">Daily Practice</div>
        <div className="auth-hed">Keep your word<br />to yourself.</div>
        {authMode === "register" && (
          <div className="auth-field">
            <label className="auth-lbl">Name</label>
            <input className="auth-inp" type="text" placeholder="Your name"
              value={af.name} onChange={e => setAf(p => ({ ...p, name: e.target.value }))} />
          </div>
        )}
        <div className="auth-field">
          <label className="auth-lbl">Email</label>
          <input className="auth-inp" type="email" autoComplete="email" placeholder="you@example.com"
            value={af.email} onChange={e => setAf(p => ({ ...p, email: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleAuth()} />
        </div>
        <div className="auth-field">
          <label className="auth-lbl">Password</label>
          <input className="auth-inp" type="password" placeholder="••••••••"
            value={af.password} onChange={e => setAf(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleAuth()} />
        </div>
        {authErr && <div className="auth-err">{authErr}</div>}
        {authMsg && <div className="auth-msg">{authMsg}</div>}
        <button className="auth-sub" onClick={handleAuth} disabled={authLoading}>
          {authLoading ? <span className="spin-sm" /> : authMode === "login" ? "Enter" : "Create Account"}
        </button>
        <button className="auth-tog"
          onClick={() => { setMode(m => m === "login" ? "register" : "login"); setAuthErr(""); setAuthMsg(""); }}>
          {authMode === "login" ? "Create an account" : "Sign in instead"}
        </button>
      </div>
    </>
  );

  // ── MAIN APP ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {overlayOn && (
          <div className={`overlay ${overlayExit ? "exit" : ""}`} onClick={dismissOverlay}>
            {overlayLoading
              ? <div className="ov-loader" />
              : <>
                  <div className="ov-greeting">{getGreeting()}</div>
                  <div className="ov-summary">
                    {overlaySummary?.split("\n").map((line, i) => (
                      <span key={i} style={{ display: "block" }}>{line}</span>
                    ))}
                  </div>
                  <div className="ov-tap">tap anywhere to continue</div>
                </>
            }
          </div>
        )}

        <div className="toprow">
          <div className="toprow-date">{TODAY}</div>
          <div className="flip-tab">
            <button className={`flip-btn ${topMode === "priority" ? "active" : ""}`}
              onClick={() => setTopMode("priority")}>Daily</button>
            <button className={`flip-btn ${topMode === "nn" ? "active" : ""}`}
              onClick={() => setTopMode("nn")}>Foundation</button>
          </div>
        </div>

        {/* ── TOP BLOCKS ── */}
        <div className="top-wrap" style={{ height: "calc(50dvh - 37px)" }}>
          {priorities.map((slot, i) => {
            const isEditing = editingSlot === i;
            return (
              <div key={i}
                className={["pri-block", slot.title && !isEditing ? "has-task" : "",
                  slot.title && slot.done && !isEditing ? "done" : "",
                  isEditing ? "editing" : ""].filter(Boolean).join(" ")}
                style={{ height: "33.333%" }}
                onClick={() => { if (!isEditing) tapSlotBody(i); }}>

                <div className="pri-num">0{i + 1}</div>

                {isEditing ? (
                  <input ref={slotRefs[i]} className="pri-input"
                    placeholder="What needs to happen..."
                    value={slotInputs[i]}
                    onChange={e => setSlotInputs(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); commitSlot(i); }
                      if (e.key === "Escape") cancelSlot(i);
                    }}
                    onBlur={() => commitSlot(i)} />
                ) : slot.title ? (
                  <>
                    <div className="pri-title">{slot.title}</div>
                    {detecting[i]
                      ? <div className="pri-detecting"><span className="spin-sm" /> detecting...</div>
                      : slot.sourceCat && <div className="pri-source">{slot.sourceCat}</div>
                    }
                  </>
                ) : (
                  <div className="pri-empty">tap to add · or tap ↑ on a task</div>
                )}

                {!isEditing && slot.title && (
                  <div className="pri-actions" onClick={e => e.stopPropagation()}>
                    <button className="pri-action-btn"
                      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); returnSlot(i); }}>
                      <IconDown />
                    </button>
                    <button className="pri-action-btn"
                      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); openSlot(i); }}>
                      <IconEdit />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className={`nn-panel ${topMode === "nn" ? "visible" : ""}`}>
            {nn.map((n, i) => (
              <div key={n.id} className={`nn-block ${n.done ? "done" : ""}`}
                style={{ height: "33.333%" }}
                onClick={() => setNn(p => p.map(x => x.id === n.id ? { ...x, done: !x.done } : x))}>
                <div className="nn-num">0{i + 1}</div>
                <div className="nn-title">{n.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LOWER ── */}
        <div className="lower">

          {/* JOURNAL COLUMN */}
          <div className="journal-col">

            {/* Mode toggle */}
            <div className="j-mode-tabs">
              <button className={`j-mode-tab ${journalMode === "notes" ? "active" : ""}`}
                onClick={() => { setJournalMode("notes"); setAiOpen(false); }}>
                Notes
              </button>
              <button className={`j-mode-tab ${journalMode === "reflection" ? "active" : ""}`}
                onClick={() => { setJournalMode("reflection"); setAiOpen(false); }}>
                Reflect
              </button>
            </div>

            {journalMode === "notes" ? (
              /* ── NOTES MODE ── */
              <>
                <textarea className="journal-area"
                  placeholder="Write anything. Enter to clear."
                  value={journal}
                  onChange={e => setJournal(e.target.value)}
                  onKeyDown={handleJournalKey}
                />
                <div className="journal-foot">
                  <button className="mic-btn" onClick={() => showToast("voice — coming soon")}>🎙</button>
                  <button className="reflect-btn" onClick={reflect}>
                    {aiLoading ? <span className="spin-sm" /> : "↑ reflect"}
                  </button>
                </div>
                <div className={`ai-panel ${aiOpen ? "open" : ""}`}>
                  <div className="ai-head">
                    <div className="ai-label">Observed</div>
                    <button className="ai-back" onClick={() => setAiOpen(false)}>← back</button>
                  </div>
                  {aiLoading
                    ? <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-mute)", fontSize: 12 }}>
                        <span className="spin-sm" /> reading...
                      </div>
                    : <div className="ai-body">{aiText}</div>
                  }
                </div>
              </>
            ) : (
              /* ── REFLECTION MODE ── */
              <div className="refl-wrap">
                {reflStep === null && (
                  <div className="refl-idle" onClick={startReflection}>
                    <div className="refl-idle-label">Begin reflection</div>
                  </div>
                )}

                {reflStep === "generating" && (
                  <div className="refl-generating">
                    <span className="spin-sm" /> generating questions...
                  </div>
                )}

                {reflStep === "questioning" && (
                  <div className="refl-q-panel">
                    <div className="refl-q-top">
                      <div className="refl-q-prog">{reflIdx + 1} / {reflQuestions.length}</div>
                      <div className="refl-q-text">{reflQuestions[reflIdx]}</div>
                    </div>
                    <textarea ref={reflAnsRef} className="refl-answer"
                      placeholder="Your answer..."
                      value={reflAnswer}
                      onChange={e => setReflAnswer(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
                      }}
                    />
                    <div className="refl-footer">
                      <button className="refl-next-btn" onClick={submitAnswer}>
                        {reflIdx + 1 < reflQuestions.length ? "Next →" : "Finish"}
                      </button>
                    </div>
                  </div>
                )}

                {reflStep === "done" && (
                  <div className="refl-done">
                    <div className="refl-done-label">Saved</div>
                    <div className="refl-done-note">Compressed into memory.</div>
                    <button className="refl-again" onClick={resetReflection}>Reflect again</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TASK COLUMN */}
          <div className="task-col">
            <div className="cat-tabs">
              {CATS.map(c => (
                <button key={c} className={`cat-tab ${cat === c ? "active" : ""}`}
                  onClick={() => { setCat(c); setAdding(false); }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="task-list">
              {currentTasks.map(t => (
                <div key={t.id}
                  className={`task-row ${t.done ? "done" : ""} ${t.fromSlot && !t.done ? "assigned" : ""}`}
                  onClick={() => tapTask(t, cat)}>
                  <div className="task-dot" />
                  <div className="task-text">{t.text}</div>
                  {!t.done && !t.fromSlot && <div className="task-up">↑</div>}
                </div>
              ))}
              {adding ? (
                <div className="add-row">
                  <input className="add-input" autoFocus placeholder="New task..."
                    value={addText}
                    onChange={e => { setAddText(e.target.value); addTextRef.current = e.target.value; }}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); commitAdd(); }
                      if (e.key === "Escape") { setAdding(false); setAddText(""); addTextRef.current = ""; }
                    }}
                  />
                  <button className="add-confirm"
                    onPointerDown={e => { e.preventDefault(); commitAdd(); }}>✓</button>
                </div>
              ) : (
                <button className="add-trigger" onClick={() => setAdding(true)}>+ add</button>
              )}
            </div>
          </div>
        </div>

        <div className={`toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
      </div>
    </>
  );
}
