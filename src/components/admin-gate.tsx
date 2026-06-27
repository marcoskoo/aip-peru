"use client"

/**
 * AdminGate — protects the Admin panel with a login form.
 *
 * Shows a login card if the user is not authenticated, otherwise renders
 * the children (the actual AdminPanel).
 *
 * Also exposes a logout button + user info in the header.
 */

import { useState } from "react"
import { Lock, Loader2, LogOut, ShieldCheck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, login, logout } = useAdminAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await login(username.trim(), password)
      setUsername("")
      setPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated → show login form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-amber-500/10">
              <Lock className="size-7 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Acceso de Administrador</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Inicie sesión para gestionar los datos aeronáuticos
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Usuario</Label>
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && (
                <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting || !username.trim() || !password}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                Iniciar sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated → show children + a logout bar
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span className="font-medium text-emerald-800 dark:text-emerald-300">
            Sesión: {user?.displayName || user?.username}
          </span>
          <span className="text-emerald-600/60 dark:text-emerald-400/60">·</span>
          <span className="text-emerald-700/70 dark:text-emerald-400/70 font-mono text-xs">
            @{user?.username}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="gap-1.5 h-8 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </Button>
      </div>
      {children}
    </div>
  )
}
