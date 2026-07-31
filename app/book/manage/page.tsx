import BookingManage from '@/components/BookingManage'
import { ngfEndpoints } from '@/lib/ngf'

export const metadata = { title: 'Manage your appointment' }

// searchParams is async in Next 15.
export default async function ManagePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { base } = ngfEndpoints()
  const { token } = await searchParams
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-md">
        <BookingManage base={base} token={token ?? ''} />
      </div>
    </main>
  )
}
