module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "nl"],
    localePath: "./public/locales",
    localeDetection: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
