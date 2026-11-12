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
import { cloudEnabled, initCloud, signIn, signOut, loadProfiles, saveProfile, deleteProfile } from "./cloud.js";

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

// Profiles: separate progress for each game account (e.g. a main and an alt) under one sign-in.
// "main" keeps the original storage key so existing progress stays where it was.
const PROFILES_KEY = "d2-proficiency-profiles";
const progressKey = id => (id === "main" ? STORAGE_KEY : `${STORAGE_KEY}:${id}`);
let profiles = load(PROFILES_KEY, null);
if (!profiles?.list?.some(p => p.id === "main")) profiles = { active: "main", list: [{ id: "main", name: "Main" }, ...(profiles?.list || [])] };
if (!profiles.list.some(p => p.id === profiles.active)) profiles.active = "main";
const activeProfile = () => profiles.list.find(p => p.id === profiles.active);

// userProgress: { [itemId]: rank } for the active profile
let userProgress = load(progressKey(profiles.active), {});
const ui = Object.assign({ tab: "weapons", subs: {}, search: "", hideDone: false, theme: "dark", compact: false, navOpen: true, bg: "glow", bgDim: 55, bgBlur: 0, order: "game", sort: "name", mode: "tracker", planZero: false, planBest: false }, load(UI_KEY, {}));
if (!CATEGORIES[ui.tab]) ui.tab = "weapons";
ui.view = ui.mode === "planner" ? "plan" : "hub"; // start on the page you used last
ui.planSlot = null;

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

// The header shows the Google profile picture (email on hover); its dot shows sync state (green saved, orange busy, red failed).
function setSyncStatus(text) {
    const chip = document.getElementById("account-chip");
    chip.dataset.state = !text ? "" : /fail/i.test(text) ? "failed" : /saving|syncing/i.test(text) ? "busy" : "ok";
    chip.title = [currentUser?.email, text].filter(Boolean).join(" \u00b7 ");
}

let pendingSave = null;
async function flushSave() {
    clearTimeout(syncTimer);
    const job = pendingSave;
    pendingSave = null;
    if (!job || !currentUser) return;
    try { await saveProfile(currentUser.uid, job.id, job.name, job.progress); setSyncStatus("Synced"); }
    catch (err) { console.error(err); setSyncStatus("Sync failed"); }
}

function persist() {
    save(progressKey(profiles.active), userProgress);
    if (!currentUser) return;
    setSyncStatus("Saving...");
    pendingSave = { id: profiles.active, name: activeProfile().name, progress: { ...userProgress } };
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flushSave, 800);
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
    if (ui.view === "planlist") {
        const def = PLAN_POOLS[ui.planSlot];
        label.textContent = `${def.title}: ${inProgress(def.pool()).length} in progress`;
        return;
    }
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
const qualityOf = item => (item.exotic ? 2 : item.named ? 1 : 0);
const SORTS = {
    name: { label: "Name", cmp: (a, b) => byName(a, b) },
    quality: { label: "Quality", cmp: (a, b) => qualityOf(b) - qualityOf(a) || byName(a, b) },
    prof: { label: "Proficiency", cmp: (a, b) => rankOf(b.id) - rankOf(a.id) || byName(a, b) },
    inv: { label: "Inverse", title: "Inverse proficiency: lowest rank first", cmp: (a, b) => rankOf(a.id) - rankOf(b.id) || byName(a, b) },
};
// Quality only shows where the category has named or exotic items (not Specialization or skills).
const sortChoices = items => (items.some(i => i.named || i.exotic) ? ["name", "quality", "prof", "inv"] : ["name", "prof", "inv"]);
const activeSort = items => (sortChoices(items).includes(ui.sort) ? ui.sort : "name");

function renderListTools() {
    const el = document.getElementById("list-tools");
    if (ui.view === "planlist") {
        el.hidden = false;
        el.innerHTML = `<div class="order-switch">${planZeroToggle()}</div>`;
        return;
    }
    el.hidden = ui.view !== "list";
    if (el.hidden) { el.innerHTML = ""; return; }
    if (!isCollectionTab()) {
        const items = CATEGORIES[ui.tab].subs[activeSubKey()].items;
        const cur = activeSort(items);
        el.innerHTML = `<div class="order-switch"><span>Sort</span>
            <div class="segmented small" role="group" aria-label="Sort">
                ${sortChoices(items).map(k => `<button type="button" data-sort="${k}" class="${k === cur ? "active" : ""}"${SORTS[k].title ? ` title="${SORTS[k].title}"` : ""}>${SORTS[k].label}</button>`).join("")}
            </div></div>`;
        return;
    }
    el.innerHTML = `<div class="order-switch"><span>Order</span>
        <div class="segmented small" role="group" aria-label="Order">
            <button type="button" data-order="game" class="${ui.order === "game" ? "active" : ""}">Game</button>
            <button type="button" data-order="az" class="${ui.order === "az" ? "active" : ""}">A\u2013Z</button>
        </div></div>`;
}

const byName = (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);

