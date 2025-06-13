"use client"

import type { GetServerSideProps } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { useTranslation } from "next-i18next"
import { useAuth } from "../contexts/AuthContext"
import { useOffline } from "../contexts/OfflineContext"

export default function Home() {
  const { t } = useTranslation("common")
  const { user } = useAuth()
  const { isOffline } = useOffline()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {t("welcome")}, {user?.name || user?.email}
      </h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("systemStatus")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">{t("connectionStatus")}</p>
            <p className={`font-medium ${isOffline ? "text-yellow-600" : "text-green-600"}`}>
              {isOffline ? t("offline") : t("online")}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">{t("userRole")}</p>
            <p className="font-medium">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t("quickActions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button className="bg-blue-50 hover:bg-blue-100 p-4 rounded-md text-left">
            <h3 className="font-medium text-blue-700">{t("scanBarcode")}</h3>
            <p className="text-sm text-gray-500">{t("scanBarcodeDesc")}</p>
          </button>
          <button className="bg-green-50 hover:bg-green-100 p-4 rounded-md text-left">
            <h3 className="font-medium text-green-700">{t("manageModules")}</h3>
            <p className="text-sm text-gray-500">{t("manageModulesDesc")}</p>
          </button>
          <button className="bg-purple-50 hover:bg-purple-100 p-4 rounded-md text-left">
            <h3 className="font-medium text-purple-700">{t("systemSettings")}</h3>
            <p className="text-sm text-gray-500">{t("systemSettingsDesc")}</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
    },
  }
}
