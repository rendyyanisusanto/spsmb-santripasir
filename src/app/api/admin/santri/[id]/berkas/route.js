import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - List berkas santri
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

    const santriId = params.id

    // Get santri data untuk validasi akses
    const { data: santri, error: santriError } = await supabase
      .from('santri')
      .select('id, lembaga_id')
      .eq('id', santriId)
      .single()

    if (santriError || !santri) {
      return Response.json(
        { error: 'Data santri tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika user adalah lembaga, pastikan santri berasal dari lembaga yang sama
    if (authResult.user.role === 'lembaga') {
      const userLembaga = authResult.user.lembaga_id
      if (!userLembaga || santri.lembaga_id !== userLembaga) {
        return Response.json({ error: 'Tidak memiliki akses untuk melihat berkas santri ini' }, { status: 403 })
      }
    }

    // Get berkas santri
    const { data: berkas, error: berkasError } = await supabase
      .from('berkas_santri')
      .select('*')
      .eq('santri_id', santriId)
      .order('created_at', { ascending: false })

    if (berkasError) {
      return Response.json(
        { error: 'Gagal memuat data berkas' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: berkas
    })

  } catch (error) {
    console.error('Get berkas santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Upload berkas santri baru
export async function POST(request, { params }) {
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

    const santriId = params.id
    const { jenis_berkas, file_url } = await request.json()

    // Validasi input
    if (!jenis_berkas || !file_url) {
      return Response.json({ 
        error: 'Jenis berkas dan URL file harus diisi' 
      }, { status: 400 })
    }

    // Get santri data untuk validasi akses
    const { data: santri, error: santriError } = await supabase
      .from('santri')
      .select('id, lembaga_id')
      .eq('id', santriId)
      .single()

    if (santriError || !santri) {
      return Response.json(
        { error: 'Data santri tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika user adalah lembaga, pastikan santri berasal dari lembaga yang sama
    if (authResult.user.role === 'lembaga') {
      const userLembaga = authResult.user.lembaga_id
      if (!userLembaga || santri.lembaga_id !== userLembaga) {
        return Response.json({ error: 'Tidak memiliki akses untuk mengelola berkas santri ini' }, { status: 403 })
      }
    }

    // Insert berkas baru
    const { data: newBerkas, error: insertError } = await supabase
      .from('berkas_santri')
      .insert({
        santri_id: santriId,
        jenis_berkas,
        file_url
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting berkas:', insertError)
      return Response.json(
        { error: 'Gagal menyimpan berkas' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Berkas berhasil disimpan',
      data: newBerkas
    })

  } catch (error) {
    console.error('Post berkas santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}