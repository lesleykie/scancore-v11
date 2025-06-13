import fs from "fs"
import path from "path"
import { promisify } from "util"
import { query } from "./db"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const exists = promisify(fs.exists)

export interface ModuleManifest {
  name: string
  version: string
  description: string
  author: string
  routes: Array<{
    path: string
    component: string
  }>
}

export interface Module {
  name: string
  version: string
  path: string
  manifest: ModuleManifest
  enabled: boolean
}

// Simplified module loader that just loads modules from the filesystem
export async function loadModules(): Promise<Module[]> {
  const modulesDir = process.env.MODULES_DIR || path.join(process.cwd(), "modules")
  const modules: Module[] = []

  try {
    // Ensure modules directory exists
    if (!(await exists(modulesDir))) {
      await fs.promises.mkdir(modulesDir, { recursive: true })
      return modules
    }

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

        // Check if module is registered in database
        const result = await query("SELECT enabled FROM modules WHERE name = $1", [manifest.name])
        const enabled = result.rows.length > 0 ? result.rows[0].enabled : true

        modules.push({
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

// Simplified module installation - just registers the module in the database
export async function registerModule(name: string, version: string): Promise<{ success: boolean; error?: string }> {
  try {
    await query(
      `INSERT INTO modules (name, version, enabled, installed_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE
       SET version = $2, updated_at = NOW()`,
      [name, version],
    )

    return { success: true }
  } catch (err) {
    console.error("Error registering module:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// Simplified module enabling/disabling
export async function enableModule(
  moduleName: string,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await query("UPDATE modules SET enabled = $1 WHERE name = $2", [enabled, moduleName])
    return { success: true }
  } catch (err) {
    console.error(`Error ${enabled ? "enabling" : "disabling"} module ${moduleName}:`, err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}
