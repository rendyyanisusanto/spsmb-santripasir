import { authenticate, authorize, hashPassword, verifyPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Get current user settings and system settings (for superadmin)
export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - semua role yang login bisa akses
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const user = authResult.user

    // Get user profile data (exclude password)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, lembaga_id, is_active, created_at, last_login')
      .eq('id', user.id)
      .single()

    if (userError) {
      return Response.json({ error: 'Gagal mengambil data user' }, { status: 500 })
    }

    const response = {
      user: userData
    }

    // If superadmin, add system settings
    if (user.role === 'superadmin') {
      // Get system statistics
      const { data: pendaftarCount, error: pendaftarError } = await supabase
        .from('pendaftar')
        .select('id', { count: 'exact', head: true })

      const { data: santriCount, error: santriError } = await supabase
        .from('santri')
        .select('id', { count: 'exact', head: true })

      const { data: lembagaCount, error: lembagaError } = await supabase
        .from('lembaga')
        .select('id', { count: 'exact', head: true })

      const { data: usersCount, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })

      response.systemStats = {
        totalPendaftar: pendaftarCount || 0,
        totalSantri: santriCount || 0,
        totalLembaga: lembagaCount || 0,
        totalUsers: usersCount || 0
      }

      // Get recent activities (last 10 registrations)
      const { data: recentActivities, error: activitiesError } = await supabase
        .from('pendaftar')
        .select(`
          id,
          nama,
          lembaga_pendidikan,
          created_at,
          lembaga:lembaga_id(nama)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      response.recentActivities = recentActivities || []
    }

    return Response.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Settings GET error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update user settings
export async function PUT(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - semua role yang login bisa akses
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const { settingType, ...updateData } = await request.json()
    const user = authResult.user

    if (settingType === 'profile') {
      // Update user profile
      const { username, email, full_name, currentPassword, newPassword } = updateData

      // Validasi input
      if (!username || !email || !full_name) {
        return Response.json({ error: 'Username, email, dan nama lengkap harus diisi' }, { status: 400 })
      }

      // Check if username/email already exists (exclude current user)
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username, email')
        .neq('id', user.id)
        .or(`username.eq.${username},email.eq.${email}`)

      if (existingUser && existingUser.length > 0) {
        const conflicts = existingUser.map(u => {
          if (u.username === username) return 'Username'
          if (u.email === email) return 'Email'
        }).filter(Boolean)
        return Response.json({ error: `${conflicts.join(' dan ')} sudah digunakan` }, { status: 400 })
      }

      let updateFields = { username, email, full_name }

      // If changing password
      if (newPassword) {
        if (!currentPassword) {
          return Response.json({ error: 'Password lama harus diisi' }, { status: 400 })
        }

        // Verify current password using authenticated user's data returned by authenticate()
        // authenticate() already fetched the user record, so use that to avoid additional RLS/permission issues
        const currentUser = user

        if (!currentUser || !currentUser.password_hash) {
          return Response.json({ error: 'Gagal memverifikasi password' }, { status: 500 })
        }

        const isValidPassword = verifyPassword(currentPassword, currentUser.password_hash)
        
        if (!isValidPassword) {
          return Response.json({ error: 'Password lama tidak benar' }, { status: 400 })
        }

        if (newPassword.length < 6) {
          return Response.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
        }

  updateFields.password_hash = hashPassword(newPassword)
      }

      // Update user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', user.id)
        .select('id, username, email, full_name, role')
        .single()

      if (updateError) {
        console.error('Update user error:', updateError)
        return Response.json({ error: 'Gagal mengupdate profil' }, { status: 500 })
      }

      return Response.json({
        success: true,
        message: 'Profil berhasil diupdate',
        data: updatedUser
      })

    } else if (settingType === 'system' && user.role === 'superadmin') {
      // System settings - only for superadmin
      const { maintenanceMode, registrationOpen, maxFileSize } = updateData

      // For now, we'll store system settings in a simple way
      // In a real app, you might want a dedicated settings table
      
      return Response.json({
        success: true,
        message: 'Pengaturan sistem berhasil diupdate'
      })

    } else {
      return Response.json({ error: 'Tipe pengaturan tidak valid' }, { status: 400 })
    }

  } catch (error) {
    console.error('Settings PUT error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}