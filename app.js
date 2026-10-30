import { assaultRifles } from "./data/weapons/assaultRifles.js";
import { smgs } from "./data/weapons/smgs.js";
import { lmgs } from "./data/weapons/lmgs.js";
import { rifles } from "./data/weapons/rifles.js";
import { marksmanRifles } from "./data/weapons/marksmanRifles.js";
import { shotguns } from "./data/weapons/shotguns.js";
import { pistols } from "./data/weapons/pistols.js";
import { masks } from "./data/armor/masks.js";
import { chests } from "./data/armor/chests.js";
import { backpacks } from "./data/armor/backpacks.js";
import { gloves } from "./data/armor/gloves.js";
import { holsters } from "./data/armor/holsters.js";
import { kneepads } from "./data/armor/kneepads.js";
import { namedWeapons } from "./data/namedExotic/namedWeapons.js";
import { namedGear } from "./data/namedExotic/namedGear.js";
import { exoticWeapons } from "./data/namedExotic/exoticWeapons.js";
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
    armor: { label: "Armor", subs: {
        masks: { label: "Masks", items: masks },
        chests: { label: "Chests", items: chests },
        backpacks: { label: "Backpacks", items: backpacks },
        gloves: { label: "Gloves", items: gloves },
        holsters: { label: "Holsters", items: holsters },
        kneepads: { label: "Kneepads", items: kneepads },
    }},
    namedExotic: { label: "Named & Exotic", subs: {
        namedWeapons: { label: "Named Weapons", items: namedWeapons },
        namedGear: { label: "Named Gear", items: namedGear },
        exoticWeapons: { label: "Exotic Weapons", items: exoticWeapons },
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
const ui = Object.assign({ tab: "weapons", subs: {}, search: "", hideDone: false }, load(UI_KEY, {}));
if (!CATEGORIES[ui.tab]) ui.tab = "weapons";

const rankOf = id => userProgress[id] || 0;
const isDone = id => rankOf(id) >= MAX_RANK;
const activeSubKey = () => {
    const subs = CATEGORIES[ui.tab].subs;
    return subs[ui.subs[ui.tab]] ? ui.subs[ui.tab] : Object.keys(subs)[0];
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const count = items => ({ done: items.filter(i => isDone(i.id)).length, total: items.length });

function setRank(id, rank) {
    if (rank > 0) userProgress[id] = rank; else delete userProgress[id];
    save(STORAGE_KEY, userProgress);
}

function renderTabs() {
    const nav = document.getElementById("main-tabs");
    nav.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => {
        const all = Object.values(cat.subs).flatMap(s => s.items);
        const { done, total } = count(all);
        return `<button class="nav-tab ${key === ui.tab ? "active" : ""}" data-tab="${key}">${cat.label}
            <span class="tab-count">${done}/${total}</span></button>`;
    }).join("");
}

function renderSubTabs() {
    const container = document.getElementById("sub-tabs-container");
    const subs = CATEGORIES[ui.tab].subs;
    if (Object.keys(subs).length < 2) { container.innerHTML = ""; return; }
    const active = activeSubKey();
    container.innerHTML = Object.entries(subs).map(([key, sub]) => {
        const { done, total } = count(sub.items);
        return `<button class="sub-tab ${key === active ? "active" : ""}" data-sub="${key}">${sub.label}
            <span class="tab-count">${done}/${total}</span></button>`;
    }).join("");
}

function renderSummary() {
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    const { done, total } = count(sub.items);
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("summary-label").textContent = `${sub.label}: ${done}/${total} proficient`;
    document.getElementById("summary-pct").textContent = `${pct}%`;
    document.getElementById("summary-bar").style.width = `${pct}%`;
}

function renderItems() {
    const grid = document.getElementById("items-grid");
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    const q = ui.search.trim().toLowerCase();

    const items = [...sub.items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(i => !q || i.name.toLowerCase().includes(q))
        .filter(i => !ui.hideDone || !isDone(i.id));

    if (!items.length) {
        grid.innerHTML = `<div class="empty">${q || ui.hideDone ? "Nothing matches the current filters." : "No items in this category yet."}</div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        const rank = rankOf(item.id);
        const done = rank >= MAX_RANK;
        return `<div class="item-row ${done ? "done" : ""}" data-id="${esc(item.id)}">
            <div class="item-controls">
                <input type="checkbox" class="proficient-checkbox" ${done ? "checked" : ""} aria-label="Proficient: ${esc(item.name)}">
                <div class="rank-wrap">
                    <span class="rank-label">Rank <b>${rank}</b>/${MAX_RANK}</span>
                    <input type="range" class="rank-slider" min="0" max="${MAX_RANK}" value="${rank}" aria-label="Rank: ${esc(item.name)}">
                </div>
            </div>
            <div class="item-info">
                <h3>${esc(item.name)}</h3>
                <span>${esc(item.variant || "")}</span>
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
    row.querySelector(".rank-label b").textContent = rank;
    row.querySelector(".rank-slider").value = rank;
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
searchBox.addEventListener("input", () => { ui.search = searchBox.value; save(UI_KEY, ui); renderItems(); });

const hideBox = document.getElementById("hide-done");
hideBox.checked = ui.hideDone;
hideBox.addEventListener("change", () => { ui.hideDone = hideBox.checked; save(UI_KEY, ui); renderItems(); });

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
        save(STORAGE_KEY, userProgress);
        renderAll();
    } catch {
        alert("Couldn't read that file. Use a JSON file exported from this tracker.");
    }
});

document.getElementById("reset-btn").addEventListener("click", () => {
    const sub = CATEGORIES[ui.tab].subs[activeSubKey()];
    if (!confirm(`Reset all ranks in "${sub.label}" to 0?`)) return;
    sub.items.forEach(i => delete userProgress[i.id]);
    save(STORAGE_KEY, userProgress);
    renderAll();
});

renderAll();
