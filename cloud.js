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
            import(`${SDK}/firebase-firestore.js`),
        ]);
        fb = { ...a, ...f };
        const application = app.initializeApp(firebaseConfig);
        auth = a.getAuth(application);
        db = f.getFirestore(application);
        a.onAuthStateChanged(auth, onUser);
        return true;
    } catch (err) {
        console.error("Cloud sync unavailable:", err);
        return false;
    }
}

export const signIn = () => fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
export const signOut = () => fb.signOut(auth);

export async function loadProgress(uid) {
    const snap = await fb.getDoc(fb.doc(db, "users", uid));
    return snap.exists() ? snap.data().progress || {} : {};
}

export const saveProgress = (uid, progress) =>
    fb.setDoc(fb.doc(db, "users", uid), { progress, updatedAt: Date.now() });
