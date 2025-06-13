import type { NextApiRequest, NextApiResponse } from "next"
import { createUser, getUserByEmail } from "../../../lib/auth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    // Create user
    const newUser = await createUser(email, password, name || "")

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
