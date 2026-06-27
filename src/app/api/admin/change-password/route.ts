import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Must be authenticated
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'No autorizado. Inicie sesión como administrador.' },
      { status: 401 }
    )
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual y nueva contraseña son obligatorias' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Fetch the user's current password hash
    const user = await db.adminUser.findUnique({
      where: { id: session.uid },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verify current password
    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 403 }
      )
    }

    // Hash and save the new password
    const newHash = await bcrypt.hash(newPassword, 10)
    await db.adminUser.update({
      where: { id: session.uid },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
