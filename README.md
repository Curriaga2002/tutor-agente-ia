# Planeación Didáctica - Sistema de Asistente Pedagógico IA

## Descripción General

Sistema web para la generación automática de planes de clase didácticos utilizando inteligencia artificial. El sistema permite a los docentes crear planeaciones personalizadas mediante un chat interactivo con un asistente IA especializado en pedagogía.

## Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Next.js 14 con TypeScript
- **Backend**: Supabase (PostgreSQL + Storage)
- **IA**: Google Gemini API
- **Estilos**: Tailwind CSS
- **Gestión de Estado**: React Hooks
- **Exportación**: docx (Word), file-saver

### Estructura de Directorios

```
planeacion-didactica/
├── app/                          # App Router de Next.js
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página principal
├── components/                   # Componentes React
│   ├── AppStatus.tsx            # Estado del sistema
│   ├── ChatAssistant.tsx        # Chat principal
│   ├── Navigation.tsx           # Navegación
│   ├── PlanningAssistant.tsx    # Layout principal
│   └── ResourcesBank.tsx        # Banco de recursos
├── hooks/                       # Custom Hooks
│   └── useBucketDocuments.ts    # Hook para documentos
├── lib/                         # Servicios y utilidades
│   ├── educational-content-service.ts
│   ├── gemini-service.ts        # Servicio de IA
│   ├── pdf-content-processor.ts
│   ├── supabase/
│   │   └── client.ts            # Cliente Supabase
│   └── vector-search.ts         # Búsqueda vectorial
├── public/                      # Archivos estáticos
└── package.json                 # Dependencias
```

## Componentes Principales

### 1. PlanningAssistant.tsx

**Propósito**: Componente principal que actúa como layout y coordinador general.

**Funcionalidades**:
- Maneja el estado de la pestaña activa
- Coordina la comunicación entre componentes
- Proporciona el layout base de la aplicación

**Estado**:
- `activeTab`: Controla qué pestaña está visible
- `currentPlanningData`: Datos de la planeación actual

### 2. Navigation.tsx

**Propósito**: Sistema de navegación por pestañas.

**Pestañas**:
- Generar Planeación: Chat principal
- Banco de Recursos: Historial de planeaciones
- Estado de la App: Estado del sistema

**Características**:
- Diseño Apple-inspired
- Botones centrados y compactos
- Transiciones suaves

### 3. ChatAssistant.tsx

**Propósito**: Componente central del sistema, maneja la generación de planeaciones.

**Funcionalidades Principales**:

#### Configuración Inicial
- Formulario con campos obligatorios:
  - Grado (1° a 11°)
  - Asignatura
  - Tema específico
  - Duración en horas
  - Número de sesiones
  - Recursos disponibles
  - Nombre del docente
- Validación de campos completos
- Consulta automática de documentos institucionales

#### Chat Interactivo
- Interfaz de chat con mensajes
- Integración con Gemini AI
- Procesamiento de respuestas en tiempo real
- Formato markdown para respuestas

#### Gestión de Estado
- `messages`: Array de mensajes del chat
- `isConfigured`: Estado de configuración
- `planningConfig`: Configuración de la planeación
- `isLoading`: Estado de carga
- `isSaving`: Estado de guardado

#### Funciones Principales
- `handleSendMessage`: Envía mensajes al chat
- `saveChatToDatabase`: Guarda el chat en la base de datos
- `exportToWord`: Exporta el chat como documento Word
- `clearChat`: Limpia la conversación

### 4. ResourcesBank.tsx

**Propósito**: Gestión y visualización del historial de planeaciones.

**Funcionalidades**:

#### Visualización de Recursos
- Tarjetas con información de cada planeación
- Filtro por búsqueda de texto
- Información mostrada:
  - Grado
  - Tema
  - Duración
  - Sesiones
  - Fecha de creación

#### Modal de Chat
- Visualización completa del historial de chat
- Botones de acción:
  - Copiar todo el chat
  - Descargar como Word
  - Cerrar modal

#### Gestión de Datos
- `fetchAllPlans`: Obtiene todas las planeaciones
- `exportChatToWord`: Exporta chat específico como Word
- `copyToClipboard`: Copia texto al portapapeles

### 5. AppStatus.tsx

**Propósito**: Monitoreo del estado del sistema.

**Información Mostrada**:
- Estado del sistema de documentos
- Estado del sistema de IA
- Contador de documentos disponibles
- Botón de actualización en tiempo real

## Servicios y Utilidades

### 1. gemini-service.ts

**Propósito**: Integración con Google Gemini AI.

**Clase Principal**: `GeminiService`

