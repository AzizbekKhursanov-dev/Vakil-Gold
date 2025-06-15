import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Singleton pattern for Firebase initialization
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let persistenceEnabled = false
let persistencePromise: Promise<void> | null = null

export function initializeFirebase(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side")
  }

  if (!app) {
    // Initialize Firebase app
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

    // Initialize Auth
    auth = getAuth(app)

    // Initialize Firestore
    db = getFirestore(app)

    // Connect to emulator in development
    if (process.env.NEXT_PUBLIC_USE_EMULATOR === "true" && process.env.NODE_ENV === "development") {
      try {
        connectFirestoreEmulator(db, "localhost", 8080)
      } catch (error) {
        console.log("Emulator already connected or not available")
      }
    }

    // Enable persistence
    enablePersistence()
  }

  return app
}

function enablePersistence() {
  if (!db || persistenceEnabled || typeof window === "undefined") return

  persistencePromise = enableIndexedDbPersistence(db, {
    forceOwnership: false,
  })
    .then(() => {
      persistenceEnabled = true
      console.log("Firestore persistence enabled")
    })
    .catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Firestore persistence failed: Multiple tabs open")
      } else if (err.code === "unimplemented") {
        console.warn("Firestore persistence not supported in this browser")
      } else {
        console.error("Firestore persistence error:", err)
      }
      persistenceEnabled = true // Mark as "enabled" to prevent retries
    })
}

export async function waitForPersistence(): Promise<void> {
  if (persistencePromise) {
    await persistencePromise
  }
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase()
  }
  if (!auth) {
    throw new Error("Firebase Auth not initialized")
  }
  return auth
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    initializeFirebase()
  }
  if (!db) {
    throw new Error("Firestore not initialized")
  }
  return db
}

export function isPersistenceReady(): boolean {
  return persistenceEnabled
}

// Export initialized instances (will be null until initializeFirebase is called)
export { auth, db }

// Default export for backward compatibility
export default app
