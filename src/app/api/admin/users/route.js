import { authenticate, authorize, hashPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - List all users (superadmin only)
export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - only superadmin
    const authzResult = await authorize(['superadmin'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    // Get query parameters for pagination and filtering
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const role = url.searchParams.get('role')
    const search = url.searchParams.get('search')

    let query = supabase
      .from('users')
      .select('id, username, email, full_name, role, lembaga_akses, is_active, created_at, last_login', { count: 'exact' })

    // Filter by role if specified
    if (role) {
      query = query.eq('role', role)
    }

    // Search by username, email, or full_name
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal mengambil data users' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new user (superadmin only)
export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - only superadmin
    const authzResult = await authorize(['superadmin'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const body = await request.json()
    const { username, email, password, full_name, role, lembaga_akses } = body

    // Validasi input
    if (!username || !email || !password || !full_name || !role) {
      return Response.json(
        { error: 'Semua field wajib harus diisi' },
        { status: 400 }
      )
    }

    // Validasi role
    const validRoles = ['superadmin', 'admin', 'lembaga']
    if (!validRoles.includes(role)) {
      return Response.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      )
    }

    // Validasi lembaga_akses untuk role lembaga
    if (role === 'lembaga') {
      const validLembaga = ['SD', 'SMP', 'SMA', 'SMK', 'Non Formal']
      if (!lembaga_akses || !validLembaga.includes(lembaga_akses)) {
        return Response.json(
          { error: 'Lembaga akses harus diisi untuk role lembaga' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    // Insert ke database
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          password_hash: hashedPassword,
          full_name: full_name.trim(),
          role,
          lembaga_akses: role === 'lembaga' ? lembaga_akses : null
        }
      ])
      .select('id, username, email, full_name, role, lembaga_akses, is_active, created_at')

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return Response.json(
          { error: 'Username atau email sudah digunakan' },
          { status: 409 }
        )
      }
      return Response.json(
        { error: 'Gagal membuat user baru' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'User berhasil dibuat',
      data: data[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}