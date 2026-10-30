function renderItems() {
    const grid = document.getElementById("items-grid");
    
    // Kept in a single vertical stack
    grid.className = "max-w-2xl mx-auto space-y-2"; 
    grid.innerHTML = "";
    
    const currentItems = itemDatabase[activeSubTab] || [];
    
    if (currentItems.length === 0) {
        grid.innerHTML = `
            <div class="text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                <p class="font-mono text-sm">Data file initialized but empty for: <span class="text-orange-400">${activeSubTab}</span></p>
            </div>
        `;
        return;
    }

    // Sort items alphabetically
    const sortedItems = [...currentItems].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedItems.forEach(item => {
        if (!userProgress[item.id]) {
            userProgress[item.id] = { rank: 0 };
        }
        const state = userProgress[item.id];
        const isProficient = state.rank >= 10;

        const row = document.createElement("div");
        row.className = `flex items-center justify-between p-3 bg-zinc-900 border ${
            isProficient ? 'border-orange-500/40 bg-zinc-900' : 'border-zinc-800'
        } rounded transition duration-150 font-mono text-xs`;
        
        row.innerHTML = `
            <!-- Left Side: Interactive Controls Group -->
            <div class="flex items-center space-x-4 min-w-[180px]">
                <!-- Checkbox -->
                <input type="checkbox" ${isProficient ? 'checked' : ''} 
                    class="proficient-checkbox w-4 h-4 rounded border-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900 bg-zinc-950 accent-orange-500 cursor-pointer"
                    data-id="${item.id}">
                
                <!-- Rank Slider Only -->
                <div class="flex flex-col w-32">
                    <span class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Rank: <b class="text-orange-400 min-w-[14px] inline-block text-right">${state.rank}</b>/10</span>
                    <input type="range" min="0" max="10" value="${state.rank}" 
                        class="rank-slider w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        data-id="${item.id}">
                </div>
            </div>

            <!-- Right Side: Item Details Identification -->
            <div class="text-right pl-4">
                <h3 class="font-bold text-zinc-100 tracking-wide text-sm ${isProficient ? 'text-orange-400 line-through decoration-orange-500/20' : ''}">${item.name}</h3>
                <span class="text-[10px] text-zinc-500 uppercase tracking-widest">${item.variant}</span>
            </div>
        `;
        
        // 1. Slider Movement Logic
        row.querySelector('.rank-slider').addEventListener('input', (e) => {
            const currentVal = parseInt(e.target.value) || 0;
            updateItemState(e.target.dataset.id, 'rank', currentVal);
        });

        // 2. Checkbox Click Logic
        row.querySelector('.proficient-checkbox').addEventListener('change', (e) => {
            const targetRank = e.target.checked ? 10 : 0;
            updateItemState(e.target.dataset.id, 'rank', targetRank);
        });

        grid.appendChild(row);
    });
}
