(() => {
"use strict";
const D = window.RN_DATA;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rp = n => "rp" + Number(n).toLocaleString("id-ID");
const FINE = window.matchMedia("(pointer:fine)").matches;

/* ---------- ikon svg custom (glyph di kotak bergeser) ---------- */
const IC = (inner, vb) => '<svg viewBox="' + (vb || "0 0 24 24") + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">' + inner + "</svg>";
const ICONS = {
  wajan: IC('<circle cx="10" cy="14" r="6"/><path d="M14.5 11.5 21 5"/><path d="M4 14h12"/>'),
  daun: IC('<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z"/><path d="M5 19c4-4 7-7 11-11"/>'),
  cabai: IC('<path d="M7 20c6 0 10-4 11-11l-3-3C9 8 6 12 5 17z"/><path d="M15 6c0-2 1-3.5 3-3.5"/>'),
  kukusan: IC('<rect x="5" y="3" width="14" height="5"/><rect x="5" y="10" width="14" height="5"/><rect x="5" y="17" width="14" height="4"/>'),
  gelas: IC('<path d="M6 3h12l-2 18H8z"/><path d="M7.5 10h9"/>'),
  cobek: IC('<path d="M4 11h16c0 4-3.5 7-8 7s-8-3-8-7z"/><path d="M14 2l5 6"/><path d="M7 21h10"/>'),
  kelapa: IC('<circle cx="12" cy="14" r="7"/><path d="M12 7V3"/><path d="M9 4.5 10 6.5M15 4.5 14 6.5"/>'),
  timbang: IC('<path d="M12 3v18M7 21h10"/><path d="M12 5 5 7m7-2 7 2"/><path d="M2.5 13a2.5 2.5 0 0 0 5 0L5 7zM16.5 13a2.5 2.5 0 0 0 5 0L19 7z"/>'),
  api: IC('<path d="M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4.5 3-7 .8 1.5 2 2.2 3 2.2C11.5 6.7 12 5 12 3z"/>'),
  timer: IC('<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l3 2M9 3h6"/>'),
  hati: IC('<path d="M12 20C6 15 3 11.5 3 8.5a4.8 4.8 0 0 1 9-2.8A4.8 4.8 0 0 1 21 8.5c0 3-3 6.5-9 11.5z"/>'),
  panah: IC('<path d="M4 12h15M13 6l6 6-6 6"/>'),
  salin: IC('<rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/>'),
  unduh: IC('<path d="M12 3v11m0 0-5-5m5 5 5-5M4 21h16"/>'),
  bintang: IC('<path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1-5.6-3-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/>'),
  cek: IC('<path d="M4 12.5l5 5L20 6.5"/>'),
  tutup: IC('<path d="M6 6l12 12M18 6 6 18"/>')
};
const CAT_ICON = { lauk: "wajan", sayur: "daun", sambal: "cabai", kue: "kukusan", minuman: "gelas" };

/* ---------- takaran ---------- */
const PECAH = [[0.75, "¾"], [0.5, "½"], [0.25, "¼"], [1 / 3, "⅓"], [2 / 3, "⅔"]];
function fmtQty(q, u) {
  if (q == null || isNaN(q)) return "";
  if (u === "g" || u === "ml") return String(Math.max(1, Math.round(q / 5) * 5));
  const whole = Math.floor(q + 1e-9);
  const frac = q - whole;
  for (const [v, s] of PECAH) if (Math.abs(frac - v) < 0.06) return (whole ? whole : "") + s || s;
  if (frac > 0.06) return (Math.round(q * 10) / 10).toString().replace(".", ",");
  return String(whole);
}
const scaled = (b, base, p) => [b[0], fmtQty(b[1] * p / base, b[2]), b[2]];

/* ---------- penyimpanan ---------- */
const LS_KEY = "resepnenek:v1";
function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { favs: [], shop: [] };
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.favs) || !Array.isArray(d.shop)) throw new Error("skema");
    return d;
  } catch (e) { return { favs: [], shop: [] }; }
}
function saveStore() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} }
let S = loadStore();
const isFav = slug => S.favs.indexOf(slug) !== -1;

