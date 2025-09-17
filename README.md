# 🎓 Tutor Agente IA - Sistema de Planeación Didáctica Inteligente

[![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.38.4-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Assistant-orange?style=for-the-badge&logo=openai)](https://openai.com/)

> **Sistema inteligente de planeación didáctica que utiliza Inteligencia Artificial para ayudar a los docentes a crear planes de clase personalizados y efectivos.**

## 📋 Tabla de Contenidos

- [✨ Características](#-características)
- [🚀 Tecnologías](#-tecnologías)
- [📦 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [🎯 Uso](#-uso)
- [🏗️ Arquitectura](#️-arquitectura)
- [📱 Capturas de Pantalla](#-capturas-de-pantalla)
- [🔧 API Reference](#-api-reference)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

## ✨ Características

### 🎯 **Generación Inteligente de Planeaciones**
- **Chat Interactivo**: Conversación natural con IA para crear planes de clase
- **Configuración Personalizada**: Grado, asignatura, tema, sesiones y recursos
- **Respuestas Contextuales**: IA adapta las respuestas según el contexto educativo
- **Persistencia de Sesión**: Las conversaciones se guardan automáticamente

### 📚 **Gestión de Recursos**
- **Banco de Planeaciones**: Historial completo de todas las planeaciones creadas
- **Búsqueda y Filtrado**: Encuentra planeaciones por tema, grado o fecha
- **Visualización Completa**: Ve el historial completo de cada conversación
- **Exportación Múltiple**: Exporta a Word (.docx) o PDF

### 👥 **Sistema de Usuarios**
- **Autenticación Segura**: Login con Supabase Auth
- **Roles de Usuario**: Usuario normal y administrador
- **Gestión de Usuarios**: Panel de administración (solo admins)
- **Protección de Rutas**: Acceso controlado por roles

### 🎨 **Interfaz Moderna**
- **Diseño Responsive**: Funciona perfectamente en móviles, tablets y desktop
- **UI/UX Intuitiva**: Interfaz limpia y fácil de usar
- **Animaciones Suaves**: Transiciones y efectos visuales atractivos
- **Tema Consistente**: Paleta de colores y tipografía unificada

## 🚀 Tecnologías

### **Frontend**
- **Next.js 14.2.32** - Framework React con App Router
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript 5** - Tipado estático para JavaScript
- **Tailwind CSS 3.3.0** - Framework de CSS utilitario
- **Geist Fonts** - Tipografía moderna y legible

### **Backend & Servicios**
- **Supabase** - Base de datos PostgreSQL y autenticación
- **OpenAI Assistant API** - Inteligencia Artificial para generación de contenido
- **Next.js API Routes** - Endpoints del servidor

### **Herramientas de Desarrollo**
- **ESLint** - Linter para JavaScript/TypeScript
- **PostCSS** - Procesador de CSS
- **Autoprefixer** - Prefijos CSS automáticos

### **Librerías Adicionales**
- **@supabase/ssr** - Supabase para Server-Side Rendering
- **react-markdown** - Renderizado de Markdown
- **docx** - Generación de documentos Word
- **pdf-lib** - Manipulación de PDFs
- **file-saver** - Descarga de archivos
- **html2canvas** - Captura de pantalla a canvas
- **jspdf** - Generación de PDFs

## 📦 Instalación

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- API Key de OpenAI

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/tutor-agente-ia.git
cd tutor-agente-ia
```

### **2. Instalar Dependencias**
```bash
npm install
# o
yarn install
```

### **3. Configurar Variables de Entorno**
Crear archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=tu_openai_api_key
OPENAI_ASSISTANT_ID=tu_openai_assistant_id
```

### **4. Configurar Base de Datos**
Ejecutar el script SQL en Supabase:

```sql
-- Crear tabla de planeaciones
CREATE TABLE planeaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grado VARCHAR(10) NOT NULL,
  tema VARCHAR(255) NOT NULL,
  duracion VARCHAR(50) NOT NULL,
  sesiones INTEGER NOT NULL,
  contenido JSONB NOT NULL,
  chat_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;

-- Política para usuarios autenticados
CREATE POLICY "Users can view their own planeaciones" ON planeaciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planeaciones" ON planeaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### **5. Ejecutar en Desarrollo**
```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuración

### **Configuración de Supabase**

1. **Crear Proyecto en Supabase**
   - Ir a [supabase.com](https://supabase.com)
   - Crear nuevo proyecto
   - Obtener URL y anon key

2. **Configurar Autenticación**
   - Habilitar autenticación por email
   - Configurar políticas RLS
   - Crear usuario administrador

### **Configuración de OpenAI**

1. **Obtener API Key**
   - Ir a [platform.openai.com](https://platform.openai.com)
   - Crear API key
   - Configurar límites de uso

2. **Crear Assistant**
   - Ir a Assistants en OpenAI
   - Crear nuevo assistant
   - Configurar instrucciones del sistema
   - Obtener Assistant ID

### **Configuración de Usuario Administrador**

Para crear un usuario administrador, actualizar el email en `contexts/AuthContext.tsx`:

```typescript
isAdmin: user.email === 'admin@tu-dominio.com'
```

## 🎯 Uso

### **1. Configuración Inicial**
- Acceder a la aplicación
- Completar el formulario de configuración:
  - Seleccionar grado (1° a 11°)
  - Especificar tema de la clase
  - Definir número de sesiones (1-2)
  - Describir recursos disponibles
  - Ingresar nombre del docente

### **2. Generar Planeación**
- Iniciar conversación con el asistente IA
- Hacer preguntas específicas sobre:
  - Objetivos de aprendizaje
  - Actividades pedagógicas
  - Estrategias de evaluación
  - Recursos y materiales
  - Distribución del tiempo

### **3. Gestionar Recursos**
- Ver historial de planeaciones
- Buscar por tema o grado
- Exportar a Word o PDF
- Copiar contenido al portapapeles

### **4. Administración (Solo Admins)**
- Gestionar usuarios
- Eliminar planeaciones
- Ver estadísticas del sistema

## 🏗️ Arquitectura

### **Estructura del Proyecto**
```
tutor-agente-ia/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── ChatAssistant.tsx # Asistente de chat
│   ├── ConfigurationForm.tsx # Formulario de configuración
│   ├── Navigation.tsx    # Navegación principal
│   └── ResourcesBank.tsx # Banco de recursos
├── contexts/             # Contextos de React
│   ├── AppProvider.tsx   # Proveedor principal
│   ├── AuthContext.tsx   # Autenticación
│   ├── ChatContext.tsx   # Estado del chat
│   └── PlanningContext.tsx # Estado de planeaciones
├── hooks/                # Custom Hooks
│   ├── useAuth.ts        # Hook de autenticación
│   ├── useChatActions.ts # Acciones del chat
│   └── usePlanningActions.ts # Acciones de planeación
├── lib/                  # Utilidades y servicios
│   ├── supabase/         # Configuración de Supabase
│   ├── openai-assistant-service.ts # Servicio de OpenAI
│   └── pdf-processor.ts  # Procesamiento de PDFs
├── types/                # Definiciones de TypeScript
│   └── index.ts          # Tipos principales
└── styles/               # Estilos adicionales
    └── markdown.css      # Estilos para Markdown
```

### **Flujo de Datos**
```
Usuario → Componente → Contexto → Hook → API → Servicio Externo
```

### **Patrones de Diseño**
- **Context API**: Estado global compartido
- **Custom Hooks**: Lógica reutilizable
- **Component Composition**: Componentes compuestos
- **Server-Side Rendering**: Optimización de rendimiento

## 📱 Capturas de Pantalla

### **Pantalla Principal**
![Pantalla Principal](public/placeholder.jpg)

### **Formulario de Configuración**
![Configuración](public/placeholder.jpg)

### **Chat con IA**
![Chat](public/placeholder.jpg)

### **Banco de Recursos**
![Recursos](public/placeholder.jpg)

## 🔧 API Reference

### **Endpoints**

#### `POST /api/chat`
Genera respuesta del chat con fallback local.

**Request:**
```json
{
  "message": "string",
  "context": {
    "grado": "string",
    "tema": "string",
    "duracion": "string"
  },
  "documents": []
}
```

**Response:**
```json
{
  "response": "string",
  "formSuggestions": null
}
```

#### `POST /api/chat/openai`
Genera respuesta usando OpenAI Assistant.

**Request:**
```json
{
  "message": "string",
  "planningConfig": {},
  "chatHistory": []
}
```

**Response:**
```json
{
  "answer": "string"
}
```

### **Hooks Personalizados**

#### `useAuth()`
```typescript
const { user, isAdmin, signOut } = useAuth()
```

#### `useChat()`
```typescript
const { 
  messages, 
  addMessage, 
  planningConfig, 
  setConfiguration 
} = useChat()
```

#### `useChatActions()`
```typescript
const { sendMessage } = useChatActions()
```

## 🤝 Contribuir

### **Cómo Contribuir**

1. **Fork** el proyecto
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### **Guías de Contribución**

- Seguir las convenciones de código existentes
- Agregar tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Usar commits descriptivos

### **Reportar Bugs**

Usar el sistema de issues de GitHub con:
- Descripción detallada del problema
- Pasos para reproducir
- Capturas de pantalla si aplica
- Información del entorno

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Cesar Urriaga** - *Desarrollo inicial* - [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [OpenAI](https://openai.com/) - Inteligencia Artificial
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Vercel](https://vercel.com/) - Plataforma de despliegue

## 📞 Contacto

- **Email**: tu-email@ejemplo.com
- **GitHub**: [@tu-usuario](https://github.com/tu-usuario)
- **LinkedIn**: [Tu Perfil](https://linkedin.com/in/tu-perfil)

---

<div align="center">

**⭐ Si te gusta este proyecto, ¡dale una estrella! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/tu-usuario/tutor-agente-ia?style=social)](https://github.com/tu-usuario/tutor-agente-ia/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/tu-usuario/tutor-agente-ia?style=social)](https://github.com/tu-usuario/tutor-agente-ia/network)

</div>