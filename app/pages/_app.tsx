"use client"

import type { AppProps } from "next/app"
import { useEffect, useState } from "react"
import { appWithTranslation } from "next-i18next"
import { AuthProvider } from "../contexts/AuthContext"
import { ModuleProvider } from "../contexts/ModuleContext"
import { OfflineProvider } from "../contexts/OfflineContext"
import { DebugProvider } from "../contexts/DebugContext"
import Layout from "../components/layout/Layout"
import "../styles/globals.css"

function MyApp({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false)

  // Register service worker for offline functionality
  useEffect(() => {
    setIsClient(true)

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("Service Worker registered with scope:", registration.scope)
          },
          (err) => {
            console.error("Service Worker registration failed:", err)
          },
        )
      })
    }
  }, [])

  return (
    <DebugProvider>
      <OfflineProvider>
        <AuthProvider>
          <ModuleProvider>
            <Layout>{isClient && <Component {...pageProps} />}</Layout>
          </ModuleProvider>
        </AuthProvider>
      </OfflineProvider>
    </DebugProvider>
  )
}

export default appWithTranslation(MyApp)
