import { Pool } from "pg"

// Create a singleton pool instance
let pool: Pool

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    })

    // Log connection errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err)
      process.exit(-1)
    })
  }

  return pool
}

// Export a convenience function for queries
export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start

  if (process.env.DEBUG === "true") {
    console.log("Executed query", { text, duration, rows: res.rowCount })
  }

  return res
}

// Initialize database with required tables
export async function initDatabase() {
  try {
    // Create users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create modules table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        version VARCHAR(50) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create settings table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}
