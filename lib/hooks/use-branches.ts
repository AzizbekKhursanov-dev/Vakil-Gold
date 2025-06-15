"use client"

import { useState, useEffect } from "react"
import { branchService } from "@/lib/services/branch.service"
import type { Branch } from "@/lib/types/branch"

interface UseBranchesOptions {
  realtime?: boolean
}

export function useBranches(options: UseBranchesOptions = {}) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { realtime = false } = options

  const loadBranches = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await branchService.getBranches()
      setBranches(data)
    } catch (err) {
      console.error("Error loading branches:", err)
      setError(err instanceof Error ? err.message : "Filiallarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [])

  const createBranch = async (branchData: any) => {
    try {
      const newBranch = await branchService.createBranch(branchData)
      setBranches((prev) => [...prev, newBranch])
      return newBranch
    } catch (err) {
      console.error("Error creating branch:", err)
      throw err
    }
  }

  const updateBranch = async (id: string, branchData: any) => {
    try {
      await branchService.updateBranch(id, branchData)
      setBranches((prev) => prev.map((branch) => (branch.id === id ? { ...branch, ...branchData } : branch)))
    } catch (err) {
      console.error("Error updating branch:", err)
      throw err
    }
  }

  const deleteBranch = async (id: string) => {
    try {
      await branchService.deleteBranch(id)
      setBranches((prev) => prev.filter((branch) => branch.id !== id))
    } catch (err) {
      console.error("Error deleting branch:", err)
      throw err
    }
  }

  const getBranch = (id: string) => {
    return branches.find((branch) => branch.id === id)
  }

  const getBranchName = (id: string) => {
    const branch = getBranch(id)
    return branch ? branch.name : "Noma'lum filial"
  }

  return {
    branches,
    loading,
    error,
    loadBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranch,
    getBranchName,
  }
}
