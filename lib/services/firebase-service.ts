import { db } from "@/lib/config/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore"

export class FirebaseService<T extends { id: string }> {
  private collectionName: string

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  async getAll(queryConstraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T)
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error)
      throw error
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T
      } else {
        return null
      }
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error)
      throw error
    }
  }

  async create(data: Omit<T, "id">): Promise<T> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const newDoc = await getDoc(docRef)
      return { id: docRef.id, ...newDoc.data() } as T
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error)
      throw error
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error)
      throw error
    }
  }

  onSnapshot(
    queryConstraints: QueryConstraint[] = [],
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void,
  ): Unsubscribe {
    const q = query(collection(db, this.collectionName), ...queryConstraints)

    return onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T)
        callback(items)
      },
      (error) => {
        console.error(`Error in ${this.collectionName} snapshot:`, error)
        if (errorCallback) errorCallback(error)
      },
    )
  }

  buildQuery(filters: Record<string, any> = {}): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    // Process filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "orderBy" && typeof value === "string") {
          constraints.push(orderBy(value))
        } else if (key === "orderByDesc" && typeof value === "string") {
          constraints.push(orderBy(value, "desc"))
        } else if (key === "limit" && typeof value === "number") {
          constraints.push(limit(value))
        } else if (key === "startAfter" && value) {
          constraints.push(startAfter(value))
        } else if (key !== "startAfter" && key !== "limit" && key !== "orderBy" && key !== "orderByDesc") {
          constraints.push(where(key, "==", value))
        }
      }
    })

    return constraints
  }
}