// Rarity drives each item's color (border, icon, bar) on the Tracker and Planner, like the game:
// exotic red, named and high-end gold (named also get a gold name), gear sets green. Skills and
// specialization weapons have no rarity and keep their section's color.
function rarityOf(item, tab, sub) {
    if (item.exotic) return "exotic";
    if (item.named) return "named";
    if (tab === "gearSets") return "set";
    if (tab === "brands") return "brand";
    if (tab === "weapons" && sub !== "specialization") return "highend";
    return "";
}

// One list row (or card) for an item; also used by the Planner's progress list.
function itemMarkup(item, tab, sub, asCard, subLabel = "") {
    const rank = rankOf(item.id);
    const done = rank >= MAX_RANK;
    const isCollection = tab === "brands" || tab === "gearSets";
    const flags = `${done ? "done" : ""} ${item.named ? "named" : ""} ${item.exotic ? "exotic" : ""}`;
    const check = `<label class="check"><input type="checkbox" class="proficient-checkbox" ${done ? "checked" : ""} aria-label="Proficient: ${esc(item.name)}"></label>`;
    const badge = iconManifest[item.id]
        ? `<span class="item-icon"><img src="icons/${encodeURIComponent(iconManifest[item.id])}" alt="" loading="lazy"></span>`
        : `<span class="item-icon">${isCollection ? `<span class="monogram">${esc(monogram(item.name))}</span>` : glyph(tab, sub)}</span>`;
    const slider = `<div class="rank-wrap">
            <input type="range" class="rank-slider" min="0" max="${MAX_RANK}" value="${rank}" style="--pct:${rank * 10}%" aria-label="Rank: ${esc(item.name)}">
            <span class="rank-value"><b>${rank}</b>/${MAX_RANK}</span>
        </div>`;
    if (asCard) {
        return `<div class="item-row item-card ${flags}" data-id="${esc(item.id)}" data-tone="${toneOf(tab)}" data-rarity="${rarityOf(item, tab, sub)}">
        <div class="card-top">${check}${badge}<h3>${esc(item.name)}</h3></div>
        ${slider}
    </div>`;
    }
    return `<div class="item-row ${flags}" data-id="${esc(item.id)}" data-tone="${toneOf(tab)}" data-rarity="${rarityOf(item, tab, sub)}">
        ${check}${badge}
        <div class="item-info"><h3>${esc(item.name)}</h3>${subLabel ? `<span class="item-sub">${esc(subLabel)}</span>` : ""}</div>
        ${slider}
    </div>`;
}

function renderItems() {
    const grid = document.getElementById("items-grid");
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    const isCollection = isCollectionTab();
    grid.classList.toggle("cards", isCollection);
    const shown = sub.items.filter(visible);
    // Brands and gear sets can follow the game's order or go A-Z; everything else uses the chosen sort.
    const items = isCollection ? (ui.order === "game" ? shown : shown.sort(byName)) : shown.sort(SORTS[activeSort(sub.items)].cmp);

    if (!items.length) {
        const elsewhere = countVisible(allItems());
        grid.innerHTML = `<div class="empty">${query() || ui.hideDone
            ? `Nothing here matches.${elsewhere ? ` ${elsewhere} ${elsewhere === 1 ? "match is" : "matches are"} in the highlighted categories.` : ""}`
            : "No items here yet."}</div>`;
        return;
    }
    grid.innerHTML = items.map(item => itemMarkup(item, ui.tab, activeSubKey(), isCollection)).join("");
}

// --- Planner: the item closest to proficiency for each slot, laid out like the in-game gear screen ---
const planIndex = new Map(); // item id -> { tab, sub }
for (const [tab, cat] of Object.entries(CATEGORIES))
    for (const [sub, s] of Object.entries(cat.subs))
        for (const item of s.items) planIndex.set(item.id, { tab, sub });

