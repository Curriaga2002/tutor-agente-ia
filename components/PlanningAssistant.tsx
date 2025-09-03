"use client"

import React, { useState } from 'react'
import Navigation from './Navigation'
import ChatAssistant from './ChatAssistant'
import ResourcesBank from './ResourcesBank'
import AppStatus from './AppStatus'
import UserAdmin from './UserAdmin'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../hooks/useAuth'

type ActiveTab = 'generar' | 'estado' | 'historial' | 'usuarios'

export default function PlanningAssistant() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generar')
  const [currentPlanningData, setCurrentPlanningData] = useState<any>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const { user, isAdmin } = useAuth()

  const handleChatUpdate = (messages: any[]) => {
    setChatHistory(messages)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {activeTab === 'generar' && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <ChatAssistant 
                onChatUpdate={handleChatUpdate}
                currentPlanningData={currentPlanningData}
                setCurrentPlanningData={setCurrentPlanningData}
              />
            </div>
          )}
          
          {activeTab === 'estado' && isAdmin && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <AppStatus />
            </div>
          )}
          
          {activeTab === 'historial' && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <ResourcesBank 
                setActiveTab={setActiveTab}
                setCurrentPlanningData={setCurrentPlanningData}
              />
            </div>
          )}
          
          {activeTab === 'usuarios' && isAdmin && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <UserAdmin />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
