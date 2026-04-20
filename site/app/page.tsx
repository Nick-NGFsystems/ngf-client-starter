import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import { getNgfContent, getItems } from '@/lib/ngf'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const content = await getNgfContent()

  // Brand
  const businessName = content['brand.businessName'] ?? 'Your Business'
  const tagline = content['brand.tagline'] ?? ''
  const primaryColor = content['brand.primaryColor'] ?? '#3B82F6'
  const secondaryColor = content['brand.secondaryColor'] ?? '#1E40AF'

  // Hero
  const heroHeadline = content['hero.headline'] ?? 'Welcome to Our Business'
  const heroSubheadline = content['hero.subheadline'] ?? 'We provide professional services you can trust.'
  const heroCtaText = content['hero.ctaText'] ?? 'Get in Touch'
  const heroCtaLink = content['hero.ctaLink'] ?? '#contact'

  // About
  const aboutTitle = content['about.title'] ?? 'About Us'
  const aboutBody = content['about.body'] ?? 'We are a locally owned business committed to quality and customer satisfaction.'

  // Services
  const servicesTitle = content['services.title'] ?? 'Our Services'
  const services = getItems(content, 'services.items')

  // Gallery
  const galleryTitle = content['gallery.title'] ?? 'Gallery'
  const gallery = getItems(content, 'gallery.photos')

  // Contact
  const contactPhone = content['contact.phone'] ?? ''
  const contactEmail = content['contact.email'] ?? ''
  const contactAddress = content['contact.address'] ?? ''
  const contactHours = content['contact.hours'] ?? ''

  const hasGallery = gallery.length > 0
  const hasServices = services.length > 0

  return (
    <div className="min-h-screen" style={{ color: '#1f2937' }}>
      <SiteHeader businessName={businessName} content={content} primaryColor={primaryColor} />

      {/* Hero */}
      <section
        className="py-24 px-4 text-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${secondaryColor}18)` }}
      >
        <div className="mx-auto max-w-3xl">
          <h1
            data-ngf-field="hero.headline"
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
          >
            {heroHeadline}
          </h1>
          <p
            data-ngf-field="hero.subheadline"
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            {heroSubheadline}
          </p>
          {heroCtaText && (
            <div className="mt-10">
              <Link
                href={heroCtaLink}
                data-ngf-field="hero.ctaText"
                className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {heroCtaText}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2
            data-ngf-field="about.title"
            className="text-3xl font-bold text-gray-900"
          >
            {aboutTitle}
          </h2>
          <p
            data-ngf-field="about.body"
            className="mt-6 text-lg leading-relaxed text-gray-600"
          >
            {aboutBody}
          </p>
        </div>
      </section>

      {/* Services */}
      {hasServices && (
        <section id="services" className="py-20 px-4 bg-gray-50">
          <div className="mx-auto max-w-6xl">
            <h2
              data-ngf-field="services.title"
              className="text-center text-3xl font-bold text-gray-900"
            >
              {servicesTitle}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h3
                    data-ngf-field={`services.items.${i}.title`}
                    className="text-lg font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {svc.title ?? ''}
                  </h3>
                  <p
                    data-ngf-field={`services.items.${i}.description`}
                    className="mt-3 text-sm text-gray-500"
                  >
                    {svc.description ?? ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {hasGallery && (
        <section id="gallery" className="py-20 px-4">
          <div className="mx-auto max-w-6xl">
            <h2
              data-ngf-field="gallery.title"
              className="text-center text-3xl font-bold text-gray-900"
            >
              {galleryTitle}
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
              {gallery.map((photo, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-2xl bg-gray-100"
                >
                  {photo.url && (
                    <img
                      src={photo.url}
                      alt={photo.caption ?? `Photo ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section
        id="contact"
        className="py-20 px-4"
        style={{ backgroundColor: hasGallery ? '#f9fafb' : undefined }}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contactPhone && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</p>
                <p data-ngf-field="contact.phone" className="mt-1 text-gray-900">{contactPhone}</p>
              </div>
            )}
            {contactEmail && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                <p data-ngf-field="contact.email" className="mt-1 text-gray-900">{contactEmail}</p>
              </div>
            )}
            {contactAddress && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Address</p>
                <p data-ngf-field="contact.address" className="mt-1 whitespace-pre-line text-gray-900">{contactAddress}</p>
              </div>
            )}
            {contactHours && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hours</p>
                <p data-ngf-field="contact.hours" className="mt-1 whitespace-pre-line text-gray-900">{contactHours}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-4 text-center text-sm text-white"
        style={{ backgroundColor: secondaryColor }}
      >
        <p data-ngf-field="brand.businessName" className="font-semibold">{businessName}</p>
        {tagline && (
          <p data-ngf-field="brand.tagline" className="mt-1 opacity-75">{tagline}</p>
        )}
        <p className="mt-4 text-xs opacity-50">
          &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