/* ---------- toast, salin, unduh ---------- */
let toastT = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2600);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = t; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { return document.execCommand("copy"); } catch (_) { return false; }
    finally { ta.remove(); }
  }
}
function download(name, text, type) {
  const b = new Blob([text], { type: type || "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

/* ---------- status ---------- */
const state = { cat: "semua", q: "", secret: false, motion: "on", portion: 6, slug: null, lastFocus: null };
try {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (m.matches) state.motion = "off";
  const saved = loadStore().motion;
  if (saved === "on" || saved === "off") state.motion = saved;
} catch (e) {}
const isLite = () =>
  (navigator.hardwareConcurrency || 8) <= 4 ||
  (navigator.deviceMemory || 8) <= 4 ||
  (navigator.connection && navigator.connection.saveData);
let liteMode = isLite();
if (liteMode) document.documentElement.classList.add("lite");

/* ---------- kartu resep ---------- */
const CATS = [["semua", "semua"], ["lauk", "lauk"], ["sayur", "sayur"], ["sambal", "sambal"], ["kue", "kue"], ["minuman", "minuman"], ["favorit", "favorit"]];
function visibleRecipes() {
  return D.recipes.filter(r => {
    if (r.secret && !state.secret) return false;
    if (state.cat === "favorit") { if (!isFav(r.slug)) return false; }
    else if (state.cat !== "semua" && r.kategori !== state.cat) return false;
    if (state.q) {
      const hay = (r.nama + " " + r.daerah + " " + r.bahan.map(b => b[0]).join(" ")).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  });
}
function cardHTML(r, i) {
  const fav = isFav(r.slug);
  return '<article class="card" role="listitem" data-slug="' + r.slug + '">' +
    (r.secret ? '<span class="badge">resep rahasia</span>' : "") +
    '<button type="button" class="fav" data-fav="' + r.slug + '" aria-pressed="' + fav + '" aria-label="' + (fav ? "hapus dari favorit: " : "tandai favorit: ") + esc(r.nama) + '">' + ICONS.hati + "</button>" +
    '<button type="button" class="cardopen" data-open="' + r.slug + '" data-cursor="card" aria-label="buka resep ' + esc(r.nama) + '">' +
    '<span class="num" aria-hidden="true">' + String(i + 1).padStart(2, "0") + "</span>" +
    '<span class="iconbox" aria-hidden="true">' + ICONS[CAT_ICON[r.kategori] || "wajan"] + "</span>" +
    "<h3>" + esc(r.nama) + "</h3>" +
    '<span class="meta">' + esc(r.daerah) + " · " + r.waktu + " mnt · " + esc(r.tingkat) + "</span>" +
    "</button></article>";
}
function renderCards(flip) {
  const list = visibleRecipes();
  const host = $("#cards");
  const apply = () => {
    host.innerHTML = list.map(cardHTML).join("");
    $("#countLine").textContent = list.length + " resep ditemukan" + (state.q ? ' untuk "' + state.q + '"' : "");
    $("#laciEmpty").hidden = list.length > 0;
    bindCards();
  };
  if (flip && window.Flip && state.motion === "on" && !liteMode) {
    const st = Flip.getState(".card");
    apply();
    Flip.from(st, { duration: 0.55, ease: "power2.out", absolute: true, scale: true });
  } else apply();
}
function bindCards() {
  $$("#cards [data-open]").forEach(b => b.addEventListener("click", ev => openOverlay(b.getAttribute("data-open"), null, ev)));
  $$("#cards [data-fav]").forEach(b => b.addEventListener("click", ev => {
    ev.stopPropagation();
    const slug = b.getAttribute("data-fav");
    const i = S.favs.indexOf(slug);
    if (i === -1) { S.favs.push(slug); toast("masuk favorit, nak."); }
    else { S.favs.splice(i, 1); toast("keluar dari favorit."); }
    saveStore(); renderCards(false);
  }));
}
function renderChips() {
  $("#chips").innerHTML = CATS.map(([v, l]) =>
    '<button type="button" class="chip" data-cat="' + v + '" aria-pressed="' + (state.cat === v) + '">' + l + "</button>").join("");
  $$("#chips .chip").forEach(c => c.addEventListener("click", () => {
    state.cat = c.getAttribute("data-cat");
    renderChips(); renderCards(true);
  }));
}

/* ---------- overlay detail ---------- */
function findRecipe(slug) { return D.recipes.find(r => r.slug === slug); }
function openOverlay(slug, portion, ev) {
  const r = findRecipe(slug);
  if (!r) return;
  state.slug = slug;
  state.portion = portion && portion >= 1 && portion <= 99 ? portion : r.porsi;
  state.lastFocus = document.activeElement;
  fillOverlay(r);
  const ov = $("#overlay");
  ov.hidden = false;
  document.body.style.overflow = "hidden";
  const card = $("#ovCard");
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  if (ev && ev.clientX != null) { cx = ev.clientX; cy = ev.clientY; }
  if (window.gsap && state.motion === "on" && !liteMode) {
    gsap.fromTo(card,
      { clipPath: "circle(0px at " + cx + "px " + cy + "px)" },
      { clipPath: "circle(" + (Math.hypot(window.innerWidth, window.innerHeight)) + "px at " + cx + "px " + cy + "px)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" });
  }
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("resep", slug); u.searchParams.set("porsi", state.portion);
    window.history.replaceState(null, "", u.toString());
  } catch (e) {}
  $("#ovClose").focus();
}
function fillOverlay(r) {
  $("#ovKicker").textContent = "resep · " + r.daerah;
  $("#ovTitle").textContent = r.nama;
  $("#ovMeta").textContent = r.waktu + " menit · tingkat " + r.tingkat + " · perkiraan biaya " + rp(r.biaya) + " (perkiraan)";
  $("#pOut").textContent = state.portion;
  $("#ovIng").innerHTML = r.bahan.map((b, i) => {
    const s = scaled(b, r.porsi, state.portion);
    return '<li><span class="q">' + esc(s[1]) + " " + esc(s[2]) + '</span><span class="n">' + esc(s[0]) + "</span></li>";
  }).join("");
  $("#ovSteps").innerHTML = r.langkah.map(s => "<li>" + esc(s) + "</li>").join("");
  $("#ovTips").textContent = r.tips;
}
function closeOverlay() {
  const ov = $("#overlay");
  const done = () => {
    ov.hidden = true;
    document.body.style.overflow = "";
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("resep"); u.searchParams.delete("porsi");
      window.history.replaceState(null, "", u.toString());
    } catch (e) {}
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  };
  const card = $("#ovCard");
  if (window.gsap && state.motion === "on" && !liteMode) {
    gsap.to(card, { clipPath: "circle(0px at 50% 50%)", duration: 0.4, ease: "power2.in", onComplete: () => { gsap.set(card, { clearProps: "clipPath" }); done(); } });
  } else done();
  state.slug = null;
}
function changePortion(d) {
  const r = findRecipe(state.slug);
  if (!r) return;
  let p = state.portion + d;
  if (p < 1) { toast("paling sedikit 1 porsi, nak."); return; }
  if (p > 99) { toast("angkanya kebanyakan nolnya, nak — maksimal 99."); return; }
  state.portion = p;
  fillOverlay(r);
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("porsi", p);
    window.history.replaceState(null, "", u.toString());
  } catch (e) {}
}

/* ---------- daftar belanja ---------- */
function renderShop() {
  const host = $("#shoplist");
  const items = S.shop;
  $("#shopEmpty").hidden = items.length > 0;
  host.innerHTML = items.map((it, i) =>
    '<li class="' + (it.done ? "done" : "") + '">' +
    '<label><input type="checkbox" data-shop="' + i + '"' + (it.done ? " checked" : "") + ' aria-label="tandai ' + esc(it.nama) + '">' +
    "<span><strong>" + esc(it.qty + " " + it.unit) + "</strong> " + esc(it.nama) +
    ' <span class="src">· ' + esc(it.resep) + "</span></span></label>" +
    '<button type="button" class="iconbtn" data-unshop="' + i + '" aria-label="hapus ' + esc(it.nama) + '" style="width:44px;height:44px">' + ICONS.tutup + "</button></li>"
  ).join("");
  $$("#shoplist [data-shop]").forEach(c => c.addEventListener("change", () => {
    S.shop[+c.getAttribute("data-shop")].done = c.checked;
    saveStore(); renderShop();
  }));
  $$("#shoplist [data-unshop]").forEach(b => b.addEventListener("click", () => {
    S.shop.splice(+b.getAttribute("data-unshop"), 1);
    saveStore(); renderShop(); toast("dihapus dari daftar.");
  }));
}
function addToShop() {
  const r = findRecipe(state.slug);
  if (!r) return;
  let n = 0;
  r.bahan.forEach(b => {
    const s = scaled(b, r.porsi, state.portion);
    const id = r.slug + "|" + b[0];
    const ex = S.shop.find(it => it.id === id);
    if (ex) { ex.qty = s[1]; ex.unit = s[2]; }
    else { S.shop.push({ id, nama: s[0], qty: s[1], unit: s[2], resep: r.nama, done: false }); n++; }
  });
  saveStore(); renderShop();
  toast(n ? n + " bahan masuk daftar belanja." : "daftar sudah lengkap, nak.");
}
function shopText() {
  if (!S.shop.length) return "";
  const lines = S.shop.map(it => (it.done ? "[x] " : "[ ] ") + it.qty + " " + it.unit + " " + it.nama + " (" + it.resep + ")");
  return "daftar belanja — resep nenek\n" + lines.join("\n");
}

/* ---------- teknik & statistik ---------- */
function renderTechs() {
  $("#techs").innerHTML = D.techniques.map(t =>
    '<div class="tech"><span class="iconbox" aria-hidden="true">' + ICONS[t.ikon] + "</span><h3>" + esc(t.judul) + "</h3><p>" + esc(t.isi) + "</p></div>"
  ).join("");
}
function statTargets() {
  const rec = D.recipes.filter(r => !r.secret);
  return {
    recipes: rec.length,
    ingredients: rec.reduce((a, r) => a + r.bahan.length, 0),
    steps: rec.reduce((a, r) => a + r.langkah.length, 0)
  };
}

/* ---------- marquee ---------- */
function buildMarquee(id, words) {
  const host = $(id);
  if (!host) return;
  const half = words.map((w, i) =>
    '<span class="' + (i % 3 === 1 ? "fill" : "") + '">' + esc(w) + " ·</span>").join("");
  host.innerHTML = half + half;
}
let skewSetter = null;
function skewMarquee(v) {
  if (!skewSetter || state.motion === "off" || liteMode) return;
  const s = Math.max(-14, Math.min(14, v / 90));
  skewSetter(s);
  gsap.to(".mq-track", { skewX: 0, duration: 0.6, overwrite: "auto" });
}

/* ---------- kata jatuh ---------- */
function buildFalling() {
  const zone = $("#fallzone");
  if (!zone || state.motion === "off" || liteMode || !window.gsap) return;
  zone.innerHTML = "";
  const W = zone.clientWidth || window.innerWidth;
  D.fallingWords.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "fallword";
    s.textContent = w;
    s.style.left = (4 + Math.random() * 88) + "%";
    s.style.fontSize = (0.9 + Math.random() * 1.6) + "rem";
    zone.appendChild(s);
    gsap.fromTo(s, { y: "-12vh", rotation: 0, opacity: 0 },
      {
        y: (52 + Math.random() * 30) + "vh", rotation: (Math.random() * 24 - 12), opacity: 1,
        duration: 0.9 + Math.random() * 0.7, delay: 0.15 + i * 0.12, ease: "power2.in",
        onComplete: () => gsap.to(s, { y: "+=14", duration: 0.35, ease: "bounce.out" })
      });
  });
}

