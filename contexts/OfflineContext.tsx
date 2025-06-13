"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { processSyncQueue, clearProcessedItems } from "../lib/syncService"

interface OfflineContextType {
  isOffline: boolean
  lastOnline: Date | null
  isPendingSync: boolean
  pendingSyncCount: number
  syncData: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  lastOnline: null,
  isPendingSync: false,
  pendingSyncCount: 0,
  syncData: async () => {},
})

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)
  const [isPendingSync, setIsPendingSync] = useState(false)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  // Check online status and set up event listeners
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOffline(!online)

      if (online) {
        setLastOnline(new Date())
        localStorage.setItem("lastOnline", new Date().toISOString())

        // Check if there's data to sync
        const pendingSync = localStorage.getItem("syncQueue") || "[]"
        const pendingItems = JSON.parse(pendingSync)
        const unprocessedItems = pendingItems.filter((item: any) => !item.processed)

        setPendingSyncCount(unprocessedItems.length)
        setIsPendingSync(unprocessedItems.length > 0)
      }
    }

    // Initialize
    updateOnlineStatus()

    // Set up event listeners
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Load last online time from storage
    const storedLastOnline = localStorage.getItem("lastOnline")
    if (storedLastOnline) {
      setLastOnline(new Date(storedLastOnline))
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  // Update pending sync count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOffline) {
        const pendingSync = localStorage.getItem("syncQueue") || "[]"
        const pendingItems = JSON.parse(pendingSync)
        const unprocessedItems = pendingItems.filter((item: any) => !item.processed)

        setPendingSyncCount(unprocessedItems.length)
        setIsPendingSync(unprocessedItems.length > 0)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isOffline])

  // Function to sync data when back online
  const syncData = async () => {
    if (isOffline) return

    try {
      setIsPendingSync(true)

      // Process the sync queue
      const result = await processSyncQueue()

      // Clear processed items
      clearProcessedItems()

      // Update counts
      const pendingSync = localStorage.getItem("syncQueue") || "[]"
      const pendingItems = JSON.parse(pendingSync)
      const unprocessedItems = pendingItems.filter((item: any) => !item.processed)

      setPendingSyncCount(unprocessedItems.length)
      setIsPendingSync(unprocessedItems.length > 0)

      return result
    } catch (error) {
      console.error("Error syncing data:", error)
    }
  }

  // Attempt to sync when coming back online
  useEffect(() => {
    if (!isOffline && isPendingSync) {
      syncData()
    }
  }, [isOffline, isPendingSync])

  return (
    <OfflineContext.Provider
      value={{
        isOffline,
        lastOnline,
        isPendingSync,
        pendingSyncCount,
        syncData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  return useContext(OfflineContext)
}
