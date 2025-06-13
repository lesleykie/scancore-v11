"use client"

import type React from "react"

import { useState } from "react"
import { useTranslation } from "next-i18next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import type { GetServerSideProps } from "next"
import Layout from "../components/Layout"
import { useModules } from "../contexts/ModuleContext"
import { useOffline } from "../contexts/OfflineContext"
import { useDebug } from "../contexts/DebugContext"

export default function ModulesPage() {
  const { t } = useTranslation("common")
  const { modules, loading, error, refreshModules, toggleModuleStatus } = useModules()
  const { isOffline } = useOffline()
  const { addLog } = useDebug()
  const [uploadingModule, setUploadingModule] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Handle module file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    if (!file.name.endsWith(".zip")) {
      setMessage({ type: "error", text: t("modules.invalid_file", "Please select a valid ZIP file") })
      return
    }

    try {
      setUploadingModule(true)
      setMessage(null)

      // Create form data
      const formData = new FormData()
      formData.append("module", file)

      // Upload the module
      const response = await fetch("/api/modules/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload module")
      }

      const data = await response.json()

      setMessage({ type: "success", text: t("modules.upload_success", "Module uploaded successfully") })
      addLog(`Module ${data.module.name} uploaded successfully`, "info")

      // Refresh the modules list
      await refreshModules()
    } catch (error) {
      console.error("Error uploading module:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to upload module" })
      addLog("Error uploading module", "error", error)
    } finally {
      setUploadingModule(false)
      // Reset the file input
      e.target.value = ""
    }
  }

  // Handle module toggle
  const handleToggleModule = async (moduleName: string, currentStatus: boolean) => {
    const success = await toggleModuleStatus(moduleName, !currentStatus)

    if (success) {
      setMessage({
        type: "success",
        text: t(
          currentStatus ? "modules.disabled_success" : "modules.enabled_success",
          `Module ${currentStatus ? "disabled" : "enabled"} successfully`,
        ),
      })
    } else {
      setMessage({
        type: "error",
        text: t("modules.toggle_error", `Failed to ${currentStatus ? "disable" : "enable"} module`),
      })
    }
  }

  return (
    <Layout title={t("modules")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("modules")}</h1>

          <div className="flex items-center">
            <button
              onClick={() => refreshModules()}
              className="mr-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {t("modules.refresh", "Refresh")}
            </button>

            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
              {uploadingModule ? t("modules.uploading", "Uploading...") : t("modules.upload", "Upload Module")}
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                disabled={uploadingModule || isOffline}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {isOffline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              {t(
                "modules.offline_warning",
                "You are currently offline. Module installation is not available in offline mode.",
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

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : modules.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t("modules.no_modules", "No modules installed")}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t("modules.name", "Name")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t("modules.version", "Version")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t("modules.author", "Author")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t("modules.status", "Status")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t("modules.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modules.map((module) => (
                  <tr key={module.name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{module.name}</div>
                      <div className="text-sm text-gray-500">{module.manifest.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.version}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.manifest.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          module.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {module.enabled ? t("modules.enabled", "Enabled") : t("modules.disabled", "Disabled")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleModule(module.name, module.enabled)}
                        className={`text-${module.enabled ? "red" : "green"}-600 hover:text-${module.enabled ? "red" : "green"}-900`}
                      >
                        {module.enabled ? t("modules.disable", "Disable") : t("modules.enable", "Enable")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
