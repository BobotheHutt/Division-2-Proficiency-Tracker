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
    masks: `<path fill-rule="evenodd" d="M8 9C8 5.500 11.500 3.500 16 3.500S24 5.500 24 9V13C24 17.500 20.500 21 16 21S8 17.500 8 13ZM9.800 8.200a1 1 0 0 1 1-1H21.200a1 1 0 0 1 1 1V9.800a1 1 0 0 1-1 1H10.800a1 1 0 0 1-1-1ZM12 13.600a2.600 2.600 0 1 0 0 5.200a2.600 2.600 0 1 0 0-5.200ZM12 15.500a.7 .7 0 1 1 0 1.400a.7 .7 0 1 1 0-1.400ZM20 13.600a2.600 2.600 0 1 0 0 5.200a2.600 2.600 0 1 0 0-5.200ZM20 15.500a.7 .7 0 1 1 0 1.400a.7 .7 0 1 1 0-1.400Z"/>`,
    bodyArmor: `<path fill-rule="evenodd" d="M9 2.500H13.200V5.500C13.200 7 14.500 8 16 8S18.800 7 18.800 5.500V2.500H23V8.500L25 10V21.500H7V10L9 8.500ZM10.500 11.500H21.500V18.500H10.500ZM12 13H20V17H12Z"/>`,
    gloves: `<rect x="10" y="11.500" width="12" height="9" rx="3"/><rect x="10.200" y="3.500" width="2.800" height="9.500" rx="1.400"/><rect x="13.600" y="2" width="2.800" height="10.500" rx="1.400"/><rect x="17" y="2.500" width="2.800" height="10.200" rx="1.400"/><rect x="20.200" y="5" width="2.600" height="8.500" rx="1.300"/><path d="M10.500 17.500L6.200 12.800a1.500 1.500 0 0 1 2.200-2L12.500 14.500Z"/><rect x="10" y="21.800" width="12" height="2" rx=".8"/>`,
    holsters: `<path d="M9.500 3.500H18.500L20 6.500V12H9.500Z"/><path fill-rule="evenodd" d="M8 11H22L20.500 22H9.500ZM9 15.200H21V17.200H9Z"/>`,
    kneepads: `<path fill-rule="evenodd" d="M16 2.500C21.500 2.500 24 5.500 24 9.500C24 15.500 20.500 21.500 16 21.500S8 15.500 8 9.500C8 5.500 10.500 2.500 16 2.500ZM16 6a5 5 0 1 0 0 10a5 5 0 1 0 0-10ZM16 8.500a2.500 2.500 0 1 1 0 5a2.500 2.500 0 1 1 0-5Z"/><rect x="3.500" y="8.500" width="4" height="3.500" rx="1"/><rect x="24.500" y="8.500" width="4" height="3.500" rx="1"/>`,
    stickyBomb: `<path fill-rule="evenodd" d="M14 7a7.500 7.500 0 1 0 0 15a7.500 7.500 0 1 0 0-15ZM10.500 12.500a4 4 0 0 1 3.500-2.500v1.500a2.500 2.500 0 0 0-2.200 1.600Z"/><rect x="12.200" y="3.500" width="3.600" height="3" rx=".8"/><path d="M16 4.500C19 3 21 4 22 2.500" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linecap="round"/><polygon points="${star(25, 3.500, 3, 1.200)}"/>`,
    decoy: `<path d="M6 12.500V15.500C6 18.500 10.500 21 16 21S26 18.500 26 15.500V12.500Z"/><path fill-rule="evenodd" d="M16 6.500a10 5.500 0 1 0 0 11a10 5.500 0 1 0 0-11ZM16 9.300a5.800 3 0 1 0 0 6a5.800 3 0 1 0 0-6ZM16 11a2 1.200 0 1 1 0 2.400a2 1.200 0 1 1 0-2.400Z"/>`,
};

