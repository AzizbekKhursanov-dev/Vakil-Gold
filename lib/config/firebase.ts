import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

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

try {
  // Initialize Firebase
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

  // Initialize Firestore
  db = getFirestore(firebaseApp)

  // Initialize Auth
  auth = getAuth(firebaseApp)

  // Initialize Storage
  storage = getStorage(firebaseApp)

  console.log("✅ Firebase initialized successfully with project:", firebaseConfig.projectId)
} catch (error) {
  console.error("❌ Error initializing Firebase:", error)
  throw error
}

// Export with consistent naming
export { firebaseApp as default, db, auth, storage }

// Also export firestore for any components that might use that name
export { db as firestore }
