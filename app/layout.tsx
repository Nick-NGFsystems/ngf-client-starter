import type { Metadata } from 'next'
import NgfEditBridge from '@/components/NgfEditBridge'
import './globals.css'

export const metadata: Metadata = {
  title: 'Client Site',
  description: '',
  // Google Search Console verification (HTML-tag method). Set
  // GOOGLE_SITE_VERIFICATION in Vercel to the token Google gives you and
  // redeploy — no code edit needed. Omit it entirely when the property was
  // verified by DNS TXT, which is the preferred method (see NGF-STANDARDS
  // "Google Search Console — per-site setup runbook"). Server-rendered, so it
  // deliberately does NOT need the NEXT_PUBLIC_ prefix.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
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
      </body>
    </html>
  )
}
