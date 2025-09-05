"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { User as AppUser } from '../types'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Verificar usuario actual
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const appUser: AppUser = {
            id: user.id,
            email: user.email || '',
            isAdmin: user.email === 'admin@admin.com'
          }
          setUser(appUser)
          setIsAdmin(appUser.isAdmin)
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            isAdmin: session.user.email === 'admin@admin.com'
          }
          setUser(appUser)
          setIsAdmin(appUser.isAdmin)
        } else {
          setUser(null)
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
