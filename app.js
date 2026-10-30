// Master structure matching your requested categories and sub-types
const categorySchema = {
    "weapons": ["Assault Rifles", "SMGs", "LMGs", "Rifles", "Marksman Rifles", "Shotguns", "Pistols"],
    "armor": ["Masks", "Chests", "Backpacks", "Gloves", "Holsters", "Kneepads"],
    "named-exotic": ["Named Weapons", "Named Gear", "Exotic Weapons", "Exotic Gear"],
    "skills": ["Pulse", "Turret", "Hive", "Chem Launcher", "Drone", "Seeker Mine", "Shield", "Firefly", "Trap", "Sticky Bomb", "Decoy"],
    "brands": ["All Brands"],
    "gear-sets": ["All Gear Sets"]
};

// Global state trackers
let activeMainTab = "weapons";
let activeSubTab = "Assault Rifles";

// Initialize UI layout on boot
document.addEventListener("DOMContentLoaded", () => {
    setupTabListeners();
    renderSubTabs();
});

// Handles clicking the main top categories
function setupTabListeners() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.classList.remove("active", "border-b-2", "border-orange-500", "text-orange-500"));
            tabs.forEach(t => t.classList.add("text-zinc-400"));
            
            e.target.classList.add("active", "border-b-2", "border-orange-500", "text-orange-500");
            e.target.classList.remove("text-zinc-400");
            
            activeMainTab = e.target.getAttribute("data-target");
            activeSubTab = categorySchema[activeMainTab][0]; // Default to the first sub-category option
            
            renderSubTabs();
        });
    });
}

// Re-renders the secondary sub-category menu bar
function renderSubTabs() {
    const container = document.getElementById("sub-tabs-container");
    container.innerHTML = "";
    
    const subs = categorySchema[activeMainTab];
    subs.forEach(sub => {
        const btn = document.createElement("button");
        btn.textContent = sub;
        
        // Match active styling vs inactive styling
        if (sub === activeSubTab) {
            btn.className = "bg-orange-600 text-white px-3 py-1 text-xs font-bold uppercase rounded shadow";
        } else {
            btn.className = "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 px-3 py-1 text-xs font-bold uppercase rounded transition";
        }
        
        btn.addEventListener("click", () => {
            activeSubTab = sub;
            renderSubTabs(); // Refresh menu bar highlights
            renderItems();   // Trigger data grid generation
        });
        
        container.appendChild(btn);
    });
    
    renderItems();
}

// Data parser placeholder to inject the cards (We will populate the static databases next)
function renderItems() {
    const grid = document.getElementById("items-grid");
    grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
            <p class="font-mono text-sm">Ready to receive data matrix for: <span class="text-orange-400">${activeMainTab} ➔ ${activeSubTab}</span></p>
        </div>
    `;
}
