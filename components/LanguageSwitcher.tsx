"use client"

import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import { useState } from "react"

export default function LanguageSwitcher() {
  const router = useRouter()
  const { t } = useTranslation("common")
  const [isOpen, setIsOpen] = useState(false)

  const { pathname, asPath, query } = router
  const currentLocale = router.locale || "en"

  const changeLanguage = (locale: string) => {
    router.push({ pathname, query }, asPath, { locale })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        {currentLocale === "en" ? t("english") : t("dutch")}
        <svg
          className="w-5 h-5 ml-2 -mr-1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-40 bg-white rounded-md shadow-lg">
          <div className="py-1">
            <button
              onClick={() => changeLanguage("en")}
              className={`block w-full text-left px-4 py-2 text-sm ${currentLocale === "en" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {t("english")}
            </button>
            <button
              onClick={() => changeLanguage("nl")}
              className={`block w-full text-left px-4 py-2 text-sm ${currentLocale === "nl" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {t("dutch")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
