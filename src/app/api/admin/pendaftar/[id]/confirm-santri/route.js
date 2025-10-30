import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - Konfirmasi pendaftar menjadi santri
export async function POST(request, { params }) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - superadmin, admin, dan lembaga boleh konfirmasi (lembaga dibatasi ke lembaganya sendiri)
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const pendaftarId = params.id
    const { santri_data, berkas_data } = await request.json()

    // Get pendaftar data
    const { data: pendaftar, error: pendaftarError } = await supabase
      .from('pendaftar')
      .select('*')
      .eq('id', pendaftarId)
      .single()

    if (pendaftarError || !pendaftar) {
      return Response.json(
        { error: 'Data pendaftar tidak ditemukan 123' },
        { status: 404 }
      )
    }

    // Jika user adalah lembaga, pastikan pendaftar berasal dari lembaga yang sama
    if (authResult.user.role === 'lembaga') {
      // depending on token payload the lembaga identifier may be in `lembaga_akses` or `lembaga_id`
      const userLembaga = authResult.user.lembaga_id || authResult.user.lembaga_akses
      if (!userLembaga || pendaftar.lembaga_id !== userLembaga) {
        return Response.json({ error: 'Tidak memiliki akses untuk mengonfirmasi pendaftar ini' }, { status: 403 })
      }
    }

    // Check if already confirmed as santri
    const { data: existingSantri, error: checkError } = await supabase
      .from('santri')
      .select('id')
      .eq('pendaftar_id', pendaftarId)
      .single()

    if (existingSantri) {
      return Response.json(
        { error: 'Pendaftar sudah dikonfirmasi menjadi santri' },
        { status: 400 }
      )
    }

    // Validasi data yang diperlukan jika ada santri_data
    if (santri_data) {
      const requiredFields = [
        'nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
        'nomor_kk', 'nik', 'alamat', 'desa', 'kecamatan', 'kabupaten', 'provinsi',
        'nama_ayah', 'nama_ibu'
      ]

      for (const field of requiredFields) {
        if (!santri_data[field]) {
          return Response.json({ 
            error: `Field ${field.replace('_', ' ')} harus diisi` 
          }, { status: 400 })
        }
      }
    }

    // Create santri record
    const santriData = santri_data ? {
      pendaftar_id: pendaftar.id,
      lembaga_id: pendaftar.lembaga_id,
      status_aktif: true,
      ...santri_data
    } : {
      pendaftar_id: pendaftar.id,
      nama_lengkap: pendaftar.nama,
      jenis_kelamin: pendaftar.jenis_kelamin,
      alamat: pendaftar.alamat,
      lembaga_id: pendaftar.lembaga_id,
      status_aktif: true,
      // Other fields will be filled later through edit form
      tempat_lahir: null,
      tanggal_lahir: null,
      nomor_kk: null,
      nik: null,
      desa: null,
      kecamatan: null,
      kabupaten: null,
      provinsi: null,
      kode_pos: null,
      nama_ayah: pendaftar.nama_wali, // Assuming wali is father
      nik_ayah: null,
      tahun_lahir_ayah: null,
      pekerjaan_ayah: null,
      pendidikan_ayah: null,
      nama_ibu: null,
      nik_ibu: null,
      tahun_lahir_ibu: null,
      pekerjaan_ibu: null,
      pendidikan_ibu: null,
      nama_sekolah_asal: null,
      provinsi_sekolah_asal: null,
      kabupaten_sekolah_asal: null,
      kecamatan_sekolah_asal: null,
      tahun_lulus_sekolah_asal: null,
      asal_pesantren: null,
      alamat_pesantren: null,
      penyakit_kronis: null
    }

    const { data: newSantri, error: santriError } = await supabase
      .from('santri')
      .insert(santriData)
      .select()
      .single()

    if (santriError) {
      console.error('Error creating santri:', santriError)
      return Response.json(
        { error: 'Gagal membuat data santri' },
        { status: 500 }
      )
    }

    // Insert berkas santri jika ada
    if (berkas_data && Object.keys(berkas_data).length > 0) {
      const berkasInserts = Object.entries(berkas_data).map(([jenis_berkas, file_url]) => ({
        santri_id: newSantri.id,
        jenis_berkas,
        file_url
      }))

      const { error: berkasError } = await supabase
        .from('berkas_santri')
        .insert(berkasInserts)

      if (berkasError) {
        console.error('Error inserting berkas:', berkasError)
        // Jangan batalkan proses, berkas bisa diupload nanti
      }
    }

    return Response.json({
      success: true,
      message: 'Pendaftar berhasil dikonfirmasi menjadi santri',
      data: {
        santri: newSantri,
        pendaftar: pendaftar
      }
    })

  } catch (error) {
    console.error('Confirm santri error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}