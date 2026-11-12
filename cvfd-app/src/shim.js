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
    const busy = (b, on) => { b.disabled = on; };
    const go = async ev => {
      ev.preventDefault(); err.textContent = ""; const b = ev.submitter || form.querySelector("button[type=submit]"); busy(b, true);
      try {
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
  async function seedSheet() {
    const st = h("p", { text: "Copies the SOG categories, training content, academy, TD dashboard and check-in weeks from the claude.ai apps into this app. Safe to run again: it overwrites with the same data." });
    const btn = h("button", { class: "cv-btn", type: "button", text: "Load it", onclick: async () => {
      btn.disabled = true;
      try {
        const data = await (await fetch("seed/seed.json")).json();
        const paths = Object.keys(data); let done = 0;
        for (let i = 0; i < paths.length; i += 400) {
          const b = fs.batch();
          paths.slice(i, i + 400).forEach(p => b.set(fs.doc(p), data[p]));
          await b.commit(); done += Math.min(400, paths.length - i); st.textContent = `Loaded ${done} of ${paths.length}…`;
        }
        st.textContent = `Done. Loaded ${paths.length} records.`; setTimeout(() => { closeOverlay(); location.reload(); }, 1200);
      } catch (e) { st.textContent = errText(e); btn.disabled = false; }
    } });
    showOverlay(h("div", { class: "cv-card" }, h("h1", { text: "Load starting data" }), st, btn, h("button", { class: "cv-btn alt", type: "button", text: "Back", onclick: accountSheet })));
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
      me: async () => ({ id: fbUser.uid, name: (profile && profile.name) || fbUser.displayName || fbUser.email || "" }),
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
  if (cfg.useEmulator) { auth.useEmulator("http://127.0.0.1:9099"); fs.useEmulator("127.0.0.1", 8085); }
  try { fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}
  window.__cvfd = { get auth() { return auth; }, get fs() { return fs; } };
  let booted = false;
  auth.onAuthStateChanged(async u => {
    if (!u) { if (booted) location.reload(); else { const go = () => signInScreen("in"); document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go(); } return; }
    fbUser = u; booted = true;
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
