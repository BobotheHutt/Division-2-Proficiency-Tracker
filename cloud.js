import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
export const cloudEnabled = !!firebaseConfig;

let auth, db, fb;

// Firebase is loaded lazily so a blocked CDN or bad config can't break the local tracker.
export async function initCloud(onUser) {
    if (!cloudEnabled) return false;
    try {
        const [app, a, f] = await Promise.all([
            import(`${SDK}/firebase-app.js`),
            import(`${SDK}/firebase-auth.js`),
            import(`${SDK}/firebase-database.js`),
        ]);
        fb = { ...a, ...f };
        const application = app.initializeApp(firebaseConfig);
        auth = a.getAuth(application);
        db = f.getDatabase(application);
        a.onAuthStateChanged(auth, onUser);
        return true;
    } catch (err) {
        console.error("Cloud sync unavailable:", err);
        return false;
    }
}

export const signIn = () => fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
export const signOut = () => fb.signOut(auth);

// Layout under users/{uid}:
//   progress, mainName       the "main" profile (kept at the original path so older saves still load)
//   profiles/{id}            other profiles: { name, progress, updatedAt }
//   deleted/{id}: true       profiles removed on another device, so they aren't re-uploaded
export async function loadProfiles(uid) {
    const snap = await fb.get(fb.ref(db, `users/${uid}`));
    const v = snap.exists() ? snap.val() : {};
    const profiles = { main: { name: v.mainName || "", progress: v.progress || {} } };
    for (const [id, a] of Object.entries(v.profiles || {})) profiles[id] = { name: a.name || "", progress: a.progress || {} };
    return { profiles, deleted: v.deleted || {} };
}

// Writes only this profile's own paths, so the other profiles are left alone.
export function saveProfile(uid, id, name, progress) {
    const now = Date.now();
    return id === "main"
        ? fb.update(fb.ref(db, `users/${uid}`), { progress, mainName: name, updatedAt: now })
        : fb.set(fb.ref(db, `users/${uid}/profiles/${id}`), { name, progress, updatedAt: now });
}

export const deleteProfile = (uid, id) =>
    fb.update(fb.ref(db, `users/${uid}`), { [`profiles/${id}`]: null, [`deleted/${id}`]: true });
