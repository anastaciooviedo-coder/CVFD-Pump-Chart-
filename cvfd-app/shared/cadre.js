function initCadre(ctx){
"use strict";


/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids) if (c != null) n.append(c);
  return n;
};
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = (d, o) => d.toLocaleDateString("en-US", o);
const short = d => fmt(d, { month: "short", day: "numeric" });
const mdY = d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
const ago = t => { if (!t) return ""; const s = (Date.now() - t) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; };
const toast = msg => window.guideToast(msg);

const THIS_MONDAY = ymd(mondayOf(new Date()));
function weekFromHash() { return THIS_MONDAY; }

/* ---------- section config ---------- */
const STATUS = {
  "Not started": "s-none", "In progress": "s-info", "Complete": "s-ok", "Blocked": "s-bad"
};
const RESULT = {
  "": "s-none", "Pass": "s-ok", "Fail": "s-bad", "Retest needed": "s-warn", "No show": "s-warn"
};
const SECTIONS = [
  { key: "events", title: "Coming Up This Week", short: "This week", addLabel: "+ Add training or event",
    sort: (a, b) => (a.date || "9").localeCompare(b.date || "9") || (a.time || "").localeCompare(b.time || "") || (a.order || 0) - (b.order || 0),
    fields: [
      { k: "title", label: "Training or event", wide: true, cls: "title-in", ph: "What's happening" },
      { k: "date", label: "Date", type: "date" },
      { k: "time", label: "Time", ph: "e.g. 0800" },
      { k: "lead", label: "Lead and location", ph: "Who / where" },
      { k: "prep", label: "Preparation needed", wide: true, ph: "Equipment, props, paperwork…" }
    ],
    dayLabel: true },
  { key: "testing", title: "Phase Testing", short: "Testing", addLabel: "+ Add member for testing",
    sort: (a, b) => (a.date || "9").localeCompare(b.date || "9") || (a.time || "").localeCompare(b.time || "") || (a.order || 0) - (b.order || 0),
    fields: [
      { k: "member", label: "Member (name / rank)", wide: true, cls: "title-in", ph: "Name / rank" },
      { k: "date", label: "Date", type: "date" },
      { k: "time", label: "Time", ph: "e.g. 1400" },
      { k: "phase", label: "Phase or test", ph: "Phase / skill" },
      { k: "evaluator", label: "Evaluator", ph: "Cadre name" },
      { k: "result", label: "Result", type: "select", opts: RESULT, blank: "Pending" }
    ] },
  { key: "tasks", title: "What Needs To Be Done", short: "Tasks", addLabel: "+ Add task",
    sort: (a, b) => (a.status === "Complete") - (b.status === "Complete") || (a.due || "9").localeCompare(b.due || "9") || (a.order || 0) - (b.order || 0),
    fields: [
      { k: "task", label: "Task or deliverable", wide: true, cls: "title-in", ph: "What needs to get done" },
      { k: "assignee", label: "Assigned to", ph: "Name" },
      { k: "due", label: "Due", type: "date" },
      { k: "status", label: "Status", type: "select", opts: STATUS }
    ],
    defaults: { status: "Not started" } },
  { key: "updates", title: "What Is New", short: "New", addLabel: "+ Add new item or update",
    hint: "Lesson plans, skills sheets, policies, forms",
    sort: (a, b) => (a.order || 0) - (b.order || 0),
    fields: [
      { k: "item", label: "New item or update", wide: true, cls: "title-in", ph: "Title / revision date" },
      { k: "change", label: "What changed and action needed", wide: true, type: "textarea", ph: "Summary / who needs to review / due date" },
      { k: "link", label: "File link", wide: true, ph: "Paste a link (Drive, SharePoint…)", link: true }
    ] },
  { key: "openItems", title: "Open Items & Decisions", short: "Open items", addLabel: "+ Add open item",
    sort: (a, b) => (a.order || 0) - (b.order || 0),
    fields: [
      { k: "issue", label: "Issue or carryover item", wide: true, cls: "title-in", ph: "Issue / blocker" },
      { k: "next", label: "Next step or decision", wide: true, ph: "Action or approval needed" },
      { k: "owner", label: "Owner", ph: "Name" },
      { k: "deadline", label: "Deadline", type: "date" }
    ] },
  { key: "roles", title: "Cadre Roles & Responsibilities", short: "Roles", addLabel: "+ Add cadre member",
    sort: (a, b) => (a.order || 0) - (b.order || 0),
    fields: [
      { k: "member", label: "Cadre member", cls: "title-in", ph: "Name / rank" },
      { k: "role", label: "Role", ph: "Role" },
      { k: "duties", label: "Responsibilities this week", wide: true, type: "textarea", ph: "Duties, assignments, areas covered" },
      { k: "backup", label: "Backup", ph: "Name" }
    ] }
];

