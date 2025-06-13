import fs from "fs"
import path from "path"
import { promisify } from "util"
import extract from "extract-zip"
import { query } from "./db"
import { queueOperation, getLocalData } from "./syncService"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)
const exists = promisify(fs.exists)

export interface ModuleManifest {
  name: string
  version: string
  description: string
  author: string
  dependencies: Record<string, string>
  routes: Array<{
    path: string
    component: string
  }>
  api: Array<{
    path: string
    handler: string
  }>
  permissions: string[]
  translations: Record<string, string>
  hooks: Array<{
    type: string
    handler: string
  }>
}

export interface Module {
  id?: number
  name: string
  version: string
  path: string
  manifest: ModuleManifest
  enabled: boolean
}

// Load modules from filesystem and database
export async function loadModules(isOffline = false): Promise<Module[]> {
  const modulesDir = process.env.MODULES_DIR || path.join(process.cwd(), "modules")
  const modules: Module[] = []

  try {
    // Ensure modules directory exists
    if (!(await exists(modulesDir))) {
      await mkdir(modulesDir, { recursive: true })
    }

    // Get modules from database if online
    let dbModules: Record<string, { id: number; enabled: boolean }> = {}

    if (!isOffline) {
      try {
        const result = await query<{ id: number; name: string; enabled: boolean }>(
          "SELECT id, name, enabled FROM modules",
        )

        result.rows.forEach((row) => {
          dbModules[row.name] = { id: row.id, enabled: row.enabled }
        })
      } catch (error) {
        console.error("Error fetching modules from database:", error)
        isOffline = true
      }
    }

    // If offline, get modules from local storage
    if (isOffline) {
      const localModules = getLocalData<{ id: number; enabled: boolean }>("modules")
      dbModules = localModules
    }

    // Read modules from filesystem
    const dirs = await readdir(modulesDir)

    for (const dir of dirs) {
      // Skip files and special directories
      const stats = await fs.promises.stat(path.join(modulesDir, dir))
      if (!stats.isDirectory() || dir.startsWith(".")) continue

      const modulePath = path.join(modulesDir, dir)
      const manifestPath = path.join(modulePath, "manifest.json")

      try {
        if (!(await exists(manifestPath))) continue

        const manifestContent = await readFile(manifestPath, "utf8")
        const manifest = JSON.parse(manifestContent) as ModuleManifest

        // Check if module is registered
        const dbModule = dbModules[manifest.name]
        const enabled = dbModule ? dbModule.enabled : true
        const id = dbModule ? dbModule.id : undefined

        modules.push({
          id,
          name: manifest.name,
          version: manifest.version,
          path: modulePath,
          manifest,
          enabled,
        })
      } catch (err) {
        console.error(`Error loading module ${dir}:`, err)
      }
    }
  } catch (err) {
    console.error("Error reading modules directory:", err)
  }

  return modules
}

// Install a module from a zip file
export async function installModule(
  zipFilePath: string,
  isOffline = false,
): Promise<{ success: boolean; module?: Module; error?: string }> {
  const modulesDir = process.env.MODULES_DIR || path.join(process.cwd(), "modules")
  const extractDir = path.join(modulesDir, "temp-extract")

  try {
    // Ensure extract directory exists and is empty
    if (await exists(extractDir)) {
      await fs.promises.rm(extractDir, { recursive: true, force: true })
    }
    await mkdir(extractDir, { recursive: true })

    // Extract the zip file
    await extract(zipFilePath, { dir: extractDir })

    // Read the manifest
    const manifestPath = path.join(extractDir, "manifest.json")
    if (!(await exists(manifestPath))) {
      throw new Error("Invalid module: manifest.json not found")
    }

    const manifestContent = await readFile(manifestPath, "utf8")
    const manifest = JSON.parse(manifestContent) as ModuleManifest

    // Validate manifest
    if (!manifest.name || !manifest.version) {
      throw new Error("Invalid manifest: name and version are required")
    }

    // Create module directory
    const moduleDir = path.join(modulesDir, manifest.name)
    if (await exists(moduleDir)) {
      // Module already exists, remove it first
      await fs.promises.rm(moduleDir, { recursive: true, force: true })
    }

    // Move files from temp directory to module directory
    await fs.promises.rename(extractDir, moduleDir)

    // Register module in database or queue for sync
    if (!isOffline) {
      try {
        const result = await query<{ id: number }>(
          `INSERT INTO modules (name, version, enabled, installed_at, updated_at)
           VALUES ($1, $2, true, NOW(), NOW())
           ON CONFLICT (name) DO UPDATE
           SET version = $2, updated_at = NOW()
           RETURNING id`,
          [manifest.name, manifest.version],
        )

        const module: Module = {
          id: result.rows[0].id,
          name: manifest.name,
          version: manifest.version,
          path: moduleDir,
          manifest,
          enabled: true,
        }

        return { success: true, module }
      } catch (error) {
        console.error("Error registering module:", error)
        isOffline = true
      }
    }

    if (isOffline) {
      // Queue for sync when back online
      const moduleData = {
        name: manifest.name,
        version: manifest.version,
        enabled: true,
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const clientId = await queueOperation("INSERT", "modules", undefined, moduleData)

      const module: Module = {
        name: manifest.name,
        version: manifest.version,
        path: moduleDir,
        manifest,
        enabled: true,
      }

      return { success: true, module }
    }

    throw new Error("Failed to register module")
  } catch (err) {
    console.error("Error installing module:", err)

    // Clean up
    if (await exists(extractDir)) {
      await fs.promises.rm(extractDir, { recursive: true, force: true })
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// Enable or disable a module
export async function enableModule(
  moduleName: string,
  enabled: boolean,
  isOffline = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isOffline) {
      try {
        await query("UPDATE modules SET enabled = $1 WHERE name = $2", [enabled, moduleName])
        return { success: true }
      } catch (error) {
        console.error(`Error ${enabled ? "enabling" : "disabling"} module ${moduleName}:`, error)
        isOffline = true
      }
    }

    if (isOffline) {
      // Queue for sync when back online
      const moduleData = { enabled }
      await queueOperation("UPDATE", "modules", moduleName, moduleData)
      return { success: true }
    }

    return { success: false, error: "Failed to update module status" }
  } catch (err) {
    console.error(`Error ${enabled ? "enabling" : "disabling"} module ${moduleName}:`, err)

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// Get translations for all modules
export async function getModuleTranslations(locale: string): Promise<Record<string, string>> {
  const modules = await loadModules()
  const translations: Record<string, string> = {}

  for (const module of modules) {
    if (!module.enabled) continue

    const moduleTranslations = module.manifest.translations?.[locale] || {}
    Object.assign(translations, moduleTranslations)
  }

  return translations
}

// Get all routes from enabled modules
export function getModuleRoutes(modules: Module[]): Array<{ path: string; component: string; moduleName: string }> {
  const routes: Array<{ path: string; component: string; moduleName: string }> = []

  for (const module of modules) {
    if (!module.enabled || !module.manifest.routes) continue

    for (const route of module.manifest.routes) {
      routes.push({
        path: route.path,
        component: route.component,
        moduleName: module.name,
      })
    }
  }

  return routes
}
