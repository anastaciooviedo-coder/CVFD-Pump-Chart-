/* CVFD app runtime: gives the shared app code the same claude.use("db"/"user"/"downloads")
   calls it had on claude.ai, backed by Firebase Auth + Firestore. Roles live in users/{uid}.role:
   member (default), cadre (Training Division staff, same as an artifact Editor), admin (can set roles). */
(function () {
  "use strict";
  const cfg = window.CVFD_FIREBASE_CONFIG || {};
  const configured = !!(cfg.apiKey && !/REPLACE/.test(cfg.apiKey));
  const native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const P = name => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || null;
  const STAFF = ["cadre", "admin"];
  let resolveCtx; const ctxReady = new Promise(r => (resolveCtx = r));
  let auth = null, fs = null, profile = null, fbUser = null;

  /* ---------- tiny DOM helpers ---------- */
  const h = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") n.textContent = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach(c => c != null && n.append(c)); return n;
  };
  const css = `
  .cv-ov{position:fixed;inset:0;z-index:9999;background:var(--bg,#eef0f1);overflow:auto;padding:calc(env(safe-area-inset-top) + 24px) 20px calc(env(safe-area-inset-bottom) + 24px);font-family:inherit}
  .cv-card{max-width:420px;margin:0 auto;background:var(--panel,#fff);border:1px solid var(--line,#d3d8dc);border-radius:14px;padding:20px}
  .cv-card h1{font-family:"Barlow Condensed",system-ui,sans-serif;font-size:28px;margin:8px 0 4px;letter-spacing:.02em;text-transform:uppercase}
  .cv-card p{color:var(--muted,#5c656c);margin:0 0 14px;font-size:15px;line-height:1.4}
  .cv-card label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px}
  .cv-card input,.cv-card select{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:11px 12px;border:1px solid var(--line,#d3d8dc);border-radius:10px;background:#fff;color:#15191c}
  .cv-btn{display:block;width:100%;margin-top:14px;padding:13px;border-radius:10px;border:1px solid var(--plate,#1d2328);background:var(--plate,#1d2328);color:#fff;font:inherit;font-size:16px;font-weight:600}
  .cv-btn.alt{background:transparent;color:var(--ink,#15191c)}
  .cv-btn.bad{background:#b31b1b;border-color:#b31b1b}
  .cv-link{background:none;border:0;color:#b31b1b;font:inherit;font-size:14px;padding:10px 0;text-decoration:underline}
  .cv-err{color:#b31b1b;font-size:14px;margin-top:10px;min-height:1em}
  .cv-badge{width:84px;height:84px;border-radius:50%;display:block;margin:0 auto}
  .cv-row{display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--line,#d3d8dc)}
  .cv-row span{flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis}
  .cv-row select{width:auto;padding:6px 8px;font-size:14px}
  .cv-gear{margin-left:6px;padding-left:8px!important;padding-right:8px!important;display:inline-flex;align-items:center}`;
  document.head.append(h("style", { text: css }));
  const badgeSrc = () => { const b = document.querySelector("img.badge, header img"); return b ? b.src : ""; };
  let overlay = null;
  function showOverlay(card) { closeOverlay(); overlay = h("div", { class: "cv-ov", role: "dialog", "aria-modal": "true" }, card); document.body.append(overlay); return overlay; }
  function closeOverlay() { if (overlay) overlay.remove(); overlay = null; }
  const errText = e => {
    const c = (e && e.code) || "";
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "That email and password don't match.";
    if (/email-already-in-use/.test(c)) return "There's already an account with that email. Sign in instead.";
    if (/weak-password/.test(c)) return "Use a password of at least 8 characters.";
    if (/invalid-email/.test(c)) return "Check the email address.";
    if (/network/.test(c)) return "No connection. Try again when you have signal.";
    if (/too-many-requests/.test(c)) return "Too many tries. Wait a minute and try again.";
    if (/requires-recent-login/.test(c)) return "For your security, sign out, sign back in, then try again.";
    return (e && e.message) || "Something went wrong.";
  };

  /* ---------- sign in ---------- */
  function signInScreen(mode = "in") {
    const err = h("div", { class: "cv-err", role: "alert" });
    const name = h("input", { id: "cv-name", autocomplete: "name", placeholder: "Last, First" });
    const email = h("input", { id: "cv-email", type: "email", autocomplete: "email", inputmode: "email", autocapitalize: "off" });
    const pw = h("input", { id: "cv-pw", type: "password", autocomplete: mode === "in" ? "current-password" : "new-password" });
    let keepPref = true; try { keepPref = localStorage.getItem("cvfd.keep") !== "0"; } catch (e) {}
    const keep = h("input", { id: "cv-keep", type: "checkbox", checked: keepPref, style: "width:auto;margin:0 8px 0 0;transform:scale(1.25)" });
    const busy = (b, on) => { b.disabled = on; };
    const go = async ev => {
      ev.preventDefault(); err.textContent = ""; const b = ev.submitter || form.querySelector("button[type=submit]"); busy(b, true);
      try {
        // Keep me signed in: stay signed in on this device until Sign out. Unchecked: sign out when the browser closes.
        try { localStorage.setItem("cvfd.keep", keep.checked ? "1" : "0"); } catch (e) {}
        await auth.setPersistence(keep.checked ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
        if (mode === "in") await auth.signInWithEmailAndPassword(email.value.trim(), pw.value);
        else {
          if (!name.value.trim()) throw { message: "Enter your name so the Training Division knows who you are." };
          if (pw.value.length < 8) throw { code: "weak-password" };
          const cr = await auth.createUserWithEmailAndPassword(email.value.trim(), pw.value);
          await cr.user.updateProfile({ displayName: name.value.trim() });
          await fs.collection("users").doc(cr.user.uid).set({ email: cr.user.email, name: name.value.trim(), role: "member", createdAt: Date.now() });
        }
        location.reload();
      } catch (e) { err.textContent = errText(e); busy(b, false); }
    };
    const form = h("form", { onsubmit: go },
      mode === "up" ? [h("label", { for: "cv-name", text: "Name" }), name] : null,
      h("label", { for: "cv-email", text: "Email" }), email,
      h("label", { for: "cv-pw", text: mode === "up" ? "Password (8+ characters)" : "Password" }), pw,
      h("label", { for: "cv-keep", style: "display:flex;align-items:center;font-weight:500;margin-top:14px" }, keep, "Keep me signed in on this device"),
      err,
      h("button", { class: "cv-btn", type: "submit", text: mode === "in" ? "Sign in" : "Create account" }));
    const card = h("div", { class: "cv-card" },
      badgeSrc() ? h("img", { class: "cv-badge", src: badgeSrc(), alt: "" }) : null,
      h("h1", { text: mode === "in" ? "CVFD sign in" : "Create your account" }),
      h("p", { text: mode === "in" ? "SOGs, size-up, training and your training record." : "Use the email you want the Training Division to reach you at." }),
      form,
      mode === "in"
        ? [h("button", { class: "cv-btn alt", type: "button", text: "Create an account", onclick: () => signInScreen("up") }),
           h("button", { class: "cv-link", type: "button", text: "Forgot password?", onclick: async () => {
             err.textContent = ""; if (!email.value.trim()) { err.textContent = "Enter your email first."; return; }
             try { await auth.sendPasswordResetEmail(email.value.trim()); err.style.color = "#1d6b3a"; err.textContent = "Check your email for a reset link."; } catch (e) { err.textContent = errText(e); }
           } })]
        : h("button", { class: "cv-btn alt", type: "button", text: "I already have an account", onclick: () => signInScreen("in") }),
      h("p", { style: "margin-top:14px;font-size:13px" }, h("a", { href: "privacy.html", text: "Privacy policy" })));
    showOverlay(card);
  }

  /* ---------- account sheet ---------- */
  async function accountSheet() {
    const err = h("div", { class: "cv-err", role: "alert" });
    const role = (profile && profile.role) || "member";
    const card = h("div", { class: "cv-card" },
      h("h1", { text: "Account" }),
      h("p", {}, (profile && profile.name) || fbUser.displayName || "", h("br"), fbUser.email || "", h("br"), "Role: " + role),
      h("button", { class: "cv-btn alt", type: "button", text: "Close", onclick: closeOverlay }),
      h("button", { class: "cv-btn", type: "button", text: "Sign out", onclick: async () => { await auth.signOut(); location.hash = ""; location.reload(); } }),
      role === "admin" ? h("button", { class: "cv-btn alt", type: "button", text: "Manage member roles", onclick: rolesSheet }) : null,
      role === "admin" ? h("button", { class: "cv-btn alt", type: "button", text: "Load starting data", onclick: seedSheet }) : null,
      STAFF.includes(role) ? h("button", { class: "cv-btn alt", type: "button", text: "Import member list (Aladtec)", onclick: rosterSheet }) : null,
      role === "admin" ? h("button", { class: "cv-btn alt", type: "button", text: "Download full backup", onclick: backupAll }) : null,
      h("a", { class: "cv-link", href: "privacy.html", style: "display:block", text: "Privacy policy" }),
      h("button", { class: "cv-link", type: "button", text: "Delete my account", onclick: () => {
        const ok = h("button", { class: "cv-btn bad", type: "button", text: "Yes, delete my account and training record", onclick: async () => {
          ok.disabled = true; err.textContent = "";
          try {
            const uid = fbUser.uid, m = fs.collection("members").doc(uid);
            for (const sub of ["certs", "hours", "books"]) { const s = await m.collection(sub).get(); await Promise.all(s.docs.map(d => d.ref.delete())); }
            await m.delete().catch(() => {});
            await fs.collection("users").doc(uid).delete().catch(() => {});
            await fbUser.delete();
            location.hash = ""; location.reload();
          } catch (e) { err.textContent = errText(e); ok.disabled = false; }
        } });
        card.append(h("p", { style: "margin-top:12px", text: "This permanently deletes your sign-in, certifications, hours and phase book progress. It can't be undone." }), ok);
      } }),
      err);
    showOverlay(card);
  }
  async function rolesSheet() {
    const list = h("div", {}, h("p", { text: "Loading members…" }));
    showOverlay(h("div", { class: "cv-card" }, h("h1", { text: "Member roles" }),
      h("p", { text: "Cadre can edit content, see the Cadre tab and review member records. Admin can also change roles." }),
      list, h("button", { class: "cv-btn alt", type: "button", text: "Done", onclick: accountSheet })));
    try {
      const s = await fs.collection("users").get();
      list.textContent = "";
      s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email))).forEach(u => {
        const sel = h("select", { "aria-label": "Role for " + (u.name || u.email) }, ["member", "cadre", "admin"].map(r => h("option", { value: r, text: r, selected: (u.role || "member") === r })));
        sel.disabled = u.id === fbUser.uid;
        sel.onchange = () => fs.collection("users").doc(u.id).update({ role: sel.value }).then(() => toastMsg("Role saved"), e => toastMsg(errText(e)));
        list.append(h("div", { class: "cv-row" }, h("span", { text: (u.name || "") + (u.email ? " · " + u.email : "") }), sel));
      });
    } catch (e) { list.textContent = errText(e); }
  }
  async function writeDocs(data, st) {
    const paths = Object.keys(data); let done = 0;
    for (let i = 0; i < paths.length; i += 400) {
      const b = fs.batch();
      paths.slice(i, i + 400).forEach(p => b.set(fs.doc(p), data[p]));
      await b.commit(); done += Math.min(400, paths.length - i); st.textContent = `Loaded ${done} of ${paths.length}…`;
    }
    return paths.length;
  }
  async function seedSheet() {
    const st = h("p", { text: "Step 1 loads the Field Guide content (Must Knows, Ref, size-up scripts, department tools). Step 2 loads the file you saved with Export data file on the TD Master Dashboard in the claude.ai Training Division app: training, academy, dashboard sheets and Cadre Material. Step 3 loads the task books (taskbook-library.json). Safe to run again: it overwrites with the same data." });
    const finish = n => { st.textContent = `Done. Loaded ${n} records.`; };
    const guideBtn = h("button", { class: "cv-btn", type: "button", text: "1. Load Field Guide content", onclick: async () => {
      guideBtn.disabled = true;
      try { finish(await writeDocs(await (await fetch("seed/guide.json", { cache: "no-cache" })).json(), st)); }
      catch (e) { st.textContent = errText(e); }
      guideBtn.disabled = false;
    } });
    const file = h("input", { type: "file", accept: ".json,application/json", style: "display:none", onchange: async () => {
      const f = file.files && file.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        const docs = j && j.cvfdExport && j.docs;
        if (!docs || typeof docs !== "object") throw { message: "That isn't a Training Division export file." };
        const ok = {};
        for (const [p, v] of Object.entries(docs)) {
          const seg = p.split("/");
          if (seg.length % 2 === 0 && /^(sections|items|tools|td|weeks)$/.test(seg[0]) && v && typeof v === "object") ok[p] = v;
        }
        finish(await writeDocs(ok, st));
      } catch (e) { st.textContent = errText(e); }
      file.value = "";
    } });
    const tdBtn = h("button", { class: "cv-btn", type: "button", text: "2. Load Training Division file", onclick: () => file.click() });
    const lib = h("input", { type: "file", accept: ".json,application/json", style: "display:none", onchange: async () => {
      const f = lib.files && lib.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        if (!j || !j.cvfdTaskbookLibrary || !Array.isArray(j.books)) throw { message: "That isn't the task book library file." };
        const b = fs.batch();
        j.books.forEach((bk, i) => { if (bk && /^[a-z0-9-]{1,80}$/.test(bk.id)) b.set(fs.collection("tbLibrary").doc(bk.id), { id: bk.id, title: String(bk.title || ""), order: bk.order != null ? bk.order : i, json: JSON.stringify(bk) }); });
        await b.commit();
        st.textContent = `Done. Loaded ${j.books.length} task books.`;
      } catch (e) { st.textContent = errText(e); }
      lib.value = "";
    } });
    const libBtn = h("button", { class: "cv-btn", type: "button", text: "3. Load task book library", onclick: () => lib.click() });
    showOverlay(h("div", { class: "cv-card" }, h("h1", { text: "Load starting data" }), st, guideBtn, tdBtn, file, libBtn, lib,
      h("button", { class: "cv-btn alt", type: "button", text: "Done", onclick: () => { closeOverlay(); location.reload(); } })));
  }
  /* ---------- full backup: every collection the site uses, with member and task book subcollections ---------- */
  async function backupAll(ev) {
    const btn = ev && ev.target; if (btn) { btn.disabled = true; btn.textContent = "Building backup…"; }
    try {
      const out = {};
      const grab = async (col, subs) => {
        const s = await fs.collection(col).get();
        for (const d of s.docs) {
          out[col + "/" + d.id] = d.data();
          for (const sub of subs || []) { const ss = await d.ref.collection(sub).get(); ss.docs.forEach(x => { out[col + "/" + d.id + "/" + sub + "/" + x.id] = x.data(); }); }
        }
      };
      await grab("users"); await grab("members", ["certs", "hours", "books"]); await grab("roster"); await grab("config");
      await grab("sections"); await grab("items"); await grab("tools");
      await grab("td"); for (const k of ["courses", "actions", "cadets", "probation", "books", "docs", "taskbook"]) { const s = await fs.collection("td").doc("main").collection(k).get(); s.docs.forEach(x => { out["td/main/" + k + "/" + x.id] = x.data(); }); }
      await grab("weeks", ["events", "roles", "testing", "tasks", "updates"]);
      await grab("tbLibrary"); await grab("tbCustom"); await grab("tbMembers"); await grab("tbBooks", ["sigs"]);
      await downloads.save({ filename: "cvfd-full-backup-" + new Date().toISOString().slice(0, 10) + ".json", data: new Blob([JSON.stringify({ cvfdBackup: 1, at: new Date().toISOString(), docs: out })], { type: "application/json" }) });
      toastMsg(Object.keys(out).length + " records saved");
    } catch (e) { toastMsg(errText(e)); }
    if (btn) { btn.disabled = false; btn.textContent = "Download full backup"; }
  }
  /* ---------- department list from an Aladtec "Member List" CSV export ---------- */
  function parseCsv(text) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  const TYPES = [["EMS Duty Crew", /ems duty crew/i], ["Fire Duty Crew", /fire duty crew/i], ["Volunteer", /volunteer|station \d+ personnel/i]];
  const ASSIGN = [["specops", /special op/i], ["td", /training/i], ["admin", /admin/i]];
  function rosterFromCsv(text) {
    const rows = parseCsv(text.replace(/^﻿/, ""));
    const hi = rows.findIndex(r => r.includes("Email") && r.includes("Last Name"));
    if (hi < 0) throw { message: "That doesn't look like an Aladtec Member List export (no Email and Last Name columns)." };
    const H = rows[hi], col = n => H.indexOf(n), get = (r, n) => (col(n) >= 0 ? String(r[col(n)] || "").trim() : "");
    const out = {};
    for (const r of rows.slice(hi + 1)) {
      if (r.length < 3) continue;
      let last = get(r, "Last Name"), first = get(r, "First Name");
      if (!last && !first) continue;
      const code = ((last.match(/\(([^)]+)\)/) || [])[1] || "").trim(); last = last.replace(/\s*\([^)]*\)\s*/g, " ").trim();
      const et = get(r, "Employee Type"), wg = get(r, "Work Group"), both = wg + " | " + et;
      const t = TYPES.find(([, re]) => re.test(wg)) || TYPES.find(([, re]) => re.test(et));
      const email = get(r, "Email").toLowerCase();
      const id = email && /^[^\s/@]+@[^\s/]+$/.test(email) ? email : "noemail-" + (last + "-" + first).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      out[id] = { name: (first + " " + last).trim(), first, last, code, email, memberType: t ? t[0] : "",
        assign: ASSIGN.filter(([, re]) => re.test(both)).map(([k]) => k),
        station: ((et.match(/station\s*(\d+)/i) || [])[1] || ""), hire: get(r, "Date Hired"), group: wg, empType: et, importedAt: Date.now() };
    }
    return out;
  }
  async function rosterSheet() {
    const st = h("p", { text: "In Aladtec: Members › Member List, filter Status is Active, export as CSV. Pick that file here. It replaces the department list: people no longer on it are removed (members you added by hand are kept). Only staff can see the list; each member can see only their own entry, which fills in their profile when they sign up with the same email. Phone numbers are not imported." });
    const file = h("input", { type: "file", accept: ".csv,text/csv", style: "display:none", onchange: async () => {
      const f = file.files && file.files[0]; if (!f) return;
      try {
        const data = rosterFromCsv(await f.text()); const ids = Object.keys(data);
        if (!ids.length) throw { message: "No members found in that file." };
        st.textContent = `Found ${ids.length} members. Saving…`;
        const old = (await fs.collection("roster").get()).docs.filter(d => !d.data().manual).map(d => d.id).filter(id => !(id in data));
        const ops = [...ids.map(id => b => b.set(fs.collection("roster").doc(id), data[id])), ...old.map(id => b => b.delete(fs.collection("roster").doc(id)))];
        for (let i = 0; i < ops.length; i += 400) { const b = fs.batch(); ops.slice(i, i + 400).forEach(op => op(b)); await b.commit(); }
        const by = t => ids.filter(id => data[id].memberType === t).length;
        st.textContent = `Done. ${ids.length} members: ${by("Volunteer")} Volunteer, ${by("Fire Duty Crew")} Fire Duty Crew, ${by("EMS Duty Crew")} EMS Duty Crew${old.length ? `. Removed ${old.length} no longer on the list` : ""}. See Cadre › Member roster › Department list.`;
      } catch (e) { st.textContent = errText(e); }
      file.value = "";
    } });
    showOverlay(h("div", { class: "cv-card" }, h("h1", { text: "Import member list" }), st,
      h("button", { class: "cv-btn", type: "button", text: "Choose the CSV file", onclick: () => file.click() }), file,
      h("button", { class: "cv-btn alt", type: "button", text: "Done", onclick: closeOverlay })));
  }
  const toastMsg = m => (window.guideToast ? window.guideToast(m) : null);

  /* ---------- claude.use() compatible namespaces ---------- */
  function makeUser() {
    const role = (profile && profile.role) || "member";
    const nameCache = {};
    return Object.freeze({
      id: async () => fbUser.uid,
      isOwner: async () => role === "admin",
      canEdit: async () => STAFF.includes(role),
      can: async () => null,
      me: async () => ({ id: fbUser.uid, name: (profile && profile.name) || fbUser.displayName || fbUser.email || "", email: fbUser.email || "" }),
      profiles: async ids => {
        const out = {};
        await Promise.all(ids.map(async id => {
          if (!(id in nameCache)) {
            try { const d = await fs.collection("users").doc(id).get(); nameCache[id] = d.exists ? (d.data().name || d.data().email || "") : ""; }
            catch (e) { nameCache[id] = ""; }
          }
          out[id] = { id, name: nameCache[id] };
        }));
        return out;
      }
    });
  }
  async function blobToB64(blob) {
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = "";
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const downloads = Object.freeze({
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const FsP = P("Filesystem"), Sh = P("Share");
      if (native && FsP && Sh) {
        const r = await FsP.writeFile({ path: filename, data: await blobToB64(blob), directory: "CACHE" });
        await Sh.share({ title: filename, url: r.uri, dialogTitle: "Save or send " + filename });
        return;
      }
      const a = h("a", { href: URL.createObjectURL(blob), download: filename }); document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }
  });
  window.claude = Object.freeze({
    use: async name => {
      const c = await ctxReady;
      if (name === "db") return c.db;
      if (name === "user") return c.user;
      if (name === "downloads") return downloads;
      return null;
    }
  });

  /* ---------- links: in-app routes stay in the app, outside sites open in the browser ---------- */
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    const href = a.getAttribute("href");
    const external = /^https?:/i.test(href);
    if (!external && a.target) { e.preventDefault(); location.href = href; return; }
    if (external && native && P("Browser")) { e.preventDefault(); P("Browser").open({ url: href }); }
  }, true);

  window.addEventListener("hashchange", () => { if (overlay && fbUser) closeOverlay(); });

  /* ---------- boot ---------- */
  function addGear() {
    const top = document.querySelector("header.top"); if (!top || document.getElementById("cv-gear")) return;
    const btn = h("button", { class: "btn sm cv-gear", id: "cv-gear", type: "button", "aria-label": "Account", title: "Account", onclick: accountSheet });
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
    top.append(btn);
  }
  if (!configured) {
    document.addEventListener("DOMContentLoaded", () => showOverlay(h("div", { class: "cv-card" }, h("h1", { text: "Setup needed" }),
      h("p", { text: "This build has no Firebase settings yet. Add them to www/firebase-config.js and rebuild." }))));
    resolveCtx({ db: null, user: null });
    return;
  }
  firebase.initializeApp(cfg);
  auth = firebase.auth(); fs = firebase.firestore();
  // The shared app code was written for claude.ai's db, where update() deep-merges nested maps
  // (update({books:{[key]:...}}) adds one book). Firestore's update() would replace the whole map,
  // so plain-object updates go through set(..., {merge:true}), which deep-merges the same way.
  (function () {
    const DR = firebase.firestore.DocumentReference.prototype, orig = DR.update;
    DR.update = function (a) {
      if (arguments.length !== 1 || !a || typeof a !== "object" || a instanceof firebase.firestore.FieldPath) return orig.apply(this, arguments);
      return this.set(a, { merge: true });
    };
  })();
  if (cfg.useEmulator) { auth.useEmulator("http://127.0.0.1:9099"); fs.useEmulator("127.0.0.1", 8085); }
  try { fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}
  window.__cvfd = { get auth() { return auth; }, get fs() { return fs; } };
  let booted = false;
  auth.onAuthStateChanged(async u => {
    if (!u) { if (booted) location.reload(); else { const go = () => signInScreen("in"); document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go(); } return; }
    fbUser = u; booted = true;
    { const nx = new URLSearchParams(location.search).get("next"); if (nx && /^tb\/[\w./?=&#%-]*$/.test(nx)) { location.replace(nx); return; } }
    const ref = fs.collection("users").doc(u.uid);
    const cached = (() => { try { return JSON.parse(localStorage.getItem("cvfd.profile." + u.uid) || "null"); } catch (e) { return null; } })();
    try {
      let d = await ref.get();
      if (!d.exists) { await ref.set({ email: u.email || "", name: u.displayName || "", role: "member", createdAt: Date.now() }); d = await ref.get(); }
      profile = d.data();
      try { localStorage.setItem("cvfd.profile." + u.uid, JSON.stringify(profile)); } catch (e) {}
    } catch (e) { profile = cached || { role: "member" }; }
    // a role change made by an admin takes effect on the next launch; watch for it
    ref.onSnapshot(s => { if (s.exists && !s.metadata.hasPendingWrites && profile && s.data().role !== profile.role) { profile = s.data(); try { localStorage.setItem("cvfd.profile." + u.uid, JSON.stringify(profile)); } catch (e) {} location.reload(); } }, () => {});
    resolveCtx({ db: fs, user: makeUser() });
    const g = () => addGear(); document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", g) : g();
  });
})();