const poolOf = (tab, subs) => subs.flatMap(s => CATEGORIES[tab].subs[s].items);
const PLAN_POOLS = {
    spec: { title: "Specialization weapons", sec: "weapons", pool: () => poolOf("weapons", ["specialization"]) },
    weapons: { title: "Primary & secondary weapons", sec: "weapons", pool: () => poolOf("weapons", ["rifles", "assaultRifles", "marksmanRifles", "shotguns", "smgs", "lmgs"]) },
    sidearm: { title: "Sidearms", sec: "weapons", pool: () => poolOf("weapons", ["pistols"]) },
    masks: { title: "Masks", sec: "gear", pool: () => poolOf("namedExotic", ["masks"]) },
    backpacks: { title: "Backpacks", sec: "gear", pool: () => poolOf("namedExotic", ["backpacks"]) },
    bodyArmor: { title: "Body armor", sec: "gear", pool: () => poolOf("namedExotic", ["bodyArmor"]) },
    gloves: { title: "Gloves", sec: "gear", pool: () => poolOf("namedExotic", ["gloves"]) },
    holsters: { title: "Holsters", sec: "gear", pool: () => poolOf("namedExotic", ["holsters"]) },
    kneepads: { title: "Kneepads", sec: "gear", pool: () => poolOf("namedExotic", ["kneepads"]) },
    brands: { title: "Brands", sec: "collections", pool: () => CATEGORIES.brands.subs.all.items },
    gearSets: { title: "Gear sets", sec: "collections", pool: () => CATEGORIES.gearSets.subs.all.items },
    skills: { title: "Skills", sec: "skills", pool: () => Object.values(CATEGORIES.skills.subs).flatMap(s => s.items) },
};
// n = 0 closest, 1 second closest. null = an empty cell that keeps the in-game layout.
const PLAN = [
    { title: "Weapons", sec: "weapons", slots: [
        { label: "Specialization", pool: "spec", n: 0, icon: ["weapons", "specialization"] }, null, null,
        { label: "Primary", pool: "weapons", n: 0, icon: ["weapons", "assaultRifles"] },
        { label: "Secondary", pool: "weapons", n: 1, icon: ["weapons", "smgs"] },
        { label: "Sidearm", pool: "sidearm", n: 0, icon: ["weapons", "pistols"] },
    ] },
    { title: "Gear", sec: "gear", slots: [
        { label: "Mask", pool: "masks", n: 0, icon: ["namedExotic", "masks"] },
        { label: "Backpack", pool: "backpacks", n: 0, icon: ["namedExotic", "backpacks"] },
        { label: "Brand", pool: "brands", n: 0, sec: "collections", icon: ["brands", "all"] },
        { label: "Body Armor", pool: "bodyArmor", n: 0, icon: ["namedExotic", "bodyArmor"] },
        { label: "Gloves", pool: "gloves", n: 0, icon: ["namedExotic", "gloves"] },
        { label: "Gear Set", pool: "gearSets", n: 0, sec: "collections", icon: ["gearSets", "all"] },
        { label: "Holster", pool: "holsters", n: 0, icon: ["namedExotic", "holsters"] },
        { label: "Kneepads", pool: "kneepads", n: 0, icon: ["namedExotic", "kneepads"] },
    ] },
    { title: "Skills", sec: "skills", slots: [
        { label: "Skill 1", pool: "skills", n: 0, icon: ["skills", "drone"] },
        { label: "Skill 2", pool: "skills", n: 1, icon: ["skills", "drone"] },
    ] },
];

const PLAN_SHOW_SUB = new Set(["weapons", "skills"]); // pools whose items come from several categories

// Items with some progress (rank 1-9), highest rank first; optionally also ones at 0/10. Proficient items drop out.
const inProgress = pool => pool
    .filter(i => { const r = rankOf(i.id); return r < MAX_RANK && (ui.planZero || r > 0); })
    .sort((a, b) => rankOf(b.id) - rankOf(a.id) || byName(a, b));

// pick (Best loadout only): { item, pool, part, note } overrides what the slot shows.
function planCard(slot, pick = null) {
    if (!slot) return `<div class="plan-spacer" aria-hidden="true"></div>`;
    const poolKey = pick?.pool || slot.pool;
    const pool = PLAN_POOLS[poolKey].pool();
    const item = pick ? pick.item : inProgress(pool)[slot.n];
    const allDone = pool.length > 0 && pool.every(i => isDone(i.id));
    const where = item && planIndex.get(item.id);
    const collection = where && (where.tab === "brands" || where.tab === "gearSets");
    const icon = item
        ? (collection ? `<span class="monogram">${esc(monogram(item.name))}</span>` : glyph(where.tab, where.sub))
        : glyph(...slot.icon);
    const rank = item ? rankOf(item.id) : 0;
    const flag = item ? `${item.named ? "named" : ""} ${item.exotic ? "exotic" : ""}` : "";
    const name = item ? esc(item.name) : (allDone ? "All proficient" : "No progress yet");
    // Skills and weapons share names across categories (two different "Striker"s), so say which one this is.
    const what = pick?.part || (item && PLAN_SHOW_SUB.has(slot.pool) ? CATEGORIES[where.tab].subs[where.sub].label : "");
    const rarity = item ? rarityOf(item, where.tab, where.sub) : "";
    return `<button type="button" class="plan-card ${item ? "" : "empty"}" data-plan="${poolKey}"${slot.sec ? ` data-sec="${slot.sec}"` : ""}${rarity ? ` data-rarity="${rarity}"` : ""}>
        <span class="plan-icon">${icon}</span>
        <span class="plan-text">
            <span class="plan-slot">${slot.label}${what ? ` \u00b7 ${esc(what)}` : ""}</span>
            <span class="plan-name ${flag}">${name}</span>
            <span class="plan-meter"><span class="plan-bar"><i style="width:${rank * 10}%"></i></span><b>${item ? `${rank}/${MAX_RANK}` : "\u2013"}</b></span>
            ${pick?.note ? `<span class="plan-note">${esc(pick.note)}</span>` : ""}
        </span>
    </button>`;
}

