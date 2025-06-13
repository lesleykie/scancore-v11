"use client"

import Link from "next/link"
import { useAuth } from "../../contexts/AuthContext"
import { useTranslation } from "next-i18next"

export default function Header() {
  const { user, logout } = useAuth()
  const { t } = useTranslation("common")

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl text-blue-600">
            ScanCore CMS
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">{user?.name || user?.email}</span>
          <button onClick={logout} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm">
            {t("logout", "Logout")}
          </button>
        </div>
      </div>
    </header>
  )
}