/* ---------- state ---------- */
let db = null, user = null, uid = null, canWrite = true;
let weekId = weekFromHash();
let weekDoc = null;          // data of weeks/{weekId}
let weekLoaded = false;
let lists = {};              // key -> Map(id -> data)
let unsubs = [];
let loadTimer = null;
const writeChains = new Map();   // path -> Promise
const pending = new Map();       // path|field -> timer
const names = {};

/* serialize writes per document */
function queueWrite(path, fn) {
  const prev = writeChains.get(path) || Promise.resolve();
  const next = prev.then(fn).catch(err => onWriteError(err));
  writeChains.set(path, next);
  return next;
}
function onWriteError(err) {
  const code = err && err.code;
  if (code === "invalid_argument" && !canWriteKnown) { setReadOnly(); return; }
  if (code === "quota_exceeded") toast("Storage is full — delete old items to add more.");
  else toast("Couldn't save — check your connection.");
  console.warn(err);
}
let canWriteKnown = false;

function stamp() { return { updatedBy: uid || null, updatedAt: Date.now() }; }

function saveField(path, field, value, delay = 600) {
  if (!db || !canWrite) return;
  const key = path + "|" + field;
  clearTimeout(pending.get(key));
  pending.set(key, setTimeout(() => {
    pending.delete(key);
    queueWrite(path, () => db.doc(path).update({ [field]: value, ...stamp() }));
  }, delay));
}

/* ---------- UI: shell ---------- */
function renderHeader() {
  const mon = parseYmd(weekId), sun = addDays(mon, 6);
  $("#ck-weekTitle").textContent = `Week of ${short(mon)} – ${short(sun)}, ${sun.getFullYear()}`;
  const tag = $("#ck-weekTag"); tag.innerHTML = "";
  if (weekId === THIS_MONDAY) tag.append(el("span", { class: "pill", text: "This week" }));
  else if (weekId < THIS_MONDAY) tag.append(el("span", { text: "Past week" }));
  else tag.append(el("span", { text: "Upcoming week" }));
  $("#ck-todayBtn").hidden = weekId === THIS_MONDAY;
  const nm = addDays(mon, 7);
  $("#ck-prepared").textContent = weekDoc ? `Prepared by ${weekDoc.preparedBy || "—"} · Next check-in ${fmt(nm, { weekday: "short", month: "numeric", day: "numeric" })}` : "";
}

function setLive(state) {
  const d = $("#ck-liveDot"), t = $("#ck-liveTxt");
  d.classList.toggle("on", state === "live");
  t.textContent = state === "live" ? "Live" : state === "stale" ? "Can't reach server — may be out of date" : state === "off" ? "Offline view" : "Connecting…";
}

function setReadOnly() {
  canWrite = false;
  document.querySelectorAll("main input, main select, main textarea").forEach(i => i.disabled = true);
  document.querySelectorAll(".add, .del, .startbtn").forEach(b => b.hidden = true);
  if (!$("#roNote")) $("#ck-main").prepend(el("div", { class: "ro", id: "roNote", text: "View only — ask the Training Division for Editor access to update this check-in." }));
}

function buildMain() {
  const main = $("#ck-main"); main.innerHTML = "";
  const jump = $("#ck-jump"); jump.innerHTML = "";
  if (!weekLoaded) { main.append(el("div", { class: "loading", text: "Loading check-in…" })); return; }
  if (!weekDoc) { buildStart(main); return; }
  if (!canWrite) main.append(el("div", { class: "ro", id: "roNote", text: "View only — ask the Training Division for Editor access to update this check-in." }));

  const jumps = [["priorities", "Priorities"], ...SECTIONS.map(s => [s.key, s.short]), ["safety", "Staffing & safety"], ["reminders", "Reminders"]];
  for (const [id, label] of jumps) jump.append(el("a", { href: "#", text: label, onclick: e => { e.preventDefault(); document.getElementById("sec-" + id)?.scrollIntoView({ behavior: "smooth" }); } }));

  // Priorities
  const pSec = el("section", { id: "sec-priorities" },
    el("div", { class: "sh" }, el("h2", { text: "Weekly Priorities" })),
    el("div", { class: "card", id: "prioList" }));
  main.append(pSec);
  renderPriorities();

  // list sections (order: events, testing, tasks, updates, then staffing, open, roles)
  for (const s of SECTIONS) {
    if (s.key === "openItems") main.append(buildTextSection());
    main.append(buildListSection(s));
  }
  main.append(buildReminders());
  main.append(el("p", { class: "note", text: "Changes save automatically and appear live for everyone with the link." }));
  if (!canWrite) setReadOnly();
}

