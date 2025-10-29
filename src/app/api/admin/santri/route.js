import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - List santri berdasarkan role
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

    // Get query parameters for pagination and filtering
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const lembaga = url.searchParams.get('lembaga')
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')

    let query = supabase
      .from('santri')
      .select(`
        *,
        lembaga:lembaga_id(id, nama),
        pendaftar:pendaftar_id(id, nama, no_hp, nama_wali)
      `, { count: 'exact' })

    // Filter berdasarkan role
    if (authResult.user.role === 'lembaga') {
      // User lembaga hanya bisa lihat data santri dari lembaganya
      query = query.eq('lembaga_id', authResult.user.lembaga_id)
    } else if (lembaga) {
      // Superadmin dan admin bisa filter by lembaga_id
      query = query.eq('lembaga_id', lembaga)
    }

    // Filter by status
    if (status) {
      query = query.eq('status_aktif', status === 'aktif')
    }

    // Search by nama_lengkap, nik, atau nomor_kk
    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,nik.ilike.%${search}%,nomor_kk.ilike.%${search}%,alamat.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: santri, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal mengambil data santri' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: santri,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('Get santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update status santri
export async function PUT(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - hanya superadmin dan admin yang bisa update status
    const authzResult = await authorize(['superadmin', 'admin'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const body = await request.json()
    const { santriId, status_aktif } = body

    if (!santriId || typeof status_aktif !== 'boolean') {
      return Response.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    const { data: santri, error } = await supabase
      .from('santri')
      .update({ status_aktif })
      .eq('id', santriId)
      .select()
      .single()

    if (error) {
      console.error('Error updating santri status:', error)
      return Response.json(
        { error: 'Gagal mengupdate status santri' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: `Status santri berhasil diubah menjadi ${status_aktif ? 'aktif' : 'non-aktif'}`,
      data: santri
    })

  } catch (error) {
    console.error('Update santri status error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}