"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../../contexts/AuthContext"
import Header from "./Header"
import Sidebar from "./Sidebar"
import Footer from "./Footer"
import DebugPanel from "../debug/DebugPanel"
import OfflineIndicator from "../core/OfflineIndicator"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(router.pathname)

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If not authenticated and not on a public route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    if (typeof window !== "undefined") {
      router.push("/login")
    }
    return null
  }

  // Public route layout
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OfflineIndicator />
        <div className="container mx-auto py-8 px-4">{children}</div>
        <DebugPanel />
      </div>
    )
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OfflineIndicator />
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
      <Footer />
      <DebugPanel />
    </div>
  )
}
