import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { deleteFile } from '@/lib/fileUpload'

// DELETE - Hapus berkas santri
export async function DELETE(request, { params }) {
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

    const berkasId = params.berkasId

    // Get berkas data untuk validasi
    const { data: berkas, error: berkasError } = await supabase
      .from('berkas_santri')
      .select(`
        *,
        santri:santri_id(id, lembaga_id)
      `)
      .eq('id', berkasId)
      .single()

    if (berkasError || !berkas) {
      return Response.json(
        { error: 'Berkas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika user adalah lembaga, pastikan santri berasal dari lembaga yang sama
    if (authResult.user.role === 'lembaga') {
      const userLembaga = authResult.user.lembaga_id
      if (!userLembaga || berkas.santri.lembaga_id !== userLembaga) {
        return Response.json({ error: 'Tidak memiliki akses untuk menghapus berkas ini' }, { status: 403 })
      }
    }

    // Hapus file dari storage
    if (berkas.file_url) {
      // Extract file path from URL
      const urlParts = berkas.file_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const folder = urlParts[urlParts.length - 2]
      const filePath = `${folder}/${fileName}`
      
      await deleteFile(filePath)
    }

    // Hapus record dari database
    const { error: deleteError } = await supabase
      .from('berkas_santri')
      .delete()
      .eq('id', berkasId)

    if (deleteError) {
      console.error('Error deleting berkas:', deleteError)
      return Response.json(
        { error: 'Gagal menghapus berkas' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Berkas berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete berkas santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}