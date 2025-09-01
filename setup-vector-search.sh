#!/bin/bash

echo "🚀 Configurando Sistema de Búsqueda Vectorial para Planeación Didáctica"
echo "=================================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar si pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
else
    echo "✅ pnpm encontrado: $(pnpm --version)"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
pnpm install

# Verificar variables de entorno
echo "🔐 Verificando variables de entorno..."

if [ ! -f ".env.local" ]; then
    echo "⚠️ Archivo .env.local no encontrado. Creando template..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_STORAGE_ACCESS_KEY=your_storage_access_key_here
SUPABASE_STORAGE_SECRET_KEY=your_storage_secret_key_here

# OpenAI Configuration (para embeddings)
OPENAI_API_KEY=your_openai_api_key_here

# Gemini Configuration (para embeddings alternativos)
GEMINI_API_KEY=your_gemini_api_key_here
EOF
    echo "📝 Template de .env.local creado. Por favor configura tus API keys."
else
    echo "✅ Archivo .env.local encontrado"
fi

# Verificar configuración de Supabase
echo "🔍 Verificando configuración de Supabase..."

# Verificar si las funciones SQL están disponibles
echo "📚 Verificando funciones de búsqueda vectorial..."

# Crear directorio sql si no existe
mkdir -p sql

# Verificar si el archivo de funciones existe
if [ ! -f "sql/vector_search_functions.sql" ]; then
    echo "⚠️ Archivo de funciones SQL no encontrado. Verifica que sql/vector_search_functions.sql exista."
else
    echo "✅ Archivo de funciones SQL encontrado"
fi

# Verificar archivos de la librería
echo "🔍 Verificando archivos de la librería..."

required_files=(
    "lib/vector-search.ts"
    "lib/pdf-processor.ts"
    "lib/gemini-embeddings.ts"
    "lib/document-indexer.ts"
    "components/IntelligentSearch.tsx"
    "components/DocumentIndexer.tsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - NO ENCONTRADO"
    fi
done

# Verificar dependencias de TypeScript
echo "🔧 Verificando configuración de TypeScript..."

if [ ! -f "tsconfig.json" ]; then
    echo "⚠️ tsconfig.json no encontrado. Creando configuración básica..."
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
    echo "✅ tsconfig.json creado"
fi

# Verificar configuración de Tailwind
echo "🎨 Verificando configuración de Tailwind CSS..."

if [ ! -f "tailwind.config.js" ]; then
    echo "⚠️ tailwind.config.js no encontrado. Creando configuración básica..."
    cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
    echo "✅ tailwind.config.js creado"
fi

# Verificar configuración de PostCSS
if [ ! -f "postcss.config.js" ]; then
    echo "⚠️ postcss.config.js no encontrado. Creando configuración básica..."
    cat > postcss.config.js << EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    echo "✅ postcss.config.js creado"
fi

# Verificar archivo CSS principal
if [ ! -f "app/globals.css" ]; then
    echo "⚠️ app/globals.css no encontrado. Creando archivo CSS básico..."
    mkdir -p app
    cat > app/globals.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
    echo "✅ app/globals.css creado"
fi

echo ""
echo "🎯 Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tus API keys en .env.local"
echo "2. Ejecuta las funciones SQL en tu base de datos Supabase"
echo "3. Ejecuta 'pnpm dev' para iniciar el servidor de desarrollo"
echo ""
echo "🔍 Para probar el sistema:"
echo "- Sube PDFs usando el componente DocumentIndexer"
echo "- Usa IntelligentSearch para buscar contenido"
echo "- Verifica que los embeddings se generen correctamente"
echo ""
echo "🚀 ¡Sistema de búsqueda vectorial listo!"
