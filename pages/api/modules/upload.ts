import type { NextApiRequest, NextApiResponse } from "next"
import formidable from "formidable"
import fs from "fs"
import path from "path"
import { installModule } from "../../../lib/moduleLoader"
import { verifyToken } from "../../../lib/auth"

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const user = await verifyToken(req)
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Parse the form data
    const form = formidable({
      uploadDir: path.join(process.cwd(), "tmp"),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    })

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    // Check if module file was provided
    const moduleFile = files.module as formidable.File
    if (!moduleFile) {
      return res.status(400).json({ message: "No module file provided" })
    }

    // Install the module
    const result = await installModule(moduleFile.filepath)

    // Clean up the temporary file
    fs.unlinkSync(moduleFile.filepath)

    if (!result.success) {
      return res.status(400).json({ message: result.error || "Failed to install module" })
    }

    return res.status(200).json({
      message: "Module installed successfully",
      module: {
        name: result.module?.name,
        version: result.module?.version,
      },
    })
  } catch (error) {
    console.error("Error uploading module:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
