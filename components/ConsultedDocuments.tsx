"use client"

import React from 'react'
import { useChat } from '../contexts/ChatContext'

export function ConsultedDocuments() {
  const { isConfigured, consultedDocuments } = useChat()

  if (!isConfigured || (
    consultedDocuments.pei.length === 0 && 
    consultedDocuments.modeloPedagogico.length === 0 && 
    consultedDocuments.orientacionesCurriculares.length === 0 && 
    consultedDocuments.relevantDocs.length === 0
  )) {
    return null
  }

  return (
    <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-xl shadow-blue-200/40 ring-1 ring-blue-200/40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">📚</span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-blue-900">Documentos Consultados en Tiempo Real</h3>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {/* PEI */}
        {consultedDocuments.pei.length > 0 && (
          <div className="bg-white/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 shadow-md shadow-blue-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="text-green-600 font-bold">✅</span>
              <span className="font-medium text-gray-800 text-sm sm:text-base">PEI (Proyecto Educativo Institucional)</span>
              <span className="text-xs sm:text-sm text-gray-500">({consultedDocuments.pei.length} documento{consultedDocuments.pei.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="space-y-1">
              {consultedDocuments.pei.map((doc, index) => (
                <div key={index} className="text-xs sm:text-sm text-gray-600 bg-white/40 rounded-md sm:rounded-lg p-2">
                  📄 {doc.title}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Modelo Pedagógico */}
        {consultedDocuments.modeloPedagogico.length > 0 && (
          <div className="bg-white/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 shadow-md shadow-blue-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="text-green-600 font-bold">✅</span>
              <span className="font-medium text-gray-800 text-sm sm:text-base">Modelo Pedagógico</span>
              <span className="text-xs sm:text-sm text-gray-500">({consultedDocuments.modeloPedagogico.length} documento{consultedDocuments.modeloPedagogico.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="space-y-1">
              {consultedDocuments.modeloPedagogico.map((doc, index) => (
                <div key={index} className="text-xs sm:text-sm text-gray-600 bg-white/40 rounded-md sm:rounded-lg p-2">
                  📄 {doc.title}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Orientaciones Curriculares */}
        {consultedDocuments.orientacionesCurriculares.length > 0 && (
          <div className="bg-white/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 shadow-md shadow-blue-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="text-green-600 font-bold">✅</span>
              <span className="font-medium text-gray-800 text-sm sm:text-base">Orientaciones Curriculares</span>
              <span className="text-xs sm:text-sm text-gray-500">({consultedDocuments.orientacionesCurriculares.length} documento{consultedDocuments.orientacionesCurriculares.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="space-y-1">
              {consultedDocuments.orientacionesCurriculares.map((doc, index) => (
                <div key={index} className="text-xs sm:text-sm text-gray-600 bg-white/40 rounded-md sm:rounded-lg p-2">
                  📄 {doc.title}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Documentos Relevantes por Consulta */}
        {consultedDocuments.relevantDocs.length > 0 && (
          <div className="bg-white/60 rounded-xl p-4 border border-blue-100 shadow-md shadow-blue-100/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 font-bold">🔍</span>
              <span className="font-medium text-gray-800">Documentos Relevantes por Consulta</span>
              <span className="text-sm text-gray-500">({consultedDocuments.relevantDocs.length} documento{consultedDocuments.relevantDocs.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="space-y-1">
              {consultedDocuments.relevantDocs.map((doc, index) => (
                <div key={index} className="text-sm text-gray-600 bg-white/40 rounded-lg p-2">
                  📄 {doc.title} <span className="text-xs text-gray-500">({doc.doc_type})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
