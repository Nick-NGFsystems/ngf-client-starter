import BookingWidget from '@/components/BookingWidget'
import { ngfEndpoints } from '@/lib/ngf'

export const metadata = { title: 'Book an appointment' }

export default function BookPage() {
  const { base, domain } = ngfEndpoints()
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900">Book an appointment</h1>
        <p className="mb-8 text-center text-gray-500">Choose a service and a time that works for you.</p>
        <BookingWidget base={base} domain={domain} />
      </div>
    </main>
  )
}
