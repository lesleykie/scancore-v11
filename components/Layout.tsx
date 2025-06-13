"use client"

import type { ReactNode } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import LanguageSwitcher from "./LanguageSwitcher"
import StatusIndicator from "./StatusIndicator"

interface LayoutProps {
  children: ReactNode
  title?: string
}

export default function Layout({ children, title }: LayoutProps) {
  const { t } = useTranslation("common")
  const router = useRouter()

  const navigation = [
    { name: t("dashboard"), href: "/" },
    { name: t("scan"), href: "/scan" },
    { name: t("modules"), href: "/modules" },
    { name: t("settings"), href: "/settings" },
    { name: t("debug"), href: "/debug" },
  ]

  const isActive = (path: string) => {
    return router.pathname === path
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} | ${t("app_name")}` : t("app_name")}</title>
        <meta name="description" content="ScanCore CMS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-blue-600">
                    {t("app_name")}
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive(item.href)
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <StatusIndicator />
      </div>
    </>
  )
}
