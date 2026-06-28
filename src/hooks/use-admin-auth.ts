"use client"

/**
 * Client-side admin authentication hook.
 *
 * Checks `/api/admin/session` on mount, and provides `login` / `logout`
 * functions. Used by AdminGate (to protect the Admin panel) and by
 * SpimBriefing (to show/hide the Pegado masivo + Eliminar todos buttons).
 */

import { useState, useEffect, useCallback } from "react"

export interface AdminUser {
  username: string
  displayName: string
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Check session on mount
  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.authenticated && data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Error al iniciar sesión")
    }
    setUser(data.user)
    return data.user as AdminUser
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    setUser(null)
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  }
}
