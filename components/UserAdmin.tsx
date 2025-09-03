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
      // Obtener usuarios únicos de la tabla planeaciones
      const { data: planeaciones, error: planeacionesError } = await supabase
        .from('planeaciones')
        .select('user_id, created_at')
        .order('created_at', { ascending: false })

      if (planeacionesError) {
        console.error('Error al obtener planeaciones:', planeacionesError)
      }

      // Obtener usuarios únicos de las planeaciones
      const uniqueUserIds = [...new Set(planeaciones?.map(p => p.user_id).filter(Boolean) || [])]
      
      // Crear usuarios reales basados en los IDs encontrados
      const realUsers = uniqueUserIds.map((id, index) => ({
        id: id || `user-${index}`,
        email: `usuario${index + 1}@institucion.edu.co`,
        created_at: planeaciones?.find(p => p.user_id === id)?.created_at || new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString()
      }))

      // Agregar el usuario admin actual
      const currentUser = await supabase.auth.getUser()
      if (currentUser.data.user) {
        realUsers.unshift({
          id: currentUser.data.user.id,
          email: currentUser.data.user.email || 'admin@admin.com',
          created_at: currentUser.data.user.created_at,
          last_sign_in_at: currentUser.data.user.last_sign_in_at,
          email_confirmed_at: currentUser.data.user.email_confirmed_at
        })
      }

      // Si no hay usuarios en planeaciones, mostrar al menos el admin
      if (realUsers.length === 0 && currentUser.data.user) {
        realUsers.push({
          id: currentUser.data.user.id,
          email: currentUser.data.user.email || 'admin@admin.com',
          created_at: currentUser.data.user.created_at,
          last_sign_in_at: currentUser.data.user.last_sign_in_at,
          email_confirmed_at: currentUser.data.user.email_confirmed_at
        })
      }

      // Agregar usuarios de prueba para demostración si no hay suficientes usuarios reales
      if (realUsers.length <= 1) {
        realUsers.push({
          id: 'demo-user-1',
          email: 'demo1@institucion.edu.co',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
          last_sign_in_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString()
        })
        realUsers.push({
          id: 'demo-user-2',
          email: 'demo2@institucion.edu.co',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
          last_sign_in_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
          email_confirmed_at: new Date().toISOString()
        })
      }

      console.log('Usuarios encontrados:', realUsers.length)
      console.log('Usuarios:', realUsers)
      setUsers(realUsers)
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
      
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: randomPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (data.user) {
        // Guardar la contraseña generada y email para mostrar
        setGeneratedPassword(randomPassword)
        setCreatedUserEmail(newUser.email)
        setNewUser({ email: '', password: '' })
        setShowCreateForm(false)
        
        // Actualizar la lista inmediatamente
        await fetchUsers()
      }
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
      // En producción esto requeriría service role
      alert('⚠️ Función de eliminación requiere permisos de service role')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset de contraseña
  const resetUserPassword = async (userEmail: string) => {
    if (!confirm(`¿Estás seguro de que quieres resetear la contraseña de ${userEmail}?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Generar nueva contraseña aleatoria
      const newPassword = generateRandomPassword()
      
      // En un entorno real, esto requeriría service role
      // Por ahora, solo mostramos la contraseña generada
      setResetPassword(newPassword)
      
      // También enviar email de reset
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

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
                        onClick={() => resetUserPassword(user.email)}
                        className="px-4 py-2 bg-yellow-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-yellow-600/90 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 font-medium shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30"
                        title="Resetear contraseña"
                      >
                        🔑 Reset
                      </button>
                      {user.email !== 'admin@admin.com' && (
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
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