function buildStart(main) {
  const mon = parseYmd(weekId);
  const isPastWeek = weekId < THIS_MONDAY;
  const box = el("div", { class: "banner" });
  box.append(el("h3", { text: isPastWeek ? "No check-in for this week" : `Start the check-in for ${short(mon)}` }));
  if (!canWrite) { box.append(el("p", { text: "This week hasn't been started yet." })); main.append(box); return; }
  box.append(el("p", { text: "Start a new week from the most recent check-in. Pick what to carry forward:" }));
  const opts = [
    ["priorities", "Weekly priorities", true],
    ["roles", "Cadre roles & responsibilities", true],
    ["openItems", "Open items & decisions", true],
    ["tasks", "Tasks that aren't complete", true],
    ["reminders", "Cadre reminders", true],
    ["staffing", "Staffing, equipment & safety notes", false]
  ];
  const checks = el("div", { class: "checks" });
  for (const [k, label, on] of opts) checks.append(el("label", {}, el("input", { type: "checkbox", value: k, checked: on }), label));
  box.append(checks);
  const btn = el("button", { class: "btn startbtn", text: "Start this week", onclick: () => startWeek([...checks.querySelectorAll("input:checked")].map(i => i.value), btn) });
  const blank = el("button", { class: "btn ghost startbtn", style: "margin-left:8px", text: "Start blank", onclick: () => startWeek([], blank) });
  box.append(btn, blank);
  main.append(box);
}

async function startWeek(carry, btn) {
  if (!db) return;
  btn.disabled = true; btn.textContent = "Starting…";
  try {
    // find most recent earlier week
    const prevSnap = await db.collection("weeks").where("weekOf", "<", weekId).orderBy("weekOf", "desc").limit(1).get();
    const prev = prevSnap.docs[0];
    const pd = prev ? prev.data() : {};
    const base = {
      weekOf: weekId,
      preparedBy: pd.preparedBy || "Captain Oviedo",
      priorities: carry.includes("priorities") && Array.isArray(pd.priorities) ? pd.priorities.slice() : ["", "", ""],
      reminders: carry.includes("reminders") ? (pd.reminders || "") : "",
      staffing: carry.includes("staffing") ? (pd.staffing || "") : "",
      equipment: carry.includes("staffing") ? (pd.equipment || "") : "",
      safety: carry.includes("staffing") ? (pd.safety || "") : "",
      createdAt: Date.now(), ...stamp()
    };
    await db.doc("weeks/" + weekId).set(base);
    if (prev) {
      let order = Date.now();
      for (const key of ["roles", "openItems", "tasks"]) {
        if (!carry.includes(key)) continue;
        const snap = await db.collection(`weeks/${prev.id}/${key}`).get();
        for (const d of snap.docs) {
          const data = { ...d.data() };
          if (key === "tasks" && data.status === "Complete") continue;
          if (key === "openItems" || key === "tasks") data.carriedFrom = prev.id;
          data.order = order++;
          Object.assign(data, stamp());
          await db.collection(`weeks/${weekId}/${key}`).doc(d.id).set(data);
        }
      }
    }
    toast("Week started");
  } catch (e) {
    btn.disabled = false; btn.textContent = "Start this week";
    onWriteError(e);
  }
}

/* ---------- priorities ---------- */
function renderPriorities() {
  const box = $("#prioList"); if (!box || !weekDoc) return;
  const pr = Array.isArray(weekDoc.priorities) ? weekDoc.priorities : [];
  if (box.dataset.n !== String(pr.length)) {
    {
      box.innerHTML = ""; box.dataset.n = String(pr.length);
      pr.forEach((p, i) => {
        const inp = el("input", { value: p, placeholder: `Priority ${i + 1}`, disabled: !canWrite });
        inp.addEventListener("input", () => savePriorities());
        inp.addEventListener("blur", () => savePriorities(0));
        const rm = el("button", { class: "del", text: "✕", "aria-label": "Remove priority", onclick: () => { const arr = readPrios(); arr.splice(i, 1); writePrios(arr, true); } });
        if (!canWrite) rm.hidden = true;
        box.append(el("div", { class: "prio" }, el("span", { class: "n", text: i + 1 }), inp, rm));
      });
      if (canWrite) box.append(el("button", { class: "add", style: "margin-top:4px", text: "+ Add priority", onclick: () => { const arr = readPrios(); arr.push(""); writePrios(arr, true); } }));
      if (!pr.length && !canWrite) box.append(el("div", { class: "empty", text: "No priorities set." }));
      return;
    }
  }
  box.querySelectorAll(".prio input").forEach((inp, i) => { if (inp !== document.activeElement && inp.value !== (pr[i] || "")) inp.value = pr[i] || ""; });
}
const readPrios = () => [...document.querySelectorAll("#prioList .prio input")].map(i => i.value);
let prioT;
function savePriorities(delay = 600) {
  clearTimeout(prioT);
  prioT = setTimeout(() => writePrios(readPrios()), delay);
}
function writePrios(arr, rerender) {
  if (!db || !canWrite) return;
  const path = "weeks/" + weekId;
  if (rerender) { weekDoc = { ...weekDoc, priorities: arr }; $("#prioList").dataset.n = "x"; renderPriorities(); }
  queueWrite(path, () => db.doc(path).update({ priorities: arr, ...stamp() }));
}

