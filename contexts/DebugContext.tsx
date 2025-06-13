"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

type LogLevel = "info" | "warning" | "error" | "debug"

interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  details?: any
}

interface DebugContextType {
  isDebugEnabled: boolean
  logs: LogEntry[]
  addLog: (message: string, level?: LogLevel, details?: any) => void
  clearLogs: () => void
  toggleDebug: () => void
  systemInfo: Record<string, any>
}

const DebugContext = createContext<DebugContextType>({
  isDebugEnabled: false,
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
  toggleDebug: () => {},
  systemInfo: {},
})

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({})

  // Initialize debug mode from localStorage or environment
  useEffect(() => {
    const debugEnabled = localStorage.getItem("debugEnabled") === "true" || process.env.NODE_ENV === "development"
    setIsDebugEnabled(debugEnabled)

    // Collect basic system info
    const info: Record<string, any> = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    }

    setSystemInfo(info)

    // Load saved logs
    const savedLogs = localStorage.getItem("debugLogs")
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs)
        // Convert string timestamps back to Date objects
        const processedLogs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }))
        setLogs(processedLogs)
      } catch (error) {
        console.error("Error loading debug logs:", error)
      }
    }
  }, [])

  // Save logs to localStorage when they change
  useEffect(() => {
    if (logs.length > 0) {
      try {
        localStorage.setItem("debugLogs", JSON.stringify(logs.slice(-100))) // Keep only last 100 logs
      } catch (error) {
        console.error("Error saving debug logs:", error)
      }
    }
  }, [logs])

  const addLog = (message: string, level: LogLevel = "info", details?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      details,
    }

    setLogs((prevLogs) => [...prevLogs, newLog])

    // Also log to console
    switch (level) {
      case "error":
        console.error(message, details)
        break
      case "warning":
        console.warn(message, details)
        break
      case "debug":
        console.debug(message, details)
        break
      default:
        console.log(message, details)
    }
  }

  const clearLogs = () => {
    setLogs([])
    localStorage.removeItem("debugLogs")
  }

  const toggleDebug = () => {
    const newValue = !isDebugEnabled
    setIsDebugEnabled(newValue)
    localStorage.setItem("debugEnabled", newValue.toString())
  }

  return (
    <DebugContext.Provider
      value={{
        isDebugEnabled,
        logs,
        addLog,
        clearLogs,
        toggleDebug,
        systemInfo,
      }}
    >
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  return useContext(DebugContext)
}
