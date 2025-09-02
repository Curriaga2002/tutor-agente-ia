"use client"

import { useState } from "react"
import Header from "./Header"
import Navigation from "./Navigation"
import PlanningForm from "./PlanningForm"
import ResourcesBank from "./ResourcesBank"
import BucketStatus from "./BucketStatus"

export default function PlanningAssistant() {
  const [activeTab, setActiveTab] = useState<"generar" | "historial">("generar")
  const [currentPlanningData, setCurrentPlanningData] = useState(null)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "generar" && (
          <div className="w-full space-y-6">
            {/* Estado del Bucket en Tiempo Real */}
            <BucketStatus />
            
            {/* Formulario de Planeación */}
            <PlanningForm currentPlanningData={currentPlanningData} setCurrentPlanningData={setCurrentPlanningData} />
          </div>
        )}

        {activeTab === "historial" && (
          <ResourcesBank setActiveTab={setActiveTab} setCurrentPlanningData={setCurrentPlanningData} />
        )}
      </div>
    </div>
  )
}
