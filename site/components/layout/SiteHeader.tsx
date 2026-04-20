import Link from 'next/link'
import type { NgfSiteContent } from '@/lib/ngf'

interface SiteHeaderProps {
  businessName: string
  content: NgfSiteContent
  primaryColor: string
}

export default function SiteHeader({ businessName, content, primaryColor }: SiteHeaderProps) {
  const hasGallery = Object.keys(content).some(k => k.startsWith('gallery.photos.'))
  const hasServices = Object.keys(content).some(k => k.startsWith('services.items.'))

  return (
    <header style={{ backgroundColor: primaryColor }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-white" data-ngf-field="brand.businessName">
          {businessName}
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/90">
          <Link href="#about" className="hover:text-white transition-colors">About</Link>
          {hasServices && <Link href="#services" className="hover:text-white transition-colors">Services</Link>}
          {hasGallery && <Link href="#gallery" className="hover:text-white transition-colors">Gallery</Link>}
          <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
        </nav>
      </div>
    </header>
  )
}
