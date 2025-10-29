import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Check if pendaftar already confirmed as santri
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

    // Check if santri exists for this pendaftar
    const { data: santri, error } = await supabase
      .from('santri')
      .select(`
        id,
        nama_lengkap,
        status_aktif,
        created_at,
        lembaga:lembaga_id(id, nama)
      `)
      .eq('pendaftar_id', pendaftarId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking santri status:', error)
      return Response.json(
        { error: 'Gagal mengecek status santri' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: {
        isConfirmed: !!santri,
        santri: santri || null
      }
    })

  } catch (error) {
    console.error('Check santri status error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}