"use client"

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function UserAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '' })
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [createdUserEmail, setCreatedUserEmail] = useState<string | null>(null)

  const supabase = createClient()

  // Función para generar contraseña aleatoria
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Función para obtener todos los usuarios (solo admin)
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Llamar a la API de administración (versión simplificada para testing)
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al obtener usuarios')
      }

      const data = await response.json()
      setUsers(data.users)
      
    } catch (err: any) {
      console.error('Error en fetchUsers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo usuario
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Generar contraseña aleatoria
      const randomPassword = generateRandomPassword()
      
      // Llamar a la API de administración para crear usuario
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUser.email,
          password: randomPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear usuario')
      }

      // Guardar la contraseña generada y email para mostrar
      setGeneratedPassword(randomPassword)
      setCreatedUserEmail(newUser.email)
      setNewUser({ email: '', password: '' })
      setShowCreateForm(false)
      
      // Actualizar la lista inmediatamente
      await fetchUsers()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === 'admin@admin.com') {
      alert('❌ No se puede eliminar el usuario administrador')
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${userEmail}?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Llamar a la API de administración para eliminar usuario
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      // Actualizar la lista inmediatamente
      await fetchUsers()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset de contraseña
  const resetUserPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de que quieres resetear la contraseña de ${userEmail}?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Generar nueva contraseña aleatoria
      const newPassword = generateRandomPassword()
      
      // Llamar a la API de administración para resetear contraseña
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al resetear contraseña')
      }

      // Mostrar la nueva contraseña
      setResetPassword(newPassword)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/85 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl shadow-black/10 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                👑 Administración de Usuarios
              </h1>
              <p className="text-gray-600">
                Gestiona usuarios del sistema
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-blue-600/90 backdrop-blur-sm text-white rounded-2xl hover:bg-blue-700/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
            >
              ➕ Crear Usuario
            </button>
          </div>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="bg-white/85 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl shadow-black/10 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Crear Nuevo Usuario
            </h2>
            <form onSubmit={createUser} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-blue-800 text-sm">
                  🔐 La contraseña se generará automáticamente y se mostrará después de crear el usuario.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600/90 backdrop-blur-sm text-white rounded-2xl hover:bg-green-700/90 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 transition-all duration-300 font-medium shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30"
                >
                  {loading ? '⏳ Creando...' : '✅ Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-500/90 backdrop-blur-sm text-white rounded-2xl hover:bg-gray-600/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg shadow-gray-500/25 hover:shadow-xl hover:shadow-gray-500/30"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="bg-white/85 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl shadow-black/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Usuarios del Sistema
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Total: {users.length} usuario(s) encontrado(s)
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2 bg-gray-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-gray-700/90 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 transition-all duration-300 font-medium shadow-lg shadow-gray-600/25"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-lg mb-2">No hay usuarios registrados</p>
              <p className="text-sm">
                Los usuarios aparecerán aquí cuando se registren en el sistema o creen planeaciones.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">
                          {user.email === 'admin@admin.com' ? '👑' : '👤'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          {user.email}
                          {user.email === 'admin@admin.com' && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Creado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </p>
                        {user.last_sign_in_at && (
                          <p className="text-sm text-gray-500">
                            Último acceso: {new Date(user.last_sign_in_at).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => resetUserPassword(user.id, user.email || '')}
                        className="px-4 py-2 bg-yellow-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-yellow-600/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30"
                        title="Resetear contraseña"
                      >
                        🔑 Reset
                      </button>
                      {user.email !== 'admin@admin.com' && (
                        <button
                          onClick={() => deleteUser(user.id, user.email || '')}
                          className="px-4 py-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
                          title="Eliminar usuario"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal para mostrar contraseña generada al crear usuario */}
        {generatedPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Usuario Creado Exitosamente
                </h3>
                <p className="text-gray-600 mb-2">
                  Email: <strong>{createdUserEmail}</strong>
                </p>
                <p className="text-gray-600 mb-4">
                  La contraseña generada es:
                </p>
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-4">
                  <code className="text-lg font-mono text-gray-800 break-all">
                    {generatedPassword}
                  </code>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedPassword)
                      alert('📋 Contraseña copiada al portapapeles')
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-300 font-medium"
                  >
                    📋 Copiar Contraseña
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedPassword(null)
                      setCreatedUserEmail(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition duration-300 font-medium"
                  >
                    ✕ Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para mostrar contraseña de reset */}
        {resetPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔑</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Contraseña de Reset Generada
                </h3>
                <p className="text-gray-600 mb-4">
                  Nueva contraseña generada:
                </p>
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-4">
                  <code className="text-lg font-mono text-gray-800 break-all">
                    {resetPassword}
                  </code>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(resetPassword)
                      alert('📋 Contraseña copiada al portapapeles')
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-300 font-medium"
                  >
                    📋 Copiar Contraseña
                  </button>
                  <button
                    onClick={() => setResetPassword(null)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition duration-300 font-medium"
                  >
                    ✕ Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
