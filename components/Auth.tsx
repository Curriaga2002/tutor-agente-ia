"use client"

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthProps {
  onAuthSuccess: (user: User) => void
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        onAuthSuccess(user)
      }
    }
    checkUser()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          onAuthSuccess(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, onAuthSuccess])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          setUser(data.user)
          onAuthSuccess(data.user)
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          setError('Usuario creado exitosamente. Por favor, verifica tu email.')
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Si ya está autenticado, mostrar información del usuario
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg shadow-black/5 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-gray-600 mb-6">
              {user.email}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-red-500/90 backdrop-blur-sm text-white rounded-2xl hover:bg-red-600/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg shadow-black/5 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-gray-600">
            {isLogin 
              ? 'Accede a tu cuenta para continuar' 
              : 'Crea una nueva cuenta para comenzar'
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gray-900/90 backdrop-blur-sm text-white rounded-2xl hover:bg-gray-800/90 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 transition-all duration-300 font-medium shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30"
          >
            {loading ? '⏳ Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm font-medium"
          >
            {isLogin 
              ? '¿No tienes cuenta? Crear una' 
              : '¿Ya tienes cuenta? Iniciar sesión'
            }
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-blue-800 text-sm font-medium mb-2">Acceso Administrador:</p>
          <p className="text-blue-600 text-xs">Solo el administrador puede acceder a funciones especiales</p>
        </div>
      </div>
    </div>
  )
}
