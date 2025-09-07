"use client"

import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigation } from '../contexts/NavigationContext'
import { usePlanning } from '../contexts/PlanningContext'
import { Navigation } from './Navigation'
import { ChatAssistant } from './ChatAssistant'
import ResourcesBank from './ResourcesBank'
import AppStatus from './AppStatus'
import UserAdmin from './UserAdmin'
import ProtectedRoute from './ProtectedRoute'
import { ActiveTab } from '../types'

export function PlanningAssistant() {
  const { isAdmin } = useAuth()
  const { activeTab } = useNavigation()
  const { currentPlanningData, setCurrentPlanningData, chatHistory, setChatHistory } = usePlanning()

  const handleChatUpdate = (messages: any[]) => {
    setChatHistory(messages)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Navigation />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {activeTab === ActiveTab.GENERAR && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <ChatAssistant 
                onChatUpdate={handleChatUpdate}
                currentPlanningData={currentPlanningData}
                setCurrentPlanningData={setCurrentPlanningData}
              />
            </div>
          )}
          
          {activeTab === ActiveTab.ESTADO && isAdmin && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <AppStatus />
            </div>
          )}
          
          {activeTab === ActiveTab.HISTORIAL && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <ResourcesBank 
                setActiveTab={(tab) => {
                  // Navigation will be handled by the context
                }}
                setCurrentPlanningData={setCurrentPlanningData}
              />
            </div>
          )}
          
          {activeTab === ActiveTab.USUARIOS && isAdmin && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <UserAdmin />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}