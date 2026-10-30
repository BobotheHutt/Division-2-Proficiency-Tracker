// Original category glyphs (drawn for this project). All share a 32x24 viewBox.
const poly = (cx, cy, r, n, rot = -90) =>
    Array.from({ length: n }, (_, i) => {
        const a = ((rot + (360 / n) * i) * Math.PI) / 180;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
const star = (cx, cy, ro, ri) =>
    Array.from({ length: 10 }, (_, i) => {
        const a = ((-90 + 36 * i) * Math.PI) / 180, r = i % 2 ? ri : ro;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

const FILL = {
    assaultRifles: `<path d="M1 8h6v8H4l-1 1H1z"/><rect x="7" y="8" width="15" height="5" rx="1"/><rect x="22" y="9" width="9" height="2"/><rect x="11" y="6" width="6" height="2"/><path d="M13 13h3l-1 8h-3zM8 13h3l-1 6H7z"/>`,
    smgs: `<path d="M2 9h5v3H2z"/><rect x="6" y="8" width="13" height="5" rx="1"/><rect x="19" y="9" width="7" height="2"/><rect x="9" y="6" width="5" height="2"/><rect x="13" y="13" width="3" height="9" rx=".5"/><path d="M7 13h3l-1 5H6z"/>`,
    lmgs: `<path d="M1 7h5v9H3l-2 1z"/><rect x="6" y="7" width="17" height="6" rx="1"/><rect x="23" y="8" width="8" height="2"/><rect x="10" y="5" width="8" height="2"/><rect x="11" y="13" width="9" height="6" rx="1"/><path d="M7 13h3l-1 5H6z"/><path d="M27 10l-3 10M27 10l3 10" stroke="currentColor" stroke-width="1.4" fill="none"/>`,
    rifles: `<path d="M1 12l9-3h8v4h-8l-3 3H5z"/><rect x="18" y="10" width="13" height="2"/><rect x="21" y="8" width="4" height="2"/><path d="M11 13h3l-1 5h-3z"/>`,
    marksmanRifles: `<path d="M1 12l9-3h8v4h-8l-3 3H5z"/><rect x="18" y="10" width="13" height="2"/><rect x="9" y="5" width="11" height="3" rx="1.5"/><path d="M12 8v1M17 8v1" stroke="currentColor" stroke-width="1.4"/><path d="M11 13h3l-1 5h-3z"/>`,
    shotguns: `<path d="M1 9l8-1v7H5z"/><rect x="9" y="8" width="6" height="6" rx="1"/><rect x="15" y="9" width="16" height="2"/><rect x="15" y="12" width="13" height="2"/><rect x="18" y="8" width="7" height="7" rx="1.5"/>`,
    pistols: `<rect x="5" y="6" width="22" height="6" rx="1"/><path d="M7 12h6l-1.5 9H6z"/><path d="M14 12h5v3a2 2 0 0 1-2 2h-1" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="26" y="7" width="3" height="2"/>`,
};

const LINE = {
    chemLauncher: `<path d="M12 3h8M13 3v6l-5.5 10a2 2 0 0 0 1.8 3h13.4a2 2 0 0 0 1.8-3L19 9V3"/><path d="M10 16h12"/>`,
    drone: `<circle cx="16" cy="12" r="3"/><path d="M13.5 10l-4-3M18.5 10l4-3M13.5 14l-4 3M18.5 14l4 3"/><circle cx="7.5" cy="5.5" r="3.5"/><circle cx="24.5" cy="5.5" r="3.5"/><circle cx="7.5" cy="18.5" r="3.5"/><circle cx="24.5" cy="18.5" r="3.5"/>`,
    firefly: `<ellipse cx="16" cy="13" rx="3" ry="5"/><path d="M13 11C9 4 4 5 5 9c.8 3 4 3 8 4zM19 11c4-7 9-6 8-2-.8 3-4 3-8 4z"/><circle cx="16" cy="20.5" r="1.4"/><path d="M14 7L12 3M18 7l2-4"/>`,
    hive: `<polygon points="${poly(10.5, 8, 4.8, 6, 0)}"/><polygon points="${poly(21.5, 8, 4.8, 6, 0)}"/><polygon points="${poly(16, 16.5, 4.8, 6, 0)}"/>`,
    mine: `<circle cx="16" cy="12" r="6"/><circle cx="16" cy="12" r="1.6"/><path d="M16 2v4M16 18v4M6 12h4M22 12h4M9 5l3 3M23 5l-3 3M9 19l3-3M23 19l-3-3"/>`,
    shield: `<path d="M16 2.5l9 3v7c0 5-4 8-9 9.5-5-1.5-9-4.5-9-9.5v-7z"/><path d="M16 7v11M11 11h10"/>`,
    turret: `<rect x="10" y="7" width="10" height="6" rx="1.5"/><path d="M20 9h9v2h-9zM15 13l-5 8M15 13l5 8M12 17.5h6"/>`,
    namedWeapons: `<circle cx="16" cy="12" r="7"/><circle cx="16" cy="12" r="1.5"/><path d="M16 2v5M16 17v5M6 12h5M21 12h5"/>`,
    exoticWeapons: `<circle cx="16" cy="12" r="7"/><circle cx="16" cy="12" r="1.5"/><path d="M16 2v5M16 17v5M6 12h5M21 12h5"/>`,
    namedGear: `<path d="M10 3l3 2h6l3-2 5 4-3 4v11H8V11L5 7z"/>`,
    exoticGear: `<path d="M10 3l3 2h6l3-2 5 4-3 4v11H8V11L5 7z"/>`,
    brands: `<path d="M6 12V6a1 1 0 0 1 1-1h6.5L26 17.5 18.5 25 6 12z" transform="translate(0 -1.5)"/><circle cx="10.5" cy="8.5" r="1.4"/>`,
    gearSets: `<polygon points="16,3 28,9 16,15 4,9"/><path d="M4 13l12 6 12-6M4 17l12 6 12-6"/>`,
};

export function glyph(tab, subKey) {
    const key = tab === "brands" || tab === "gearSets" ? tab : subKey;
    if (FILL[key]) return `<svg class="glyph" viewBox="0 0 32 24" fill="currentColor" aria-hidden="true">${FILL[key]}</svg>`;
    if (LINE[key]) return `<svg class="glyph" viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${LINE[key]}</svg>`;
    return "";
}
