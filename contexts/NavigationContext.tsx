"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { NavigationState, ActiveTab } from '../types'

interface NavigationContextType extends NavigationState {
  // Actions
  setActiveTab: (tab: ActiveTab) => void
  navigateToGenerar: () => void
  navigateToHistorial: () => void
  navigateToEstado: () => void
  navigateToUsuarios: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.GENERAR)

  const navigateToGenerar = useCallback(() => {
    setActiveTab(ActiveTab.GENERAR)
  }, [])

  const navigateToHistorial = useCallback(() => {
    setActiveTab(ActiveTab.HISTORIAL)
  }, [])

  const navigateToEstado = useCallback(() => {
    setActiveTab(ActiveTab.ESTADO)
  }, [])

  const navigateToUsuarios = useCallback(() => {
    setActiveTab(ActiveTab.USUARIOS)
  }, [])

  const value: NavigationContextType = {
    // State
    activeTab,
    // Actions
    setActiveTab,
    navigateToGenerar,
    navigateToHistorial,
    navigateToEstado,
    navigateToUsuarios
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
