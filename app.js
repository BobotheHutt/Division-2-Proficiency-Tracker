import { assaultRifles } from "./data/weapons/assaultRifles.js";
import { smgs } from "./data/weapons/smgs.js";
import { lmgs } from "./data/weapons/lmgs.js";
import { rifles } from "./data/weapons/rifles.js";
import { marksmanRifles } from "./data/weapons/marksmanRifles.js";
import { shotguns } from "./data/weapons/shotguns.js";
import { pistols } from "./data/weapons/pistols.js";
import { specialization } from "./data/weapons/specialization.js";
import { masks } from "./data/namedExotic/masks.js";
import { bodyArmor } from "./data/namedExotic/bodyArmor.js";
import { backpacks } from "./data/namedExotic/backpacks.js";
import { gloves } from "./data/namedExotic/gloves.js";
import { holsters } from "./data/namedExotic/holsters.js";
import { kneepads } from "./data/namedExotic/kneepads.js";
import { stickyBomb } from "./data/skills/stickyBomb.js";
import { trap } from "./data/skills/trap.js";
import { decoy } from "./data/skills/decoy.js";
import { pulse } from "./data/skills/pulse.js";
import { turret } from "./data/skills/turret.js";
import { hive } from "./data/skills/hive.js";
import { chemLauncher } from "./data/skills/chemLauncher.js";
import { firefly } from "./data/skills/firefly.js";
import { mine } from "./data/skills/mine.js";
import { drone } from "./data/skills/drone.js";
import { shield } from "./data/skills/shield.js";
import { smartCover } from "./data/skills/smartCover.js";
import { brands } from "./data/brands.js";
import { gearSets } from "./data/gearSets.js";

import { glyph } from "./icons.js";
import { cloudEnabled, initCloud, signIn, signOut, loadProgress, saveProgress } from "./cloud.js";

const MAX_RANK = 10;
const STORAGE_KEY = "d2-proficiency-progress";
const UI_KEY = "d2-proficiency-ui";

// Card order follows the in-game screens.
const CATEGORIES = {
    weapons: { label: "Weapons", subs: {
        rifles: { label: "Rifles", items: rifles },
        assaultRifles: { label: "Assault Rifles", items: assaultRifles },
        marksmanRifles: { label: "Marksman Rifles", items: marksmanRifles },
        shotguns: { label: "Shotguns", items: shotguns },
        smgs: { label: "SMGs", items: smgs },
        lmgs: { label: "LMGs", items: lmgs },
        pistols: { label: "Pistols", items: pistols },
        specialization: { label: "Specialization", items: specialization },
    }},
    namedExotic: { label: "Named & Exotic Gear", subs: {
        masks: { label: "Masks", items: masks },
        bodyArmor: { label: "Body Armor", items: bodyArmor },
        backpacks: { label: "Backpacks", items: backpacks },
        gloves: { label: "Gloves", items: gloves },
        holsters: { label: "Holsters", items: holsters },
        kneepads: { label: "Kneepads", items: kneepads },
    }},
    skills: { label: "Skills", subs: {
        stickyBomb: { label: "Sticky Bomb", items: stickyBomb },
        trap: { label: "Trap", items: trap },
        decoy: { label: "Decoy", items: decoy },
        pulse: { label: "Pulse", items: pulse },
        turret: { label: "Turret", items: turret },
        hive: { label: "Hive", items: hive },
        chemLauncher: { label: "Chem Launcher", items: chemLauncher },
        firefly: { label: "Firefly", items: firefly },
        mine: { label: "Seeker Mine", items: mine },
        drone: { label: "Drone", items: drone },
        shield: { label: "Ballistic Shield", items: shield },
        smartCover: { label: "Smart Cover", items: smartCover },
    }},
    brands: { label: "Brands", subs: { all: { label: "Brands", items: brands } } },
    gearSets: { label: "Gear Sets", subs: { all: { label: "Gear Sets", items: gearSets } } },
};

