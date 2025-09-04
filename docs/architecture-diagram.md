# 🏗️ Arquitectura del Agente Planeador de Clases

## Diagrama de Flujo Principal

```mermaid
flowchart TD
    A[👨‍🏫 Docente<br/>Entrada: Grado, Tema, Sesiones] --> B[🧠 Agente de Planificación<br/>Análisis de contexto]
    
    B --> C[📚 Consulta de Documentos<br/>PEI, MEN 2022, Tabla 7]
    B --> D[🎯 Mapeo de Competencias<br/>Según grado y tema]
    
    C --> E[⚙️ Generación de Plan<br/>Estructura completa]
    D --> E
    
    E --> F[🛡️ Guardrails<br/>• Filtrado de información interna<br/>• Validación de coherencia<br/>• Anti-alucinación]
    
    F --> G[📋 Plan de Clase Final<br/>• Identificación<br/>• Competencias<br/>• Momentos pedagógicos<br/>• Evaluación Tabla 7]
    
    G --> H[💾 Almacenamiento<br/>Base de datos + Historial]
    
    H --> I[📊 Exportación<br/>Word, PDF, etc.]
    
    %% Memoria y Aprendizaje
    J[💾 Memoria del Sistema<br/>• Historial de chat<br/>• Perfil del docente<br/>• Estado de conversación] -.-> B
    
    %% Observabilidad
    K[📈 Observabilidad<br/>• Métricas de rendimiento<br/>• Logs de interacción<br/>• Análisis de calidad] -.-> F
    
    %% Estilos
    classDef userClass fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef agentClass fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef processClass fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef outputClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef memoryClass fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class A userClass
    class B agentClass
    class C,D,E processClass
    class F,G,H,I outputClass
    class J,K memoryClass
```

## 🔄 Componentes del Sistema

### 1. **Entrada del Usuario**
- Formulario de configuración
- Validación de campos
- Contexto inicial

### 2. **Agente de Planificación**
- Análisis semántico del tema
- Selección de estrategia didáctica
- Coordinación de workflows

### 3. **Consulta de Documentos**
- Recuperación de PEI
- Integración de Orientaciones MEN 2022
- Aplicación de Tabla 7
- Incorporación de Revisión Sistemática

### 4. **Mapeo de Competencias**
- Identificación de componente curricular
- Selección de competencias por grado
- Conexión con evidencias de aprendizaje

### 5. **Generación de Plan**
- Estructura de 7 apartados
- Momentos pedagógicos (120 min exactos)
- Distribución proporcional de tiempos
- Roles del docente y estudiante

### 6. **Guardrails**
- Filtrado de información interna
- Validación de coherencia
- Prevención de alucinaciones
- Mantenimiento de estructura

### 7. **Almacenamiento y Exportación**
- Guardado en base de datos
- Historial de conversaciones
- Exportación a Word/PDF
- Reutilización de planes

## 🎯 Flujo de Datos

```mermaid
sequenceDiagram
    participant D as Docente
    participant A as Agente
    participant DB as Base de Datos
    participant G as Gemini AI
    participant E as Exportación
    
    D->>A: Configuración inicial
    A->>DB: Consulta documentos
    DB-->>A: Documentos relevantes
    A->>G: Generación de plan
    G-->>A: Plan estructurado
    A->>A: Aplicar guardrails
    A->>D: Plan de clase final
    D->>A: Solicitar guardado
    A->>DB: Almacenar plan
    D->>A: Solicitar exportación
    A->>E: Generar Word/PDF
    E-->>D: Archivo descargado
```

## 🛡️ Capas de Seguridad

1. **Validación de Entrada**: Campos obligatorios y formatos
2. **Consulta de Documentos**: Solo fuentes oficiales
3. **Generación Controlada**: Prompt estructurado y validado
4. **Guardrails**: Filtrado y validación de salida
5. **Almacenamiento Seguro**: Base de datos con RLS
6. **Exportación Controlada**: Formatos estándar y seguros
