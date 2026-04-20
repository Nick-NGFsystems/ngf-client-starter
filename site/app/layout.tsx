import type { Metadata } from 'next'
import NgfEditBridge from '@/components/NgfEditBridge'
import './globals.css'

export const metadata: Metadata = {
  title: 'Client Site',
  description: '',
  other: {
    'ngf-public-api': 'https://app.ngfsystems.com/api/public/content',
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
