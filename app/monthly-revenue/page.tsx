"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { MonthlyRevenue } from "@/components/monthly-revenue/monthly-revenue"
import { useBranch } from "@/lib/contexts/branch-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/config/firebase"

export default function MonthlyRevenuePage() {
  const { selectedBranch } = useBranch()
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true)
      try {
        let revenueQuery

        if (selectedBranch) {
          // If a branch is selected, filter revenue by branch
          revenueQuery = query(collection(db, "monthlyRevenue"), where("branchId", "==", selectedBranch.id))
        } else {
          // Otherwise, get all revenue data
          revenueQuery = collection(db, "monthlyRevenue")
        }

        const revenueSnapshot = await getDocs(revenueQuery)
        const revenueList = revenueSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setRevenueData(revenueList)
      } catch (error) {
        console.error("Error fetching revenue data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [selectedBranch])

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Oylik daromad</h1>
        <p className="text-muted-foreground">
          {selectedBranch
            ? `${selectedBranch.name} filiali oylik daromad hisoboti`
            : "Barcha filiallar oylik daromad hisoboti"}
        </p>
      </div>
      <MonthlyRevenue data={revenueData} loading={loading} />
    </AppLayout>
  )
}
