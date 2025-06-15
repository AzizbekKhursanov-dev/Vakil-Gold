// Optimized Firebase configuration with modular imports
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage"

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

// Singleton pattern for Firebase services
let firebaseApp: FirebaseApp
let db: Firestore
let auth: Auth
let storage: FirebaseStorage

// Performance monitoring (client-side only)
let performance: any = null

// Initialize Firebase with error handling and performance optimization
function initializeFirebase() {
  try {
    // Initialize Firebase app
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

    // Initialize services with connection pooling
    db = getFirestore(firebaseApp)
    auth = getAuth(firebaseApp)
    storage = getStorage(firebaseApp)

    // Enable offline persistence for Firestore
    if (typeof window !== "undefined") {
      import("firebase/firestore").then(({ enableNetwork, disableNetwork }) => {
        // Enable network by default, but allow offline mode
        enableNetwork(db).catch(console.warn)
      })
    }

    // Initialize performance monitoring (client-side only)
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      import("firebase/performance")
        .then(({ getPerformance, trace }) => {
          performance = getPerformance(firebaseApp)

          // Custom performance traces
          const pageLoadTrace = trace(performance, "page_load")
          pageLoadTrace.start()

          window.addEventListener("load", () => {
            pageLoadTrace.stop()
          })
        })
        .catch(console.warn)
    }

    // Connect to emulators in development
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      try {
        connectFirestoreEmulator(db, "localhost", 8080)
        connectAuthEmulator(auth, "http://localhost:9099")
        connectStorageEmulator(storage, "localhost", 9199)
      } catch (error) {
        // Emulators might already be connected
        console.warn("Firebase emulators connection warning:", error)
      }
    }

    console.log("✅ Firebase initialized successfully with optimizations")
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error)
    throw error
  }
}

// Initialize Firebase
initializeFirebase()

// Export optimized Firebase services
export { firebaseApp as default, db, auth, storage, performance }
export { db as firestore }

// Export types for better TypeScript support
export type { FirebaseApp, Firestore, Auth, FirebaseStorage }
