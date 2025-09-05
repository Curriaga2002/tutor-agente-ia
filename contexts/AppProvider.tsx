"use client"

import React, { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { ChatProvider } from './ChatContext'
import { PlanningProvider } from './PlanningContext'
import { NavigationProvider } from './NavigationContext'
import { DocumentProvider } from './DocumentContext'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      <DocumentProvider>
        <NavigationProvider>
          <PlanningProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </PlanningProvider>
        </NavigationProvider>
      </DocumentProvider>
    </AuthProvider>
  )
}
