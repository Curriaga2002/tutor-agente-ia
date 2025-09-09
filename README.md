# 🎓 Planeador Didáctico Inteligente - IE Camilo Torres

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Assistant-blueviolet?style=for-the-badge&logo=openai)](https://platform.openai.com/)

> **Sistema de generación automática de planes de clase** utilizando inteligencia artificial, diseñado específicamente para docentes de Tecnología e Informática de la Institución Educativa Camilo Torres.

## 📋 Tabla de Contenidos

- [🎯 Descripción General](#-descripción-general)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [⚡ Características Principales](#-características-principales)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [💻 Uso del Sistema](#-uso-del-sistema)
- [🔧 API y Servicios](#-api-y-servicios)
- [📊 Base de Datos](#-base-de-datos)
- [🎨 Componentes Principales](#-componentes-principales)
- [📈 Flujos de Datos](#-flujos-de-datos)
- [🔒 Seguridad](#-seguridad)
- [📝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

---

## 🎯 Descripción General
El **Planeador Didáctico Inteligente** es un sistema web avanzado que utiliza inteligencia artificial para generar planes de clase completos y estructurados. Está diseñado específicamente para docentes del área de **Tecnología e Informática** de la Institución Educativa Camilo Torres.

### 🎯 Objetivos

- **Automatizar** la creación de planes de clase didácticos
- **Alinear** con políticas educativas nacionales (MEN 2022)
- **Integrar** el modelo pedagógico crítico-social
- **Facilitar** la evaluación con criterios oficiales (Tabla 7)
- **Optimizar** el tiempo de planeación docente

### 🎓 Público Objetivo

- Docentes de Tecnología e Informática
- Coordinadores académicos
- Directivos docentes
- Estudiantes de pedagogía

---

## 🏗️ Arquitectura del Sistema

### 📊 Diagrama de Flujo Principal

```mermaid
graph TB
    %% Entradas Iniciales
    A[🎓 Docente<br/>Entrada: Grado, Tema, Sesiones] 
    B[🧠 Memoria del Sistema<br/>• Historial de chat<br/>• Perfil del docente<br/>• Estado de conversación]
    
    %% Agente de Planificación
    C[🤖 Agente de Planificación<br/>Análisis de contexto]
    
    %% Procesos Paralelos
    D[📄 Consulta de Documentos<br/>PEI, MEN 2022, Tabla 7]
    E[🎯 Mapeo de Competencias<br/>Según grado y tema]
    
    %% Generación del Plan
    F[⚙️ Generación de Plan<br/>Estructura completa]
    
    %% Observabilidad
    G[📊 Observabilidad<br/>• Métricas de rendimiento<br/>• Logs de interacción<br/>• Análisis de calidad]
    
    %% Guardrails
    H[🛡️ Guardrails<br/>• Filtrado de información interna<br/>• Validación de coherencia<br/>• Anti-alucinación]
    
    %% Plan de Clase Final
    I[📋 Plan de Clase Final<br/>• Identificación<br/>• Competencias<br/>• Momentos pedagógicos<br/>• Evaluación Tabla 7]
    
    %% Almacenamiento y Exportación
    J[💾 Almacenamiento<br/>Base de datos + Historial]
    K[📤 Exportación<br/>Word, PDF, etc.]
    
    %% Flujo principal
    A --> C
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    F --> H
    H --> I
    I --> J
    J --> K
    
    %% Observabilidad (línea punteada)
    F -.-> G
    
    %% Estilos
    classDef entrada fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef agente fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef proceso fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef guardrail fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef resultado fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef observabilidad fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class A,B entrada
    class C agente
    class D,E,F proceso
    class H guardrail
    class I,J,K resultado
    class G observabilidad
```

---

## ⚡ Características Principales

### 🎯 Generación Inteligente
- **Planes de clase completos** con estructura pedagógica
- **Alineación automática** con PEI y MEN 2022
- **Integración de competencias** según grado y tema
- **Evaluación con Tabla 7** (criterios oficiales)

### 📚 Gestión de Documentos
- **Consulta en tiempo real** de documentos institucionales
- **Búsqueda vectorial** para contenido relevante
- **Procesamiento automático** de PDFs
- **Integración de múltiples fuentes** de información

### 💬 Interfaz Intuitiva
- **Chat interactivo** con asistente IA
- **Formularios inteligentes** con validación
- **Exportación a Word** con formato profesional
- **Historial de planeaciones** organizado

### 🔒 Seguridad y Confiabilidad
- **Autenticación robusta** con Supabase
- **Validación de datos** en frontend y backend
- **Políticas RLS** para protección de datos
- **Anti-alucinación** en respuestas de IA

---

## 📈 Flujos de Datos

### 🔄 Flujo de Datos Principal

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant AI as Gemini AI
    participant DB as Supabase
    participant S as Storage
    
    U->>F: Configuración inicial
    F->>DB: Consulta documentos
    DB-->>F: Documentos relevantes
    F->>AI: Generación de plan
    AI-->>F: Plan estructurado
    F->>F: Validación y formateo
    F->>U: Plan de clase final
    U->>F: Solicitar guardado
    F->>DB: Almacenar plan
    U->>F: Solicitar exportación
    F->>S: Generar Word/PDF
    S-->>U: Archivo descargado
```

### 🔄 Flujo de Generación de Plan

```mermaid
flowchart TD
    A[Usuario completa configuración] --> B[Validación de campos]
    B --> C[Consulta documentos relevantes]
    C --> D[Construcción de prompt]
    D --> E[Envío a Gemini API]
    E --> F[Procesamiento de respuesta]
    F --> G[Validación de estructura]
    G --> H[Formateo markdown]
    H --> I[Mostrar al usuario]
    I --> J[Opción de guardar/exportar]
```

### 💾 Flujo de Persistencia

```mermaid
flowchart TD
    A[Usuario solicita guardar] --> B[Validación de datos]
    B --> C[Preparación de payload]
    C --> D[Inserción en base de datos]
    D --> E[Actualización de estado local]
    E --> F[Confirmación al usuario]
    F --> G[Actualización de historial]
```

### 📤 Flujo de Exportación

```mermaid
flowchart TD
    A[Usuario solicita exportar] --> B[Recolección de datos]
    B --> C[Generación de documento Word]
    C --> D[Formateo de contenido]
    D --> E[Descarga automática]
    E --> F[Confirmación de éxito]
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **React Context** - Gestión de estado global
- **Custom Hooks** - Lógica reutilizable

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Vector Search** - Búsqueda semántica
- **Storage** - Almacenamiento de archivos

### IA y Procesamiento
- **OpenAI Assistant API (GPT-4)** - Modelo de lenguaje para generación de planes y chat
- **PDF Processing** - Extracción de contenido
- **Vector Embeddings** - Representación semántica
- **Prompt Engineering** - Optimización de prompts

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Git** - Control de versiones
- **Vercel** - Despliegue (opcional)

---

## 📁 Estructura del Proyecto

```
tutor-agente-ia/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 admin/                # Rutas de administración
│   │   └── 📁 chat/                 # Rutas de chat
│   ├── globals.css                  # Estilos globales
│   ├── layout.tsx                   # Layout principal
│   └── page.tsx                     # Página principal
├── 📁 components/                   # Componentes React
│   ├── 📁 ui/                       # Componentes UI base
│   │   ├── button.tsx               # Botones
│   │   ├── input.tsx                # Inputs
│   │   ├── label.tsx                # Labels
│   │   ├── toast.tsx                # Notificaciones
│   │   ├── toaster.tsx              # Contenedor de toasts
│   │   └── use-toast.ts             # Hook de toast
│   ├── AppStatus.tsx                # Estado del sistema
│   ├── ChatAssistant.tsx            # Chat principal
│   ├── ChatHeader.tsx               # Header del chat
│   ├── ChatInput.tsx                # Input del chat
│   ├── ChatMessages.tsx             # Mensajes del chat
│   ├── ConfigurationForm.tsx        # Formulario de configuración
│   ├── ConsultedDocuments.tsx       # Documentos consultados
│   ├── InitialMessage.tsx           # Mensaje inicial
│   ├── Navigation.tsx               # Navegación
│   ├── PlanningAssistant.tsx        # Layout principal
│   ├── ResourcesBank.tsx            # Banco de recursos
│   └── UserAdmin.tsx                # Administración de usuarios
├── 📁 contexts/                     # Contextos React
│   ├── AppProvider.tsx              # Proveedor principal
│   ├── AuthContext.tsx              # Contexto de autenticación
│   ├── ChatContext.tsx              # Contexto del chat
│   ├── DocumentContext.tsx          # Contexto de documentos
│   ├── NavigationContext.tsx        # Contexto de navegación
│   └── PlanningContext.tsx          # Contexto de planeación
├── 📁 hooks/                        # Custom Hooks
│   ├── useAuth.ts                   # Hook de autenticación
│   ├── useBucketDocuments.ts        # Hook de documentos
│   ├── useChatActions.ts            # Hook de acciones del chat
│   ├── usePlanningActions.ts        # Hook de acciones de planeación
│   └── index.ts                     # Exportaciones
├── 📁 lib/                          # Servicios y utilidades
│   ├── 📁 supabase/                 # Cliente Supabase
│   │   ├── admin.ts                 # Cliente admin
│   │   ├── client.ts                # Cliente público
│   │   └── server.ts                # Cliente servidor
│   ├── educational-content-service.ts # Servicio de contenido
│   ├── openai-assistant-service.ts   # Servicio de IA (OpenAI Assistant)
│   ├── pdf-content-processor.ts     # Procesador de PDFs
│   ├── vector-search.ts             # Búsqueda vectorial
│   └── utils.ts                     # Utilidades generales
├── 📁 types/                        # Tipos TypeScript
│   └── index.ts                     # Definiciones de tipos
├── 📁 utils/                        # Utilidades
│   ├── markdown.ts                  # Procesador de markdown
│   └── index.ts                     # Exportaciones
├── 📁 public/                       # Archivos estáticos
│   └── placeholder.svg              # Imagen placeholder
├── 📁 scripts/                      # Scripts de base de datos
│   └── 008_setup_admin_user.sql     # Configuración de admin
├── package.json                     # Dependencias
├── tsconfig.json                    # Configuración TypeScript
├── tailwind.config.js               # Configuración Tailwind
├── next.config.mjs                  # Configuración Next.js
└── README.md                        # Este archivo
```

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- **Node.js** 18.0 o superior
- **npm** o **pnpm** (recomendado)
- **Git** para clonar el repositorio
- **Cuenta de Supabase** para backend
- **API Key de Google Gemini** para IA

### 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/tutor-agente-ia.git
   cd tutor-agente-ia
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```

4. **Configurar variables en `.env.local`**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   
   # OpenAI Assistant
   OPENAI_API_KEY=tu_openai_api_key
   ASSISTANT_ID=tu_assistant_id
   
   # Opcional: Claves de administración
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

5. **Configurar base de datos**
   ```bash
   # Ejecutar scripts SQL en Supabase
   # Ver sección de Base de Datos
   ```

6. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

7. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

### 🗄️ Configuración de Base de Datos

1. **Crear proyecto en Supabase**
2. **Ejecutar scripts SQL** (ver sección Base de Datos)
3. **Configurar políticas RLS**
4. **Subir documentos al Storage**

---

## 💻 Uso del Sistema

### 🎯 Flujo de Trabajo Principal

#### 1. **Configuración Inicial**
- Acceder a la aplicación
- Completar formulario de configuración:
  - **Grado**: 1° a 11°
  - **Asignatura**: Tecnología e Informática (fijo)
  - **Tema**: Tema específico a enseñar
  - **Sesiones**: 1 o 2 sesiones (2-4 horas)
  - **Recursos**: Recursos disponibles
  - **Nombre del docente**: Nombre completo

#### 2. **Generación de Plan**
- Iniciar conversación con el asistente
- Solicitar plan de clase específico
- El sistema consulta documentos relevantes
- Genera plan estructurado y completo

#### 3. **Revisión y Edición**
- Revisar el plan generado
- Solicitar modificaciones si es necesario
- El asistente ajusta según solicitudes

#### 4. **Guardado y Exportación**
- Guardar el chat en el banco de recursos
- Exportar a documento Word
- Reutilizar en futuras planeaciones

### 🎨 Interfaz de Usuario

#### **Pestaña "Generar"**
- Formulario de configuración
- Chat interactivo con asistente
- Visualización de documentos consultados
- Botones de acción (enviar, limpiar, guardar)

#### **Pestaña "Historial"**
- Lista de planeaciones guardadas
- Búsqueda y filtrado
- Visualización de chats completos
- Exportación individual

#### **Pestaña "Estado"** (Solo administradores)
- Estado del sistema
- Estadísticas de uso
- Gestión de usuarios
- Monitoreo de documentos

---

## 🎨 Componentes Principales

### 🏗️ Arquitectura de Componentes

```mermaid
graph TD
    A[PlanningAssistant] --> B[Navigation]
    A --> C[ChatAssistant]
    A --> D[ResourcesBank]
    A --> E[AppStatus]
    
    C --> F[ConfigurationForm]
    C --> G[ChatHeader]
    C --> H[ChatMessages]
    C --> I[ChatInput]
    C --> J[ConsultedDocuments]
    C --> K[InitialMessage]
    
    B --> L[AuthContext]
    C --> M[ChatContext]
    D --> N[PlanningContext]
    E --> O[DocumentContext]
```

### 📱 Componentes Clave

#### **PlanningAssistant.tsx**
- **Propósito**: Componente principal y coordinador
- **Estado**: Navegación, datos de planeación
- **Contextos**: Auth, Navigation, Planning

#### **ChatAssistant.tsx**
- **Propósito**: Interfaz de chat principal
- **Funcionalidades**: Configuración, chat, exportación
- **Estado**: Mensajes, configuración, carga

#### **ResourcesBank.tsx**
- **Propósito**: Gestión de historial
- **Funcionalidades**: Lista, búsqueda, exportación
- **Estado**: Planeaciones, filtros

#### **ConfigurationForm.tsx**
- **Propósito**: Formulario de configuración inicial
- **Validación**: Campos obligatorios, formatos
- **Estado**: Configuración de planeación

### 🎯 Contextos de Estado

#### **AuthContext**
```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}
```

#### **ChatContext**
```typescript
interface ChatContextType {
  messages: Message[]
  isConfigured: boolean
  planningConfig: PlanningConfig
  isLoading: boolean
  isSaving: boolean
  consultedDocuments: ConsultedDocuments
  // ... acciones
}
```

#### **DocumentContext**
```typescript
interface DocumentContextType {
  documents: PDFContent[]
  isLoading: boolean
  error: string | null
  documentCount: number
  lastUpdated: Date | null
  // ... acciones
}
```

---

## 🔧 API y Servicios

### 🤖 Servicio de IA (OpenAI Assistant)

```typescript
// lib/openai-assistant-service.ts
export async function getOpenAIResponse(context: {
  message: string;
  planningConfig?: any;
  chatHistory?: any[];
}): Promise<{ answer: string }>
```

**Características:**
- Modelo: `gpt-4` (o el modelo configurado en OpenAI)
- Prompt engineering optimizado con contexto, historial y configuración inicial
- Respuestas estructuradas y formateadas en Markdown
- Integración segura vía backend (la API Key nunca se expone al frontend)

#### Conexión y configuración

1. **Obtener una API Key de OpenAI** desde https://platform.openai.com/api-keys
2. **Configurar variables en `.env.local`:**
   ```env
   # OpenAI
   OPENAI_API_KEY=sk-...
   ASSISTANT_ID=asst_...
   ```
3. **El backend se encarga de:**
   - Recibir el mensaje, configuración y contexto del usuario
   - Construir el prompt enriquecido
   - Llamar a la API de OpenAI Assistant
   - Devolver la respuesta al frontend

4. **El frontend solo interactúa con el backend** mediante endpoints `/api/chat/openai`.

### 📚 Servicio de Documentos

```typescript
// lib/educational-content-service.ts
class EducationalContentService {
  async getDocuments(): Promise<PDFContent[]>
  async searchDocuments(query: string): Promise<PDFContent[]>
  async getDocumentById(id: string): Promise<PDFContent>
}
```

**Funcionalidades:**
- Carga de documentos desde Supabase Storage
- Búsqueda vectorial semántica
- Procesamiento de PDFs
- Extracción de contenido

### 🔍 Búsqueda Vectorial

```typescript
// lib/vector-search.ts
class VectorSearchService {
  async searchSimilar(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]>
}
```

**Características:**
- Embeddings de 1536 dimensiones
- Búsqueda híbrida (texto + vector)
- Scoring combinado
- Filtrado por metadatos

---

## 📊 Base de Datos

### 🗄️ Esquema Principal

#### **Tabla: planeaciones**
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
  user_id UUID REFERENCES auth.users(id)
);
```

#### **Tabla: documents**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  doc_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Tabla: chunks**
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

### 🔧 Funciones SQL

#### **search_educational_content**
```sql
CREATE OR REPLACE FUNCTION search_educational_content(
  query_text TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  doc_type VARCHAR(50),
  similarity FLOAT
)
```

#### **insert_educational_document**
```sql
CREATE OR REPLACE FUNCTION insert_educational_document(
  p_title TEXT,
  p_content TEXT,
  p_doc_type VARCHAR(50),
  p_metadata JSONB,
  p_embedding vector(1536)
)
RETURNS UUID
```

### 🔒 Políticas RLS

```sql
-- Política para planeaciones
CREATE POLICY "Users can view their own planeaciones" ON planeaciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planeaciones" ON planeaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

---

## 🔒 Seguridad

### 🛡️ Medidas de Seguridad Implementadas

#### **Autenticación y Autorización**
- Autenticación con Supabase Auth
- Políticas RLS en base de datos
- Verificación de roles de usuario
- Tokens JWT seguros

#### **Validación de Datos**
- Validación en frontend (TypeScript)
- Sanitización de inputs
- Validación de tipos
- Escape de caracteres especiales

#### **Protección de API**
- Rate limiting en endpoints
- Validación de API keys
- CORS configurado
- Headers de seguridad

#### **Protección de IA**
- Filtrado de prompts maliciosos
- Validación de respuestas
- Anti-alucinación
- Límites de tokens

### 🔐 Configuración de Seguridad

```typescript
// Configuración de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
)
```

---

## 📝 Contribución

### 🤝 Cómo Contribuir

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abrir** un Pull Request

### 📋 Estándares de Código

#### **TypeScript**
- Tipado estricto habilitado
- Interfaces bien definidas
- Evitar `any` cuando sea posible
- Documentación de tipos complejos

#### **React**
- Componentes funcionales
- Hooks personalizados para lógica
- Props tipadas
- Estado inmutable

#### **Estilos**
- Tailwind CSS para estilos
- Clases semánticas
- Responsive design
- Consistencia visual

#### **Commits**
- `feat:` nueva funcionalidad
- `fix:` corrección de bugs
- `docs:` documentación
- `style:` formato de código
- `refactor:` refactorización
- `test:` pruebas

### 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests con coverage
npm run test:coverage

# Tests de integración
npm run test:integration
```

### 📚 Documentación

- README actualizado
- Comentarios en código complejo
- JSDoc para funciones públicas
- Diagramas actualizados

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 📞 Soporte y Contacto

- **Email**: soporte@ie-camilo-torres.edu.co
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/tutor-agente-ia/wiki)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/tutor-agente-ia/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/tu-usuario/tutor-agente-ia/discussions)

---

## 🙏 Agradecimientos

- **Institución Educativa Camilo Torres** por la confianza y apoyo
- **OpenAI** por la API de inteligencia artificial
- **Supabase** por la infraestructura de backend
- **Comunidad de Next.js** por el framework
- **Contribuidores** del proyecto

---

<div align="center">

**Desarrollado con ❤️ para la educación colombiana**

[⬆️ Volver al inicio](#-planeador-didáctico-inteligente---ie-camilo-torres)

</div>