/* ---------- gerak horizontal ---------- */
let hTween = null, panelSTs = [];
function killMotion() {
  if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(st => st.kill());
  if (window.gsap) gsap.killTweensOf("*");
  hTween = null; panelSTs = [];
  gsap && gsap.set("#htrack", { clearProps: "all" });
  gsap && gsap.set(".panel-inner", { clearProps: "all" });
  gsap && gsap.set(".mq-track", { clearProps: "all" });
}
function buildMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);
  const track = $("#htrack");
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  hTween = gsap.to(track, {
    x: () => -dist(), ease: "none",
    scrollTrigger: {
      trigger: "#hwrap", start: "top top",
      end: () => "+=" + dist(),
      pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: self => { navProgress(self.progress); skewMarquee(self.getVelocity()); }
    }
  });
  if (!liteMode) {
    $$(".panel").forEach(p => {
      const inner = $(".panel-inner", p);
      const st = gsap.fromTo(inner, { scale: 1 }, {
        scale: 1.05, ease: "none",
        scrollTrigger: { trigger: p, containerAnimation: hTween, start: "left center", end: "right center", scrub: true }
      });
      panelSTs.push(st.scrollTrigger);
    });
  }
  skewSetter = gsap.quickSetter(".mq-track", "skewX", "deg");
  window.addEventListener("resize", () => ScrollTrigger.refresh());
}
function panelIndexAt() {
  if (!hTween) return 0;
  const track = $("#htrack");
  const x = -gsap.getProperty(track, "x");
  const panels = $$(".panel");
  let best = 0, bd = 1e9;
  panels.forEach((p, i) => { const d = Math.abs(p.offsetLeft - x); if (d < bd) { bd = d; best = i; } });
  return best;
}
function gotoPanel(i) {
  const panels = $$(".panel");
  i = Math.max(0, Math.min(panels.length - 1, i));
  if (!hTween || state.motion === "off") { panels[i].scrollIntoView({ behavior: "auto" }); return; }
  const track = $("#htrack");
  const st = hTween.scrollTrigger;
  const frac = track.scrollWidth <= window.innerWidth ? 0 : panels[i].offsetLeft / (track.scrollWidth - window.innerWidth);
  window.scrollTo(0, st.start + frac * (st.end - st.start));
}
function navProgress(pr) {
  const n = $$(".panel").length;
  const idx = Math.min(n - 1, Math.round(pr * (n - 1)));
  $$(".topnav button").forEach((b, i) => i === idx ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"));
}

/* ---------- kursor & magnet ---------- */
let cursorRAF = 0;
function buildCursor() {
  const c = $("#cursor");
  if (!FINE || state.motion === "off" || liteMode || !c) return;
  c.classList.add("on");
  let mx = -100, my = -100, x = -100, y = -100;
  addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener("mouseleave", () => c.classList.remove("on"));
  document.addEventListener("mouseenter", () => c.classList.add("on"));
  const loop = () => {
    x += (mx - x) * 0.2; y += (my - y) * 0.2;
    c.style.transform = "translate(" + x + "px," + y + "px)";
    cursorRAF = requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener("mouseover", e => {
    const t = e.target.closest("[data-cursor],.btn,.chip,.iconbtn");
    if (!t) { c.setAttribute("data-state", ""); return; }
    c.setAttribute("data-state", t.getAttribute("data-cursor") || "btn");
  });
}
function buildMagnetic() {
  if (!FINE || state.motion === "off" || liteMode || !window.gsap) return;
  $$(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.3 });
    });
    btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
  });
}

