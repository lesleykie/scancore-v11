import type { AppProps } from "next/app"
import { appWithTranslation } from "next-i18next"
import { OfflineProvider } from "../contexts/OfflineContext"
import { DebugProvider } from "../contexts/DebugContext"
import { ModuleProvider } from "../contexts/ModuleContext"
import "../styles/globals.css"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DebugProvider>
      <OfflineProvider>
        <ModuleProvider>
          <Component {...pageProps} />
        </ModuleProvider>
      </OfflineProvider>
    </DebugProvider>
  )
}

export default appWithTranslation(MyApp)
