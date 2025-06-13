"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "next-i18next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import type { GetServerSideProps } from "next"
import Layout from "../components/Layout"
import { useDebug } from "../contexts/DebugContext"
import { useOffline } from "../contexts/OfflineContext"
import { getAllSettings, setSetting } from "../lib/settingsService"

interface SettingItem {
  key: string
  value: string
  label: string
  type: "text" | "select" | "checkbox" | "number"
  options?: Array<{ value: string; label: string }>
}

export default function SettingsPage() {
  const { t } = useTranslation("common")
  const { addLog } = useDebug()
  const { isOffline } = useOffline()
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Define the settings structure
  const settingsDefinition: Omit<SettingItem, "value">[] = [
    {
      key: "app_name",
      label: t("settings.app_name", "Application Name"),
      type: "text",
    },
    {
      key: "default_language",
      label: t("settings.default_language", "Default Language"),
      type: "select",
      options: [
        { value: "en", label: t("english") },
        { value: "nl", label: t("dutch") },
      ],
    },
    {
      key: "offline_mode",
      label: t("settings.offline_mode", "Enable Offline Mode"),
      type: "checkbox",
    },
    {
      key: "scan_beep",
      label: t("settings.scan_beep", "Play Sound on Scan"),
      type: "checkbox",
    },
    {
      key: "scan_vibrate",
      label: t("settings.scan_vibrate", "Vibrate on Scan"),
      type: "checkbox",
    },
    {
      key: "scan_history_limit",
      label: t("settings.scan_history_limit", "Scan History Limit"),
      type: "number",
    },
  ]

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)
        const allSettings = await getAllSettings(isOffline)

        // Combine with definitions
        const settingsWithValues = settingsDefinition.map((def) => ({
          ...def,
          value: allSettings[def.key] || getDefaultValue(def),
        }))

        setSettings(settingsWithValues)
        addLog("Settings loaded", "info")
      } catch (error) {
        console.error("Error loading settings:", error)
        addLog("Error loading settings", "error", error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [isOffline, addLog, t])

  // Get default value based on setting type
  function getDefaultValue(setting: Omit<SettingItem, "value">): string {
    switch (setting.type) {
      case "checkbox":
        return "false"
      case "number":
        return "100"
      case "select":
        return setting.options?.[0]?.value || ""
      default:
        return ""
    }
  }

  // Handle setting change
  const handleChange = (key: string, value: string) => {
    setSettings((prev) => prev.map((setting) => (setting.key === key ? { ...setting, value } : setting)))
  }

  // Save all settings
  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      for (const setting of settings) {
        await setSetting(setting.key, setting.value, isOffline)
      }

      setMessage({ type: "success", text: t("settings.saved_success", "Settings saved successfully") })
      addLog("Settings saved", "info")
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage({ type: "error", text: t("settings.saved_error", "Error saving settings") })
      addLog("Error saving settings", "error", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title={t("settings")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("settings")}</h1>

        {isOffline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              {t(
                "settings.offline_warning",
                "You are currently offline. Changes will be saved locally and synced when you're back online.",
              )}
            </p>
          </div>
        )}

        {message && (
          <div
            className={`p-4 mb-6 rounded-md ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </label>
                  <div className="md:col-span-2">
                    {setting.type === "text" && (
                      <input
                        type="text"
                        id={setting.key}
                        value={setting.value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                    {setting.type === "select" && (
                      <select
                        id={setting.key}
                        value={setting.value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {setting.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {setting.type === "checkbox" && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={setting.key}
                          checked={setting.value === "true"}
                          onChange={(e) => handleChange(setting.key, e.target.checked.toString())}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-500">
                          {setting.value === "true" ? t("enabled") : t("disabled")}
                        </span>
                      </div>
                    )}
                    {setting.type === "number" && (
                      <input
                        type="number"
                        id={setting.key}
                        value={setting.value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? t("settings.saving", "Saving...") : t("settings.save", "Save Settings")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
    },
  }
}
