// Firebase initialization for the web app
import { initializeApp, type FirebaseApp, getApps } from "firebase/app";
import { initializeFirestore, persistentLocalCache, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";

// Main Firebase config (EXCLUSIVELY for confessions channel)
const firebaseConfig = {
  apiKey: "AIzaSyC_w0kCvgpIjcjtk9JWZ9S-idl5lHzJGls",
  authDomain: "productioncloak-c935a.firebaseapp.com",
  projectId: "productioncloak-c935a",
  storageBucket: "productioncloak-c935a.firebasestorage.app",
  messagingSenderId: "6947337655",
  appId: "1:6947337655:web:601bdf8d38537af338a432",
  measurementId: "G-WGLWLHDWTC",
};

// Location channels Firebase config (separate project for location channels only)
const locationFirebaseConfig = {
  apiKey: "AIzaSyASlkh5i2osv0OXc3kfray4ZmGqEbcdRoc",
  authDomain: "location-channels.firebaseapp.com",
  projectId: "location-channels",
  storageBucket: "location-channels.firebasestorage.app",
  messagingSenderId: "629710240755",
  appId: "1:629710240755:web:406b3374534b16e5c3b086",
  measurementId: "G-WBDFSP0KL4",
};

// Support channel Firebase config (separate project for support channel only)
const supportFirebaseConfig = {
  apiKey: "AIzaSyBTv3OtRQ8qni1QgEHcdelKcelqANuZoPU",
  authDomain: "bits-cloak.firebaseapp.com",
  projectId: "bits-cloak",
  storageBucket: "bits-cloak.firebasestorage.app",
  messagingSenderId: "91495503277",
  appId: "1:91495503277:web:783fc9a7d71a11c6fcfd24",
  measurementId: "G-0NN4BVTDR0",
};

// General channel Firebase config (separate project for general channel only)
const generalFirebaseConfig = {
  apiKey: "AIzaSyD3ED_kR7WddTb2gT6LBCECPJ4_CY9YGpI",
  authDomain: "general-channel.firebaseapp.com",
  projectId: "general-channel",
  storageBucket: "general-channel.firebasestorage.app",
  messagingSenderId: "162778779189",
  appId: "1:162778779189:web:3cc371d89290a8bafa6b7c",
  measurementId: "G-24QPBV9ZJH",
};

// Initialize main Firebase app (EXCLUSIVELY for confessions channel)
// Also used for RTDB (username reservations) - DO NOT CHANGE
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize location Firebase app (with unique name to avoid conflicts)
export const locationApp: FirebaseApp = initializeApp(locationFirebaseConfig, "location-channels-app");

// Initialize support Firebase app (with unique name to avoid conflicts)
export const supportApp: FirebaseApp = initializeApp(supportFirebaseConfig, "support-channel-app");

// Initialize general Firebase app (with unique name to avoid conflicts)
export const generalApp: FirebaseApp = initializeApp(generalFirebaseConfig, "general-channel-app");

// Main Firestore (EXCLUSIVELY for confessions channel)
// Enable persistent local cache so returning users read from cache first
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache limit
  }),
});

// Location Firestore (for location channels only)
export const locationDb: Firestore = initializeFirestore(locationApp, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache limit
  }),
});

// Support Firestore (for support channel only)
export const supportDb: Firestore = initializeFirestore(supportApp, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache limit
  }),
});

// General Firestore (for general channel only)
export const generalDb: Firestore = initializeFirestore(generalApp, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache limit
  }),
});

// Realtime Database (for username reservations) - uses main app
export const rtdb: Database = getDatabase(app);

// Lightweight anonymous auth to work with secure RTDB rules - uses main app
export const auth: Auth = getAuth(app);
// Best-effort anonymous sign-in; ignore errors to avoid blocking UI
signInAnonymously(auth).catch(() => {});

// Location channels also need auth for security rules
export const locationAuth: Auth = getAuth(locationApp);
signInAnonymously(locationAuth).catch(() => {});

