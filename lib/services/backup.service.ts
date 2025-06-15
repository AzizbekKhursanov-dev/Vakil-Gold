import { collection, getDocs, query, orderBy, writeBatch, doc, deleteDoc, where, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/config/firebase"

// Export all data from Firestore
export async function exportData() {
  try {
    const data: Record<string, any[]> = {}

    // Collections to export
    const collections = ["items", "branches", "users", "transactions", "oldiBerdi"]

    // Export each collection
    for (const collectionName of collections) {
      const q = query(collection(db, collectionName), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      data[collectionName] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    }

    // Create a JSON file
    const jsonData = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `backup-${timestamp}.json`

    // Upload to Firebase Storage
    const storageRef = ref(storage, `backups/${filename}`)
    await uploadBytes(storageRef, blob)

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)

    // Save backup metadata to Firestore
    const backupRef = doc(collection(db, "backups"))
    await writeBatch(db)
      .set(backupRef, {
        id: backupRef.id,
        filename,
        date: new Date().toISOString(),
        size: blob.size,
        downloadURL,
        itemCount: data.items?.length || 0,
        branchCount: data.branches?.length || 0,
        status: "completed",
        createdAt: new Date().toISOString(),
      })
      .commit()

    return {
      success: true,
      filename,
      downloadURL,
      timestamp: new Date().toISOString(),
      size: blob.size,
      collections: Object.keys(data),
      counts: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.length])),
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    throw new Error("Ma'lumotlarni eksport qilishda xatolik yuz berdi")
  }
}

// Import data from a JSON file
export async function importData(file: File) {
  try {
    // Read the file
    const text = await file.text()
    const data = JSON.parse(text)

    // Validate the data structure
    if (!data || typeof data !== "object") {
      throw new Error("Noto'g'ri fayl formati")
    }

    // Create a backup before importing
    await exportData()

    // Import data using batched writes
    const collections = Object.keys(data)

    for (const collectionName of collections) {
      if (!Array.isArray(data[collectionName])) {
        console.warn(`Skipping ${collectionName}: not an array`)
        continue
      }

      const batch = writeBatch(db)
      let batchCount = 0
      const batchLimit = 500 // Firestore batch limit

      // Delete existing data
      const existingDocs = await getDocs(collection(db, collectionName))
      const deletePromises = existingDocs.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Import new data
      for (const item of data[collectionName]) {
        if (!item.id) continue

        const docRef = doc(collection(db, collectionName), item.id)
        batch.set(docRef, item)
        batchCount++

        // Commit batch when limit is reached
        if (batchCount >= batchLimit) {
          await batch.commit()
          batchCount = 0
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit()
      }
    }

    // Save import record
    const importRef = doc(collection(db, "backupLogs"))
    await writeBatch(db)
      .set(importRef, {
        id: importRef.id,
        type: "import",
        filename: file.name,
        date: new Date().toISOString(),
        collections,
        counts: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
        ),
        createdAt: new Date().toISOString(),
      })
      .commit()

    return {
      success: true,
      timestamp: new Date().toISOString(),
      collections,
      counts: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
      ),
    }
  } catch (error) {
    console.error("Error importing data:", error)
    throw new Error("Ma'lumotlarni import qilishda xatolik yuz berdi")
  }
}

// Get backup history from Firebase Storage
export async function getBackupHistory() {
  try {
    const backupsRef = ref(storage, "backups")
    const result = await listAll(backupsRef)

    const backups = await Promise.all(
      result.items.map(async (itemRef) => {
        try {
          const metadata = await itemRef.getMetadata()
          const downloadURL = await getDownloadURL(itemRef)

          return {
            id: itemRef.name,
            filename: itemRef.name,
            date: metadata.timeCreated,
            size: `${(metadata.size / (1024 * 1024)).toFixed(2)} MB`,
            downloadURL,
            status: "completed",
          }
        } catch (error) {
          console.error(`Error getting metadata for ${itemRef.name}:`, error)
          return null
        }
      }),
    )

    return backups.filter(Boolean).sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())
  } catch (error) {
    console.error("Error getting backup history:", error)
    throw new Error("Zaxira tarixini olishda xatolik yuz berdi")
  }
}

// Delete a backup
export async function deleteBackup(filename: string) {
  try {
    // Delete from Storage
    const storageRef = ref(storage, `backups/${filename}`)
    await deleteObject(storageRef)

    // Delete metadata from Firestore if exists
    const backupsQuery = query(collection(db, "backups"), where("filename", "==", filename))
    const backupsSnapshot = await getDocs(backupsQuery)

    if (!backupsSnapshot.empty) {
      const batch = writeBatch(db)
      backupsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      await batch.commit()
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting backup:", error)
    throw new Error("Zaxirani o'chirishda xatolik yuz berdi")
  }
}

// Schedule automatic backup
export async function scheduleBackup(schedule: {
  enabled: boolean
  frequency: "daily" | "weekly" | "monthly"
  time: string
  retention: number
}) {
  try {
    // Save schedule to Firestore
    const scheduleRef = doc(db, "settings", "backupSchedule")
    await writeBatch(db)
      .set(scheduleRef, {
        ...schedule,
        updatedAt: new Date().toISOString(),
      })
      .commit()

    return { success: true }
  } catch (error) {
    console.error("Error scheduling backup:", error)
    throw new Error("Zaxiralash jadvalini saqlashda xatolik yuz berdi")
  }
}

// Get backup schedule
export async function getBackupSchedule() {
  try {
    const scheduleRef = doc(db, "settings", "backupSchedule")
    const scheduleDoc = await getDoc(scheduleRef)

    if (scheduleDoc.exists()) {
      return scheduleDoc.data()
    }

    // Default schedule
    return {
      enabled: false,
      frequency: "daily",
      time: "00:00",
      retention: 30,
    }
  } catch (error) {
    console.error("Error getting backup schedule:", error)
    throw new Error("Zaxiralash jadvalini olishda xatolik yuz berdi")
  }
}
