"use client"

import { useState } from "react"
import { useDebug } from "../../contexts/DebugContext"

export default function DebugPanel() {
  const { isDebugEnabled, toggleDebug, logs, clearLogs } = useDebug()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isDebugEnabled) {
    return (
      <button
        onClick={toggleDebug}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg"
        title="Enable Debug Mode"
      >
        🐞
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-0 right-0 bg-gray-900 text-white transition-all duration-300 shadow-lg ${
        isExpanded ? "w-96 h-64" : "w-32 h-10"
      }`}
    >
      <div className="flex justify-between items-center p-2 border-b border-gray-700">
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
          {isExpanded ? "Collapse" : "Expand"} Debug Panel
        </button>
        <div className="flex space-x-2">
          <button onClick={clearLogs} className="text-xs text-gray-400 hover:text-white">
            Clear
          </button>
          <button onClick={toggleDebug} className="text-xs text-gray-400 hover:text-white">
            Disable
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-2 h-[calc(100%-32px)] overflow-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-xs">No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 text-xs">
                <span className="text-gray-400">{log.timestamp.toLocaleTimeString()}: </span>
                <span
                  className={
                    log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-yellow-400" : "text-green-400"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
