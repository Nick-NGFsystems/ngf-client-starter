'use client'

import { useEffect, useState } from 'react'

// Customer-facing "manage my appointment" view, reached from the manage link in
// the confirmation email (/book/manage?token=…). Lets a customer view and
// cancel their appointment without an account. Cancelling reopens the slot and
// notifies the owner.

interface ApptView {
  service: string
  whenLabel: string
  timezone: string
  status: string
  businessName: string
  customerName: string
}

export default function BookingManage({ base, token }: { base: string; token: string }) {
  const [appt, setAppt] = useState<ApptView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    if (!token) { setError('Missing appointment link.'); setLoading(false); return }
    ;(async () => {
      try {
        const res = await fetch(`${base}/api/public/bookings/manage?token=${encodeURIComponent(token)}`)
        const json = await res.json()
        if (!res.ok || !json.ok) throw new Error(json.error || 'Appointment not found.')
        setAppt(json.appointment)
        if (json.appointment.status === 'CANCELLED') setCancelled(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Appointment not found.')
      } finally {
        setLoading(false)
      }
    })()
  }, [base, token])

  const cancel = async () => {
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`${base}/api/public/bookings/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'cancel' }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not cancel. Please contact the business.')
      setCancelled(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <p className="text-center text-sm text-gray-500">Loading…</p>
  if (error && !appt) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>
  if (!appt) return null

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Your appointment</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-gray-500">Business</dt><dd className="font-medium text-gray-800">{appt.businessName}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Service</dt><dd className="font-medium text-gray-800">{appt.service}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">When</dt><dd className="font-medium text-gray-800">{appt.whenLabel}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Timezone</dt><dd className="text-gray-600">{appt.timezone}</dd></div>
      </dl>

      {cancelled ? (
        <div className="mt-6 rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-600">
          This appointment is cancelled. Need another time? Head back to the booking page.
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          <button type="button" onClick={cancel} disabled={cancelling} className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
            {cancelling ? 'Cancelling…' : 'Cancel this appointment'}
          </button>
          <p className="text-center text-xs text-gray-400">To reschedule, cancel here and book a new time.</p>
        </div>
      )}
      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
