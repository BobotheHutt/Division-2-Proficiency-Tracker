import { assaultRifles } from "./data/weapons/assaultRifles.js";
import { smgs } from "./data/weapons/smgs.js";
import { lmgs } from "./data/weapons/lmgs.js";
import { rifles } from "./data/weapons/rifles.js";
import { marksmanRifles } from "./data/weapons/marksmanRifles.js";
import { shotguns } from "./data/weapons/shotguns.js";
import { pistols } from "./data/weapons/pistols.js";
import { namedGear } from "./data/namedExotic/namedGear.js";
import { exoticGear } from "./data/namedExotic/exoticGear.js";
import { chemLauncher } from "./data/skills/chemLauncher.js";
import { drone } from "./data/skills/drone.js";
import { firefly } from "./data/skills/firefly.js";
import { mine } from "./data/skills/mine.js";
import { shield } from "./data/skills/shield.js";
import { hive } from "./data/skills/hive.js";
import { turret } from "./data/skills/turret.js";
import { brands } from "./data/brands.js";
import { gearSets } from "./data/gearSets.js";

import { glyph, tabGlyph } from "./icons.js";
import { cloudEnabled, initCloud, signIn, signOut, loadProgress, saveProgress } from "./cloud.js";

const MAX_RANK = 10;
const STORAGE_KEY = "d2-proficiency-progress";
const UI_KEY = "d2-proficiency-ui";

const CATEGORIES = {
    weapons: { label: "Weapons", subs: {
        assaultRifles: { label: "Assault Rifles", items: assaultRifles },
        smgs: { label: "SMGs", items: smgs },
        lmgs: { label: "LMGs", items: lmgs },
        rifles: { label: "Rifles", items: rifles },
        marksmanRifles: { label: "Marksman Rifles", items: marksmanRifles },
        shotguns: { label: "Shotguns", items: shotguns },
        pistols: { label: "Pistols", items: pistols },
    }},
    namedExotic: { label: "Named & Exotic", subs: {
        namedGear: { label: "Named Gear", items: namedGear },
        exoticGear: { label: "Exotic Gear", items: exoticGear },
    }},
    skills: { label: "Skills", subs: {
        chemLauncher: { label: "Chem Launcher", items: chemLauncher },
        drone: { label: "Drone", items: drone },
        firefly: { label: "Firefly", items: firefly },
        hive: { label: "Hive", items: hive },
        mine: { label: "Seeker Mine", items: mine },
        shield: { label: "Ballistic Shield", items: shield },
        turret: { label: "Turret", items: turret },
    }},
    brands: { label: "Brands", subs: { all: { label: "All Brands", items: brands } } },
    gearSets: { label: "Gear Sets", subs: { all: { label: "All Gear Sets", items: gearSets } } },
};

function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// userProgress: { [itemId]: rank }
let userProgress = load(STORAGE_KEY, {});
const ui = Object.assign({ tab: "weapons", subs: {}, search: "", hideDone: false, theme: "dark", compact: false }, load(UI_KEY, {}));
if (!CATEGORIES[ui.tab]) ui.tab = "weapons";

// Color coding, in the spirit of the game: named and brands = gold, exotic = red, gear sets = green.
const TONES = { namedGear: "named", exoticGear: "exotic" };
const toneOf = (subKey, tab = ui.tab) => TONES[subKey] || (tab === "gearSets" ? "set" : tab === "brands" ? "brand" : "");

// Optional item icons: icons/manifest.json maps item id -> file name. Missing entries show no icon.
let iconManifest = {};
fetch("icons/manifest.json")
    .then(r => (r.ok ? r.json() : {}))
    .then(m => { iconManifest = m && typeof m === "object" ? m : {}; if (Object.keys(iconManifest).length) renderItems(); })
    .catch(() => {});

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

// Progress bar + count normally; a match count while searching (tabs without hits are dimmed).
function tabProgress(items) {
    if (query()) {
        const n = countVisible(items);
        return { cls: n ? "has-match" : "no-match",
                 html: `<span class="nav-match">${n ? `${n} ${n === 1 ? "match" : "matches"}` : "No matches"}</span>` };
    }
    const { done, total } = count(items);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { cls: "", html: `<span class="nav-bar"><i style="width:${pct}%"></i></span><span class="nav-count">${done}/${total}</span>` };
}

