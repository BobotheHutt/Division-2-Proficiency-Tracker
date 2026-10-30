// ==========================================
// 1. DATA IMPORTS (MATCHING FILE PATHS EXACTLY)
// ==========================================
import { backpacks } from './data/armor/backpacks.js';
import { chests } from './data/armor/chests.js';
import { gloves } from './data/armor/gloves.js';
import { holsters } from './data/armor/holsters.js';
import { kneepads } from './data/armor/kneepads.js';
import { masks } from './data/armor/masks.js';

import { exoticGear } from './data/namedExotic/exoticGear.js';
import { exoticWeapon } from './data/namedExotic/exoticWeapons.js';
import { namedGear } from './data/namedExotic/namedGear.js';
import { namedWeapon } from './data/namedExotic/namedWeapons.js';

import { chemLauncher } from './data/skills/chemLauncher.js';
import { cover } from './data/skills/cover.js';
import { drone } from './data/skills/drone.js';
import { firefly } from './data/skills/firefly.js';
import { mine } from './data/skills/mine.js';
import { shield } from './data/skills/shield.js';

import { assaultRifles } from './data/weapons/assaultRifles.js';
import { lmgs } from './data/weapons/lmgs.js';
import { marksmanRifles } from './data/weapons/marksmanRifles.js';
import { pistols } from './data/weapons/pistols.js';
import { rifles } from './data/weapons/rifles.js';
import { shotguns } from './data/weapons/shotguns.js';
import { smgs } from './data/weapons/smgs.js';

import { brands } from './data/brands.js';
import { gearSets } from './data/gearSets.js';

// ==========================================
// 2. MATRIX MAPPING TO TARGET FILES
// ==========================================
const itemDatabase = {
    // Weapons Sub-Tabs
    "Assault Rifles": assaultRifles, "SMGs": smgs, "LMGs": lmgs, "Rifles": rifles, "Marksman Rifles": marksmanRifles, "Shotguns": shotguns, "Pistols": pistols,
    // Armor Sub-Tabs
    "Masks": masks, "Chests": chests, "Backpacks": backpacks, "Gloves": gloves, "Holsters": holsters, "Kneepads": kneepads,
    // Named & Exotic Sub-Tabs
    "Named Weapons": namedWeapon, "Named Gear": namedGear, "Exotic Weapons": exoticWeapon, "Exotic Gear": exoticGear,
    // Skills Sub-Tabs
    "Chem Launcher": chemLauncher, "Smart Cover": cover, "Drone": drone, "Firefly": firefly, "Seeker Mine": mine, "Ballistic Shield": shield,
    // Base Groups
    "Brands": brands, "Gear Sets": gearSets
};

const categorySchema = {
    "weapons": ["Assault Rifles", "SMGs", "LMGs", "Rifles", "Marksman Rifles", "Shotguns", "Pistols"],
    "armor": ["Masks", "Chests", "Backpacks", "Gloves", "Holsters", "Kneepads"],
    "namedExotic": ["Named Weapons", "Named Gear", "Exotic Weapons", "Exotic Gear"],
    "skills": ["Chem Launcher", "Smart Cover", "Drone", "Firefly", "Seeker Mine", "Ballistic Shield"],
    "brands": ["Brands"],
    "gearSets": ["Gear Sets"]
};

// ==========================================
// 3. GLOBAL APP ENGINE & STATE
// ==========================================
let activeMainTab = "weapons";
let activeSubTab = "Assault Rifles";
let userProgress = JSON.parse(localStorage.getItem('shd_expertise_progress')) || {};

document.addEventListener("DOMContentLoaded", () => {
    setupTabListeners();
    renderSubTabs();
});

function setupTabListeners() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.className = "nav-tab px-4 py-2 text-sm font-bold uppercase text-zinc-400 hover:text-zinc-200 transition cursor-pointer");
            
            e.target.className = "nav-tab active px-4 py-2 text-sm font-bold uppercase border-b-2 border-orange-500 text-orange-500 transition cursor-pointer";
            
            activeMainTab = e.target.getAttribute("data-target");
            activeSubTab = categorySchema[activeMainTab][0]; 
            
            renderSubTabs();
        });
    });
}

