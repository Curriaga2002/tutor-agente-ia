import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Crear cliente de Supabase para verificar autenticación
    const supabase = createClient()
    
    // Obtener el token de las cookies
    const token = request.cookies.get('sb-access-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token found' }, { status: 401 })
    }

    // Verificar el token del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verificar que sea admin
    if (user.email !== 'admin@admin.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Obtener todos los usuarios usando el service role
    const adminSupabase = createAdminClient()
    const { data: users, error } = await adminSupabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Filtrar y formatear los datos de usuarios
    const formattedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      is_admin: user.email === 'admin@admin.com'
    }))

    return NextResponse.json({ users: formattedUsers })

  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
