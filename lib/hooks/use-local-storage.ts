"use client"

import { useState, useCallback } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue] as const
}

// Hook for managing complex local storage data
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useLocalStorage(key, initialValue)

  const updateValue = useCallback(
    (updates: Partial<T>) => {
      setValue((prev) => ({ ...prev, ...updates }))
    },
    [setValue],
  )

  const resetValue = useCallback(() => {
    setValue(initialValue)
  }, [setValue, initialValue])

  return {
    value,
    setValue,
    updateValue,
    resetValue,
  }
}

// Hook for caching API responses
export function useLocalStorageCache<T>(key: string, ttlMinutes = 5) {
  const getCachedData = useCallback((): T | null => {
    if (typeof window === "undefined") return null

    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null

      const { data, timestamp, ttl } = JSON.parse(cached)

      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(key)
        return null
      }

      return data
    } catch (error) {
      console.warn(`Error reading cache for key "${key}":`, error)
      return null
    }
  }, [key])

  const setCachedData = useCallback(
    (data: T) => {
      if (typeof window === "undefined") return

      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
          ttl: ttlMinutes * 60 * 1000,
        }
        localStorage.setItem(key, JSON.stringify(cacheData))
      } catch (error) {
        console.warn(`Error setting cache for key "${key}":`, error)
      }
    },
    [key, ttlMinutes],
  )

  const clearCache = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  }, [key])

  return {
    getCachedData,
    setCachedData,
    clearCache,
  }
}
