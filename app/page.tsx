import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import { getNgfContent, getItems, ngfEndpoints } from '@/lib/ngf'
import LeadForm from '@/components/LeadForm'

// Placeholder rows for the repeatable groups below. These exist so the group
// containers are ALWAYS present in the rendered HTML — the portal scrapes this
// page to build the editor sidebar, and an absent container means the client
// has no "+ Add" button and can never create their first item. Replace the copy
// with the client's real services during scaffolding; once they publish, their
// content replaces these entirely.
const DEFAULT_SERVICES = [
  { title: 'First Service',  description: 'Describe this service in a sentence or two.' },
  { title: 'Second Service', description: 'Describe this service in a sentence or two.' },
  { title: 'Third Service',  description: 'Describe this service in a sentence or two.' },
]

const DEFAULT_GALLERY = [
  { url: '', caption: 'Add a photo' },
  { url: '', caption: 'Add a photo' },
  { url: '', caption: 'Add a photo' },
]

// Neutral grey tile shown until a real photo is set. Inline data-URI so an empty
// gallery still renders a clickable <img> the editor can target — an <img> that
// isn't rendered can't be clicked, and the client could never set the first photo.
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
      '<rect width="400" height="400" fill="#e5e7eb"/>' +
      '<text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" ' +
      'font-family="system-ui,sans-serif" font-size="20">Click to set image</text>' +
      '</svg>',
  )