// Sections on the home page. Categories in the same group appear together as quick-switch buttons in the list view.
const HUB = [
    { key: "weapons", title: "Weapons", tabs: ["weapons"] },
    { key: "gear", title: "Named & Exotic Gear", tabs: ["namedExotic"] },
    { key: "skills", title: "Skills", tabs: ["skills"] },
    { key: "collections", title: "Brands & Gear Sets", tabs: ["brands", "gearSets"] },
];
const groupOf = tab => HUB.find(g => g.tabs.includes(tab));
const entriesOf = group => group.tabs.flatMap(tab =>
    Object.entries(CATEGORIES[tab].subs).map(([sub, s]) => ({ tab, sub, ...s })));
const allItems = () => Object.values(CATEGORIES).flatMap(c => Object.values(c.subs).flatMap(s => s.items));

function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// userProgress: { [itemId]: rank }
let userProgress = load(STORAGE_KEY, {});
const ui = Object.assign({ tab: "weapons", subs: {}, search: "", hideDone: false, theme: "dark", compact: false, navOpen: true, bg: "glow", bgDim: 55, bgBlur: 0, order: "game", sort: "name" }, load(UI_KEY, {}));
if (!CATEGORIES[ui.tab]) ui.tab = "weapons";
ui.view = "hub"; // always start on the home page

// Color coding: brands = orange, gear sets = green. Named (gold) and exotic (red) items are flagged in the data.
const toneOf = tab => (tab === "gearSets" ? "set" : tab === "brands" ? "brand" : "");

// Optional item icons: icons/manifest.json maps item id -> file name. Missing entries show no icon.
let iconManifest = {};
fetch("icons/manifest.json")
    .then(r => (r.ok ? r.json() : {}))
    .then(m => { iconManifest = m && typeof m === "object" ? m : {}; if (Object.keys(iconManifest).length) renderItems(); })
    .catch(() => {});

