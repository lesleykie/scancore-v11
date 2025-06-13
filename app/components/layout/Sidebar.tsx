"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"

export default function Sidebar() {
  const router = useRouter()
  const { t } = useTranslation("common")

  const isActive = (path: string) => router.pathname === path

  const menuItems = [
    { path: "/", label: t("dashboard", "Dashboard"), icon: "📊" },
    { path: "/scan", label: t("scanBarcode", "Scan Barcode"), icon: "📷" },
    { path: "/modules", label: t("modules", "Modules"), icon: "🧩" },
    { path: "/settings", label: t("settings", "Settings"), icon: "⚙️" },
  ]

  return (
    <aside className="w-64 bg-white shadow-md">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center p-2 rounded-md ${
                  isActive(item.path) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
