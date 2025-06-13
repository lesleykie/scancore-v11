import type { NextApiRequest } from "next"
import { verify, sign } from "jsonwebtoken"
import { hash, compare } from "bcrypt"
import { query } from "./db"
import { queueOperation, getLocalData } from "./syncService"

// User interface
export interface User {
  id: number
  email: string
  name: string | null
  role: string
}

// Generate JWT token
export function generateToken(user: User): string {
  return sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "default-secret",
    { expiresIn: "7d" },
  )
}

// Verify JWT token from request
export async function verifyToken(req: NextApiRequest): Promise<User | null> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, process.env.JWT_SECRET || "default-secret") as any

    // Get user from database to ensure they still exist and have the same role
    const result = await query<User>("SELECT id, email, name, role FROM users WHERE id = $1", [decoded.userId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

// Compare password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

// Create a new user
export async function createUser(
  email: string,
  password: string,
  name: string,
  role = "user",
  isOffline = false,
): Promise<User> {
  const hashedPassword = await hashPassword(password)

  if (isOffline) {
    // Generate a temporary ID for offline mode
    const tempId = Date.now()
    const userData = { email, password: hashedPassword, name, role }

    // Queue for sync when back online
    await queueOperation("INSERT", "users", undefined, userData)

    // Return a user object with the temporary ID
    return { id: tempId, email, name, role }
  }

  const result = await query<User>(
    "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
    [email, hashedPassword, name, role],
  )

  return result.rows[0]
}

// Get user by email
export async function getUserByEmail(email: string, includeOffline = true): Promise<User | null> {
  try {
    const result = await query<User>("SELECT id, email, name, role FROM users WHERE email = $1", [email])

    if (result.rows.length > 0) {
      return result.rows[0]
    }

    // Check offline data if requested
    if (includeOffline) {
      const localUsers = getLocalData<User & { password: string }>("users")
      const user = Object.values(localUsers).find((u) => u.email === email)

      if (user) {
        return {
          id: Number.parseInt(Object.keys(localUsers).find((key) => localUsers[key].email === email) || "0"),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error getting user by email:", error)

    // If there's a database error, try offline data
    if (includeOffline) {
      const localUsers = getLocalData<User & { password: string }>("users")
      const user = Object.values(localUsers).find((u) => u.email === email)

      if (user) {
        return {
          id: Number.parseInt(Object.keys(localUsers).find((key) => localUsers[key].email === email) || "0"),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }

    return null
  }
}

// Get user by ID
export async function getUserById(id: number, includeOffline = true): Promise<User | null> {
  try {
    const result = await query<User>("SELECT id, email, name, role FROM users WHERE id = $1", [id])

    if (result.rows.length > 0) {
      return result.rows[0]
    }

    // Check offline data if requested
    if (includeOffline) {
      const localUsers = getLocalData<User>("users")
      const user = localUsers[id.toString()]

      if (user) {
        return {
          id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error getting user by ID:", error)

    // If there's a database error, try offline data
    if (includeOffline) {
      const localUsers = getLocalData<User>("users")
      const user = localUsers[id.toString()]

      if (user) {
        return {
          id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }

    return null
  }
}

// Verify user credentials (for login)
export async function verifyCredentials(email: string, password: string, isOffline = false): Promise<User | null> {
  try {
    if (!isOffline) {
      // Online verification
      const result = await query<User & { password: string }>(
        "SELECT id, email, name, role, password FROM users WHERE email = $1",
        [email],
      )

      if (result.rows.length === 0) {
        return null
      }

      const user = result.rows[0]
      const passwordMatch = await comparePassword(password, user.password)

      if (!passwordMatch) {
        return null
      }

      // Store user data locally for offline login
      const { password: _, ...userData } = user
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData))

      return userData
    } else {
      // Offline verification
      const localUsers = getLocalData<User & { password: string }>("users")
      const user = Object.values(localUsers).find((u) => u.email === email)

      if (!user) {
        return null
      }

      const passwordMatch = await comparePassword(password, user.password)

      if (!passwordMatch) {
        return null
      }

      const { password: _, ...userData } = user
      return userData
    }
  } catch (error) {
    console.error("Error verifying credentials:", error)

    // If online verification fails, try offline
    if (!isOffline) {
      return verifyCredentials(email, password, true)
    }

    return null
  }
}