/* ---------- text sections on week doc ---------- */
function weekTextField(k, label, ph) {
  const ta = el("textarea", { "data-wk": k, placeholder: ph, disabled: !canWrite });
  ta.value = (weekDoc && weekDoc[k]) || "";
  ta.addEventListener("input", () => saveField("weeks/" + weekId, k, ta.value));
  ta.addEventListener("blur", () => flush("weeks/" + weekId, k, ta.value));
  return el("div", { class: "f wide" }, el("label", { text: label }), ta);
}
function flush(path, field, value) {
  const key = path + "|" + field;
  if (pending.has(key)) saveField(path, field, value, 0);
}
function buildTextSection() {
  return el("section", { id: "sec-safety" },
    el("div", { class: "sh" }, el("h2", { text: "Staffing, Equipment & Safety" })),
    el("div", { class: "card" }, el("div", { class: "grid" },
      weekTextField("staffing", "Staffing or coverage", "Who's covering what, call-offs, shift swaps…"),
      weekTextField("equipment", "Equipment and facilities", "Apparatus, props, tower, classroom…"),
      weekTextField("safety", "Safety considerations", "Weather, rehab, ISO, burn plan…"))));
}
function buildReminders() {
  return el("section", { id: "sec-reminders" },
    el("div", { class: "sh" }, el("h2", { text: "Cadre Reminders" })),
    el("div", { class: "card" }, el("div", { class: "grid" }, weekTextField("reminders", "Reminders", "Reminders for the cadre"))));
}
function refreshWeekText() {
  document.querySelectorAll("[data-wk]").forEach(ta => {
    const v = (weekDoc && weekDoc[ta.dataset.wk]) || "";
    if (ta !== document.activeElement && ta.value !== v) ta.value = v;
  });
}

/* ---------- list sections ---------- */
function buildListSection(s) {
  const sec = el("section", { id: "sec-" + s.key });
  sec.append(el("div", { class: "sh" }, el("h2", { text: s.title }), el("span", { class: "count", id: "count-" + s.key }), s.hint ? el("span", { class: "hint", text: s.hint }) : null));
  sec.append(el("div", { id: "list-" + s.key }));
  if (canWrite) sec.append(el("button", { class: "add", text: s.addLabel, onclick: () => addItem(s) }));
  setTimeout(() => renderList(s), 0);
  return sec;
}

async function addItem(s) {
  if (!db || !canWrite) return;
  const col = db.collection(`weeks/${weekId}/${s.key}`);
  const ref = col.doc();
  const data = { order: Date.now(), ...(s.defaults || {}), ...stamp() };
  if (s.key === "events" || s.key === "testing") data.date = "";
  justAdded = ref.id;
  queueWrite(ref.path, () => ref.set(data));
}
let justAdded = null;

