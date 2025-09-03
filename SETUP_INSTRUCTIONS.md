# Configuración de Variables de Entorno

Para que el sistema de administración de usuarios funcione correctamente, necesitas configurar las siguientes variables de entorno:

## 1. Variables Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yyeqybtcopfaccnpnorf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Gemini API (opcional)
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

## 2. Cómo Obtener las Claves de Supabase

### URL de Supabase:
- Ya tienes: `https://yyeqybtcopfaccnpnorf.supabase.co`

### Anon Key:
1. Ve a tu dashboard de Supabase
2. Navega a Settings > API
3. Copia la "anon public" key

### Service Role Key:
1. En el mismo lugar (Settings > API)
2. Copia la "service_role" key
3. ⚠️ **IMPORTANTE**: Esta clave es muy sensible, no la compartas

## 3. Funcionalidades por Configuración

### Con Service Role Key:
- ✅ Listar usuarios reales
- ✅ Crear usuarios
- ✅ Eliminar usuarios
- ✅ Resetear contraseñas

### Sin Service Role Key (solo Anon Key):
- ✅ Listar usuarios (datos mock)
- ❌ Crear usuarios
- ❌ Eliminar usuarios
- ❌ Resetear contraseñas

## 4. Verificación

Después de configurar las variables:

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a la sección "Usuarios" en tu aplicación

3. Si ves los usuarios reales de tu base de datos, la configuración es correcta

## 5. Solución de Problemas

### Error: "Failed to fetch users"
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté configurada
- Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté configurada

### Error: "Service role key not configured"
- Agrega `SUPABASE_SERVICE_ROLE_KEY` a tu archivo `.env.local`
- Reinicia el servidor

### Error: "Invalid token"
- Las APIs ahora funcionan sin autenticación para testing
- Si persiste, verifica las claves de Supabase