**Métodos**:
- `generateResponse`: Genera respuesta básica
- `generateClassPlan`: Genera plan de clase personalizado
- `buildClassPlanPrompt`: Construye prompt estructurado
- `resetChat`: Reinicia la conversación

**Configuración**:
- Modelo: gemini-1.5-flash
- Temperatura: 0.7
- Max tokens: 2048

### 2. useBucketDocuments.ts

**Propósito**: Hook personalizado para gestión de documentos del bucket.

**Funcionalidades**:
- Carga documentos desde Supabase Storage
- Estado de carga y errores
- Función de actualización
- Filtrado de documentos

### 3. vector-search.ts

**Propósito**: Sistema de búsqueda vectorial para documentos.

**Funcionalidades**:
- Búsqueda híbrida (texto + vector)
- Filtrado por metadatos
- Scoring combinado
- Fallbacks para errores

## Base de Datos

### Esquema Principal

#### Tabla: planeaciones
```sql
CREATE TABLE planeaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grado VARCHAR(10) NOT NULL,
  tema TEXT NOT NULL,
  duracion VARCHAR(20) NOT NULL,
  sesiones INTEGER NOT NULL,
  contenido JSONB,
  chat_history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID
);
```

#### Tabla: documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  doc_type VARCHAR(50),
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: chunks
```sql
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Funciones SQL

#### search_educational_content
Búsqueda híbrida que combina texto y vectores.

#### insert_educational_document
Inserta documentos con embeddings.

#### get_search_stats
Obtiene estadísticas del sistema de búsqueda.

## Configuración del Proyecto

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=tu_gemini_api_key
SUPABASE_STORAGE_ACCESS_KEY=tu_access_key
SUPABASE_STORAGE_SECRET_KEY=tu_secret_key
```

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Configurar variables de entorno
4. Ejecutar en desarrollo:
   ```bash
   pnpm dev
   ```

### Dependencias Principales

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@google/generative-ai": "^0.0.0",
    "docx": "^9.5.1",
    "file-saver": "^2.0.5",
    "tailwindcss": "^3.0.0"
  }
}
```

## Flujo de Trabajo

### 1. Configuración Inicial
1. Usuario accede a la aplicación
2. Completa el formulario de configuración
3. Sistema valida campos obligatorios
4. Usuario confirma configuración

### 2. Generación de Planeación
1. Usuario inicia conversación con el asistente
2. Sistema consulta documentos relevantes
3. Gemini AI genera respuesta personalizada
4. Respuesta se muestra en el chat con formato

### 3. Gestión de Recursos
1. Usuario puede guardar el chat
2. Sistema almacena en base de datos
3. Planeación aparece en Banco de Recursos
4. Usuario puede exportar o reutilizar

### 4. Exportación
1. Usuario selecciona exportar
2. Sistema genera documento Word
3. Archivo se descarga automáticamente
4. Documento es compatible con cualquier software

## Características Técnicas

### Rendimiento
- Lazy loading de componentes
- Optimización de imágenes
- Caching de respuestas de IA
- Debounce en búsquedas

### Seguridad
- Validación de entrada
- Sanitización de datos
- Autenticación con Supabase
- Políticas RLS en base de datos

### Escalabilidad
- Arquitectura modular
- Separación de responsabilidades
- Hooks reutilizables
- Servicios independientes

## Mantenimiento

### Logs y Monitoreo
- Console logs para debugging
- Estados de error manejados
- Alertas de usuario
- Validación de API keys

### Actualizaciones
- Dependencias actualizadas regularmente
- Compatibilidad con versiones de Node.js
- Migraciones de base de datos
- Backup de configuraciones

## Troubleshooting

### Problemas Comunes

1. **Error de API Key de Gemini**
   - Verificar variable de entorno
   - Comprobar cuota de API
   - Revisar formato de la clave

2. **Error de conexión a Supabase**
   - Verificar URL y anon key
   - Comprobar políticas RLS
   - Revisar configuración de red

3. **Error de exportación**
   - Verificar dependencias instaladas
   - Comprobar permisos de descarga
   - Revisar formato de datos

### Soluciones

1. Reiniciar servidor de desarrollo
2. Limpiar cache del navegador
3. Verificar variables de entorno
4. Revisar logs de consola
5. Comprobar estado de servicios externos

## Contribución

### Estructura de Commits
- feat: nueva funcionalidad
- fix: corrección de bugs
- docs: documentación
- style: formato de código
- refactor: refactorización
- test: pruebas

### Estándares de Código
- TypeScript estricto
- ESLint configurado
- Prettier para formato
- Convenciones de naming
- Documentación de funciones

## Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.