function fieldInput(s, f, path, data) {
  const v = data[f.k] ?? "";
  let inp;
  if (f.type === "select") {
    inp = el("select", { class: "stchip", disabled: !canWrite });
    for (const opt of Object.keys(f.opts)) inp.append(el("option", { value: opt, text: opt || f.blank || "—" }));
    inp.value = v;
    const paint = () => { inp.className = "stchip " + (f.opts[inp.value] || "s-none"); };
    paint();
    inp.addEventListener("change", () => { paint(); saveField(path, f.k, inp.value, 0); });
    inp._paint = paint;
  } else if (f.type === "textarea") {
    inp = el("textarea", { placeholder: f.ph || "", disabled: !canWrite, rows: 2 });
    inp.value = v;
  } else {
    inp = el("input", { type: f.type === "date" ? "date" : "text", placeholder: f.ph || "", class: f.cls || "", disabled: !canWrite });
    inp.value = v;
  }
  if (f.type !== "select") {
    inp.addEventListener("input", () => saveField(path, f.k, inp.value));
    inp.addEventListener("blur", () => flush(path, f.k, inp.value));
  }
  inp.dataset.k = f.k;
  const wrap = el("div", { class: "f" + (f.wide ? " wide" : "") }, el("label", { text: f.label }), inp);
  if (f.link) {
    const a = el("a", { class: "openlink", target: "_blank", rel: "noopener" });
    const upd = () => { const u = inp.value.trim(); if (/^https?:\/\//i.test(u)) { a.href = u; a.textContent = "Open link ↗"; a.hidden = false; } else a.hidden = true; };
    upd(); inp.addEventListener("input", upd); inp._link = upd;
    wrap.append(a);
  }
  return wrap;
}

function buildCard(s, id, data) {
  const path = `weeks/${weekId}/${s.key}/${id}`;
  const card = el("div", { class: "card", "data-id": id });
  if (s.dayLabel) card.append(el("div", { class: "daylabel", "data-day": "1" }));
  if (data.carriedFrom) card.append(el("div", { class: "daylabel", style: "color:var(--muted)", text: "Carried over from " + short(parseYmd(data.carriedFrom)) }));
  const grid = el("div", { class: "grid" });
  for (const f of s.fields) grid.append(fieldInput(s, f, path, data));
  card.append(grid);
  const who = el("span", { class: "who" });
  const del = el("button", { class: "del", text: "Delete" });
  del.addEventListener("click", () => {
    if (!del.classList.contains("arm")) {
      del.classList.add("arm"); del.textContent = "Tap again to delete";
      setTimeout(() => { del.classList.remove("arm"); del.textContent = "Delete"; }, 3000);
      return;
    }
    card.style.opacity = .4;
    queueWrite(path, () => db.doc(path).delete());
  });
  if (!canWrite) del.hidden = true;
  card.append(el("div", { class: "meta" }, who, del));
  return card;
}

function updateCard(s, card, data) {
  card.querySelectorAll("[data-k]").forEach(inp => {
    const v = data[inp.dataset.k] ?? "";
    if (inp !== document.activeElement && inp.value !== v) {
      inp.value = v;
      inp._paint && inp._paint();
      inp._link && inp._link();
    }
  });
  const day = card.querySelector("[data-day]");
  if (day) day.textContent = data.date ? fmt(parseYmd(data.date), { weekday: "long", month: "numeric", day: "numeric" }) : "Date not set";
  const who = card.querySelector(".who");
  if (data.updatedAt) {
    const n = data.updatedBy ? (names[data.updatedBy] || "") : "";
    who.textContent = "Updated " + ago(data.updatedAt) + (n ? " by " + n : "");
  } else who.textContent = "";
}

function renderList(s) {
  const box = document.getElementById("list-" + s.key); if (!box) return;
  const map = lists[s.key] || new Map();
  const items = [...map.entries()].map(([id, d]) => ({ id, ...d })).sort(s.sort);
  const existing = new Map([...box.querySelectorAll(":scope > .card")].map(c => [c.dataset.id, c]));
  // remove
  for (const [id, c] of existing) if (!map.has(id)) c.remove();
  // add/update
  const cards = items.map(it => {
    let c = existing.get(it.id);
    if (!c) {
      c = buildCard(s, it.id, it);
      if (it.updatedBy && it.updatedBy !== uid && lists._ready?.[s.key]) c.classList.add("flash");
    }
    updateCard(s, c, it);
    return c;
  });
  // order (only touch DOM if needed; avoid moving focused card)
  const current = [...box.querySelectorAll(":scope > .card")];
  const same = current.length === cards.length && current.every((c, i) => c === cards[i]);
  if (!same && !box.contains(document.activeElement)) cards.forEach(c => box.append(c));
  else if (!same) cards.forEach(c => { if (!c.isConnected) box.append(c); });
  let empty = box.querySelector(".empty");
  if (!items.length && !empty) box.append(el("div", { class: "empty", text: "Nothing yet." }));
  if (items.length && empty) empty.remove();
  const cnt = document.getElementById("count-" + s.key);
  if (cnt) {
    if (s.key === "tasks") { const done = items.filter(i => i.status === "Complete").length; cnt.textContent = items.length ? `${done}/${items.length} complete` : ""; }
    else if (s.key === "testing") { const done = items.filter(i => i.result).length; cnt.textContent = items.length ? `${done}/${items.length} scored` : ""; }
    else cnt.textContent = items.length ? String(items.length) : "";
  }
  if (justAdded && map.has(justAdded)) {
    const c = box.querySelector(`[data-id="${justAdded}"]`);
    justAdded = null;
    if (c) { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.querySelector("input,textarea")?.focus({ preventScroll: true }); }
  }
  resolveNames(items.map(i => i.updatedBy).filter(Boolean));
}

let nameQ = new Set(), nameT;
function resolveNames(ids) {
  if (!user || !user.profiles) return;
  let added = false;
  for (const id of ids) if (!(id in names) && !nameQ.has(id)) { nameQ.add(id); added = true; }
  if (!added) return;
  clearTimeout(nameT);
  nameT = setTimeout(async () => {
    const q = [...nameQ]; nameQ.clear();
    try {
      const ps = await user.profiles(q);
      for (const id of q) names[id] = (ps && ps[id] && ps[id].name) || "";
      SECTIONS.forEach(s => { const box = document.getElementById("list-" + s.key); if (box) renderList(s); });
    } catch { for (const id of q) names[id] = ""; }
  }, 150);
}

/* ---------- subscriptions ---------- */
function subscribe() {
  unsubs.forEach(u => { try { u(); } catch {} }); unsubs = [];
  lists = { _ready: {} };
  weekDoc = null; weekLoaded = false;
  renderHeader(); buildMain();
  if (!db) return;
  setLive("connecting");
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => setLive("stale"), 10000);
  const wid = weekId;
  const onErr = e => { console.warn(e); setLive("stale"); };

  unsubs.push(db.doc("weeks/" + wid).onSnapshot(snap => {
    if (wid !== weekId) return;
    if (!snap.metadata.fromCache) { clearTimeout(loadTimer); setLive("live"); }
    const had = !!weekDoc, wasLoaded = weekLoaded;
    weekDoc = snap.exists ? snap.data() : null;
    weekLoaded = true;
    renderHeader();
    if (!wasLoaded || had !== !!weekDoc) buildMain();
    else { renderPriorities(); refreshWeekText(); }
  }, onErr));

  for (const s of SECTIONS) {
    lists[s.key] = new Map();
    unsubs.push(db.collection(`weeks/${wid}/${s.key}`).onSnapshot(snap => {
      if (wid !== weekId) return;
      const m = new Map();
      snap.docs.forEach(d => m.set(d.id, d.data()));
      lists[s.key] = m;
      renderList(s);
      if (!snap.metadata.fromCache) lists._ready[s.key] = true;
    }, onErr));
  }
}

/* refresh "x min ago" labels */
setInterval(() => SECTIONS.forEach(s => document.getElementById("list-" + s.key) && renderList(s)), 60000);

/* ---------- navigation ---------- */
function goWeek(id) {
  if (id === weekId) return;
  weekId = id;
  subscribe();
  
}
$("#ck-prev").onclick = () => goWeek(ymd(addDays(parseYmd(weekId), -7)));
$("#ck-next").onclick = () => goWeek(ymd(addDays(parseYmd(weekId), 7)));
$("#ck-todayBtn").onclick = () => goWeek(THIS_MONDAY);

/* ---------- copy summary ---------- */
function summaryText() {
  const mon = parseYmd(weekId), sun = addDays(mon, 6);
  const L = [];
  L.push(`CADRE CHECK-IN — Week of ${mdY(mon)} – ${mdY(sun)}`);
  if (weekDoc) L.push(`Prepared by: ${weekDoc.preparedBy || ""} | Briefing: ${mdY(mon)}`);
  if (!weekDoc) return L.join("\n") + "\n(Not started)";
  L.push("", "WEEKLY PRIORITIES");
  (weekDoc.priorities || []).filter(Boolean).forEach((p, i) => L.push(`${i + 1}. ${p}`));
  const get = k => { const s = SECTIONS.find(x => x.key === k); return [...(lists[k] || new Map()).entries()].map(([id, d]) => ({ id, ...d })).sort(s.sort); };
  const dd = d => d ? mdY(parseYmd(d)) : "";
  L.push("", "COMING UP THIS WEEK");
  get("events").forEach(e => L.push(`• ${dd(e.date)} ${e.time || ""} — ${e.title || ""}${e.lead ? " | Lead: " + e.lead : ""}${e.prep ? " | Prep: " + e.prep : ""}`.replace(/\s+—/, " —")));
  L.push("", "PHASE TESTING");
  get("testing").forEach(t => L.push(`• ${t.member || ""} — ${t.phase || ""}, ${dd(t.date)} ${t.time || ""}, Evaluator: ${t.evaluator || ""}, Result: ${t.result || "Pending"}`));
  L.push("", "WHAT NEEDS TO BE DONE");
  get("tasks").forEach(t => L.push(`• [${t.status || "Not started"}] ${t.task || ""}${t.assignee ? " — " + t.assignee : ""}${t.due ? " (due " + dd(t.due) + ")" : ""}`));
  L.push("", "WHAT IS NEW");
  get("updates").forEach(u => L.push(`• ${u.item || ""}${u.change ? " — " + u.change : ""}${u.link ? " " + u.link : ""}`));
  L.push("", "STAFFING, EQUIPMENT & SAFETY");
  L.push(`Staffing: ${weekDoc.staffing || ""}`, `Equipment: ${weekDoc.equipment || ""}`, `Safety: ${weekDoc.safety || ""}`);
  L.push("", "OPEN ITEMS & DECISIONS");
  get("openItems").forEach(o => L.push(`• ${o.issue || ""}${o.next ? " → " + o.next : ""}${o.owner ? " (" + o.owner + (o.deadline ? ", " + dd(o.deadline) : "") + ")" : ""}`));
  L.push("", "CADRE ROLES");
  get("roles").forEach(r => L.push(`• ${r.member || ""} — ${r.role || ""}${r.duties ? ": " + r.duties : ""}${r.backup ? " (backup: " + r.backup + ")" : ""}`));
  L.push("", "REMINDERS", weekDoc.reminders || "");
  L.push("", `Next cadre check-in: ${mdY(addDays(mon, 7))}`);
  return L.join("\n");
}
$("#ck-copyBtn").onclick = async () => {
  const txt = summaryText();
  try { await navigator.clipboard.writeText(txt); toast("Summary copied — paste into a text or email"); }
  catch {
    let box = $("#copyWrap");
    if (!box) {
      box = el("section", { id: "copyWrap" }, el("div", { class: "sh" }, el("h2", { text: "Summary" }), el("span", { class: "hint", text: "Select all and copy" })), el("textarea", { class: "copybox", readonly: true }));
      $("#ck-main").prepend(box);
    }
    box.querySelector("textarea").value = txt;
    box.scrollIntoView({ behavior: "smooth" });
  }
};

/* ---------- Word (.docx) export ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  for (const [name, text] of files) {
    const nb = enc.encode(name), db_ = enc.encode(text), crc = crc32(db_);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, db_.length, true); h.setUint32(22, db_.length, true);
    h.setUint16(26, nb.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nb, db_);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, db_.length, true); c.setUint32(24, db_.length, true);
    c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), nb);
    off += 30 + nb.length + db_.length;
  }
  const cs = cen.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
const xe = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const RED_HEX = "B31B1B";
function wRun(t, o = {}) {
  const pr = `${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}${o.sz ? `<w:sz w:val="${o.sz}"/>` : ""}`;
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
}
const wP = (runs, o = {}) => `<w:p><w:pPr><w:spacing w:before="${o.before || 0}" w:after="${o.after ?? 80}"/>${o.border ? `<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${RED_HEX}"/></w:pBdr>` : ""}${o.ind ? `<w:ind w:left="360" w:hanging="360"/>` : ""}</w:pPr>${runs}</w:p>`;
const wH = t => wP(wRun(t, { b: true, color: RED_HEX, sz: 26 }), { before: 240, after: 80 });
function wTable(cols, rows, widths) {
  const tw = widths.reduce((a, b) => a + b, 0);
  const cell = (t, w, head) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${head ? `<w:shd w:val="clear" w:color="auto" w:fill="${RED_HEX}"/>` : ""}</w:tcPr>${wP(wRun(t, head ? { b: true, color: "FFFFFF", sz: 20 } : { sz: 20 }), { after: 0 })}</w:tc>`;
  const b = `<w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${tw}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${b}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`
    + `<w:tr><w:trPr><w:tblHeader/></w:trPr>${cols.map((c, i) => cell(c, widths[i], true)).join("")}</w:tr>`
    + rows.map(r => `<w:tr>${r.map((c, i) => cell(c, widths[i], false)).join("")}</w:tr>`).join("") + `</w:tbl>` + wP("", { after: 0 });
}
function buildDocx() {
  const mon = parseYmd(weekId), sun = addDays(mon, 6);
  const get = k => { const s = SECTIONS.find(x => x.key === k); return [...(lists[k] || new Map()).entries()].map(([id, d]) => ({ id, ...d })).sort(s.sort); };
  const has = (o, ks) => ks.some(k => String(o[k] || "").trim());
  const dd = d => d ? fmt(parseYmd(d), { weekday: "short", month: "numeric", day: "numeric" }) : "";
  const w = weekDoc || {};
  let B = "";
  B += wP(wRun("CVFD TRAINING DIVISION", { b: true, color: RED_HEX, sz: 18 }), { after: 40 });
  B += wP(wRun("Cadre Weekly Check-In", { sz: 48, color: "1F2A44" }), { border: true, after: 120 });
  B += wP(wRun(`Week of ${fmt(mon, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} \u2013 ${mdY(sun)}${w.preparedBy ? "   \u00b7   Prepared by " + w.preparedBy : ""}`, { i: true }), { after: 120 });
  const pri = (w.priorities || []).map(p => String(p || "").trim()).filter(Boolean);
  B += wH("Priorities this week");
  B += pri.length ? pri.map((p, i) => wP(wRun(`${i + 1}.  ${p}`), { ind: true, after: 40 })).join("") : wP(wRun("None listed.", { i: true }));
  const sect = (title, k, keys, cols, widths, map) => {
    const rows = get(k).filter(r => has(r, keys)).map(map);
    if (!rows.length && (k === "updates" || k === "openItems" || k === "roles")) return;
    B += wH(title);
    B += rows.length ? wTable(cols, rows, widths) : wP(wRun("Nothing scheduled.", { i: true }));
  };
  sect("Events & training", "events", ["title", "date", "lead"], ["Date", "Time", "Event", "Lead / Location", "Prep"], [1300, 800, 3500, 2300, 1900],
    e => [dd(e.date), e.time, e.title, e.lead, e.prep]);
  sect("Phase testing", "testing", ["member", "date", "phase"], ["Date", "Time", "Member", "Phase", "Evaluator", "Result"], [1300, 800, 2500, 1900, 1700, 1600],
    t => [dd(t.date), t.time, t.member, t.phase, t.evaluator, t.result || "Pending"]);
  sect("Tasks", "tasks", ["task"], ["Task", "Assigned to", "Due", "Status"], [4500, 2600, 1300, 1400],
    t => [t.task, t.assignee, dd(t.due), t.status || "Not started"]);
  sect("What is new", "updates", ["item", "change"], ["Item", "What changed / action", "Link"], [3000, 4600, 2200],
    u => [u.item, u.change, u.link]);
  B += wH("Staffing, safety & equipment");
  [["Staffing", w.staffing], ["Safety", w.safety], ["Equipment", w.equipment]].forEach(([l, v]) =>
    B += wP(wRun(l + ": ", { b: true }) + wRun(String(v || "").trim() || "Nothing noted.")));
  sect("Open items & decisions", "openItems", ["issue", "next"], ["Issue", "Next step", "Owner", "Deadline"], [3400, 3400, 1700, 1300],
    o => [o.issue, o.next, o.owner, dd(o.deadline)]);
  sect("Cadre roles", "roles", ["member", "role"], ["Member", "Role", "Responsibilities", "Backup"], [2200, 1800, 4100, 1700],
    r => [r.member, r.role, r.duties, r.backup]);
  if (String(w.reminders || "").trim()) { B += wH("Reminders"); B += wP(wRun(w.reminders, { i: true })); }
  B += wP(wRun(`Next cadre check-in: ${mdY(addDays(mon, 7))}`, { sz: 18, color: "666666" }), { before: 200 });
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${B}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="864" w:right="1080" w:bottom="864" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`;
  return zipStore([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`],
    ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["word/document.xml", doc],
    ["word/styles.xml", styles]
  ]);
}
window.__ckBuildDocx = buildDocx;
$("#ck-docxBtn").onclick = async () => {
  if (!weekDoc) { toast("This week hasn't been started yet"); return; }
  const blob = buildDocx(), filename = `Cadre-Check-In-Week-of-${weekId}.docx`;
  let dl = null; try { dl = await claude.use("downloads"); } catch (e) {}
  if (dl) {
    try { await dl.save({ filename, data: blob }); toast("Word file saved"); }
    catch (e) { if (e && e.code !== "declined") toast("Couldn't save the Word file here"); }
    return;
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
};

/* ---------- boot ---------- */
renderHeader();
db = ctx.db; user = ctx.user; canWrite = !!ctx.canEdit; canWriteKnown = true;
if (user) { user.id().then(v => { uid = v; }).catch(() => {}); }
if (!db) {
  weekLoaded = true; weekDoc = null; canWrite = false; setLive("off");
  $("#ck-main").innerHTML = "";
  $("#ck-main").append(el("div", { class: "banner" }, el("h3", { text: "Sign in to view the check-in" }), el("p", { text: "Open the guide while signed in to Claude to see the live check-in." })));
} else subscribe();

}
