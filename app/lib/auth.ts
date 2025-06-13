import type { NextApiRequest } from "next"
import { verify, sign } from "jsonwebtoken"
import { hash, compare } from "bcrypt"
import { query } from "./db"

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
    const result = await query("SELECT id, email, name, role FROM users WHERE id = $1", [decoded.userId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as User
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
export async function createUser(email: string, password: string, name: string, role = "user"): Promise<User> {
  const hashedPassword = await hashPassword(password)

  const result = await query(
    "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
    [email, hashedPassword, name, role],
  )

  return result.rows[0] as User
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query("SELECT id, email, name, role FROM users WHERE email = $1", [email])

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as User
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  const result = await query("SELECT id, email, name, role FROM users WHERE id = $1", [id])

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as User
}
