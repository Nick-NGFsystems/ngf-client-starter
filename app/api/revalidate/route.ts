import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/revalidate?secret=<WEBSITE_REVALIDATION_SECRET>
 *
 * Called by the NGF portal after a client publishes content.
 * The site uses cache: 'no-store' so no explicit revalidation is needed —
 * this endpoint exists to signal a 200 to NGF and satisfy the push flow.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expected = process.env.WEBSITE_REVALIDATION_SECRET

  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  return NextResponse.json({ revalidated: true })
}
