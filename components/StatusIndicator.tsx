import { useOffline } from "../contexts/OfflineContext"
import { useTranslation } from "next-i18next"

export default function StatusIndicator() {
  const { isOffline, lastOnline, isPendingSync, pendingSyncCount } = useOffline()
  const { t } = useTranslation("common")

  const formatLastOnline = (date: Date | null) => {
    if (!date) return ""
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className={`rounded-md px-4 py-2 shadow-lg flex items-center space-x-2 ${
          isOffline
            ? "bg-yellow-100 text-yellow-800"
            : isPendingSync
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            isOffline ? "bg-yellow-500" : isPendingSync ? "bg-blue-500 animate-pulse" : "bg-green-500"
          }`}
        ></div>
        <div>
          {isOffline ? (
            <div>
              <p className="font-medium">{t("status.offline")}</p>
              {lastOnline && (
                <p className="text-xs">
                  {t("status.last_online")}: {formatLastOnline(lastOnline)}
                </p>
              )}
            </div>
          ) : isPendingSync ? (
            <div>
              <p className="font-medium">{t("status.syncing")}</p>
              <p className="text-xs">
                {pendingSyncCount} {pendingSyncCount === 1 ? "item" : "items"}
              </p>
            </div>
          ) : (
            <p className="font-medium">{t("status.online")}</p>
          )}
        </div>
      </div>
    </div>
  )
}