function renderTabs() {
    const nav = document.getElementById("main-tabs");
    nav.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => {
        const p = tabProgress(Object.values(cat.subs).flatMap(s => s.items));
        return `<button class="nav-tab ${key === ui.tab ? "active" : ""} ${p.cls}" data-tab="${key}">
            <span class="nav-icon">${tabGlyph(key)}</span>
            <span class="nav-text">
                <span class="nav-label">${cat.label}</span>
                <span class="nav-progress">${p.html}</span>
            </span>
        </button>`;
    }).join("");
}

function renderSubTabs() {
    const container = document.getElementById("sub-tabs-container");
    const subs = CATEGORIES[ui.tab].subs;
    if (Object.keys(subs).length < 2) { container.innerHTML = ""; return; }
    const active = activeSubKey();
    container.innerHTML = Object.entries(subs).map(([key, sub]) => {
        const p = tabProgress(sub.items);
        return `<button class="sub-tab ${key === active ? "active" : ""} ${p.cls}" data-sub="${key}" data-tone="${toneOf(key)}">
            <span class="nav-icon">${glyph(ui.tab, key)}</span>
            <span class="nav-text">
                <span class="nav-label">${sub.label}</span>
                <span class="nav-progress">${p.html}</span>
            </span>
        </button>`;
    }).join("");
}

function renderSummary() {
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    const { done, total } = count(sub.items);
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("summary-label").textContent = query()
        ? `${sub.label}: ${countVisible(sub.items)} of ${total} match "${ui.search.trim()}"`
        : `${sub.label}: ${done}/${total} proficient`;
    document.getElementById("summary-pct").textContent = `${pct}%`;
    document.getElementById("summary-bar").style.width = `${pct}%`;
}

function renderItems() {
    const grid = document.getElementById("items-grid");
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    const items = sub.items.filter(visible).sort((a, b) => a.name.localeCompare(b.name));

    if (!items.length) {
        const elsewhere = countVisible(Object.values(CATEGORIES).flatMap(c => Object.values(c.subs).flatMap(s => s.items)));
        grid.innerHTML = `<div class="empty">${query() || ui.hideDone
            ? `Nothing here matches.${elsewhere ? ` ${elsewhere} ${elsewhere === 1 ? "match is" : "matches are"} in the highlighted tabs.` : ""}`
            : "No items in this category yet."}</div>`;
        return;
    }

    const tone = toneOf(activeSubKey());
    const icon = glyph(ui.tab, activeSubKey());
    grid.innerHTML = items.map(item => {
        const rank = rankOf(item.id);
        const done = rank >= MAX_RANK;
        return `<div class="item-row ${done ? "done" : ""} ${item.named ? "named" : ""} ${item.exotic ? "exotic" : ""}" data-id="${esc(item.id)}" data-tone="${tone}">
            <label class="check"><input type="checkbox" class="proficient-checkbox" ${done ? "checked" : ""} aria-label="Proficient: ${esc(item.name)}"></label>
            ${iconManifest[item.id]
                ? `<span class="item-icon"><img src="icons/${encodeURIComponent(iconManifest[item.id])}" alt="" loading="lazy"></span>`
                : `<span class="item-icon">${icon}</span>`}
            <div class="item-info">
                <h3>${esc(item.name)}</h3>
            </div>
            <div class="rank-wrap">
                <input type="range" class="rank-slider" min="0" max="${MAX_RANK}" value="${rank}" style="--pct:${rank * 10}%" aria-label="Rank: ${esc(item.name)}">
                <span class="rank-value"><b>${rank}</b>/${MAX_RANK}</span>
            </div>
        </div>`;
    }).join("");
}

function renderAll() {
    renderTabs();
    renderSubTabs();
    renderSummary();
    renderItems();
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
    renderTabs();
    renderSubTabs();
    renderSummary();
}

document.addEventListener("click", e => {
    const tab = e.target.closest("[data-tab]");
    const sub = e.target.closest("[data-sub]");
    if (tab) { ui.tab = tab.dataset.tab; }
    else if (sub) { ui.subs[ui.tab] = sub.dataset.sub; }
    else return;
    save(UI_KEY, ui);
    renderAll();
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

// If the current category has no hits, jump to the first one that does (current tab's categories first).
function jumpToFirstMatch() {
    if (!query() || countVisible(CATEGORIES[ui.tab].subs[activeSubKey()].items)) return;
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