// --- Best loadout: what you could actually equip at once, following the game's limits ---
// Goal: the highest total rank across the slots. A gear set or brand counts its rank once per piece it fills.
// Weapons: at most one exotic across Primary, Secondary and Sidearm (Specialization is separate).
// Gear: at most one exotic piece; the other slots take named pieces, or a gear set (4 pieces) / brand
// (3 pieces). The NinjaBike backpack lowers that to 3 set / 2 brand pieces, so it can win even when it
// isn't the closest exotic. Ties go: set, then brand, then named pieces, then having an exotic in.
// Skills: the two closest of different skill types.
const GEAR_SLOTS = ["masks", "backpacks", "bodyArmor", "gloves", "holsters", "kneepads"];
const GEAR_LABEL = { masks: "Mask", backpacks: "Backpack", bodyArmor: "Body Armor", gloves: "Gloves", holsters: "Holster", kneepads: "Kneepads" };
const NINJABIKE = "exg_ninjabike_messenger_backpack";
const byRank = (a, b) => rankOf(b.id) - rankOf(a.id) || byName(a, b);
const subOf = item => planIndex.get(item.id).sub;
const rankSum = items => items.reduce((t, i) => t + (i ? rankOf(i.id) : 0), 0);
const better = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };

function bestWeapons() {
    const prim = inProgress(PLAN_POOLS.weapons.pool());
    const side = inProgress(PLAN_POOLS.sidearm.pool());
    const plainPrim = prim.filter(i => !i.exotic);
    const plainSide = side.filter(i => !i.exotic);
    // Options: no exotic, the closest exotic primary-type weapon, or the closest exotic sidearm.
    const options = [{ primary: plainPrim[0], secondary: plainPrim[1], sidearm: plainSide[0], ex: 0 }];
    const exP = prim.find(i => i.exotic);
    const exS = side.find(i => i.exotic);
    if (exP) options.push({ primary: exP, secondary: plainPrim[0], sidearm: plainSide[0], ex: 1 });
    if (exS) options.push({ primary: plainPrim[0], secondary: plainPrim[1], sidearm: exS, ex: 1 });
    let best = null;
    for (const o of options) {
        o.key = [rankSum([o.primary, o.secondary, o.sidearm]), o.ex];
        if (!best || better(o.key, best.key)) best = o;
    }
    const note = (picked, normal) => (normal && normal !== picked && normal.exotic ? "Only 1 exotic weapon can be equipped" : "");
    return {
        Primary: { item: best.primary, note: note(best.primary, prim[0]) },
        Secondary: { item: best.secondary, note: note(best.secondary, prim[1]) },
        Sidearm: { item: best.sidearm, note: note(best.sidearm, side[0]) },
    };
}

// Best way to fill the gear slots around one exotic (or none).
function solveGear(lists, exotic) {
    const exSlot = exotic && GEAR_SLOTS.find(k => lists[k].includes(exotic));
    const free = GEAR_SLOTS.filter(k => k !== exSlot);
    const named = Object.fromEntries(free.map(k => [k, lists[k].find(i => !i.exotic)]));
    const ninja = exotic?.id === NINJABIKE;
    const need = { set: ninja ? 3 : 4, brand: ninja ? 2 : 3 };
    const sets = inProgress(PLAN_POOLS.gearSets.pool());
    const brands = inProgress(PLAN_POOLS.brands.pool());
    // Candidate groups: the closest set and the two closest brands (more never fit in 6 slots).
    const groups = [
        sets[0] && { key: "S", kind: "set", item: sets[0], need: need.set },
        brands[0] && { key: "B1", kind: "brand", item: brands[0], need: need.brand },
        brands[1] && { key: "B2", kind: "brand", item: brands[1], need: need.brand },
    ].filter(Boolean);
    const choices = ["N", ...groups.map(g => g.key)];
    const exRank = exotic ? rankOf(exotic.id) : 0;
    let best = null;
    const assign = new Array(free.length);
    (function walk(i) {
        if (i === free.length) {
            let score = exRank, setPieces = 0, brandPieces = 0;
            for (const g of groups) {
                const n = assign.filter(a => a === g.key).length;
                if (n && n !== g.need) return;
                score += n * rankOf(g.item.id);
                if (g.kind === "set") setPieces += n; else brandPieces += n;
            }
            free.forEach((k, j) => { if (assign[j] === "N" && named[k]) score += rankOf(named[k].id); });
            const key = [score, setPieces, brandPieces, exotic ? 1 : 0];
            if (!best || better(key, best.key)) best = { key, assign: [...assign] };
            return;
        }
        for (const c of choices) { assign[i] = c; walk(i + 1); }
    })(0);
    return { key: best.key, exotic, exSlot, ninja, free, named, groups, assign: best.assign };
}

