import { query } from "./db"
import { queueOperation, getLocalData } from "./syncService"

// Get a setting value
export async function getSetting(key: string, defaultValue = "", isOffline = false): Promise<string> {
  try {
    if (!isOffline) {
      const result = await query<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key])

      if (result.rows.length > 0) {
        return result.rows[0].value
      }
    }

    // Try to get from local storage
    const localSettings = getLocalData<{ value: string }>("settings")
    const setting = localSettings[key]

    if (setting) {
      return setting.value
    }

    return defaultValue
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error)

    // Try to get from local storage on error
    const localSettings = getLocalData<{ value: string }>("settings")
    const setting = localSettings[key]

    if (setting) {
      return setting.value
    }

    return defaultValue
  }
}

// Set a setting value
export async function setSetting(key: string, value: string, isOffline = false): Promise<boolean> {
  try {
    if (!isOffline) {
      await query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = $2, updated_at = NOW()`,
        [key, value],
      )

      // Also update local storage
      const localSettings = getLocalData<{ value: string }>("settings")
      localSettings[key] = { value }
      localStorage.setItem("local_settings", JSON.stringify(localSettings))

      return true
    } else {
      // Queue for sync when back online
      await queueOperation("UPDATE", "settings", key, { value })
      return true
    }
  } catch (error) {
    console.error(`Error setting ${key}:`, error)

    // Try to queue for sync on error
    try {
      await queueOperation("UPDATE", "settings", key, { value })
      return true
    } catch (syncError) {
      console.error(`Error queueing setting update for ${key}:`, syncError)
      return false
    }
  }
}

// Get all settings
export async function getAllSettings(isOffline = false): Promise<Record<string, string>> {
  try {
    const settings: Record<string, string> = {}

    if (!isOffline) {
      const result = await query<{ key: string; value: string }>("SELECT key, value FROM settings")

      for (const row of result.rows) {
        settings[row.key] = row.value
      }
    }

    // Merge with local settings
    const localSettings = getLocalData<{ value: string }>("settings")

    for (const [key, setting] of Object.entries(localSettings)) {
      settings[key] = setting.value
    }

    return settings
  } catch (error) {
    console.error("Error getting all settings:", error)

    // Return local settings on error
    const localSettings = getLocalData<{ value: string }>("settings")
    const settings: Record<string, string> = {}

    for (const [key, setting] of Object.entries(localSettings)) {
      settings[key] = setting.value
    }

    return settings
  }
}
