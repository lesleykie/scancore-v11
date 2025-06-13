"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface OfflineContextType {
  isOffline: boolean
  lastOnline: Date | null
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  lastOnline: null,
})

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine)

    // Set up event listeners for online/offline events
    const handleOnline = () => {
      setIsOffline(false)
      setLastOnline(new Date())

      // Trigger sync when coming back online
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register("syncData")
        })
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Store last online time in localStorage
    if (navigator.onLine) {
      const now = new Date()
      localStorage.setItem("lastOnline", now.toISOString())
      setLastOnline(now)
    } else {
      const lastOnlineStr = localStorage.getItem("lastOnline")
      if (lastOnlineStr) {
        setLastOnline(new Date(lastOnlineStr))
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Update localStorage when online status changes
  useEffect(() => {
    if (!isOffline) {
      const now = new Date()
      localStorage.setItem("lastOnline", now.toISOString())
      setLastOnline(now)
    }
  }, [isOffline])

  return <OfflineContext.Provider value={{ isOffline, lastOnline }}>{children}</OfflineContext.Provider>
}

export function useOffline() {
  return useContext(OfflineContext)
}
