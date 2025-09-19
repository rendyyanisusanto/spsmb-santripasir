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

    const pendaftarId = params.id

    let query = supabase
      .from('pendaftar')
      .select('*')
      .eq('id', pendaftarId)

    // Filter berdasarkan role lembaga
    if (authResult.user.role === 'lembaga') {
      query = query.eq('lembaga_pendidikan', authResult.user.lembaga_akses)
    }

    const { data: pendaftar, error } = await query.single()

    if (error || !pendaftar) {
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

    const pendaftarId = params.id
    const body = await request.json()
    const { nama, jenis_kelamin, no_hp, nama_wali, alamat, lembaga_pendidikan } = body

    // Validasi input
    if (!nama || !jenis_kelamin || !no_hp || !nama_wali || !alamat || !lembaga_pendidikan) {
      return Response.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Validasi lembaga pendidikan
    const validLembaga = ['SD', 'SMP', 'SMA', 'SMK', 'Non Formal']
    if (!validLembaga.includes(lembaga_pendidikan)) {
      return Response.json(
        { error: 'Lembaga pendidikan tidak valid' },
        { status: 400 }
      )
    }

    // Cek akses lembaga untuk role lembaga
    if (!canAccessLembaga(authResult.user, lembaga_pendidikan)) {
      return Response.json(
        { error: 'Tidak memiliki akses untuk lembaga pendidikan ini' },
        { status: 403 }
      )
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
      .select('lembaga_pendidikan')
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      checkQuery = checkQuery.eq('lembaga_pendidikan', authResult.user.lembaga_akses)
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
        lembaga_pendidikan,
        updated_by: authResult.user.id
      })
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      updateQuery = updateQuery.eq('lembaga_pendidikan', authResult.user.lembaga_akses)
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

    const pendaftarId = params.id

    // Cek apakah data pendaftar ada dan user memiliki akses
    let checkQuery = supabase
      .from('pendaftar')
      .select('nama, lembaga_pendidikan')
      .eq('id', pendaftarId)

    if (authResult.user.role === 'lembaga') {
      checkQuery = checkQuery.eq('lembaga_pendidikan', authResult.user.lembaga_akses)
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
      deleteQuery = deleteQuery.eq('lembaga_pendidikan', authResult.user.lembaga_akses)
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