export default async function HomePage() {
  const content = await getNgfContent()
  const { base: ngfBase, domain: ngfDomain } = ngfEndpoints()

  // Brand
  const businessName  = content['brand.businessName']  || 'Your Business'
  const tagline       = content['brand.tagline']       || ''
  const primaryColor  = content['brand.primaryColor']  || '#3B82F6'
  const secondaryColor = content['brand.secondaryColor'] || '#1E40AF'

  // Hero
  const heroHeadline    = content['hero.headline']    || 'Welcome to Our Business'
  const heroSubheadline = content['hero.subheadline'] || 'We provide professional services you can trust.'
  const heroCtaText     = content['hero.ctaText']     || 'Get in Touch'
  const heroCtaLink     = content['hero.ctaLink']     || '#contact'

  // About
  const aboutTitle = content['about.title'] || 'About Us'
  const aboutBody  = content['about.body']  || 'We are a locally owned business committed to quality and customer satisfaction.'
  // Toggle: the client can hide this whole section from the editor. '' / 'true'
  // => shown (default), 'false' => hidden. Always render the element so the
  // editor can reveal + dim it; CSS/inline display drives live visibility.
  const aboutHidden = content['about.visible'] === 'false'

  // Services
  const servicesTitle = content['services.title'] || 'Our Services'
  const services      = getItems(content, 'services.items')

  // Gallery
  const galleryTitle = content['gallery.title'] || 'Gallery'
  const gallery      = getItems(content, 'gallery.photos')

  // Contact
  const contactPhone   = content['contact.phone']   || ''
  const contactEmail   = content['contact.email']   || ''
  const contactAddress = content['contact.address'] || ''
  const contactHours   = content['contact.hours']   || ''

  // NEVER gate an annotated section on content being non-empty. The portal
  // builds its editor sidebar by scraping this page's HTML — a section hidden
  // behind `{items.length > 0 && …}` simply is not in the HTML, so the group
  // never appears in the editor and a brand-new client can never add their
  // first card without a code change. Always render, and fall back to these
  // placeholders so the scraper always sees a populated group.
  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES
  const displayGallery  = gallery.length  > 0 ? gallery  : DEFAULT_GALLERY

  return (
    <div className="min-h-screen" style={{ color: '#1f2937' }}>
      <SiteHeader businessName={businessName} content={content} primaryColor={primaryColor} />

      {/* ── Hero ── */}
      <section
        id="hero"
        data-ngf-section="Hero"
        className="py-24 px-4 text-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${secondaryColor}18)` }}
      >
        <div className="mx-auto max-w-3xl">
          <h1
            data-ngf-field="hero.headline"
            data-ngf-label="Headline"
            data-ngf-type="text"
            data-ngf-section="Hero"
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
          >
            {heroHeadline}
          </h1>
          <p
            data-ngf-field="hero.subheadline"
            data-ngf-label="Subheadline"
            data-ngf-type="textarea"
            data-ngf-section="Hero"
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            {heroSubheadline}
          </p>
          {heroCtaText && (
            <div className="mt-10">
              <Link
                href={heroCtaLink}
                data-ngf-field="hero.ctaText"
                data-ngf-label="Button Text"
                data-ngf-type="text"
                data-ngf-section="Hero"
                className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {heroCtaText}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── About (toggle-able: client can show/hide this whole section) ── */}
      <section
        id="about"
        data-ngf-field="about.visible"
        data-ngf-label="Show About Section"
        data-ngf-type="toggle"
        data-ngf-section="About"
        className="py-20 px-4"
        style={aboutHidden ? { display: 'none' } : undefined}
      >
        <div className="mx-auto max-w-4xl">
          <h2
            data-ngf-field="about.title"
            data-ngf-label="Title"
            data-ngf-type="text"
            data-ngf-section="About"
            className="text-3xl font-bold text-gray-900"
          >
            {aboutTitle}
          </h2>
          <p
            data-ngf-field="about.body"
            data-ngf-label="Body Text"
            data-ngf-type="textarea"
            data-ngf-section="About"
            className="mt-6 text-lg leading-relaxed text-gray-600"
          >
            {aboutBody}
          </p>
        </div>
      </section>

      {/* ── Services ── */}
      <section
          id="services"
          data-ngf-section="Services"
          className="py-20 px-4 bg-gray-50"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              data-ngf-field="services.title"
              data-ngf-label="Section Title"
              data-ngf-type="text"
              data-ngf-section="Services"
              className="text-center text-3xl font-bold text-gray-900"
            >
              {servicesTitle}
            </h2>

            {/* Repeatable group */}
            <div
              data-ngf-group="services.items"
              data-ngf-item-label="Service"
              data-ngf-min-items="1"
              data-ngf-max-items="12"
              data-ngf-item-fields='[{"key":"title","label":"Service Name","type":"text"},{"key":"description","label":"Description","type":"textarea"}]'
              className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {displayServices.map((svc, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3
                    data-ngf-field={`services.items.${i}.title`}
                    data-ngf-label="Service Name"
                    data-ngf-type="text"
                    data-ngf-section="Services"
                    className="text-lg font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {svc.title ?? ''}
                  </h3>
                  <p
                    data-ngf-field={`services.items.${i}.description`}
                    data-ngf-label="Description"
                    data-ngf-type="textarea"
                    data-ngf-section="Services"
                    className="mt-3 text-sm text-gray-500"
                  >
                    {svc.description ?? ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ── Gallery ── */}
      <section
          id="gallery"
          data-ngf-section="Gallery"
          className="py-20 px-4"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              data-ngf-field="gallery.title"
              data-ngf-label="Section Title"
              data-ngf-type="text"
              data-ngf-section="Gallery"
              className="text-center text-3xl font-bold text-gray-900"
            >
              {galleryTitle}
            </h2>

            {/* Repeatable group */}
            <div
              data-ngf-group="gallery.photos"
              data-ngf-item-label="Photo"
              data-ngf-min-items="0"
              data-ngf-max-items="20"
              data-ngf-item-fields='[{"key":"url","label":"Image URL","type":"image"},{"key":"caption","label":"Caption","type":"text"}]'
              className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3"
            >
              {displayGallery.map((photo, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                  {/* Every sub-field declared in data-ngf-item-fields must ALSO be
                      annotated on a real element, or the editor can list it in the
                      sidebar while the bridge has nothing to patch — edits appear to
                      do nothing in the live preview. Render the <img> unconditionally
                      for the same reason the section is unconditional. */}
                  <img
                    src={photo.url || PLACEHOLDER_IMAGE}
                    alt={photo.caption || `Photo ${i + 1}`}
                    data-ngf-field={`gallery.photos.${i}.url`}
                    data-ngf-label="Photo"
                    data-ngf-type="image"
                    data-ngf-section="Gallery"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <span
                    data-ngf-field={`gallery.photos.${i}.caption`}
                    data-ngf-label="Caption"
                    data-ngf-type="text"
                    data-ngf-section="Gallery"
                    className="sr-only"
                  >
                    {photo.caption || `Photo ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ── Contact ── */}
      <section
        id="contact"
        data-ngf-section="Contact"
        className="py-20 px-4"
        style={{ backgroundColor: '#f9fafb' }}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contactPhone && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</p>
                <p
                  data-ngf-field="contact.phone"
                  data-ngf-label="Phone"
                  data-ngf-type="text"
                  data-ngf-section="Contact"
                  className="mt-1 text-gray-900"
                >
                  {contactPhone}
                </p>
              </div>
            )}
            {contactEmail && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                <p
                  data-ngf-field="contact.email"
                  data-ngf-label="Email"
                  data-ngf-type="text"
                  data-ngf-section="Contact"
                  className="mt-1 text-gray-900"
                >
                  {contactEmail}
                </p>
              </div>
            )}
            {contactAddress && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Address</p>
                <p
                  data-ngf-field="contact.address"
                  data-ngf-label="Address"
                  data-ngf-type="textarea"
                  data-ngf-section="Contact"
                  className="mt-1 whitespace-pre-line text-gray-900"
                >
                  {contactAddress}
                </p>
              </div>
            )}
            {contactHours && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hours</p>
                <p
                  data-ngf-field="contact.hours"
                  data-ngf-label="Hours"
                  data-ngf-type="textarea"
                  data-ngf-section="Contact"
                  className="mt-1 whitespace-pre-line text-gray-900"
                >
                  {contactHours}
                </p>
              </div>
            )}
          </div>

          {/* Lead capture — posts to the central NGF lead store (persist-first),
              and lands in the client's portal under Form Submissions. Do NOT
              replace this with a bespoke /api/contact route: that is exactly
              how sites ended up email-only and losing leads. */}
          <div className="mx-auto mt-10 max-w-2xl">
            <LeadForm base={ngfBase} domain={ngfDomain} formType="contact" />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="footer"
        data-ngf-section="Footer"
        className="py-10 px-4 text-center text-sm text-white"
        style={{ backgroundColor: secondaryColor }}
      >
        <p
          data-ngf-field="brand.businessName"
          data-ngf-label="Business Name"
          data-ngf-type="text"
          data-ngf-section="Brand"
          className="font-semibold"
        >
          {businessName}
        </p>
        {tagline && (
          <p
            data-ngf-field="brand.tagline"
            data-ngf-label="Tagline"
            data-ngf-type="text"
            data-ngf-section="Brand"
            className="mt-1 opacity-75"
          >
            {tagline}
          </p>
        )}
        <p className="mt-4 text-xs opacity-50">
          {`© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
        </p>
        <p className="mt-2 text-xs opacity-70">
          <Link href="/privacy" className="underline hover:opacity-100">Privacy &amp; Cookie Policy</Link>
        </p>
      </footer>
    </div>
  )
}
