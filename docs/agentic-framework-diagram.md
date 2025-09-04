# 🧠 Arquitectura del Agente Planeador de Clases IE Camilo Torres

## Framework Agentic del Sistema

```mermaid
graph TB
    %% Usuario y Sistema
    User[👨‍🏫 Docente<br/>Usuario]
    System[💻 Sistema<br/>Respuesta]
    
    %% Framework Principal
    subgraph Framework["🧠 Agente Planeador de Clases IE Camilo Torres"]
        %% LLM Principal
        LLM[🤖 Large Language Model<br/>Gemini 1.5 Flash]
        
        %% Agente de Planificación
        PlanningAgent[📋 Agente de Planificación<br/>Análisis de entrada y contexto]
        
        %% Workflows
        subgraph Workflows["⚙️ Flujos de Trabajo"]
            %% Workflow Secuencial
            subgraph Sequential["📝 Workflow Secuencial"]
                Agent1[🔍 Análisis de Documentos<br/>PEI, MEN 2022, Tabla 7]
                Agent2[📚 Mapeo de Competencias<br/>Grado y Componente]
                Agent3[🎯 Generación de Plan<br/>Estructura Completa]
                Agent1 --> Agent2 --> Agent3
            end
            
            %% Workflow Paralelo
            subgraph Parallel["🔄 Workflow Paralelo"]
                Agent4[📊 Validación de Sesiones<br/>Cálculo de Tiempos]
                Agent5[📋 Evaluación Tabla 7<br/>Criterios Oficiales]
                DecisionAgent[⚖️ Agente de Decisión<br/>Integración Final]
                Agent4 --> DecisionAgent
                Agent5 --> DecisionAgent
            end
        end
        
        %% Guardrails
        Guardrails[🛡️ Guardrails<br/>• Filtrado de información interna<br/>• Validación de coherencia<br/>• Anti-alucinación<br/>• Estructura de salida]
        
        %% Memoria
        subgraph Memory["💾 Memoria del Sistema"]
            ChatHistory[💬 Historial de Chat<br/>Conversaciones previas]
            UserProfile[👤 Perfil del Docente<br/>Preferencias y estilo]
            ConversationState[🔄 Estado de Conversación<br/>Contexto actual]
        end
        
        %% Observabilidad
        Observability[📊 Observabilidad y Analytics<br/>• Monitoreo de rendimiento<br/>• Logs de interacción<br/>• Métricas de calidad]
    end
    
    %% Flujo Principal
    User --> PlanningAgent
    PlanningAgent --> Sequential
    PlanningAgent --> Parallel
    Sequential --> Guardrails
    Parallel --> Guardrails
    Guardrails --> System
    
    %% Memoria y Aprendizaje
    Memory -.-> PlanningAgent
    PlanningAgent -.-> Memory
    
    %% Observabilidad
    System -.-> Observability
    Observability -.-> PlanningAgent
    
    %% Estilos
    classDef userClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef systemClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef agentClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef workflowClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef memoryClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef guardrailClass fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    
    class User,System userClass
    class LLM,PlanningAgent,DecisionAgent agentClass
    class Sequential,Parallel,Agent1,Agent2,Agent3,Agent4,Agent5 workflowClass
    class Memory,ChatHistory,UserProfile,ConversationState memoryClass
    class Guardrails guardrailClass
```

## 🔄 Flujo de Procesamiento

### 1. **Entrada del Usuario**
- Docente proporciona: grado, tema, sesiones, recursos, nombre
- Sistema valida campos obligatorios
- Contexto se almacena en memoria

### 2. **Agente de Planificación**
- Analiza la entrada del usuario
- Consulta documentos institucionales (PEI, MEN 2022, Tabla 7)
- Determina estrategia didáctica apropiada
- Planifica flujo de trabajo

### 3. **Workflow Secuencial**
- **Análisis de Documentos**: Recupera información relevante
- **Mapeo de Competencias**: Conecta tema con competencias del grado
- **Generación de Plan**: Crea estructura completa del plan de clase

### 4. **Workflow Paralelo**
- **Validación de Sesiones**: Calcula tiempos y distribuye momentos pedagógicos
- **Evaluación Tabla 7**: Selecciona criterios oficiales de evaluación
- **Agente de Decisión**: Integra ambos flujos en respuesta coherente

### 5. **Guardrails**
- Filtra información interna (cálculos, validaciones)
- Valida coherencia entre secciones
- Previene alucinaciones
- Mantiene estructura de salida definida

### 6. **Memoria y Aprendizaje**
- Almacena historial de conversaciones
- Mantiene perfil del docente
- Actualiza estado de conversación
- Permite adaptación y mejora continua

### 7. **Observabilidad**
- Monitorea rendimiento del sistema
- Registra interacciones y métricas
- Proporciona insights para mejora
- Genera reportes de calidad

## 🎯 Características Clave

- **Modularidad**: Componentes independientes y reutilizables
- **Escalabilidad**: Fácil adición de nuevos agentes y workflows
- **Seguridad**: Guardrails robustos para prevenir errores
- **Aprendizaje**: Memoria persistente para mejora continua
- **Monitoreo**: Observabilidad completa del sistema
- **Coherencia**: Integración perfecta con documentos institucionales
