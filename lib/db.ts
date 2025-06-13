import { Pool, type PoolClient } from "pg"

// Create a singleton pool instance
let pool: Pool | null = null

// Initialize the database connection pool
export function initPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    })

    // Log connection errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err)
      // Don't exit in production, just log the error
      if (process.env.NODE_ENV === "development") {
        process.exit(-1)
      }
    })
  }

  return pool
}

// Get the pool instance
export function getPool(): Pool {
  return pool || initPool()
}

// Execute a query with timing and logging
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool()
  const start = Date.now()

  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start

    if (process.env.DEBUG === "true") {
      console.log("Executed query", { text, duration, rows: res.rowCount })
    }

    return res
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Transaction helper
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Initialize database with required tables
export async function initDatabase(): Promise<void> {
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

    // Create scans table for barcode scanning
    await query(`
      CREATE TABLE IF NOT EXISTS scans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        barcode TEXT NOT NULL,
        barcode_type VARCHAR(50),
        scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        synced BOOLEAN DEFAULT true
      )
    `)

    // Create sync_queue table for offline operations
    await query(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id SERIAL PRIMARY KEY,
        operation VARCHAR(50) NOT NULL,
        table_name VARCHAR(255) NOT NULL,
        record_id VARCHAR(255),
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT false,
        error TEXT
      )
    `)

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}