function bestGear() {
    const lists = Object.fromEntries(GEAR_SLOTS.map(k => [k, inProgress(PLAN_POOLS[k].pool())]));
    // Try no exotic, the closest exotic in each slot, and the NinjaBike backpack (its set/brand bonus can win).
    const tries = [null, ...GEAR_SLOTS.map(k => lists[k].find(i => i.exotic)), lists.backpacks.find(i => i.id === NINJABIKE)];
    let best = null;
    for (const ex of new Set(tries)) {
        if (ex === undefined) continue;
        const r = solveGear(lists, ex);
        if (!best || better(r.key, best.key)) best = r;
    }
    const out = {};
    if (best.exSlot) out[GEAR_LABEL[best.exSlot]] = { item: best.exotic, note: best.ninja ? "Sets need 3 pieces, brands 2" : "" };
    best.free.forEach((k, j) => {
        const g = best.groups.find(x => x.key === best.assign[j]);
        if (g) { out[GEAR_LABEL[k]] = { item: g.item, pool: g.kind === "set" ? "gearSets" : "brands", part: g.kind === "set" ? "Gear set" : "Brand" }; return; }
        const normal = lists[k][0];
        out[GEAR_LABEL[k]] = { item: best.named[k], note: normal && normal.exotic && normal !== best.named[k] ? "Only 1 exotic gear piece can be equipped" : "" };
    });
    return out;
}

function bestLoadout() {
    const skills = inProgress(PLAN_POOLS.skills.pool());
    const s1 = skills[0];
    const s2 = s1 && skills.find(i => subOf(i) !== subOf(s1));
    return {
        ...bestWeapons(),
        ...bestGear(),
        "Skill 1": { item: s1 },
        "Skill 2": { item: s2, note: skills[1] && skills[1] !== s2 && s1 && subOf(skills[1]) === subOf(s1) ? "Must be a different skill type" : "" },
    };
}

const planZeroToggle = () => `<label class="chip-toggle" data-tip="Also show items you haven't started yet"><input type="checkbox" data-plan-zero ${ui.planZero ? "checked" : ""}><span>Include 0/10</span></label>`;
const planBestToggle = () => `<label class="chip-toggle" data-tip="The build you can wear at once with the highest total proficiency. Up to 1 exotic weapon and 1 exotic gear piece, 2 different skill types, and gear sets or brands where they add up to more."><input type="checkbox" data-plan-best ${ui.planBest ? "checked" : ""}><span>Best loadout</span></label>`;

function renderPlanner() {
    const loadout = ui.planBest ? bestLoadout() : null;
    document.getElementById("planner").innerHTML =
        `<div class="plan-tools"><div class="plan-toggles">${planBestToggle()}${planZeroToggle()}</div></div>` +
        PLAN.map(s => `<section class="hub-section plan-section" data-sec="${s.sec}">
            <h2>${s.title}</h2>
            <div class="plan-grid">${s.slots.map(slot => {
                if (!loadout || !slot || slot.pool === "spec") return planCard(slot);
                // Brand and Gear Set are part of the build in this mode, not slots of their own.
                if (slot.pool === "brands" || slot.pool === "gearSets") return planCard(null);
                return planCard(slot, loadout[slot.label]);
            }).join("")}</div>
        </section>`).join("");
}

function renderPlanList() {
    const grid = document.getElementById("items-grid");
    grid.classList.remove("cards");
    const items = inProgress(PLAN_POOLS[ui.planSlot].pool());
    if (!items.length) {
        grid.innerHTML = `<div class="empty">${ui.planZero ? "Everything here is already proficient." : "Nothing in progress here yet. Give an item a rank above 0 in the Tracker, or turn on Include 0/10."}</div>`;
        return;
    }
    const showSub = PLAN_SHOW_SUB.has(ui.planSlot);
    grid.innerHTML = items.map(item => {
        const o = planIndex.get(item.id);
        return itemMarkup(item, o.tab, o.sub, false, showSub ? CATEGORIES[o.tab].subs[o.sub].label : "");
    }).join("");
}

