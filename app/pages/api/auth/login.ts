import type { NextApiRequest, NextApiResponse } from "next"
import { query } from "../../../lib/db"
import { comparePassword, generateToken } from "../../../lib/auth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  try {
    // Get user from database
    const result = await query("SELECT id, email, password, name, role FROM users WHERE email = $1", [email])

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    // Return user info and token
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
