import type { NextApiRequest, NextApiResponse } from "next"
import { loadModules } from "../../../lib/moduleLoader"
import { verifyToken } from "../../../lib/auth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const user = await verifyToken(req)
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const modules = await loadModules()

    return res.status(200).json({
      modules: modules.map((module) => ({
        name: module.name,
        version: module.version,
        description: module.manifest.description,
        author: module.manifest.author,
        enabled: module.enabled,
        routes: module.manifest.routes,
        permissions: module.manifest.permissions,
      })),
    })
  } catch (error) {
    console.error("Error loading modules:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