function renderSubTabs() {
    const container = document.getElementById("sub-tabs-container");
    container.innerHTML = "";
    
    const subs = categorySchema[activeMainTab];
    subs.forEach(sub => {
        const btn = document.createElement("button");
        btn.textContent = sub;
        
        if (sub === activeSubTab) {
            btn.className = "bg-orange-600 text-white px-3 py-1 text-xs font-bold uppercase rounded shadow cursor-pointer";
        } else {
            btn.className = "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 px-3 py-1 text-xs font-bold uppercase rounded transition cursor-pointer";
        }
        
        btn.addEventListener("click", () => {
            activeSubTab = sub;
            renderSubTabs();
        });
        container.appendChild(btn);
    });
    
    renderItems();
}

// ==========================================
// 4. CARD RENDERING ENGINE
// ==========================================
function renderItems() {
    const grid = document.getElementById("items-grid");
    grid.innerHTML = "";
    
    const currentItems = itemDatabase[activeSubTab] || [];
    
    if (currentItems.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                <p class="font-mono text-sm">Data file initialized but empty for: <span class="text-orange-400">${activeSubTab}</span></p>
            </div>
        `;
        return;
    }
    
    currentItems.forEach(item => {
        if (!userProgress[item.id]) {
            userProgress[item.id] = { rank: 0, grade: 0 };
        }
        const state = userProgress[item.id];
        const isProficient = state.rank >= 10;

        const card = document.createElement("div");
        card.className = `p-4 rounded border relative overflow-hidden transition group ${
            isProficient ? 'bg-zinc-900 border-orange-500/50 shadow-md shadow-orange-950/20' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
        }`;
        
        card.innerHTML = `
            <div class="absolute top-0 left-0 w-1 h-full ${isProficient ? 'bg-orange-500' : 'bg-zinc-700'}"></div>
            
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-bold text-sm text-zinc-100 tracking-wide">${item.name}</h3>
                    <p class="text-[10px] text-zinc-500 uppercase tracking-wider">${item.variant}</p>
                </div>
                ${isProficient ? '<span class="text-[10px] bg-orange-500/10 text-orange-400 font-bold px-1.5 py-0.5 rounded border border-orange-500/20 tracking-widest uppercase">Proficient</span>' : ''}
            </div>
            
            <div class="space-y-2 mt-4 pt-3 border-t border-zinc-800/60 font-mono text-xs">
                <div class="flex items-center justify-between">
                    <span class="text-zinc-400 text-[11px]">Proficiency Rank:</span>
                    <div class="flex items-center space-x-1">
                        <input type="number" min="0" max="10" value="${state.rank}" 
                            class="rank-input w-10 bg-zinc-950 text-center font-bold border border-zinc-800 rounded py-0.5 text-orange-400 focus:outline-none focus:border-orange-500"
                            data-id="${item.id}">
                        <span class="text-zinc-600">/10</span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="text-zinc-400 text-[11px]">Expertise Grade:</span>
                    <input type="number" min="0" max="30" value="${state.grade}" 
                        class="grade-input w-10 bg-zinc-950 text-center font-bold border border-zinc-800 rounded py-0.5 text-zinc-300 focus:outline-none focus:border-orange-500"
                        data-id="${item.id}">
                </div>
            </div>
        `;
        
        card.querySelector('.rank-input').addEventListener('input', (e) => updateItemState(e.target.dataset.id, 'rank', e.target.value));
        card.querySelector('.grade-input').addEventListener('input', (e) => updateItemState(e.target.dataset.id, 'grade', e.target.value));
        
        grid.appendChild(card);
    });
}

function updateItemState(id, field, value) {
    let numValue = parseInt(value) || 0;
    if (field === 'rank' && numValue > 10) numValue = 10;
    if (field === 'grade' && numValue > 30) numValue = 30;
    if (numValue < 0) numValue = 0;

    userProgress[id][field] = numValue;
    localStorage.setItem('shd_expertise_progress', JSON.stringify(userProgress));
    
    if (field === 'rank') {
        renderItems();
    }
}
