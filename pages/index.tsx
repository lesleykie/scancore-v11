"use client"

import { useTranslation } from "next-i18next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import type { GetServerSideProps } from "next"
import Layout from "../components/Layout"
import { useDebug } from "../contexts/DebugContext"
import { useOffline } from "../contexts/OfflineContext"
import { useEffect } from "react"

export default function HomePage() {
  const { t } = useTranslation("common")
  const { addLog } = useDebug()
  const { isOffline } = useOffline()

  useEffect(() => {
    // Add a log entry when the page loads
    addLog("Home page loaded", "info")
  }, [addLog])

  return (
    <Layout title={t("welcome")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">{t("welcome")}</h1>

        {isOffline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{t("offline.message")}</p>
                <p className="mt-2 text-sm text-yellow-700">{t("offline.stored_data")}</p>
                <p className="mt-1 text-sm text-yellow-700">{t("offline.will_sync")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard cards would go here */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Scan</h2>
            <p className="text-gray-500">Scan barcodes and QR codes</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Modules</h2>
            <p className="text-gray-500">Manage and configure modules</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-500">Configure application settings</p>
          </div>
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
