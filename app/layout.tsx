import type { Metadata } from 'next'
import NgfEditBridge from '@/components/NgfEditBridge'
import CookieConsent from '@/components/CookieConsent'
import './globals.css'

export const metadata: Metadata = {
  title: 'Client Site',
  description: '',
  other: {
    'ngf-public-api': 'https://app.ngfsystems.com/api/public/content',
    'ngf-template-id': 'generic',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        <NgfEditBridge />
        {children}
        {/* Only shows when NEXT_PUBLIC_COOKIE_ANALYTICS=1 (site loads cookie-based
            analytics). Gate GA/Clarity/etc. behind hasCookieConsent(). */}
        <CookieConsent />
      </body>
    </html>
  )
}
