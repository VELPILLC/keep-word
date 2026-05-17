"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const BAR_H = 28; // px height of a completed task bar

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#241712; --border:#3E2919; --text:#E4D9CF; --text-dim:#9A8878;
    --text-mute:#614838; --accent:#D4A246; --red:#8B3A3A;
    --done-bg:#1B2B1B; --done-text:#527252; --nn-bg:#1E1B19;
    --nn-border:#231E1B; --input-bg:#2A1C10;
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

  /* ── STARTUP OVERLAY ── */
  .s-overlay { position:fixed; inset:0; background:var(--bg); z-index:100;
    display:flex; flex-direction:column; padding:52px 44px 44px;
    cursor:pointer; transition:opacity 500ms ease; touch-action:manipulation; }
  .s-overlay.exit { opacity:0; pointer-events:none; }
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

  /* ── AI OVERLAY ── */
  .ai-overlay { position:fixed; inset:0; background:var(--bg); z-index:90;
    display:flex; flex-direction:column; overflow:hidden;
    opacity:1; transition:opacity 380ms ease; }
  .ai-overlay.exit { opacity:0; pointer-events:none; }
  .ai-scroll { flex:1; overflow-y:auto; padding:52px 44px 88px;
    -webkit-overflow-scrolling:touch; touch-action:pan-y; }
  .ai-scroll::-webkit-scrollbar { display:none; }
  .ai-tag { font-family:var(--mono); font-size:9px; letter-spacing:0.14em;
    color:var(--text-mute); text-transform:lowercase; margin-bottom:36px; }
  .ai-body-lg { font-size:clamp(15px,3.8vw,20px); font-weight:300; line-height:1.72;
    color:var(--text-dim); letter-spacing:-0.01em; white-space:pre-wrap; }
  .ai-dismiss { position:absolute; bottom:32px; left:44px; font-family:var(--mono);
    font-size:9px; letter-spacing:0.12em; color:var(--text-mute); pointer-events:none; }
  .ai-spin-wrap { display:flex; align-items:center; gap:12px;
    font-family:var(--mono); font-size:9px; letter-spacing:0.1em; color:var(--text-mute); }

  /* ── TOPROW ── */
  .toprow { display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; flex-shrink:0; gap:8px; }
  .toprow-date { font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
    color:var(--text-mute); flex:1; }
  .toprow-right { display:flex; align-items:center; gap:8px; }
  .ai-trigger-btn { background:none; border:none; padding:5px 8px;
    font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
    color:var(--text-mute); cursor:pointer; -webkit-tap-highlight-color:transparent;
    touch-action:manipulation; transition:color var(--tr); line-height:1; }
  .ai-trigger-btn:active { color:var(--text-dim); }
  .flip-tab { display:flex; border:1px solid var(--border); overflow:hidden; }
  .flip-btn { padding:6px 12px; font-family:var(--mono); font-size:7.5px;
    letter-spacing:0.1em; text-transform:uppercase; color:var(--text-mute);
    background:none; border:none; cursor:pointer; -webkit-tap-highlight-color:transparent;
    touch-action:manipulation; transition:color var(--tr),background var(--tr); }
  .flip-btn+.flip-btn { border-left:1px solid var(--border); }
  .flip-btn.active { color:var(--text); background:rgba(255,255,255,0.04); }

  /* ── TOP SECTION ── */
  .top-wrap { flex-shrink:0; display:flex; flex-direction:column;
    border-top:1px solid var(--border); position:relative; overflow:hidden; }

  /* Completed bar */
  .pri-bar { height:${BAR_H}px; flex-shrink:0; padding:0 14px;
    display:flex; align-items:center; overflow:hidden;
    background:var(--done-bg); border-bottom:1px solid #253525; }
  .pri-bar-text { font-size:10px; font-weight:300; color:var(--done-text);
    text-decoration:line-through; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; letter-spacing:0.01em; }

  /* Priority cards */
  .pri-block { height:calc((50dvh - 37px) / 3); border-bottom:1px solid var(--border);
    padding:0 56px 0 16px; display:flex; flex-direction:column;
    justify-content:center; position:relative; cursor:pointer;
    -webkit-tap-highlight-color:transparent; touch-action:none;
    user-select:none; -webkit-user-select:none;
    transition:background var(--tr),opacity var(--tr); }
  .pri-block.editing { background:var(--input-bg); cursor:default; }
  .pri-block.dragging { opacity:0.3; }
  .pri-block.drag-target { background:rgba(255,255,255,0.05); }
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
  .nn-block { height:calc((50dvh - 37px) / 3); border-bottom:1px solid var(--nn-border);
    padding:0 16px; display:flex; flex-direction:column; justify-content:center;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:opacity var(--tr); }
  .nn-block.done { opacity:0.4; }
  .nn-num { font-family:var(--mono); font-size:8px; letter-spacing:0.1em;
    color:#2C2725; margin-bottom:4px; }
  .nn-title { font-size:clamp(14px,3.6vw,19px); font-weight:400; line-height:1.2;
    color:#504846; letter-spacing:-0.01em; }
  .nn-block.done .nn-title { text-decoration:line-through; color:#2C2725; }

  /* ── LOWER ── */
  .lower { flex:1; display:flex; min-height:0; border-top:1px solid var(--border); }

  /* Reflection question bar */
  .refl-bar { flex-shrink:0; padding:10px 14px 9px; border-bottom:1px solid var(--border);
    min-height:38px; display:flex; flex-direction:column; justify-content:center;
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .refl-bar-loading { display:flex; align-items:center; gap:8px;
    font-family:var(--mono); font-size:8px; letter-spacing:0.1em; color:var(--text-mute); }
  .refl-bar-prog { font-family:var(--mono); font-size:7px; letter-spacing:0.1em;
    color:var(--text-mute); margin-bottom:4px; }
  .refl-bar-text { font-size:11px; font-weight:300; line-height:1.5; color:var(--text-dim); }

  /* TASK COLUMN — full width */
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
  .task-swipe-wrap { position:relative; overflow:hidden; }
  .task-delete-bg { position:absolute; inset:0; background:var(--red);
    display:flex; align-items:center; padding-left:16px; }
  .task-delete-label { font-family:var(--mono); font-size:8px; letter-spacing:0.12em;
    color:rgba(255,255,255,0.55); text-transform:uppercase; }
  .task-row { display:flex; align-items:center; padding:12px 14px; gap:9px;
    border-bottom:1px solid var(--border); cursor:pointer;
    -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    background:var(--bg); position:relative; z-index:1;
    transition:opacity var(--tr); }
  .task-row:active { background:rgba(255,255,255,0.02); }
  .task-row.done { opacity:0.42; }
  .task-row.assigned { opacity:0.3; }
  .task-row.tdragging { opacity:0.2; background:var(--bg) !important; }
  .task-swipe-wrap.tdrag-target .task-row { background:rgba(255,255,255,0.04); }
  .task-dot { width:5px; height:5px; border-radius:50%;
    border:1px solid var(--text-mute); flex-shrink:0;
    transition:background var(--tr),border-color var(--tr); }
  .task-row.done .task-dot { background:var(--accent); border-color:var(--accent); }
  .task-text { font-size:12px; font-weight:300; line-height:1.45;
    color:var(--text); flex:1; user-select:none; -webkit-user-select:none; }
  .task-row.done .task-text { text-decoration:line-through; color:var(--text-mute); }
  .task-up { font-size:14px; color:#527252; flex-shrink:0; line-height:1; padding:2px 0; }
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

  /* ── AUTH ── */
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

function todayStr() { return new Date().toISOString().split("T")[0]; }

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

const EMPTY_TASKS = { Work: [], Personal: [], Business: [], Life: [] };

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
    <path d="M9 2L11 4L5 10L2 11L3 8Z" stroke="#614838" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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

  // ── STARTUP OVERLAY ────────────────────────────────────────────────────────
  const [overlayOn, setOverlayOn]           = useState(true);
  const [overlayExit, setOverlayExit]       = useState(false);
  const [overlaySummary, setOverlaySummary] = useState(null);
  const [overlayLoading, setOvLoading]      = useState(true);

  // ── AI OVERLAY ─────────────────────────────────────────────────────────────
  const [aiOverlayOn, setAiOverlayOn]       = useState(false);
  const [aiOverlayExit, setAiOverlayExit]   = useState(false);
  const [aiOverlayText, setAiOverlayText]   = useState(null);
  const [aiOverlayLoading, setAiOvLoading]  = useState(false);

  // ── TOP ────────────────────────────────────────────────────────────────────
  const [topMode, setTopMode]         = useState("priority");
  const [priorities, setPriorities]   = useState([EMPTY_SLOT(), EMPTY_SLOT(), EMPTY_SLOT()]);
  const [editingSlot, setEditingSlot] = useState(-1);
  const [slotInputs, setSlotInputs]   = useState(["", "", ""]);
  const [detecting, setDetecting]     = useState([false, false, false]);
  const [completedBars, setCompletedBars] = useState(() => LS.get("kw_bars", []));

  // ── PRIORITY DRAG ──────────────────────────────────────────────────────────
  const [dragIdx, setDragIdx]   = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // ── NN ─────────────────────────────────────────────────────────────────────
  const [nn, setNn] = useState(() => LS.get("kw_nn", DEFAULT_NN));

  // ── TASKS ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks]         = useState(EMPTY_TASKS);
  const [cat, setCat]             = useState("Work");
  const [adding, setAdding]       = useState(false);
  const [addText, setAddText]     = useState("");
  const [taskDragIdx, setTDragIdx]   = useState(null);
  const [taskDragOver, setTDragOver] = useState(null);

  // ── REFLECTION QUESTIONS ───────────────────────────────────────────────────
  const [reflLoading, setReflLoading]     = useState(false);
  const [reflQuestions, setReflQuestions] = useState([]);
  const [reflIdx, setReflIdx]             = useState(0);

  // ── TOAST ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: "" });

  // ── REFS ───────────────────────────────────────────────────────────────────
  const slotRefs         = [useRef(null), useRef(null), useRef(null)];
  const addTextRef       = useRef("");
  const topWrapRef       = useRef(null);
  const taskListRef      = useRef(null);

  // Priority drag refs
  const dragState        = useRef({ active: false, startIdx: -1, dragOver: -1, timer: null });
  const wasDraggingRef   = useRef(false);
  const completedBarsRef = useRef(completedBars);
  const prioritiesRef    = useRef(priorities);
  const onMoveRef        = useRef(null);
  const onUpRef          = useRef(null);

  // Task drag/swipe refs
  const tdDragState      = useRef({ active: false, startIdx: -1, dragOver: -1, cat: null });
  const wasDraggingTask  = useRef(false);
  const swipeWasSwipe    = useRef(false);
  const hiddenAtRef      = useRef(null);
  const userRef          = useRef(null); // stable ref to user for visibilitychange

  // Keep mirrors in sync
  useEffect(() => { completedBarsRef.current = completedBars; }, [completedBars]);
  useEffect(() => { prioritiesRef.current = priorities; }, [priorities]);
  useEffect(() => { addTextRef.current = addText; }, [addText]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Persist NN
  useEffect(() => { LS.set("kw_nn", nn); }, [nn]);
  // Persist completed bars
  useEffect(() => { LS.set("kw_bars", completedBars); }, [completedBars]);

  // ── DAILY SNAPSHOT ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    LS.set("kw_daily", {
      date: todayStr(),
      priorities: priorities.map(p => ({ title: p.title, done: p.done })),
      nn: nn.map(n => ({ id: n.id, title: n.title, done: n.done })),
      completedBars: completedBars.map(b => ({ title: b.title })),
    });
  }, [priorities, nn, completedBars, authed]);

  // ── MIDNIGHT / NEW-DAY RESET ───────────────────────────────────────────────
  useEffect(() => {
    function checkNewDay() {
      const today  = todayStr();
      const stored = LS.get("kw_last_date", "");
      if (stored && stored !== today) {
        const u = userRef.current;
        if (u) {
          saveDailyMemory(u, stored);
          saveNnMemory(u, nn, stored);
        }
        setNn(p => p.map(x => ({ ...x, done: false })));
        setCompletedBars([]);
        setPriorities(p => p.map(s => s.done ? EMPTY_SLOT() : s));
        LS.set("kw_last_date", today);
      } else if (!stored) {
        LS.set("kw_last_date", today);
      }
    }
    checkNewDay();
    const interval = setInterval(checkNewDay, 60_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── VISIBILITY CHANGE → AI OVERLAY after 30 min away ──────────────────────
  useEffect(() => {
    const AWAY_MS = 30 * 60 * 1000;
    function onVisChange() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        if (hiddenAtRef.current && Date.now() - hiddenAtRef.current >= AWAY_MS && userRef.current) {
          hiddenAtRef.current = null;
          openAiOverlay();
        } else {
          hiddenAtRef.current = null;
        }
      }
    }
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SUPABASE AUTH LISTENER ─────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setAuthed(true);
          const name = session.user.user_metadata?.name || session.user.email.split("@")[0];
          const tasksData = await loadTasks(session.user.id);
          loadOverlay(session.user.id, name);
          loadQuestions(session.user.id, tasksData);
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
          grouped[t.category].push({ id: t.id, text: t.text, done: t.done, fromSlot: false });
        }
      });
      setTasks(grouped);
      return grouped;
    }
    return EMPTY_TASKS;
  }

  async function loadOverlay(userId, name) {
    setOvLoading(true);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: memories } = await supabase
        .from("memories").select("summary")
        .eq("user_id", userId).gte("memory_date", since)
        .order("created_at", { ascending: false }).limit(10);

      const context = memories?.map(m => m.summary).filter(Boolean).join(". ") || "";
      const prompt  = context ? `Name: ${name}. Recent context: ${context}` : `Name: ${name}`;

      const text = await callClaude(
        `Calm daily briefing. Use any recent daily-summary memories to personalise (streaks, patterns, what they carried over). 1-2 lines plain text. No labels. Under 20 words. Grounded. Displayed very large.`,
        prompt
      );
      setOverlaySummary(text);
    } catch {
      setOverlaySummary("Keep your word.\nFinish what you start.");
    }
    setOvLoading(false);
  }

  async function loadQuestions(userId, tasksData) {
    setReflLoading(true);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: memories } = await supabase
        .from("memories").select("summary")
        .eq("user_id", userId).gte("memory_date", since)
        .order("created_at", { ascending: false }).limit(10);

      const recentCtx = memories?.map(m => m.summary).filter(Boolean).join(". ") || "";
      const source    = tasksData || EMPTY_TASKS;
      const doneTasks    = Object.entries(source).flatMap(([c, list]) => list.filter(t => t.done).map(t => `${t.text} (${c})`));
      const pendingTasks = Object.entries(source).flatMap(([c, list]) => list.filter(t => !t.done).map(t => `${t.text} (${c})`));

      const ctx = [
        `Time of day: ${getGreeting()}`,
        doneTasks.length    ? `Completed: ${doneTasks.slice(0, 5).join(", ")}` : "",
        pendingTasks.length ? `Still pending: ${pendingTasks.slice(0, 5).join(", ")}` : "",
        recentCtx           ? `Recent context (incl. daily summaries): ${recentCtx}` : "",
      ].filter(Boolean).join("\n");

      const result = await callClaude(
        `Generate 3 to 5 specific, thoughtful reflection questions grounded in this context.
Reference completed/pending tasks, time of day, and any patterns from recent daily summaries.
No generic questions. Return valid JSON array only: ["Question 1?","Question 2?"]`,
        ctx, 400
      );

      const match = result.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("no array");
      const questions = JSON.parse(match[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        setReflQuestions(questions);
        setReflIdx(0);
      }
    } catch { /* silent */ }
    setReflLoading(false);
  }

  // Background journal saving (infrastructure kept; triggered by AI reflection flow)
  async function saveJournalEntry(text, type) {
    if (!user || !text.trim()) return;
    await supabase.from("journal_entries").insert({
      user_id: user.id, raw_text: text.trim(), entry_type: type,
    });
  }

  async function compressToMemory(text) {
    if (!user) return;
    try {
      const result = await callClaude(
        `Extract 3-5 keywords and one concise insight sentence from this journal entry.
Return valid JSON only: {"keywords":["word1","word2"],"summary":"One sentence."}`,
        text, 150
      );
      const match = result.match(/\{[\s\S]*\}/);
      if (!match) return;
      const { keywords, summary } = JSON.parse(match[0]);
      if (summary) {
        await supabase.from("memories").insert({
          user_id: user.id, keywords: keywords || [], summary,
          category: "journal", memory_date: todayStr(),
        });
      }
    } catch { /* silent */ }
  }

  // ── MEMORY WRITES ──────────────────────────────────────────────────────────

  async function saveDailyMemory(u, date) {
    if (!u) return;
    try {
      const snap = LS.get("kw_daily", null);
      if (!snap) return;

      const donePri  = snap.priorities?.filter(p => p.title && p.done).map(p => p.title)  || [];
      const skipPri  = snap.priorities?.filter(p => p.title && !p.done).map(p => p.title) || [];
      const bars     = snap.completedBars?.map(b => b.title) || [];
      const doneNN   = snap.nn?.filter(n => n.done).map(n => n.title)  || [];
      const skipNN   = snap.nn?.filter(n => !n.done).map(n => n.title) || [];

      const parts = [
        donePri.length  ? `Top 3 completed: ${donePri.join(", ")}` : "No Top 3 completed",
        skipPri.length  ? `Carried over: ${skipPri.join(", ")}` : "",
        bars.length     ? `Also completed (replaced): ${bars.join(", ")}` : "",
        `Non-Negotiables ${doneNN.length}/3 done` + (doneNN.length ? ` (${doneNN.join(", ")})` : ""),
        skipNN.length   ? `NN skipped: ${skipNN.join(", ")}` : "",
      ].filter(Boolean).join(". ");

      await supabase.from("memories").insert({
        user_id: u.id,
        keywords: ["daily-summary", date, ...donePri.slice(0, 3)],
        summary: parts,
        category: "daily",
        memory_date: date,
      });
    } catch { /* silent */ }
  }

  async function saveNnMemory(u, nnState, date) {
    if (!u) return;
    try {
      const done   = nnState.filter(n => n.done).map(n => n.title);
      const skipped = nnState.filter(n => !n.done).map(n => n.title);
      const summary = [
        `Non-Negotiables for ${date}:`,
        done.length   ? `Completed (${done.length}/3): ${done.join(", ")}` : "None completed",
        skipped.length ? `Skipped: ${skipped.join(", ")}` : "",
      ].filter(Boolean).join(" ");

      await supabase.from("memories").insert({
        user_id: u.id,
        keywords: ["nn", date, ...done.slice(0, 3)],
        summary,
        category: "nn",
        memory_date: date,
      });
    } catch { /* silent */ }
  }

  async function saveTaskCompletionMemory(u, text, catName) {
    if (!u) return;
    try {
      await supabase.from("memories").insert({
        user_id: u.id,
        keywords: ["task-done", catName.toLowerCase(), todayStr()],
        summary: `Completed task (${catName}): ${text}`,
        category: "task",
        memory_date: todayStr(),
      });
    } catch { /* silent */ }
  }

  // ── AI OVERLAY ─────────────────────────────────────────────────────────────

  async function openAiOverlay() {
    if (aiOverlayLoading) return;
    setAiOverlayExit(false);
    setAiOverlayOn(true);
    setAiOverlayText(null);
    setAiOvLoading(true);

    try {
      const u = userRef.current;
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: memories } = u ? await supabase
        .from("memories").select("summary,category,memory_date")
        .eq("user_id", u.id).gte("memory_date", since)
        .order("memory_date", { ascending: false }).limit(20)
        : { data: [] };

      const memCtx = memories?.map(m => `[${m.category} ${m.memory_date}] ${m.summary}`).join("\n") || "";

      const snap = LS.get("kw_daily", null);
      const activePri  = snap?.priorities?.filter(p => p.title && !p.done).map(p => p.title) || [];
      const donePri    = snap?.completedBars?.map(b => b.title) || [];
      const nnDone     = snap?.nn?.filter(n => n.done).map(n => n.title) || [];
      const nnPending  = snap?.nn?.filter(n => !n.done).map(n => n.title) || [];

      const taskCtx = Object.entries(tasks).flatMap(([c, list]) =>
        list.filter(t => t.done).map(t => `${t.text} (${c}, done)`)
      ).slice(0, 10).join(", ");

      const ctx = [
        `Time: ${getGreeting()}`,
        activePri.length  ? `Active priorities: ${activePri.join(", ")}` : "No active priorities",
        donePri.length    ? `Completed today: ${donePri.join(", ")}` : "",
        nnDone.length     ? `Non-Negotiables done: ${nnDone.join(", ")}` : "",
        nnPending.length  ? `Non-Negotiables pending: ${nnPending.join(", ")}` : "",
        taskCtx           ? `Tasks completed recently: ${taskCtx}` : "",
        memCtx            ? `\nMemory context:\n${memCtx}` : "",
      ].filter(Boolean).join("\n");

      const text = await callClaude(
        `You are a grounded, observational presence. Reflect on this person's current state — what they are doing, what patterns you notice, what is unresolved. Do not motivate, encourage, or use coaching language. Be present and factual. Reference specifics from their tasks and memories. Write in plain prose, multiple paragraphs if needed. No headers, no bullets, no labels.`,
        ctx,
        800
      );
      setAiOverlayText(text);
    } catch {
      setAiOverlayText("Nothing to reflect on yet. Keep going.");
    }
    setAiOvLoading(false);
  }

  function dismissAiOverlay() {
    if (aiOverlayLoading) return;
    setAiOverlayExit(true);
    setTimeout(() => { setAiOverlayOn(false); setAiOverlayExit(false); }, 400);
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
          email: af.email, password: af.password,
          options: { data: { name: af.name } },
        });
        if (error) { setAuthErr(error.message); return; }
        setAuthMsg("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: af.email, password: af.password });
        if (error) { setAuthErr(error.message); }
      }
    } catch { setAuthErr("Something went wrong. Please try again."); }
    finally   { setAuthLoading(false); }
  }

  function dismissStartupOverlay() {
    if (overlayLoading) return;
    setOverlayExit(true);
    setTimeout(() => setOverlayOn(false), 500);
  }

  // ── PRIORITY DRAG ──────────────────────────────────────────────────────────

  function cleanupDrag() {
    if (onMoveRef.current) window.removeEventListener("pointermove", onMoveRef.current);
    if (onUpRef.current) {
      window.removeEventListener("pointerup", onUpRef.current);
      window.removeEventListener("pointercancel", onUpRef.current);
    }
    onMoveRef.current = null;
    onUpRef.current   = null;
  }

  function onSlotPointerDown(e, idx) {
    if (editingSlot !== -1) return;
    if (!prioritiesRef.current[idx].title) return;

    const timer = setTimeout(() => {
      dragState.current.active   = true;
      dragState.current.dragOver = idx;
      setDragIdx(idx);
      setDragOver(idx);
      if (navigator.vibrate) navigator.vibrate(20);

      onMoveRef.current = (ev) => {
        const wrap = topWrapRef.current;
        if (!wrap) return;
        const rect    = wrap.getBoundingClientRect();
        const barsH   = completedBarsRef.current.length * BAR_H;
        const activeH = rect.height - barsH;
        const relY    = ev.clientY - rect.top - barsH;
        const over    = Math.max(0, Math.min(2, Math.floor(relY / (activeH / 3))));
        dragState.current.dragOver = over;
        setDragOver(over);
      };

      onUpRef.current = () => {
        cleanupDrag();
        const from = dragState.current.startIdx;
        const to   = dragState.current.dragOver;
        if (dragState.current.active && from !== to && to >= 0) {
          setPriorities(p => {
            const next = [...p];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          });
        }
        wasDraggingRef.current = true;
        dragState.current = { active: false, startIdx: -1, dragOver: -1, timer: null };
        setDragIdx(null);
        setDragOver(null);
      };

      window.addEventListener("pointermove", onMoveRef.current);
      window.addEventListener("pointerup",   onUpRef.current);
      window.addEventListener("pointercancel", onUpRef.current);
    }, 400);

    dragState.current = { active: false, startIdx: idx, dragOver: idx, timer };
  }

  function onSlotPointerUp() {
    if (!dragState.current.active) {
      clearTimeout(dragState.current.timer);
      dragState.current = { active: false, startIdx: -1, dragOver: -1, timer: null };
    }
  }

  // ── SLOT LOGIC ─────────────────────────────────────────────────────────────

  function openSlot(idx) {
    setSlotInputs(prev => { const n = [...prev]; n[idx] = priorities[idx].title || ""; return n; });
    setEditingSlot(idx);
  }

  function tapSlotBody(idx) {
    if (wasDraggingRef.current) { wasDraggingRef.current = false; return; }
    if (editingSlot !== -1) return;
    const slot = priorities[idx];
    if (slot.title) {
      // Archive to completed bar, shift remaining up, open empty slot at bottom
      const bar = {
        id: `bar_${Date.now()}`,
        title: slot.title,
        sourceId: slot.sourceId,
        sourceCat: slot.sourceCat,
      };
      setCompletedBars(prev => [...prev, bar]);
      // Save task completion memory
      if (user) saveTaskCompletionMemory(user, slot.title, slot.sourceCat || "Work");
      setPriorities(p => {
        const remaining = p.filter((_, i) => i !== idx);
        return [...remaining, EMPTY_SLOT()];
      });
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      openSlot(idx);
    }
  }

  async function commitSlot(idx) {
    const text     = slotInputs[idx].trim();
    const existing = priorities[idx];
    setEditingSlot(-1);
    if (!text) return;

    // Normal slot commit — if slot had a previous task, remove it from tasks
    if (existing.title && existing.sourceId && existing.sourceCat) {
      setTasks(p => ({
        ...p,
        [existing.sourceCat]: (p[existing.sourceCat] || []).filter(t => t.id !== existing.sourceId),
      }));
      if (user) await supabase.from("tasks").delete().eq("id", existing.sourceId);
    }

    setPriorities(p => p.map((s, i) =>
      i === idx ? { title: text, done: false, sourceId: null, sourceCat: null } : s
    ));

    setDetecting(prev => { const n = [...prev]; n[idx] = true; return n; });
    const detectedCat = await detectCategory(text);
    setDetecting(prev => { const n = [...prev]; n[idx] = false; return n; });

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

    // Reset any active swipe state to prevent glitch when task returns to list
    swipeWasSwipe.current = false;

    if (slot.sourceId) {
      const targetCat = slot.sourceCat || "Personal";
      setTasks(tp => {
        const list   = tp[targetCat] || [];
        const exists = list.some(t => t.id === slot.sourceId);
        if (exists) return { ...tp, [targetCat]: list.map(t => t.id === slot.sourceId ? { ...t, fromSlot: false } : t) };
        return { ...tp, [targetCat]: [...list, { id: slot.sourceId, text: slot.title, done: false, fromSlot: false }] };
      });
      if (user) await supabase.from("tasks").update({ from_slot: false }).eq("id", slot.sourceId);
      setCat(slot.sourceCat || "Personal");
    }

    if (completedBars.length > 0) {
      const bar = completedBars[completedBars.length - 1];
      setPriorities(p => p.map((s, i) =>
        i === idx ? { title: bar.title, done: false, sourceId: bar.sourceId, sourceCat: bar.sourceCat } : s
      ));
      setCompletedBars(prev => prev.slice(0, -1));
      showToast("restored from completed");
    } else {
      setPriorities(p => p.map((s, i) => i === idx ? EMPTY_SLOT() : s));
      showToast(slot.sourceId ? `returned to ${slot.sourceCat || "tasks"}` : "cleared");
    }
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
    if (user) {
      supabase.from("tasks").update({ done: newDone }).eq("id", id);
      if (newDone) saveTaskCompletionMemory(user, task.text, catName);
    }
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

  function deleteTask(catName, taskId) {
    setTasks(p => ({ ...p, [catName]: (p[catName] || []).filter(t => t.id !== taskId) }));
    setPriorities(p => p.map(s => s.sourceId === taskId ? EMPTY_SLOT() : s));
    if (user) supabase.from("tasks").delete().eq("id", taskId);
    showToast("deleted");
  }

  // ── TASK INTERACTION (swipe-to-delete + drag-to-reorder) ──────────────────

  function startTaskInteraction(e, task, taskIdx, catName) {
    if (e.button !== 0 && e.pointerType !== "touch" && e.pointerType !== "pen") return;
    const wrapEl = e.currentTarget;
    const rowEl  = wrapEl.querySelector(".task-row");
    if (!rowEl) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let swipeLocked   = false;
    let dragActivated = false;
    let translateX    = 0;

    const dragTimer = setTimeout(() => {
      if (swipeLocked) return; // already a swipe
      dragActivated = true;
      tdDragState.current = { active: true, startIdx: taskIdx, dragOver: taskIdx, cat: catName };
      setTDragIdx(taskIdx);
      setTDragOver(taskIdx);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 400);

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (dragActivated) {
        // Update drag-over position by scanning rendered rows
        const list = taskListRef.current;
        if (list) {
          const wraps = Array.from(list.querySelectorAll(".task-swipe-wrap"));
          let over = tdDragState.current.startIdx;
          for (let i = 0; i < wraps.length; i++) {
            const r = wraps[i].getBoundingClientRect();
            if (ev.clientY >= r.top && ev.clientY <= r.bottom) { over = i; break; }
          }
          tdDragState.current.dragOver = over;
          setTDragOver(over);
        }
        return;
      }

      // Direction lock
      if (!swipeLocked && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;

      if (!swipeLocked) {
        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical — let scroll handle it
          clearTimeout(dragTimer);
          cleanup();
          return;
        }
        // Horizontal swipe confirmed
        clearTimeout(dragTimer);
        swipeLocked = true;
      }

      if (swipeLocked) {
        if (dx <= 0) { rowEl.style.transform = "translateX(0)"; translateX = 0; return; }
        translateX = dx;
        rowEl.style.transform = `translateX(${dx}px)`;
      }
    }

    function onUp() {
      cleanup();
      clearTimeout(dragTimer);

      if (dragActivated) {
        const from = tdDragState.current.startIdx;
        const to   = tdDragState.current.dragOver;
        if (from !== to && to >= 0) {
          setTasks(p => {
            const list = [...(p[catName] || [])];
            const [moved] = list.splice(from, 1);
            list.splice(to, 0, moved);
            return { ...p, [catName]: list };
          });
        }
        wasDraggingTask.current = true;
        tdDragState.current = { active: false, startIdx: -1, dragOver: -1, cat: null };
        setTDragIdx(null);
        setTDragOver(null);
        return;
      }

      if (swipeLocked) {
        swipeWasSwipe.current = true;
        const rowWidth = rowEl.offsetWidth || 300;
        if (translateX >= rowWidth * 0.9) {
          deleteTask(catName, task.id);
        } else {
          rowEl.style.transition = "transform 200ms ease";
          rowEl.style.transform  = "translateX(0)";
          setTimeout(() => { rowEl.style.transition = ""; }, 210);
        }
      }
    }

    function cleanup() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
      window.removeEventListener("pointercancel", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    window.addEventListener("pointercancel", onUp);
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

        {/* ── STARTUP OVERLAY ── */}
        {overlayOn && (
          <div className={`s-overlay ${overlayExit ? "exit" : ""}`} onClick={dismissStartupOverlay}>
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

        {/* ── AI OVERLAY ── */}
        {aiOverlayOn && (
          <div className={`ai-overlay ${aiOverlayExit ? "exit" : ""}`} onClick={dismissAiOverlay}>
            <div className="ai-scroll" onClick={e => e.stopPropagation()}>
              <div className="ai-tag">{getGreeting()} · reflect</div>
              {aiOverlayLoading
                ? <div className="ai-spin-wrap"><span className="spin-sm" /> reading...</div>
                : <div className="ai-body-lg">{aiOverlayText}</div>
              }
            </div>
            <div className="ai-dismiss">tap outside to close</div>
          </div>
        )}

        {/* ── TOP ROW ── */}
        <div className="toprow">
          <div className="toprow-date">{TODAY}</div>
          <div className="toprow-right">
            <button className="ai-trigger-btn" onClick={openAiOverlay}>
              {aiOverlayLoading ? <span className="spin-sm" /> : "reflect"}
            </button>
            <div className="flip-tab">
              <button className={`flip-btn ${topMode === "priority" ? "active" : ""}`}
                onClick={() => setTopMode("priority")}>Daily</button>
              <button className={`flip-btn ${topMode === "nn" ? "active" : ""}`}
                onClick={() => setTopMode("nn")}>Non-Negotiables</button>
            </div>
          </div>
        </div>

        {/* ── TOP SECTION ── */}
        <div className="top-wrap" ref={topWrapRef}>

          {/* Completed bars stacked at top */}
          {completedBars.map(bar => (
            <div key={bar.id} className="pri-bar">
              <div className="pri-bar-text">✓ {bar.title}</div>
            </div>
          ))}

          {/* Priority cards */}
          {priorities.map((slot, i) => {
            const isEditing  = editingSlot === i;
            const isDragging = dragIdx === i;
            const isTarget   = dragOver === i && dragIdx !== null && dragIdx !== i;
            return (
              <div key={i}
                className={[
                  "pri-block",
                  isEditing  ? "editing"     : "",
                  isDragging ? "dragging"    : "",
                  isTarget   ? "drag-target" : "",
                ].filter(Boolean).join(" ")}
                onPointerDown={e => onSlotPointerDown(e, i)}
                onPointerUp={() => onSlotPointerUp()}
                onContextMenu={e => e.preventDefault()}
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
                    onPointerDown={e => e.stopPropagation()}
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
                  <div className="pri-actions" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
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

          {/* Non-Negotiables panel */}
          <div className={`nn-panel ${topMode === "nn" ? "visible" : ""}`}>
            {nn.map((n, i) => (
              <div key={n.id} className={`nn-block ${n.done ? "done" : ""}`}
                onClick={() => setNn(p => p.map(x => x.id === n.id ? { ...x, done: !x.done } : x))}>
                <div className="nn-num">0{i + 1}</div>
                <div className="nn-title">{n.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LOWER — full-width task list ── */}
        <div className="lower">
          <div className="task-col">

            {/* Reflection question bar — cycles through AI questions */}
            {(reflLoading || reflQuestions.length > 0) && (
              <div className="refl-bar"
                onClick={() => !reflLoading && reflQuestions.length > 0 &&
                  setReflIdx(i => (i + 1) % reflQuestions.length)}>
                {reflLoading ? (
                  <div className="refl-bar-loading"><span className="spin-sm" /> personalizing...</div>
                ) : (
                  <>
                    <div className="refl-bar-prog">{reflIdx + 1} / {reflQuestions.length} · tap to cycle</div>
                    <div className="refl-bar-text">{reflQuestions[reflIdx]}</div>
                  </>
                )}
              </div>
            )}

            <div className="cat-tabs">
              {CATS.map(c => (
                <button key={c} className={`cat-tab ${cat === c ? "active" : ""}`}
                  onClick={() => { setCat(c); setAdding(false); }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="task-list" ref={taskListRef}>
              {currentTasks.length === 0 && (
                <div style={{ padding:"20px 14px", fontFamily:"var(--mono)", fontSize:"9px",
                  letterSpacing:"0.1em", color:"var(--text-mute)", lineHeight:1.7 }}>
                  no tasks yet · tap + add
                </div>
              )}
              {currentTasks.map((t, tIdx) => {
                const isTDragging = taskDragIdx === tIdx && tdDragState.current.cat === cat;
                const isTTarget   = taskDragOver === tIdx && taskDragIdx !== null && taskDragIdx !== tIdx && tdDragState.current.cat === cat;
                return (
                  <div key={t.id}
                    className={`task-swipe-wrap${isTTarget ? " tdrag-target" : ""}`}
                    onPointerDown={e => startTaskInteraction(e, t, tIdx, cat)}>
                    <div className="task-delete-bg">
                      <span className="task-delete-label">delete</span>
                    </div>
                    <div
                      className={[
                        "task-row",
                        t.done ? "done" : "",
                        t.fromSlot && !t.done ? "assigned" : "",
                        isTDragging ? "tdragging" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => {
                        if (wasDraggingTask.current) { wasDraggingTask.current = false; return; }
                        if (swipeWasSwipe.current) { swipeWasSwipe.current = false; return; }
                        tapTask(t, cat);
                      }}>
                      <div className="task-dot" />
                      <div className="task-text">{t.text}</div>
                      {!t.done && !t.fromSlot && <div className="task-up">↑</div>}
                    </div>
                  </div>
                );
              })}
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
