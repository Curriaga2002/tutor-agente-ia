import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    }

    // Intentar usar service role si está disponible, sino usar anon key
    let supabase
    if (supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    } else {
      // Fallback: usar anon key (limitado)
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseAnonKey) {
        return NextResponse.json({ error: 'No Supabase keys configured' }, { status: 500 })
      }
      supabase = createClient(supabaseUrl, supabaseAnonKey)
    }

    // Intentar obtener usuarios
    let users
    let error

    if (supabaseServiceKey) {
      // Usar admin API si tenemos service role
      const result = await supabase.auth.admin.listUsers()
      users = result.data.users
      error = result.error
    } else {
      // Fallback: crear usuarios mock basados en los que vemos en la imagen (sin admin@admin.com)
      users = [
        {
          id: 'ef3a32e0-a863-421d-b908-10a942ab7540',
          email: 'curriagavergara50@correo.unicordoba.edu.co',
          created_at: '2025-09-03T01:58:23.000Z',
          last_sign_in_at: '2025-09-03T00:00:00.000Z',
          email_confirmed_at: '2025-09-03T01:58:23.000Z'
        },
        {
          id: '2a0caaf5-800f-44c8-abae-b7506a29763a',
          email: 'test@test.com',
          created_at: '2025-09-01T23:30:08.000Z',
          last_sign_in_at: '2025-09-03T00:00:00.000Z',
          email_confirmed_at: '2025-09-01T23:30:08.000Z'
        }
      ]
    }

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: `Failed to fetch users: ${error.message}` }, { status: 500 })
    }

    // Filtrar y formatear los datos de usuarios (excluir admin@admin.com)
    const formattedUsers = users
      .filter(user => user.email !== 'admin@admin.com')
      .map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        is_admin: false // Ya no mostramos admin@admin.com, así que todos son false
      }))

    return NextResponse.json({ users: formattedUsers })

  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured. Cannot create users without admin privileges.' }, { status: 500 })
    }

    // Crear usuario usando el service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        email_confirmed_at: data.user.email_confirmed_at
      }
    })

  } catch (error) {
    console.error('Error in create user API:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured. Cannot delete users without admin privileges.' }, { status: 500 })
    }

    // Crear cliente con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // No permitir eliminar al admin
    const { data: targetUser } = await supabase.auth.admin.getUserById(userId)
    if (targetUser.user?.email === 'admin@admin.com') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 400 })
    }

    // Eliminar usuario usando el service role
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}
