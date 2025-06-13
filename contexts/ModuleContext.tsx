"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Module, loadModules, enableModule } from "../lib/moduleLoader"
import { useOffline } from "./OfflineContext"
import { useDebug } from "./DebugContext"

interface ModuleContextType {
  modules: Module[]
  loading: boolean
  error: string | null
  refreshModules: () => Promise<void>
  toggleModuleStatus: (moduleName: string, enabled: boolean) => Promise<boolean>
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isOffline } = useOffline()
  const { addLog } = useDebug()

  const fetchModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const moduleList = await loadModules(isOffline)
      setModules(moduleList)
      addLog(`Loaded ${moduleList.length} modules`, "info")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load modules"
      setError(errorMessage)
      addLog("Error loading modules", "error", err)
      console.error("Error loading modules:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [isOffline])

  const refreshModules = async () => {
    await fetchModules()
  }

  const toggleModuleStatus = async (moduleName: string, enabled: boolean): Promise<boolean> => {
    try {
      const result = await enableModule(moduleName, enabled, isOffline)

      if (result.success) {
        // Update the local state
        setModules((prevModules) =>
          prevModules.map((module) => (module.name === moduleName ? { ...module, enabled } : module)),
        )

        addLog(`Module ${moduleName} ${enabled ? "enabled" : "disabled"}`, "info")
        return true
      } else {
        addLog(`Failed to ${enabled ? "enable" : "disable"} module ${moduleName}`, "error", result.error)
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addLog(`Error toggling module status: ${errorMessage}`, "error", err)
      console.error("Error toggling module status:", err)
      return false
    }
  }

  return (
    <ModuleContext.Provider
      value={{
        modules,
        loading,
        error,
        refreshModules,
        toggleModuleStatus,
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