function renderAll() {
    const v = ui.view; // hub | list (Tracker)  plan | planlist (Planner)
    const planner = v === "plan" || v === "planlist";
    const listish = v === "list" || v === "planlist";
    document.body.classList.toggle("view-hub", v === "hub");
    document.body.classList.toggle("view-plan", v === "plan");
    document.body.classList.toggle("view-planlist", v === "planlist");
    document.getElementById("hub").hidden = v !== "hub";
    document.getElementById("planner").hidden = v !== "plan";
    document.getElementById("list-view").hidden = !listish;
    document.getElementById("list-nav").hidden = v !== "list";
    document.getElementById("list-tools").hidden = true;
    document.getElementById("back-btn").hidden = !listish;
    document.getElementById("back-label").textContent = v === "planlist" ? "Planner" : "Home";
    document.querySelector(".controls").hidden = v === "plan";
    document.querySelectorAll("#mode-switch [data-mode]").forEach(b =>
        b.classList.toggle("active", b.dataset.mode === (planner ? "planner" : "tracker")));
    // The working area takes the section's color.
    const sec = v === "list" ? groupOf(ui.tab).key : v === "planlist" ? PLAN_POOLS[ui.planSlot].sec : null;
    for (const id of ["list-nav", "list-view"]) {
        const el = document.getElementById(id);
        if (sec) el.dataset.sec = sec; else el.removeAttribute("data-sec");
    }
    const controls = document.querySelector(".controls");
    if (sec) controls.dataset.sec = sec; else controls.removeAttribute("data-sec");
    document.body.classList.toggle("collection", v === "list" && isCollectionTab());
    renderSummary();
    if (v === "hub") renderHub();
    else if (v === "plan") renderPlanner();
    else if (v === "planlist") { renderListTools(); renderPlanList(); }
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
    if (ui.view === "list") renderListNav();
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
function openPlanList(key) {
    if (!PLAN_POOLS[key]) return;
    ui.planSlot = key;
    ui.view = "planlist";
    history.pushState({ v: "planlist", k: key }, "");
    renderAll();
    window.scrollTo(0, 0);
}
function goHome() {
    if (history.state?.v === "list" || history.state?.v === "planlist") { history.back(); return; }
    ui.view = ui.mode === "planner" ? "plan" : "hub";
    renderAll();
}
window.addEventListener("popstate", e => {
    const s = e.state;
    if (s?.v === "list") ui.view = "list";
    else if (s?.v === "planlist" && PLAN_POOLS[s.k]) { ui.view = "planlist"; ui.planSlot = s.k; }
    else ui.view = ui.mode === "planner" ? "plan" : "hub";
    renderAll();
});

// Tracker <-> Planner
document.getElementById("mode-switch").addEventListener("click", e => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    if (history.state?.v) history.replaceState(null, "");
    ui.mode = b.dataset.mode;
    ui.view = ui.mode === "planner" ? "plan" : "hub";
    ui.planSlot = null;
    save(UI_KEY, ui);
    renderAll();
    window.scrollTo(0, 0);
});

document.addEventListener("change", e => {
    if (e.target.matches("[data-plan-best]")) { ui.planBest = e.target.checked; save(UI_KEY, ui); renderAll(); return; }
    if (!e.target.matches("[data-plan-zero]")) return;
    ui.planZero = e.target.checked;
    save(UI_KEY, ui);
    renderAll();
});

