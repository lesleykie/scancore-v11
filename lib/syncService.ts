import { query } from "./db"
import { v4 as uuidv4 } from "uuid"

// Define the types of operations that can be queued
export type SyncOperation = "INSERT" | "UPDATE" | "DELETE"

// Interface for a sync queue item
export interface SyncQueueItem {
  id?: number
  operation: SyncOperation
  tableName: string
  recordId?: string
  data?: any
  createdAt?: Date
  processed?: boolean
  error?: string
  clientId?: string // Used to identify items created on this client
}

// Save an operation to the sync queue in IndexedDB
export async function queueOperation(
  operation: SyncOperation,
  tableName: string,
  recordId: string | undefined,
  data?: any,
): Promise<string> {
  const clientId = uuidv4() // Generate a unique ID for this operation

  // Store in IndexedDB
  const syncQueue = localStorage.getItem("syncQueue") || "[]"
  const queue = JSON.parse(syncQueue) as SyncQueueItem[]

  const queueItem: SyncQueueItem = {
    operation,
    tableName,
    recordId,
    data,
    createdAt: new Date(),
    processed: false,
    clientId,
  }

  queue.push(queueItem)
  localStorage.setItem("syncQueue", JSON.stringify(queue))

  // Also store the actual data for local access
  if (data) {
    const localData = localStorage.getItem(`local_${tableName}`) || "{}"
    const tableData = JSON.parse(localData)

    if (operation === "INSERT" || operation === "UPDATE") {
      tableData[recordId || clientId] = data
    } else if (operation === "DELETE" && recordId) {
      delete tableData[recordId]
    }

    localStorage.setItem(`local_${tableName}`, JSON.stringify(tableData))
  }

  return clientId
}

// Process the sync queue when online
export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  const syncQueue = localStorage.getItem("syncQueue") || "[]"
  const queue = JSON.parse(syncQueue) as SyncQueueItem[]

  let success = 0
  let failed = 0

  // Process each item in the queue
  for (const item of queue) {
    if (item.processed) continue

    try {
      switch (item.operation) {
        case "INSERT":
          // Generate columns and values for the insert query
          if (item.data) {
            const columns = Object.keys(item.data)
            const values = Object.values(item.data)
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ")

            await query(
              `INSERT INTO ${item.tableName} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
              values,
            )
          }
          break

        case "UPDATE":
          if (item.data && item.recordId) {
            const updates = Object.entries(item.data)
              .map(([key, _], i) => `${key} = $${i + 1}`)
              .join(", ")

            await query(`UPDATE ${item.tableName} SET ${updates} WHERE id = $${Object.keys(item.data).length + 1}`, [
              ...Object.values(item.data),
              item.recordId,
            ])
          }
          break

        case "DELETE":
          if (item.recordId) {
            await query(`DELETE FROM ${item.tableName} WHERE id = $1`, [item.recordId])
          }
          break
      }

      // Mark as processed
      item.processed = true
      success++
    } catch (error) {
      console.error(`Error processing sync item:`, error)
      item.error = error instanceof Error ? error.message : "Unknown error"
      failed++
    }
  }

  // Update the queue in localStorage
  localStorage.setItem("syncQueue", JSON.stringify(queue))

  return { success, failed }
}

// Get local data for a table
export function getLocalData<T = any>(tableName: string): Record<string, T> {
  const localData = localStorage.getItem(`local_${tableName}`) || "{}"
  return JSON.parse(localData)
}

// Clear processed items from the sync queue
export function clearProcessedItems(): void {
  const syncQueue = localStorage.getItem("syncQueue") || "[]"
  const queue = JSON.parse(syncQueue) as SyncQueueItem[]
  const unprocessed = queue.filter((item) => !item.processed)
  localStorage.setItem("syncQueue", JSON.stringify(unprocessed))
}
