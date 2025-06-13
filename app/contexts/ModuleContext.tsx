"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Module, loadModules } from "../lib/moduleLoader"

interface ModuleContextType {
  modules: Module[]
  loading: boolean
  error: string | null
  refreshModules: () => Promise<void>
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const moduleList = await loadModules()
      setModules(moduleList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules")
      console.error("Error loading modules:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const refreshModules = async () => {
    await fetchModules()
  }

  return (
    <ModuleContext.Provider
      value={{
        modules,
        loading,
        error,
        refreshModules,
      }}
    >
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error("useModules must be used within a ModuleProvider")
  }
  return context
}