/* ---------- statistik count-up ---------- */
let counted = false;
function buildStats() {
  if (!window.ScrollTrigger || !hTween) { paintStats(1); return; }
  const panels = $$(".panel");
  ScrollTrigger.create({
    trigger: panels[3], containerAnimation: hTween,
    start: "left 70%", once: true,
    onEnter: () => countUp()
  });
}
function paintStats(p) {
  const t = statTargets();
  $("#statRecipes").textContent = Math.round(t.recipes * p);
  $("#statIngredients").textContent = Math.round(t.ingredients * p);
  $("#statSteps").textContent = Math.round(t.steps * p);
}
function countUp() {
  if (counted) return; counted = true;
  if (!window.gsap || state.motion === "off") { paintStats(1); return; }
  const o = { v: 0 };
  gsap.to(o, { v: 1, duration: 1.4, ease: "power2.out", onUpdate: () => paintStats(o.v) });
}

/* ---------- mode gerak ---------- */
function applyMotion() {
  const off = state.motion === "off";
  document.documentElement.classList.toggle("rm", off);
  cancelAnimationFrame(cursorRAF);
  const c = $("#cursor");
  if (c) { c.classList.remove("on"); c.removeAttribute("style"); }
  if (window.gsap && window.ScrollTrigger) killMotion();
  $("#fallzone").innerHTML = "";
  const t = $("#motionToggle");
  t.textContent = "gerak: " + (off ? "mati" : "nyala");
  t.setAttribute("aria-pressed", String(!off));
  if (!off) {
    buildMotion(); buildFalling(); buildCursor(); buildMagnetic();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  } else {
    paintStats(1);
  }
  try { S.motion = state.motion; saveStore(); } catch (e) {}
}

