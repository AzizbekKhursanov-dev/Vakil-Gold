import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4WHftt9nKeiftpYVLBXhpI8etKQCxk_k",
  authDomain: "tillo-savdosi.firebaseapp.com",
  projectId: "tillo-savdosi",
  storageBucket: "tillo-savdosi.firebasestorage.app",
  messagingSenderId: "233784125555",
  appId: "1:233784125555:web:6220277028af0a62162206",
  measurementId: "G-WF906BMGBQ",
}

// Initialize Firebase
let firebaseApp
let db
let auth
let storage
let functions

const isEmulator = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_EMULATOR === "true"
const isClient = typeof window !== "undefined"

try {
  // Initialize Firebase App
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

  // Initialize services
  db = getFirestore(firebaseApp)
  auth = getAuth(firebaseApp)
  storage = getStorage(firebaseApp)
  functions = getFunctions(firebaseApp)

  // Connect to emulators in development
  if (isEmulator && isClient) {
    // Check if already connected to avoid multiple connections
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
    }

    if (!db._delegate._databaseId.projectId.includes("localhost")) {
      connectFirestoreEmulator(db, "localhost", 8080)
    }

    if (!storage._delegate._host.includes("localhost")) {
      connectStorageEmulator(storage, "localhost", 9199)
    }

    if (!functions._delegate._url.includes("localhost")) {
      connectFunctionsEmulator(functions, "localhost", 5001)
    }

    console.log("🔥 Connected to Firebase Emulators")
  }

  // Enable offline persistence for Firestore (client-side only)
  if (isClient && !isEmulator) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
      } else if (err.code === "unimplemented") {
        console.warn("The current browser does not support all features required to enable persistence")
      } else {
        console.error("Failed to enable offline persistence:", err)
      }
    })
  }

  console.log(`✅ Firebase initialized successfully ${isEmulator ? "(Emulator Mode)" : "(Production Mode)"}`)
} catch (error) {
  console.error("❌ Error initializing Firebase:", error)
  throw error
}

// Export services
export { firebaseApp as default, db, auth, storage, functions }
export { db as firestore }

// Utility functions
export const isUsingEmulator = () => isEmulator
export const getEmulatorConfig = () => ({
  auth: "http://localhost:9099",
  firestore: "http://localhost:8080",
  functions: "http://localhost:5001",
  storage: "http://localhost:9199",
  ui: "http://localhost:4000",
})