document.addEventListener("click", e => {
    const srt = e.target.closest("[data-sort]");
    if (srt) {
        ui.sort = srt.dataset.sort;
        save(UI_KEY, ui);
        renderListTools();
        renderItems();
        return;
    }
    const ord = e.target.closest("[data-order]");
    if (ord) {
        ui.order = ord.dataset.order;
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
    const plan = e.target.closest("[data-plan]");
    if (plan) { openPlanList(plan.dataset.plan); return; }
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
    if (ui.view === "list" && ui.hideDone && isDone(row.dataset.id)) renderItems();
});
grid.addEventListener("change", e => {
    const row = e.target.closest(".item-row");
    if (!row) return;
    const isBox = e.target.classList.contains("proficient-checkbox");
    if (isBox) {
        setRank(row.dataset.id, e.target.checked ? MAX_RANK : 0);
        refreshRow(row);
    } else if (!e.target.classList.contains("rank-slider")) return;
    // In the Planner's list, finished (or reset) items leave once you let go.
    if (ui.view === "planlist") { renderSummary(); renderPlanList(); return; }
    if (isBox && ui.hideDone) renderItems();
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
    a.download = `division2-progress-${activeProfile().name.replace(/[^\w-]+/g, "_")}.json`;
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

// --- Profiles: quick switcher next to the Google email, full management in a popup from Settings ---
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");
const profilesDialog = document.getElementById("profiles-dialog");
const profilesList = document.getElementById("profiles-list");
const addForm = document.getElementById("profile-add-form");
const addName = document.getElementById("profile-add-name");
let renaming = null; // id of the profile being renamed in the popup
let menuAdding = false; // the dropdown's "Add profile" turned into a name field

const NAME_MAX = 24;
const cleanName = n => String(n || "").trim().slice(0, NAME_MAX);
const newProfileId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const profileById = id => profiles.list.find(p => p.id === id);
const progressOf = id => (id === profiles.active ? { ...userProgress } : load(progressKey(id), {}));

// Push one profile to the cloud (the active one goes through the normal debounced save).
function syncProfile(id) {
    if (!currentUser) return;
    if (id === profiles.active) { persist(); return; }
    const p = profileById(id);
    setSyncStatus("Saving...");
    saveProfile(currentUser.uid, id, p.name, progressOf(id))
        .then(() => setSyncStatus("Synced"))
        .catch(err => { console.error(err); setSyncStatus("Sync failed"); });
}

function renderProfiles() {
    document.getElementById("profile-name").textContent = activeProfile().name;
    document.getElementById("settings-profile").textContent = activeProfile().name;
    profileMenu.innerHTML = `<div class="menu-title">Profiles</div>
        ${profiles.list.map(p => `<button type="button" role="menuitemradio" aria-checked="${p.id === profiles.active}" class="menu-item ${p.id === profiles.active ? "active" : ""}" data-profile="${esc(p.id)}">
            <span class="menu-check" aria-hidden="true">${p.id === profiles.active ? "✓" : ""}</span>${esc(p.name)}</button>`).join("")}
        <div class="menu-sep"></div>
        ${menuAdding
            ? `<form class="menu-add" id="menu-add-form">
                   <input type="text" class="text-input" maxlength="${NAME_MAX}" placeholder="Profile name" aria-label="New profile name" required>
                   <button type="submit" class="btn small primary">Add</button>
               </form>`
            : `<button type="button" role="menuitem" class="menu-item" data-profile-action="add"><span class="menu-check" aria-hidden="true">+</span>Add profile</button>`}`;
    if (menuAdding) profileMenu.querySelector("input").focus();
    if (profilesDialog.open) renderProfilesDialog();
}

function renderProfilesDialog() {
    profilesList.innerHTML = profiles.list.map(p => {
        const on = p.id === profiles.active;
        const done = Object.values(progressOf(p.id)).filter(r => r >= MAX_RANK).length;
        const name = renaming === p.id
            ? `<form class="rename-form" data-rename-form="${esc(p.id)}">
                   <input type="text" class="text-input" maxlength="${NAME_MAX}" value="${esc(p.name)}" aria-label="New name for ${esc(p.name)}" required>
                   <button type="submit" class="btn small primary">Save</button>
                   <button type="button" class="btn small" data-pm="cancel">Cancel</button>
               </form>`
            : `<div class="profile-name-line"><b>${esc(p.name)}</b>${on ? `<span class="tag">Active</span>` : ""}<span class="muted tiny">${done} proficient</span></div>`;
        return `<li class="profile-row ${on ? "active" : ""}" data-id="${esc(p.id)}">
            ${name}
            ${renaming === p.id ? "" : `<div class="profile-actions">
                ${on ? "" : `<button type="button" class="btn small" data-pm="use">Switch</button>`}
                <button type="button" class="btn small" data-pm="rename">Rename</button>
                <button type="button" class="btn small" data-pm="duplicate">Duplicate</button>
                ${p.id === "main" ? "" : `<button type="button" class="btn small danger" data-pm="delete">Delete</button>`}
            </div>`}
        </li>`;
    }).join("");
    const input = profilesList.querySelector(".rename-form input");
    if (input) { input.focus(); input.select(); }
}

function openProfilesDialog() {
    setPanel(false);
    setProfileMenu(false);
    renaming = null;
    renderProfilesDialog();
    profilesDialog.showModal();
}

function setProfileMenu(open) {
    if (!open && menuAdding) { menuAdding = false; renderProfiles(); }
    profileMenu.hidden = !open;
    profileBtn.setAttribute("aria-expanded", String(open));
}

async function switchProfile(id) {
    if (id === profiles.active || !profileById(id)) return;
    await flushSave();
    profiles.active = id;
    save(PROFILES_KEY, profiles);
    userProgress = load(progressKey(id), {});
    renderProfiles();
    renderAll();
}

function addProfile(name, progress = {}, after = null) {
    const id = newProfileId();
    const at = after ? profiles.list.findIndex(p => p.id === after) + 1 : profiles.list.length;
    profiles.list.splice(at, 0, { id, name });
    save(PROFILES_KEY, profiles);
    save(progressKey(id), progress);
    syncProfile(id);
    return id;
}

function renameProfile(id, name) {
    const p = profileById(id);
    if (!p || !name) return;
    p.name = name;
    save(PROFILES_KEY, profiles);
    syncProfile(id);
    renderProfiles();
}

function duplicateProfile(id) {
    const src = profileById(id);
    const name = cleanName(`${src.name} (copy)`);
    addProfile(name, progressOf(id), id);
    renderProfiles();
}

async function removeProfile(id) {
    const p = profileById(id);
    if (!p || id === "main") return;
    if (!confirm(`Delete the profile "${p.name}" and all of its progress? This can't be undone.`)) return;
    if (id === profiles.active) { pendingSave = null; clearTimeout(syncTimer); await switchProfile("main"); }
    if (pendingSave?.id === id) pendingSave = null;
    profiles.list = profiles.list.filter(x => x.id !== id);
    save(PROFILES_KEY, profiles);
    try { localStorage.removeItem(progressKey(id)); } catch { /* storage unavailable */ }
    if (currentUser) deleteProfile(currentUser.uid, id).catch(err => { console.error(err); setSyncStatus("Sync failed"); });
    renderProfiles();
}

profileBtn.addEventListener("click", () => setProfileMenu(profileMenu.hidden));
profileMenu.addEventListener("click", e => {
    const p = e.target.closest("[data-profile]");
    const a = e.target.closest("[data-profile-action]");
    if (!p && !a) return;
    if (a) { menuAdding = true; renderProfiles(); return; }
    setProfileMenu(false);
    switchProfile(p.dataset.profile);
});
// Adding from the dropdown switches straight to the new profile.
profileMenu.addEventListener("submit", e => {
    e.preventDefault();
    const name = cleanName(e.target.querySelector("input").value);
    if (!name) return;
    const id = addProfile(name);
    setProfileMenu(false);
    switchProfile(id);
});
document.addEventListener("click", e => {
    // composedPath, not closest: the menu re-renders on click, which detaches the clicked element.
    if (!profileMenu.hidden && !e.composedPath().some(el => el.classList?.contains("profile-select"))) setProfileMenu(false);
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !profileMenu.hidden) { setProfileMenu(false); profileBtn.focus(); }
});

document.getElementById("manage-profiles-btn").addEventListener("click", () => openProfilesDialog());
document.getElementById("profiles-close").addEventListener("click", () => profilesDialog.close());
profilesDialog.addEventListener("click", e => { if (e.target === profilesDialog) profilesDialog.close(); }); // click outside
profilesDialog.addEventListener("close", () => { renaming = null; addName.value = ""; });
// Esc while renaming only cancels the rename, not the whole popup.
profilesDialog.addEventListener("cancel", e => {
    if (renaming) { e.preventDefault(); renaming = null; renderProfilesDialog(); }
});

profilesList.addEventListener("click", e => {
    const b = e.target.closest("[data-pm]");
    if (!b) return;
    const id = b.closest(".profile-row").dataset.id;
    const act = b.dataset.pm;
    if (act === "use") switchProfile(id).then(renderProfilesDialog);
    else if (act === "rename") { renaming = id; renderProfilesDialog(); }
    else if (act === "cancel") { renaming = null; renderProfilesDialog(); }
    else if (act === "duplicate") duplicateProfile(id);
    else if (act === "delete") removeProfile(id);
});
profilesList.addEventListener("submit", e => {
    const f = e.target.closest("[data-rename-form]");
    if (!f) return;
    e.preventDefault();
    const name = cleanName(f.querySelector("input").value);
    renaming = null;
    if (name) renameProfile(f.dataset.renameForm, name);
    else renderProfilesDialog();
});
addForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = cleanName(addName.value);
    if (!name) { addName.focus(); return; }
    addName.value = "";
    addProfile(name);
    renderProfiles();
});
renderProfiles();