// Original monogram badge (initials) used for brands and gear sets.
const SKIP = new Set(["of", "the", "de", "co", "ltd", "ab", "gmbh", "sa", "spa", "sp", "z", "o", "s", "r", "l"]);
function monogram(name) {
    const words = name.replace(/[&.,:()']/g, " ").split(/\s+/).filter(Boolean);
    if (/\d/.test(words[0])) return name.split(/\s+/)[0];
    const sig = words.filter(w => !SKIP.has(w.toLowerCase()));
    return (sig.length ? sig : words).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

const rankOf = id => userProgress[id] || 0;
const isDone = id => rankOf(id) >= MAX_RANK;
const activeSubKey = () => {
    const subs = CATEGORIES[ui.tab].subs;
    return subs[ui.subs[ui.tab]] ? ui.subs[ui.tab] : Object.keys(subs)[0];
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const query = () => ui.search.trim().toLowerCase();
const matches = (item, q = query()) => !q || item.name.toLowerCase().includes(q);
const visible = item => matches(item) && (!ui.hideDone || !isDone(item.id));
const countVisible = items => items.filter(visible).length;
const count = items => ({ done: items.filter(i => isDone(i.id)).length, total: items.length });
const pctOf = ({ done, total }) => (total ? Math.round((done / total) * 100) : 0);

let currentUser = null;
let syncTimer = null;

function setSyncStatus(text) {
    document.getElementById("sync-status").textContent = text;
}

function persist() {
    save(STORAGE_KEY, userProgress);
    if (!currentUser) return;
    setSyncStatus("Saving...");
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
        try { await saveProgress(currentUser.uid, userProgress); setSyncStatus("Synced"); }
        catch (err) { console.error(err); setSyncStatus("Sync failed"); }
    }, 800);
}

function setRank(id, rank) {
    if (rank > 0) userProgress[id] = rank; else delete userProgress[id];
    persist();
}

// --- Home page ---
function cardHtml(e) {
    const c = count(e.items);
    const q = query();
    let cls = "";
    let stat = `<small>Proficient with</small><b>${c.done}/${c.total}</b>`;
    if (q) {
        const n = countVisible(e.items);
        cls = n ? "has-match" : "no-match";
        stat = `<small>${n === 1 ? "Match" : "Matches"}</small><b>${n}</b>`;
    } else if (c.total && c.done === c.total) {
        cls = "complete";
    }
    if (!q && c.done > 0) cls += " started";
    return `<button type="button" class="hub-card ${cls}" data-open="${e.tab}|${e.sub}" data-tone="${toneOf(e.tab)}">
        <span class="hub-id">
            <span class="hub-icon">${glyph(e.tab, e.sub)}</span>
            <span class="hub-label">${e.label}</span>
        </span>
        <span class="hub-stat">${stat}</span>
        <span class="hub-bar"><i style="width:${pctOf(c)}%"></i></span>
    </button>`;
}

function renderHub() {
    document.getElementById("hub").innerHTML = HUB.map(g => `
        <section class="hub-section" data-sec="${g.key}">
            <h2>${g.title}</h2>
            <div class="hub-grid">${entriesOf(g).map(cardHtml).join("")}</div>
        </section>`).join("");
}

// --- List view ---
// Progress bar + count normally; a match count while searching (buttons without hits are dimmed).
function pillProgress(items) {
    if (query()) {
        const n = countVisible(items);
        return { cls: n ? "has-match" : "no-match",
                 html: `<span class="nav-match">${n ? `${n} ${n === 1 ? "match" : "matches"}` : "No matches"}</span>` };
    }
    const c = count(items);
    return { cls: "", html: `<span class="nav-bar"><i style="width:${pctOf(c)}%"></i></span><span class="nav-count">${c.done}/${c.total}</span>` };
}

function renderListNav() {
    const active = activeSubKey();
    const entries = entriesOf(groupOf(ui.tab));
    const cur = entries.find(e => e.tab === ui.tab && e.sub === active);
    const q = query();
    const c = count(cur.items);
    const stat = q ? `${countVisible(cur.items)} ${countVisible(cur.items) === 1 ? "match" : "matches"}` : `${c.done}/${c.total}`;
    const withHits = q ? entries.filter(e => countVisible(e.items) > 0).length : 0;
    const hint = ui.navOpen ? "Hide categories" : (q ? `${withHits} with matches` : "Switch category");
    const cards = entries.map(e => {
        const p = pillProgress(e.items);
        const on = e.tab === ui.tab && e.sub === active;
        return `<button type="button" class="sub-tab ${on ? "active" : ""} ${p.cls}" data-open="${e.tab}|${e.sub}" data-tone="${toneOf(e.tab)}">
            <span class="nav-icon">${glyph(e.tab, e.sub)}</span>
            <span class="nav-text">
                <span class="nav-label">${e.label}</span>
                <span class="nav-progress">${p.html}</span>
            </span>
        </button>`;
    }).join("");
    document.getElementById("list-nav").innerHTML = `
        <button type="button" class="nav-toggle" data-nav-toggle aria-expanded="${ui.navOpen}">
            <span class="nav-toggle-main">
                <span class="nav-icon">${glyph(cur.tab, cur.sub)}</span>
                <span class="nav-toggle-label">${cur.label}</span>
                <span class="nav-toggle-count">${stat}</span>
            </span>
            <span class="nav-toggle-hint">${hint}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </span>
        </button>
        <div class="subnav" ${ui.navOpen ? "" : "hidden"}>${cards}</div>`;
}

function renderSummary() {
    const label = document.getElementById("summary-label");
    let items, name;
    if (ui.view === "hub") { items = allItems(); name = "Overall"; }
    else { const sub = CATEGORIES[ui.tab].subs[activeSubKey()]; items = sub.items; name = sub.label; }
    const c = count(items);
    label.textContent = query()
        ? `${name}: ${countVisible(items)} of ${c.total} match "${ui.search.trim()}"`
        : `${name}: ${c.done}/${c.total} proficient`;
    document.getElementById("summary-pct").textContent = `${pctOf(c)}%`;
    document.getElementById("summary-bar").style.width = `${pctOf(c)}%`;
}

const isCollectionTab = () => ui.tab === "brands" || ui.tab === "gearSets";

// Sorting, like the in-game options. Brands and gear sets instead follow the in-game order (their data files' order)
// or go A-Z; their in-game sorts (Name, Grade, Level) are about your inventory, so they don't apply here.
// Plain character order (digits first, accented letters after z) to match the in-game list.
const byName = (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
const qualityOf = item => (item.exotic ? 2 : item.named ? 1 : 0);
const SORTS = {
    game: { label: "Game", cmp: null },
    name: { label: "Name", cmp: byName },
    az: { label: "A\u2013Z", cmp: byName },
    quality: { label: "Quality", cmp: (a, b) => qualityOf(b) - qualityOf(a) || byName(a, b) },
    prof: { label: "Proficiency", cmp: (a, b) => rankOf(b.id) - rankOf(a.id) || byName(a, b) },
    inv: { label: "Inverse", title: "Inverse proficiency: lowest rank first", cmp: (a, b) => rankOf(a.id) - rankOf(b.id) || byName(a, b) },
};
// Quality only shows where the category has named or exotic items (not Specialization or skills).
function sortChoices(items) {
    if (isCollectionTab()) return ["game", "az"];
    return items.some(i => i.named || i.exotic) ? ["name", "quality", "prof", "inv"] : ["name", "prof", "inv"];
}
const sortKey = () => (isCollectionTab() ? "order" : "sort");
function activeSort(items) {
    const choices = sortChoices(items);
    return choices.includes(ui[sortKey()]) ? ui[sortKey()] : choices[0];
}

function renderListTools() {
    const el = document.getElementById("list-tools");
    const items = CATEGORIES[ui.tab].subs[activeSubKey()].items;
    const cur = activeSort(items);
    el.hidden = sortChoices(items).length < 2;
    if (el.hidden) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="order-switch"><span>Sort</span>
        <div class="segmented small" role="group" aria-label="Sort">
            ${sortChoices(items).map(k => `<button type="button" data-sort="${k}" class="${k === cur ? "active" : ""}"${SORTS[k].title ? ` title="${SORTS[k].title}"` : ""}>${SORTS[k].label}</button>`).join("")}
        </div></div>`;
}

function renderItems() {
    const grid = document.getElementById("items-grid");
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    const isCollection = isCollectionTab();
    grid.classList.toggle("cards", isCollection);
    const cmp = SORTS[activeSort(sub.items)].cmp;
    const shown = sub.items.filter(visible);
    const items = cmp ? shown.sort(cmp) : shown;

    if (!items.length) {
        const elsewhere = countVisible(allItems());
        grid.innerHTML = `<div class="empty">${query() || ui.hideDone
            ? `Nothing here matches.${elsewhere ? ` ${elsewhere} ${elsewhere === 1 ? "match is" : "matches are"} in the highlighted categories.` : ""}`
            : "No items here yet."}</div>`;
        return;
    }

    const tone = toneOf(ui.tab);
    const icon = glyph(ui.tab, activeSubKey());
    grid.innerHTML = items.map(item => {
        const rank = rankOf(item.id);
        const done = rank >= MAX_RANK;
        const flags = `${done ? "done" : ""} ${item.named ? "named" : ""} ${item.exotic ? "exotic" : ""}`;
        const check = `<label class="check"><input type="checkbox" class="proficient-checkbox" ${done ? "checked" : ""} aria-label="Proficient: ${esc(item.name)}"></label>`;
        const badge = iconManifest[item.id]
            ? `<span class="item-icon"><img src="icons/${encodeURIComponent(iconManifest[item.id])}" alt="" loading="lazy"></span>`
            : `<span class="item-icon">${isCollection ? `<span class="monogram">${esc(monogram(item.name))}</span>` : icon}</span>`;
        const slider = `<div class="rank-wrap">
                <input type="range" class="rank-slider" min="0" max="${MAX_RANK}" value="${rank}" style="--pct:${rank * 10}%" aria-label="Rank: ${esc(item.name)}">
                <span class="rank-value"><b>${rank}</b>/${MAX_RANK}</span>
            </div>`;
        if (isCollection) {
            return `<div class="item-row item-card ${flags}" data-id="${esc(item.id)}" data-tone="${tone}">
            <div class="card-top">${check}${badge}<h3>${esc(item.name)}</h3></div>
            ${slider}
        </div>`;
        }
        return `<div class="item-row ${flags}" data-id="${esc(item.id)}" data-tone="${tone}">
            ${check}${badge}
            <div class="item-info"><h3>${esc(item.name)}</h3></div>
            ${slider}
        </div>`;
    }).join("");
}

function renderAll() {
    const hub = ui.view === "hub";
    document.body.classList.toggle("view-hub", hub);
    document.getElementById("hub").hidden = !hub;
    document.getElementById("list-view").hidden = hub;
    document.getElementById("list-nav").hidden = hub;
    document.getElementById("back-btn").hidden = hub;
    // In the list view the whole working area takes the section's color.
    const sec = hub ? null : groupOf(ui.tab).key;
    for (const id of ["list-nav", "list-view"]) {
        const el = document.getElementById(id);
        if (sec) el.dataset.sec = sec; else el.removeAttribute("data-sec");
    }
    const controls = document.querySelector(".controls");
    if (sec) controls.dataset.sec = sec; else controls.removeAttribute("data-sec");
    document.body.classList.toggle("collection", !hub && isCollectionTab());
    renderSummary();
    if (hub) renderHub();
    else { renderListNav(); renderListTools(); renderItems(); }
}

// Update one row in place so dragging a slider isn't interrupted by a re-render.
function refreshRow(row) {
    const id = row.dataset.id;
    const rank = rankOf(id);
    row.classList.toggle("done", rank >= MAX_RANK);
    row.querySelector(".rank-value b").textContent = rank;
    const slider = row.querySelector(".rank-slider");
    slider.value = rank;
    slider.style.setProperty("--pct", `${rank * 10}%`);
    row.querySelector(".proficient-checkbox").checked = rank >= MAX_RANK;
    renderListNav();
    renderSummary();
}

// --- Navigation: home page <-> list view (browser/phone back returns home) ---
function openCategory(tab, sub) {
    if (!CATEGORIES[tab]?.subs[sub]) return;
    const fromHub = ui.view === "hub";
    ui.tab = tab;
    ui.subs[tab] = sub;
    ui.view = "list";
    if (fromHub) history.pushState({ v: "list" }, "");
    save(UI_KEY, ui);
    renderAll();
    window.scrollTo(0, 0);
}
function goHome() {
    if (history.state?.v === "list") { history.back(); return; }
    ui.view = "hub";
    renderAll();
}
window.addEventListener("popstate", e => {
    ui.view = e.state?.v === "list" ? "list" : "hub";
    renderAll();
});

document.addEventListener("click", e => {
    const ord = e.target.closest("[data-sort]");
    if (ord) {
        ui[sortKey()] = ord.dataset.sort;
        save(UI_KEY, ui);
        renderListTools();
        renderItems();
        return;
    }
    if (e.target.closest("[data-nav-toggle]")) {
        ui.navOpen = !ui.navOpen;
        save(UI_KEY, ui);
        renderListNav();
        return;
    }
    const open = e.target.closest("[data-open]");
    if (open) { openCategory(...open.dataset.open.split("|")); return; }
    if (e.target.closest("[data-back]")) goHome();
});

const grid = document.getElementById("items-grid");
grid.addEventListener("input", e => {
    const row = e.target.closest(".item-row");
    if (!row || !e.target.classList.contains("rank-slider")) return;
    setRank(row.dataset.id, parseInt(e.target.value, 10) || 0);
    refreshRow(row);
    if (ui.hideDone && isDone(row.dataset.id)) renderItems();
});
grid.addEventListener("change", e => {
    const row = e.target.closest(".item-row");
    if (!row || !e.target.classList.contains("proficient-checkbox")) return;
    setRank(row.dataset.id, e.target.checked ? MAX_RANK : 0);
    refreshRow(row);
    if (ui.hideDone) renderItems();
});

const searchBox = document.getElementById("search");
searchBox.value = ui.search;

// In the list view, if this category has no hits, jump to the first one that does.
function jumpToFirstMatch() {
    if (ui.view !== "list" || !query() || countVisible(CATEGORIES[ui.tab].subs[activeSubKey()].items)) return;
    const tabs = [ui.tab, ...Object.keys(CATEGORIES).filter(k => k !== ui.tab)];
    for (const tab of tabs) {
        for (const [subKey, sub] of Object.entries(CATEGORIES[tab].subs)) {
            if (countVisible(sub.items)) { ui.tab = tab; ui.subs[tab] = subKey; return; }
        }
    }
}
searchBox.addEventListener("input", () => {
    ui.search = searchBox.value;
    jumpToFirstMatch();
    save(UI_KEY, ui);
    renderAll();
});
// "/" focuses search from anywhere; Esc clears it.
document.addEventListener("keydown", e => {
    if (e.key === "/" && !e.target.closest("input, textarea")) { e.preventDefault(); searchBox.focus(); }
    else if (e.key === "Escape" && e.target === searchBox && searchBox.value) {
        searchBox.value = ""; ui.search = ""; save(UI_KEY, ui); renderAll();
    }
});

const hideBox = document.getElementById("hide-done");
hideBox.checked = ui.hideDone;
hideBox.addEventListener("change", () => { ui.hideDone = hideBox.checked; save(UI_KEY, ui); renderAll(); });

document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(userProgress, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "division2-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
});

const importInput = document.getElementById("import-input");
document.getElementById("import-btn").addEventListener("click", () => importInput.click());
importInput.addEventListener("change", async () => {
    const file = importInput.files[0];
    importInput.value = "";
    if (!file) return;
    try {
        const data = JSON.parse(await file.text());
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad format");
        const clean = {};
        for (const [id, rank] of Object.entries(data)) {
            const n = Math.min(MAX_RANK, Math.max(0, parseInt(rank, 10) || 0));
            if (n) clean[id] = n;
        }
        userProgress = clean;
        persist();
        renderAll();
    } catch {
        alert("Couldn't read that file. Use a JSON file exported from this tracker.");
    }
});

document.getElementById("reset-btn").addEventListener("click", () => {
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    if (!confirm(`Reset all ranks in "${sub.label}" to 0?`)) return;
    sub.items.forEach(i => delete userProgress[i.id]);
    persist();
    renderAll();
});

renderAll();

// --- Settings panel ---
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");

function setPanel(open) {
    settingsPanel.hidden = !open;
    settingsBtn.setAttribute("aria-expanded", String(open));
}
settingsBtn.addEventListener("click", () => setPanel(settingsPanel.hidden));
document.addEventListener("click", e => {
    if (!settingsPanel.hidden && !e.target.closest(".settings")) setPanel(false);
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !settingsPanel.hidden) { setPanel(false); settingsBtn.focus(); }
});

const systemLight = matchMedia("(prefers-color-scheme: light)");
function applyTheme() {
    const t = ui.theme;
    document.documentElement.dataset.theme = t === "system" ? (systemLight.matches ? "light" : "dark") : t;
    document.querySelectorAll("[data-theme-choice]").forEach(b => b.classList.toggle("active", b.dataset.themeChoice === t));
}
document.getElementById("theme-options").addEventListener("click", e => {
    const b = e.target.closest("[data-theme-choice]");
    if (!b) return;
    ui.theme = b.dataset.themeChoice;
    save(UI_KEY, ui);
    applyTheme();
});
systemLight.addEventListener("change", () => { if (ui.theme === "system") applyTheme(); });

const compactToggle = document.getElementById("compact-toggle");
function applyCompact() {
    document.body.classList.toggle("compact", ui.compact);
    compactToggle.checked = ui.compact;
}
compactToggle.addEventListener("change", () => { ui.compact = compactToggle.checked; save(UI_KEY, ui); applyCompact(); });

applyTheme();
applyCompact();

// --- Background: patterns, or a picture kept only in this browser (IndexedDB) ---
const bgLayerImg = document.querySelector("#bg-layer .bg-img");
const bgControls = document.getElementById("bg-image-controls");
const bgHint = document.getElementById("bg-hint");
let bgUrl = null;

function idb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open("d2-tracker", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("files");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
async function idbDo(mode, fn) {
    const db = await idb();
    return new Promise((resolve, reject) => {
        const req = fn(db.transaction("files", mode).objectStore("files"));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
const bgStore = {
    get: () => idbDo("readonly", s => s.get("background")),
    set: blob => idbDo("readwrite", s => s.put(blob, "background")),
    del: () => idbDo("readwrite", s => s.delete("background")),
};

function showBgImage(blob) {
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    bgUrl = blob ? URL.createObjectURL(blob) : null;
    bgLayerImg.style.backgroundImage = bgUrl ? `url("${bgUrl}")` : "none";
    document.getElementById("bg-clear").disabled = !bgUrl;
    bgHint.textContent = bgUrl ? "Saved only in this browser." : "No picture yet. Choose one from your device.";
}

function applyBg() {
    document.documentElement.dataset.bg = ui.bg;
    document.documentElement.style.setProperty("--bg-dim", String(ui.bgDim / 100));
    document.documentElement.style.setProperty("--bg-blur", `${ui.bgBlur}px`);
    document.querySelectorAll("[data-bg-choice]").forEach(b => b.classList.toggle("active", b.dataset.bgChoice === ui.bg));
    bgControls.hidden = ui.bg !== "image";
    document.getElementById("bg-dim").value = ui.bgDim;
    document.getElementById("bg-blur").value = ui.bgBlur;
}

// Shrink big photos so they stay light and sharp enough for a background.
async function prepareImage(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85));
}

document.getElementById("bg-options").addEventListener("click", e => {
    const b = e.target.closest("[data-bg-choice]");
    if (!b) return;
    ui.bg = b.dataset.bgChoice;
    save(UI_KEY, ui);
    applyBg();
});
const bgFile = document.getElementById("bg-file");
document.getElementById("bg-pick").addEventListener("click", () => bgFile.click());
bgFile.addEventListener("change", async () => {
    const file = bgFile.files[0];
    bgFile.value = "";
    if (!file) return;
    try {
        const blob = await prepareImage(file);
        await bgStore.set(blob);
        showBgImage(blob);
        ui.bg = "image";
        save(UI_KEY, ui);
        applyBg();
    } catch (err) {
        console.error(err);
        bgHint.textContent = "Couldn't use that file. Try a JPG or PNG.";
    }
});
document.getElementById("bg-clear").addEventListener("click", async () => {
    try { await bgStore.del(); } catch (err) { console.error(err); }
    showBgImage(null);
    if (ui.bg === "image") { ui.bg = "glow"; save(UI_KEY, ui); }
    applyBg();
});
for (const [id, key] of [["bg-dim", "bgDim"], ["bg-blur", "bgBlur"]]) {
    document.getElementById(id).addEventListener("input", e => {
        ui[key] = Number(e.target.value);
        save(UI_KEY, ui);
        applyBg();
    });
}
applyBg();
showBgImage(null);
bgStore.get().then(blob => { if (blob) showBgImage(blob); }).catch(() => {});

// --- Accounts (optional; the tracker works locally without signing in) ---
const authButtons = document.querySelectorAll("[data-auth]");
const cloudParts = document.querySelectorAll(".needs-cloud");
const headerSignIn = document.getElementById("header-signin");
const accountInfo = document.getElementById("account-info");

function renderAuth() {
    const signedIn = !!currentUser;
    authButtons.forEach(b => { b.textContent = signedIn ? "Log out" : (b === headerSignIn ? "Sign in" : "Sign in with Google"); b.disabled = false; });
    headerSignIn.hidden = signedIn;
    accountInfo.textContent = signedIn
        ? `Signed in as ${currentUser.displayName || currentUser.email}. Progress syncs across devices.`
        : "Not signed in. Progress is saved in this browser only.";
}

async function onUserChange(user) {
    currentUser = user;
    renderAuth();
    if (!user) { setSyncStatus(""); return; }
    setSyncStatus("Syncing...");
    try {
        // On sign-in, keep the higher rank per item from local and cloud.
        const cloud = await loadProgress(user.uid);
        const merged = { ...cloud };
        for (const [id, rank] of Object.entries(userProgress)) merged[id] = Math.max(rank, merged[id] || 0);
        userProgress = merged;
        save(STORAGE_KEY, userProgress);
        await saveProgress(user.uid, userProgress);
        setSyncStatus("Synced");
        renderAll();
    } catch (err) {
        console.error(err);
        setSyncStatus("Sync failed");
    }
}

if (cloudEnabled) {
    cloudParts.forEach(el => { el.hidden = false; });
    authButtons.forEach(b => b.addEventListener("click", async () => {
        authButtons.forEach(x => { x.disabled = true; });
        try { await (currentUser ? signOut() : signIn()); }
        catch (err) { console.error(err); }
        authButtons.forEach(x => { x.disabled = false; });
    }));
    initCloud(onUserChange).then(ok => { if (!ok) cloudParts.forEach(el => { el.hidden = true; }); });
}