const LINE = {
    chemLauncher: `<path d="M12 3h8M13 3v6l-5.5 10a2 2 0 0 0 1.8 3h13.4a2 2 0 0 0 1.8-3L19 9V3"/><path d="M10 16h12"/>`,
    drone: `<circle cx="16" cy="12" r="3"/><path d="M13.5 10l-4-3M18.5 10l4-3M13.5 14l-4 3M18.5 14l4 3"/><circle cx="7.5" cy="5.5" r="3.5"/><circle cx="24.5" cy="5.5" r="3.5"/><circle cx="7.5" cy="18.5" r="3.5"/><circle cx="24.5" cy="18.5" r="3.5"/>`,
    firefly: `<ellipse cx="16" cy="13" rx="3" ry="5"/><path d="M13 11C9 4 4 5 5 9c.8 3 4 3 8 4zM19 11c4-7 9-6 8-2-.8 3-4 3-8 4z"/><circle cx="16" cy="20.5" r="1.4"/><path d="M14 7L12 3M18 7l2-4"/>`,
    hive: `<polygon points="${poly(10.5, 8, 4.8, 6, 0)}"/><polygon points="${poly(21.5, 8, 4.8, 6, 0)}"/><polygon points="${poly(16, 16.5, 4.8, 6, 0)}"/>`,
    turret: `<rect x="10" y="7" width="10" height="6" rx="1.5"/><path d="M20 9h9v2h-9zM15 13l-5 8M15 13l5 8M12 17.5h6"/>`,
    specialization: `<path d="M16 2.500l5 5-5 5-5-5z"/><path d="M16 12.500v4M16 16.500l-6 3.500M16 16.500l6 3.500"/><circle cx="10" cy="21" r="2"/><circle cx="22" cy="21" r="2"/>`,
    backpacks: `<rect x="9" y="6" width="14" height="16" rx="5"/><path d="M12.5 6V4.5a3.5 3.5 0 0 1 7 0V6M12 15h8v5h-8zM12 11.5h8"/>`,
    pulse: `<circle cx="16" cy="12" r="2"/><path d="M11.500 7.500a6.500 6.500 0 0 0 0 9M20.500 7.500a6.500 6.500 0 0 1 0 9M7.500 4.500a12 12 0 0 0 0 15M24.500 4.500a12 12 0 0 1 0 15"/>`,
    smartCover: `<path d="M5 20V8l6-3h10l6 3v12z"/><path d="M3 20h26M11 20v-8h10v8"/>`,
    brands: `<path d="M6 12V6a1 1 0 0 1 1-1h6.5L26 17.5 18.5 25 6 12z" transform="translate(0 -1.5)"/><circle cx="10.5" cy="8.5" r="1.4"/>`,
    gearSets: `<polygon points="16,3 28,9 16,15 4,9"/><path d="M4 13l12 6 12-6M4 17l12 6 12-6"/>`,
    trap: `<polygon points="${poly(16, 13, 8.500, 6)}"/><path d="M16 4.500L23.400 17.250H8.600Z"/><circle cx="22" cy="3.500" r="1.800"/><path d="M23.400 8.800L22.500 5.100"/>`,
    mine: `<circle cx="16" cy="12" r="8.500"/><ellipse cx="16" cy="12" rx="3.600" ry="8.500"/><circle cx="16" cy="12" r="1.200"/>`,
    shield: `<rect x="9" y="2.500" width="14" height="19" rx="3.500"/><rect x="11.800" y="6" width="8.400" height="3.500" rx="1"/><path d="M12 13.500h8M12 16.500h8"/>`,
};

// Weapon class icons are images in icons/class/. They're used as masks so they take the surrounding text color
// (light/dark theme, orange hover, named/exotic tint) like the drawn glyphs do.
const CLASS_IMG = new Set(["rifles", "assaultRifles", "marksmanRifles", "shotguns", "smgs", "lmgs", "pistols", "specialization"]);

export function glyph(tab, subKey) {
    if (tab === "weapons" && CLASS_IMG.has(subKey)) {
        return `<span class="glyph glyph-mask" style="--src:url('icons/class/${subKey}.png')" aria-hidden="true"></span>`;
    }
    const key = tab === "brands" || tab === "gearSets" ? tab : subKey;
    if (FILL[key]) return `<svg class="glyph" viewBox="0 0 32 24" fill="currentColor" aria-hidden="true">${FILL[key]}</svg>`;
    if (LINE[key]) return `<svg class="glyph" viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${LINE[key]}</svg>`;
    return "";
}

