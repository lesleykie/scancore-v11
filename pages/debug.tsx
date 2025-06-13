"use client"

import { useTranslation } from "next-i18next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import type { GetServerSideProps } from "next"
import { useDebug } from "../contexts/DebugContext"
import { useOffline } from "../contexts/OfflineContext"
import Layout from "../components/Layout"

export default function DebugPage() {
  const { t } = useTranslation("common")
  const { isDebugEnabled, logs, clearLogs, systemInfo } = useDebug()
  const { isOffline, lastOnline, isPendingSync, pendingSyncCount } = useOffline()

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    }).format(date)
  }

  // Get log level style
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600"
      case "warning":
        return "text-yellow-600"
      case "debug":
        return "text-purple-600"
      default:
        return "text-blue-600"
    }
  }

  // Calculate storage usage
  const getStorageUsage = () => {
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ""
        totalSize += key.length + value.length
      }
    }
    return (totalSize / 1024).toFixed(2) + " KB"
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("debug_page.title")}</h1>

        {!isDebugEnabled && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">Debug mode is currently disabled. Some information may not be available.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* System Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t("debug_page.system_info")}</h2>
            <dl className="space-y-2">
              {Object.entries(systemInfo).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">{key}</dt>
                  <dd className="text-sm text-gray-900 col-span-2 break-all">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Connection Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t("debug_page.connection_status")}</h2>
            <dl className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm col-span-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isOffline ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isOffline ? t("status.offline") : t("status.online")}
                  </span>
                </dd>
              </div>

              {lastOnline && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">{t("status.last_online")}</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{lastOnline.toLocaleString()}</dd>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">{t("debug_page.pending_sync")}</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {isPendingSync ? (
                    <span className="text-blue-600">{pendingSyncCount} items</span>
                  ) : (
                    <span className="text-green-600">No pending items</span>
                  )}
                </dd>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">{t("debug_page.storage_usage")}</dt>
                <dd className="text-sm text-gray-900 col-span-2">{getStorageUsage()}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Application Logs */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t("debug_page.logs")}</h2>
            <button onClick={clearLogs} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
              {t("debug_page.clear_logs")}
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-gray-500">{t("debug_page.no_logs")}</p>
          ) : (
            <div className="overflow-auto max-h-96 border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Level
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(log.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`${getLogLevelStyle(log.level)} font-medium`}>{log.level.toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.message}
                        {log.details && (
                          <details className="mt-1">
                            <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