// Support channel also needs auth for security rules
export const supportAuth: Auth = getAuth(supportApp);
signInAnonymously(supportAuth).catch(() => {});

// General channel also needs auth for security rules
export const generalAuth: Auth = getAuth(generalApp);
signInAnonymously(generalAuth).catch(() => {});

/**
 * Determines which database a channel should use
 * - general: General database (general-channel) - COMPLETELY ISOLATED
 * - support: Support database (bits-cloak) - COMPLETELY ISOLATED
 * - confessions: Main database (productioncloak-c935a) - EXCLUSIVELY for confessions
 * - All other channels: Location database (location-channels)
 */
export function getFirestoreForChannel(channelId: string): Firestore {
  // CRITICAL: General channel MUST use general-channel database
  if (channelId === "general") {
    return generalDb; // Returns Firestore from general-channel project
  }
  
  // CRITICAL: Support channel MUST use bits-cloak database
  if (channelId === "support") {
    return supportDb; // Returns Firestore from bits-cloak project
  }
  
  // Location channels (food, lecture, digital, campus, mess categories)
  const nonLocationChannels = ["general", "confessions", "support"];
  if (!nonLocationChannels.includes(channelId)) {
    return locationDb;
  }
  
  // CRITICAL: Main database EXCLUSIVELY for confessions channel
  // Only "confessions" channel reaches this point
  return db; // Returns Firestore from productioncloak-c935a project (confessions only)
}

/**
 * Verification function to ensure Support channel is isolated from main database
 * Returns true if Support channel is correctly using bits-cloak database
 * and main database is correctly used by confessions channel
 */
export function verifySupportChannelIsolation(): boolean {
  // Verify by checking if the instances match the expected constants
  const supportDbInstance = getFirestoreForChannel("support");
  const confessionsDbInstance = getFirestoreForChannel("confessions");
  
  // Check if instances are the correct ones (comparing references)
  const isSupportUsingCorrectDb = supportDbInstance === supportDb;
  const isConfessionsUsingMainDb = confessionsDbInstance === db;
  
  // Use config values directly (they're the source of truth)
  const supportProjectId = supportFirebaseConfig.projectId;
  const mainProjectId = firebaseConfig.projectId;
  
  // Support should use bits-cloak, confessions should use productioncloak-c935a
  const isIsolated = isSupportUsingCorrectDb && isConfessionsUsingMainDb && 
                     supportProjectId === "bits-cloak" && 
                     mainProjectId === "productioncloak-c935a" &&
                     supportDbInstance !== confessionsDbInstance; // Ensure they're different
  
  // Only log errors if isolation fails (silent success)
  if (!isIsolated) {
    console.error("❌ SUPPORT CHANNEL ISOLATION CHECK FAILED!");
    console.error("Support DB instance match:", isSupportUsingCorrectDb, "(expected: true)");
    console.error("Confessions DB instance match:", isConfessionsUsingMainDb, "(expected: true)");
    console.error("Support and Confessions are different:", supportDbInstance !== confessionsDbInstance, "(expected: true)");
    console.error("Support project:", supportProjectId, "(expected: bits-cloak)");
    console.error("Main project:", mainProjectId, "(expected: productioncloak-c935a)");
  }
  
  return isIsolated;
}

/**
 * Returns the appropriate Auth instance based on channel type
 */
export function getAuthForChannel(channelId: string): Auth {
  if (channelId === "general") {
    return generalAuth;
  }
  
  if (channelId === "support") {
    return supportAuth;
  }
  
  // Location channels
  const nonLocationChannels = ["general", "confessions", "support"];
  if (!nonLocationChannels.includes(channelId)) {
    return locationAuth;
  }
  
  // Main database (EXCLUSIVELY for confessions channel)
  return auth;
}

/**
 * Helper function to determine if a channel is a location channel
 * (kept for backward compatibility if needed elsewhere)
 */
export function isLocationChannel(channelId: string): boolean {
  const nonLocationChannels = ["general", "confessions", "support"];
  return !nonLocationChannels.includes(channelId);
}


