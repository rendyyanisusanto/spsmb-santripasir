import { authenticate, authorize, canAccessLembaga } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Get specific pendaftar
export async function GET(request, { params }) {
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

    // CRITICAL FIX: await params (Next.js 15 async params)
    const resolvedParams = await params
    const pendaftarId = resolvedParams.id

    // ===== DEBUG LOGGING START =====
    console.log('==========================================')
    console.log('GET PENDAFTAR BY ID - START')
    console.log('==========================================')
    console.log('1. Request params:', { pendaftarId, rawParams: params })
    console.log('2. Auth user:', {
      id: authResult.user.id,
      username: authResult.user.username,
      role: authResult.user.role,
      lembaga_id: authResult.user.lembaga_id,
      lembaga_name: authResult.user.lembaga_name,
      fullUser: JSON.stringify(authResult.user)
    })

    let query = supabase
      .from('pendaftar')
      .select('*')
      .eq('id', pendaftarId)

    console.log('3. Base query built for pendaftar:', pendaftarId)

    // Filter berdasarkan role lembaga
    if (authResult.user.role === 'lembaga') {
      console.log('4. User is LEMBAGA role - applying filter')
      console.log('   lembaga_id from user:', authResult.user.lembaga_id)
      // User lembaga hanya bisa akses data dari lembaganya
      if (authResult.user.lembaga_id) {
        query = query.eq('lembaga_id', authResult.user.lembaga_id)
        console.log('   Filter applied: lembaga_id =', authResult.user.lembaga_id)
      } else {
        console.log('   WARNING: lembaga_id is NULL/undefined - no filter applied!')
      }
    } else {
      console.log('4. User role is:', authResult.user.role, '- NO lembaga filter')
    }

    console.log('5. Executing Supabase query...')
    const { data: pendaftar, error } = await query.single()

    console.log('6. Supabase query result:', {
      success: !error,
      hasData: !!pendaftar,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null,
      data: pendaftar ? {
        id: pendaftar.id,
        nama: pendaftar.nama,
        lembaga_id: pendaftar.lembaga_id,
        lembaga_pendidikan: pendaftar.lembaga_pendidikan
      } : null
    })
    console.log('==========================================')
    console.log('GET PENDAFTAR BY ID - END')
    console.log('==========================================')
    // ===== DEBUG LOGGING END =====

    if (error || !pendaftar) {
      console.error('RETURNING 404 - Pendaftar not found')
      return Response.json(
        { error: 'Data pendaftar tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: pendaftar
    })

  } catch (error) {
    console.error('Get pendaftar error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update pendaftar
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - semua role yang login bisa update
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    // CRITICAL FIX: await params (Next.js 15 async params)
    const resolvedParams = await params
    const pendaftarId = resolvedParams.id
    const body = await request.json()
    const { nama, jenis_kelamin, no_hp, nama_wali, alamat, lembaga_id } = body

    // Validasi input
    if (!nama || !jenis_kelamin || !no_hp || !nama_wali || !alamat || !lembaga_id) {
      return Response.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Validasi lembaga_id - pastikan lembaga exists
    const { data: lembagaExists, error: lembagaError } = await supabase
      .from('lembaga')
      .select('id')
      .eq('id', lembaga_id)
      .single()

    if (lembagaError || !lembagaExists) {
      return Response.json(
        { error: 'Lembaga tidak valid' },
        { status: 400 }
      )
    }

    // Cek akses lembaga untuk role lembaga
    if (authResult.user.role === 'lembaga') {
      if (authResult.user.lembaga_id && lembaga_id !== authResult.user.lembaga_id) {
        return Response.json(
          { error: 'Tidak memiliki akses untuk lembaga ini' },
          { status: 403 }
        )
      }
    }

    // Validasi jenis kelamin
    const validJenisKelamin = ['Pria', 'Wanita']
    if (!validJenisKelamin.includes(jenis_kelamin)) {
      return Response.json(
        { error: 'Jenis kelamin tidak valid' },
        { status: 400 }
      )
    }

    // Validasi nomor HP
    const phoneRegex = /^[0-9]{10,15}$/
    if (!phoneRegex.test(no_hp.replace(/[^\d]/g, ''))) {
      return Response.json(
        { error: 'Nomor HP tidak valid' },
        { status: 400 }
      )
    }

    // Cek apakah data pendaftar ada dan user memiliki akses
    let checkQuery = supabase
      .from('pendaftar')
      .select('lembaga_id')
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      if (authResult.user.lembaga_id) {
        checkQuery = checkQuery.eq('lembaga_id', authResult.user.lembaga_id)
      }
    }

    const { data: existingData, error: checkError } = await checkQuery.single()

    if (checkError || !existingData) {
      return Response.json(
        { error: 'Data pendaftar tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    // Update data
    let updateQuery = supabase
      .from('pendaftar')
      .update({
        nama: nama.trim(),
        jenis_kelamin,
        no_hp: no_hp.trim(),
        nama_wali: nama_wali.trim(),
        alamat: alamat.trim(),
        lembaga_id,
        updated_by: authResult.user.id
      })
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      if (authResult.user.lembaga_id) {
        updateQuery = updateQuery.eq('lembaga_id', authResult.user.lembaga_id)
      }
    }

    const { data, error } = await updateQuery.select()

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal mengupdate data pendaftar' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return Response.json(
        { error: 'Data pendaftar tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      message: 'Data pendaftar berhasil diupdate',
      data: data[0]
    })

  } catch (error) {
    console.error('Update pendaftar error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete pendaftar
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - semua role yang login bisa delete
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    // CRITICAL FIX: await params (Next.js 15 async params)
    const resolvedParams = await params
    const pendaftarId = resolvedParams.id

    // Cek apakah data pendaftar ada dan user memiliki akses
    let checkQuery = supabase
      .from('pendaftar')
      .select('nama, lembaga_id')
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      if (authResult.user.lembaga_id) {
        checkQuery = checkQuery.eq('lembaga_id', authResult.user.lembaga_id)
      }
    }

    const { data: existingData, error: checkError } = await checkQuery.single()

    if (checkError || !existingData) {
      return Response.json(
        { error: 'Data pendaftar tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    // Delete data
    let deleteQuery = supabase
      .from('pendaftar')
      .delete()
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      if (authResult.user.lembaga_id) {
        deleteQuery = deleteQuery.eq('lembaga_id', authResult.user.lembaga_id)
      }
    }

    const { error } = await deleteQuery

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal menghapus data pendaftar' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Data pendaftar berhasil dihapus',
      data: { id: pendaftarId, nama: existingData.nama }
    })

  } catch (error) {
    console.error('Delete pendaftar error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}