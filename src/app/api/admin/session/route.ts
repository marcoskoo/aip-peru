import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  // Fetch fresh user data
  const user = await db.adminUser.findUnique({
    where: { id: session.uid },
    select: { username: true, displayName: true },
  })

  if (!user) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: user.username,
      displayName: user.displayName || user.username,
    },
  })
}
