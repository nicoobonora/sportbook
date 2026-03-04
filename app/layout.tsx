import type { Metadata } from "next"
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-barlow",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SportBook",
  description: "Piattaforma per circoli sportivi italiani",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body
        className={`${barlow.variable} ${inter.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        {/* Skip link per accessibilità WCAG 2.1 */}
        <a href="#main-content" className="skip-link">
          Salta al contenuto principale
        </a>
        {children}
      </body>
    </html>
  )
}
