import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cost Management Hub - SLB",
  description: "Purchase Order mapping and project cost tracking for SLB",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