// --- Accounts (optional; the tracker works locally without signing in) ---
const authButtons = document.querySelectorAll("[data-auth]");
const cloudParts = document.querySelectorAll(".needs-cloud");
const headerSignIn = document.getElementById("header-signin");
const accountInfo = document.getElementById("account-info");

// Google profile picture in the header; falls back to the first letter of the email if there's no picture
// or it fails to load. no-referrer: Google's image host can refuse requests that carry another site's referrer.
function renderAvatar() {
    const box = document.getElementById("account-avatar");
    const chip = document.getElementById("account-chip");
    if (!currentUser) { box.innerHTML = ""; chip.removeAttribute("aria-label"); return; }
    const who = currentUser.email || currentUser.displayName || "";
    chip.setAttribute("aria-label", `Signed in as ${who}`);
    const initial = () => { box.textContent = (who.trim()[0] || "?"); };
    if (!currentUser.photoURL) { initial(); return; }
    const img = new Image();
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.onerror = initial;
    img.src = currentUser.photoURL;
    box.replaceChildren(img);
}

function renderAuth() {
    const signedIn = !!currentUser;
    authButtons.forEach(b => { b.textContent = signedIn ? "Log out" : (b === headerSignIn ? "Sign in" : "Sign in with Google"); b.disabled = false; });
    headerSignIn.hidden = signedIn;
    document.getElementById("account-chip").hidden = !signedIn;
    renderAvatar();
    accountInfo.textContent = signedIn
        ? `Signed in as ${currentUser.email}. Progress syncs across devices.`
        : "Not signed in. Progress is saved in this browser only.";
}

async function onUserChange(user) {
    currentUser = user;
    renderAuth();
    if (!user) { setSyncStatus(""); return; }
    setSyncStatus("Syncing...");
    try {
        // On sign-in, combine this browser's profiles with the cloud's: same profile -> keep the higher rank per item.
        // Cloud names win (renames on another device); profiles deleted elsewhere are dropped here too.
        const cloud = await loadProfiles(user.uid);
        const list = profiles.list.filter(p => !cloud.deleted[p.id]);
        for (const [id, c] of Object.entries(cloud.profiles)) {
            const p = list.find(x => x.id === id);
            if (p) { if (c.name) p.name = c.name; }
            else list.push({ id, name: c.name || "Profile" });
        }
        profiles.list = list;
        if (!list.some(p => p.id === profiles.active)) profiles.active = "main";
        for (const p of list) {
            const merged = { ...(cloud.profiles[p.id]?.progress || {}) };
            for (const [id, rank] of Object.entries(load(progressKey(p.id), {}))) merged[id] = Math.max(rank, merged[id] || 0);
            save(progressKey(p.id), merged);
            await saveProfile(user.uid, p.id, p.name, merged);
        }
        save(PROFILES_KEY, profiles);
        userProgress = load(progressKey(profiles.active), {});
        setSyncStatus("Synced");
        renderProfiles();
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
