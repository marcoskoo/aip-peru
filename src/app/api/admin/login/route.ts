import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    // Look up the admin user (case-insensitive username)
    const user = await db.adminUser.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Update last login
    await db.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Set session cookie
    await setSessionCookie(user.id, user.username)

    return NextResponse.json({
      ok: true,
      user: {
        username: user.username,
        displayName: user.displayName || user.username,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