/* ---------- rahasia ---------- */
let keyBuf = "";
function bindSecret() {
  addEventListener("keydown", e => {
    if (state.secret) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "Escape") { if (!$("#overlay").hidden) closeOverlay(); return; }
    if (e.key === "/" && tag !== "INPUT") { e.preventDefault(); $("#q").focus(); return; }
    if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) { gotoPanel(panelIndexAt() + 1); return; }
    if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) { gotoPanel(panelIndexAt() - 1); return; }
    if (e.key.length === 1) {
      keyBuf = (keyBuf + e.key.toLowerCase()).slice(-5);
      if (keyBuf === "rindu") {
        state.secret = true;
        renderCards(false);
        toast("nenek membisikkan satu resep rahasia... cari di laci.");
      }
    }
  });
}

/* ---------- init ---------- */
function init() {
  buildMarquee("#mqA", D.marqueeA);
  buildMarquee("#mqB", D.marqueeB);
  renderChips();
  renderCards(false);
  renderShop();
  renderTechs();
  paintStats(0);

  let qT = null;
  $("#q").addEventListener("input", e => {
    clearTimeout(qT);
    qT = setTimeout(() => {
      state.q = e.target.value.trim().toLowerCase();
      renderCards(true);
    }, 220);
  });
  $("#resetFilter").addEventListener("click", () => {
    state.q = ""; $("#q").value = "";
    state.cat = "semua"; renderChips(); renderCards(true);
  });

  $$("[data-goto]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    gotoPanel(+b.getAttribute("data-goto"));
  }));

  $("#motionToggle").addEventListener("click", () => {
    state.motion = state.motion === "on" ? "off" : "on";
    applyMotion();
    toast(state.motion === "on" ? "gerak dinyalakan." : "gerak dimatikan, nak — santai saja.");
  });
  $("#marqueeToggle").addEventListener("click", function () {
    const paused = $(".marquee").classList.toggle("paused");
    $$(".marquee").forEach(m => m.classList.toggle("paused", paused));
    this.textContent = "pita: " + (paused ? "jeda" : "jalan");
    this.setAttribute("aria-pressed", String(!paused));
  });

  $("#ovClose").addEventListener("click", closeOverlay);
  $("#overlay").addEventListener("click", e => { if (e.target === $("#overlay")) closeOverlay(); });
  $("#pMinus").addEventListener("click", () => changePortion(-1));
  $("#pPlus").addEventListener("click", () => changePortion(1));
  $("#pReset").addEventListener("click", () => {
    const r = findRecipe(state.slug);
    if (r) { state.portion = r.porsi; fillOverlay(r); toast("takaran kembali seperti catatan nenek."); }
  });
  $("#ovToShop").addEventListener("click", addToShop);
  $("#ovCopy").addEventListener("click", async () => {
    const r = findRecipe(state.slug);
    if (!r) return;
    const txt = r.nama + " (" + state.portion + " porsi) — resep nenek\n\nbahan:\n" +
      r.bahan.map(b => { const s = scaled(b, r.porsi, state.portion); return "- " + s[1] + " " + s[2] + " " + s[0]; }).join("\n") +
      "\n\nlangkah:\n" + r.langkah.map((s, i) => (i + 1) + ". " + s).join("\n") +
      "\n\ntips nenek: " + r.tips;
    toast(await copyText(txt) ? "ringkasan tersalin." : "gagal menyalin, nak — coba lagi.");
  });
  $("#ovDl").addEventListener("click", () => {
    const r = findRecipe(state.slug);
    if (!r) return;
    download("resep-" + r.slug + ".json", JSON.stringify(r, null, 2));
    toast("resep diunduh.");
  });

  $("#copyShop").addEventListener("click", async () => {
    const t = shopText();
    if (!t) { toast("daftar masih kosong, nak."); return; }
    toast(await copyText(t) ? "daftar tersalin, tinggal tempel di wa." : "gagal menyalin, nak.");
  });
  $("#dlShop").addEventListener("click", () => {
    if (!S.shop.length) { toast("daftar masih kosong, nak."); return; }
    download("daftar-belanja.json", JSON.stringify(S.shop, null, 2));
    toast("daftar diunduh.");
  });
  let armClear = false, armT = null;
  $("#clearShop").addEventListener("click", function () {
    if (!S.shop.length) { toast("sudah kosong, nak."); return; }
    if (!armClear) {
      armClear = true;
      this.textContent = "yakin? tekan lagi";
      armT = setTimeout(() => { armClear = false; this.textContent = "kosongkan"; }, 3000);
    } else {
      clearTimeout(armT); armClear = false;
      this.textContent = "kosongkan";
      S.shop = []; saveStore(); renderShop();
      toast("daftar dikosongkan.");
    }
  });

  bindSecret();
  applyMotion();
  buildStats();

  try {
    const u = new URL(window.location.href);
    const slug = u.searchParams.get("resep");
    const p = parseInt(u.searchParams.get("porsi") || "", 10);
    if (slug && findRecipe(slug)) setTimeout(() => openOverlay(slug, p >= 1 && p <= 99 ? p : null, null), 600);
  } catch (e) {}

  /* watchdog fps → mode ringan */
  setTimeout(() => {
    if (liteMode || state.motion === "off") return;
    let frames = 0;
    const t0 = performance.now();
    const loop = () => {
      frames++;
      if (performance.now() - t0 < 2000) requestAnimationFrame(loop);
      else {
        const fps = frames / 2;
        if (fps < 40) {
          liteMode = true;
          document.documentElement.classList.add("lite");
          applyMotion();
        }
      }
    };
    requestAnimationFrame(loop);
  }, 4000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
})();
