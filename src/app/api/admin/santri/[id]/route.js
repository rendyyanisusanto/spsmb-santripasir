import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Get detail santri
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

    let query = supabase
      .from('santri')
      .select(`
        *,
        lembaga:lembaga_id(id, nama)
      `)
      .eq('id', santriId)

    // Filter berdasarkan role
    if (authResult.user.role === 'lembaga') {
      // User lembaga hanya bisa lihat santri dari lembaganya
      query = query.eq('lembaga_id', authResult.user.lembaga_id)
    }

    const { data: santri, error: santriError } = await query.single()

    if (santriError || !santri) {
      return Response.json(
        { error: 'Data santri tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: santri
    })

  } catch (error) {
    console.error('Get santri detail error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update santri
export async function PUT(request, { params }) {
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
    const updateData = await request.json()

    // Get santri data untuk validasi akses
    const { data: existingSantri, error: checkError } = await supabase
      .from('santri')
      .select('id, lembaga_id')
      .eq('id', santriId)
      .single()

    if (checkError || !existingSantri) {
      return Response.json(
        { error: 'Data santri tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika user adalah lembaga, pastikan santri berasal dari lembaga yang sama
    if (authResult.user.role === 'lembaga') {
      const userLembaga = authResult.user.lembaga_id
      if (!userLembaga || existingSantri.lembaga_id !== userLembaga) {
        return Response.json({ error: 'Tidak memiliki akses untuk mengubah data santri ini' }, { status: 403 })
      }
    }

    // Remove fields that shouldn't be updated directly
    const { id, pendaftar_id, lembaga_id, created_at, ...allowedUpdates } = updateData

    const { data: updatedSantri, error: updateError } = await supabase
      .from('santri')
      .update(allowedUpdates)
      .eq('id', santriId)
      .select(`
        *,
        lembaga:lembaga_id(id, nama)
      `)
      .single()

    if (updateError) {
      console.error('Error updating santri:', updateError)
      return Response.json(
        { error: 'Gagal mengupdate data santri' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Data santri berhasil diupdate',
      data: updatedSantri
    })

  } catch (error) {
    console.error('Update santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete santri
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - hanya superadmin dan admin yang bisa hapus
    const authzResult = await authorize(['superadmin', 'admin'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const santriId = params.id

    // Check if santri exists
    const { data: existingSantri, error: checkError } = await supabase
      .from('santri')
      .select('id')
      .eq('id', santriId)
      .single()

    if (checkError || !existingSantri) {
      return Response.json(
        { error: 'Data santri tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete santri (berkas will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabase
      .from('santri')
      .delete()
      .eq('id', santriId)

    if (deleteError) {
      console.error('Error deleting santri:', deleteError)
      return Response.json(
        { error: 'Gagal menghapus data santri' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Data santri berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}