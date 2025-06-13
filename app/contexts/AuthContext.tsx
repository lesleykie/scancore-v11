"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/router"
import { useOffline } from "./OfflineContext"

interface User {
  id: number
  email: string
  name: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isOffline } = useOffline()

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setError(null)

      // Handle offline login
      if (isOffline) {
        const storedUser = localStorage.getItem("user")
        const storedEmail = storedUser ? JSON.parse(storedUser).email : null

        if (storedEmail === email) {
          // In a real app, you'd need to verify the password hash offline
          // This is a simplified example
          const user = JSON.parse(storedUser!)
          setUser(user)
          return user
        } else {
          throw new Error("Cannot login with new credentials while offline")
        }
      }

      // Online login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Login failed")
      }

      const data = await res.json()

      // Store user and token
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)

      setUser(data.user)
      return data.user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
