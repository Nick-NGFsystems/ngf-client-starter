'use client'

import { useCallback, useEffect, useState } from 'react'

// Self-contained booking widget for a client site. Calls the NGF public
// availability + bookings endpoints directly from the browser (they send CORS
// `*`). Drop <BookingWidget base={...} domain={...} /> anywhere — the values
// come from lib/ngf.ts `ngfEndpoints()` on the server. Styling uses neutral
// Tailwind so it inherits the site's look; restyle freely per client.

interface Service { id: string; name: string; duration_min: number; price_cents: number | null }
interface Slot { startUtc: string; label: string }

function todayInputValue(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BookingWidget({ base, domain }: { base: string; domain: string }) {
  const [timezone, setTimezone] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(todayInputValue())
  const [slots, setSlots] = useState<Slot[]>([])
  const [slot, setSlot] = useState<Slot | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [gotcha, setGotcha] = useState('') // honeypot

  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ label: string } | null>(null)

  // Load services + timezone once.
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${base}/api/public/availability?domain=${encodeURIComponent(domain)}`)
        const json = await res.json()
        setTimezone(json.timezone ?? null)
        setServices(json.services ?? [])
        if (json.services?.[0]) setServiceId(json.services[0].id)
      } catch {
        setError('Could not load booking options. Please try again later.')
      }
    })()
  }, [base, domain])

  // (Re)load slots when service or date changes.
  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return
    setLoadingSlots(true)
    setSlot(null)
    setError(null)
    try {
      const res = await fetch(`${base}/api/public/availability?domain=${encodeURIComponent(domain)}&date=${date}&serviceId=${serviceId}`)
      const json = await res.json()
      setSlots(json.slots ?? [])
    } catch {
      setError('Could not load available times.')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [base, domain, serviceId, date])

  useEffect(() => { void loadSlots() }, [loadSlots])

  const submit = async () => {
    if (!slot || !serviceId) return
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim() && !phone.trim()) { setError('Please add an email or phone number.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${base}/api/public/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          serviceId,
          startUtc: slot.startUtc,
          customer: { name, email, phone },
          notes,
          _gotcha: gotcha,
        }),
      })
      const json = await res.json()
      if (res.status === 409) {
        // Refresh the grid FIRST, then set the message. loadSlots() opens with
        // setError(null), so setting it beforehand wiped the only explanation the
        // customer ever gets — they just saw the form collapse and the times
        // reshuffle, with no idea their slot had gone.
        await loadSlots()
        setError(json.error || 'That time was just taken. Please pick another.')
        return
      }
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not book. Please try again.')
      setConfirmed({ label: json.appointment?.label ? `${date} at ${json.appointment.label}` : date })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not book. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <h3 className="text-xl font-semibold text-green-800">You&apos;re booked!</h3>
        <p className="mt-2 text-green-700">Your appointment is confirmed for {confirmed.label}.</p>
        {email && <p className="mt-1 text-sm text-green-600">A confirmation has been sent to {email}.</p>}
      </div>
    )
  }

  const selectedService = services.find((s) => s.id === serviceId)

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {services.length === 0 ? (
        <p className="text-center text-sm text-gray-500">Online booking isn&apos;t available right now.</p>
      ) : (
        <div className="space-y-5">
          {/* Service */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Service</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.price_cents != null ? ` — $${(s.price_cents / 100).toFixed(2)}` : ''} ({s.duration_min} min)
                </option>
              ))}
            </select>
          </label>

          {/* Date */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Date</span>
            <input type="date" min={todayInputValue()} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>

          {/* Slots */}
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Available times {timezone ? <span className="font-normal text-gray-400">({timezone})</span> : null}
            </span>
            {loadingSlots ? (
              <p className="text-sm text-gray-400">Loading times…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400">No open times that day — try another date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.startUtc}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`rounded-lg border px-2 py-2 text-sm transition ${
                      slot?.startUtc === s.startUtc ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          {slot && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-600">
                {selectedService?.name} · {date} at <span className="font-medium">{slot.label}</span>
              </p>
              <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <textarea placeholder="Anything we should know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              {/* Honeypot — visually hidden; real users never fill it */}
              <input
                type="text" tabIndex={-1} autoComplete="off" value={gotcha} onChange={(e) => setGotcha(e.target.value)}
                name="_gotcha" aria-hidden="true"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <button type="button" onClick={submit} disabled={submitting} className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">
                {submitting ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
