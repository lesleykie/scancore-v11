"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface DebugContextType {
  isDebugEnabled: boolean
  toggleDebug: () => void
  logs: Array<{ timestamp: Date; message: string; type: "info" | "error" | "warn" }>
  addLog: (message: string, type?: "info" | "error" | "warn") => void
  clearLogs: () => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugEnabled, setIsDebugEnabled] = useState(process.env.DEBUG === "true")
  const [logs, setLogs] = useState<Array<{ timestamp: Date; message: string; type: "info" | "error" | "warn" }>>([])

  const toggleDebug = () => {
    setIsDebugEnabled((prev) => !prev)
  }

  const addLog = (message: string, type: "info" | "error" | "warn" = "info") => {
    if (isDebugEnabled) {
      setLogs((prevLogs) => [...prevLogs, { timestamp: new Date(), message, type }])
      console[type](message)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <DebugContext.Provider
      value={{
        isDebugEnabled,
        toggleDebug,
        logs,
        addLog,
        clearLogs,
      }}
    >
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const context = useContext(DebugContext)
  if (context === undefined) {
    throw new Error("useDebug must be used within a DebugProvider")
  }
  return context
}
