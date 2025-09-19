import { authenticate, authorize, hashPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Get specific user (superadmin only)
export async function GET(request, { params }) {
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

    const userId = params.id

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, lembaga_akses, is_active, created_at, last_login')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return Response.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get user error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update user (superadmin only)
export async function PUT(request, { params }) {
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

    const userId = params.id
    const body = await request.json()
    const { username, email, password, full_name, role, lembaga_akses, is_active } = body

    // Validasi input
    if (!username || !email || !full_name || !role) {
      return Response.json(
        { error: 'Field wajib harus diisi' },
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

    // Prepare update data
    const updateData = {
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      full_name: full_name.trim(),
      role,
      lembaga_akses: role === 'lembaga' ? lembaga_akses : null,
      is_active: is_active !== undefined ? is_active : true
    }

    // Hash password jika diubah
    if (password) {
      updateData.password_hash = hashPassword(password)
    }

    // Update database
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, email, full_name, role, lembaga_akses, is_active, created_at, last_login')

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return Response.json(
          { error: 'Username atau email sudah digunakan' },
          { status: 409 }
        )
      }
      return Response.json(
        { error: 'Gagal mengupdate user' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return Response.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      message: 'User berhasil diupdate',
      data: data[0]
    })

  } catch (error) {
    console.error('Update user error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (superadmin only)
export async function DELETE(request, { params }) {
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

    const userId = params.id

    // Cek apakah user yang akan dihapus bukan superadmin terakhir
    const { data: superadminCount } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('role', 'superadmin')
      .eq('is_active', true)

    if (superadminCount === 1) {
      // Cek apakah user yang akan dihapus adalah superadmin
      const { data: userToDelete } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userToDelete && userToDelete.role === 'superadmin') {
        return Response.json(
          { error: 'Tidak dapat menghapus superadmin terakhir' },
          { status: 403 }
        )
      }
    }

    // Soft delete - set is_active = false
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .select('id, username, full_name')

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal menghapus user' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return Response.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      message: 'User berhasil dihapus',
      data: data[0]
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}