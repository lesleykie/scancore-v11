import { useOffline } from "../../contexts/OfflineContext"

export default function OfflineIndicator() {
  const { isOffline, lastOnline } = useOffline()

  if (!isOffline) return null

  const lastOnlineText = lastOnline ? `Last online: ${lastOnline.toLocaleString()}` : "Not connected recently"

  return (
    <div className="bg-yellow-500 text-white px-4 py-2 text-center">
      <p className="font-bold">You are currently offline</p>
      <p className="text-sm">{lastOnlineText}</p>
    </div>
  )
}
