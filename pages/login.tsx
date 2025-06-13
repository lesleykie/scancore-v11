"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { useTranslation } from "next-i18next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import type { GetServerSideProps } from "next"
import { verifyCredentials, generateToken } from "../lib/auth"
import { useOffline } from "../contexts/OfflineContext"
import { useDebug } from "../contexts/DebugContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isOffline } = useOffline()
  const { addLog } = useDebug()
  const router = useRouter()
  const { t } = useTranslation("common")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Verify credentials
      const user = await verifyCredentials(email, password, isOffline)

      if (!user) {
        throw new Error(t("login.invalid_credentials", "Invalid email or password"))
      }

      // Generate token
      const token = generateToken(user)

      // Store user and token
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", token)

      addLog("User logged in", "info", { email: user.email, role: user.role })

      // Redirect to dashboard
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      addLog("Login failed", "error", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("login.title", "Sign in to your account")}
          </h2>
          {isOffline && (
            <p className="mt-2 text-center text-sm text-yellow-600">
              {t("login.offline_message", "You are offline. You can only sign in with previously used credentials.")}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t("login.email", "Email address")}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("login.email", "Email address")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t("login.password", "Password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("login.password", "Password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? t("login.signing_in", "Signing in...") : t("login.sign_in", "Sign in")}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t("login.register_link", "Don't have an account? Register")}
            </Link>
          </div>
        </form>
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
