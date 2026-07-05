// firebase-config.js

import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ── Firebase Config ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCqxT97xCnww9P8csG2xyDYrs6jOOLVC7o",
  authDomain:        "moksh-tours-and-travel-e29ab.firebaseapp.com",
  projectId:         "moksh-tours-and-travel-e29ab",
  storageBucket:     "moksh-tours-and-travel-e29ab.firebasestorage.app",
  messagingSenderId: "511906793574",
  appId:             "1:511906793574:web:c54d18ec742b294fa205a7",
  measurementId:     "G-FN4ND9C4TM"
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);

// ── Auth helpers ───────────────────────────────────────────────────────────────
export { auth };

export function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutAdmin() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Firestore helpers ──────────────────────────────────────────────────────────

/**
 * Save a document to a collection.
 * Automatically adds a `received` server timestamp.
 */
export async function saveDocument(collectionName, data) {
  const ref = collection(db, collectionName);
  return addDoc(ref, { ...data, received: serverTimestamp() });
}

/**
 * Fetch all documents from a collection.
 * By default, orders by `received` descending (newest first).
 * Pass orderField=null to skip ordering, or a different field/direction as needed.
 * Returns an array of objects including the Firestore `id`.
 */
export async function fetchCollection(collectionName, orderField = "received", direction = "desc") {
  try {
    const ref  = collection(db, collectionName);
    const q    = orderField ? query(ref, orderBy(orderField, direction)) : query(ref);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // If the collection doesn't exist yet, return empty array
    console.warn(`fetchCollection(${collectionName}):`, e.message);
    return [];
  }
}

/**
 * Upload an image file to Firebase Storage and return its public URL.
 */
export async function uploadRouteImage(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `routes/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Delete a single document by ID.
 */
export function deleteDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

/**
 * Update fields on an existing document by ID.
 */
export function updateDocument(collectionName, id, data) {
  return updateDoc(doc(db, collectionName, id), data);
}
