import { authenticate, authorize, canAccessLembaga } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - List pendaftar berdasarkan role
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

    let query = supabase
      .from('pendaftar')
      .select('*', { count: 'exact' })

    // Filter berdasarkan role
    if (authResult.user.role === 'lembaga') {
      // User lembaga hanya bisa lihat data lembaganya
      query = query.eq('lembaga_pendidikan', authResult.user.lembaga_akses)
    } else if (lembaga) {
      // Superadmin dan admin bisa filter by lembaga
      query = query.eq('lembaga_pendidikan', lembaga)
    }

    // Search by nama, no_hp, nama_wali, atau alamat
    if (search) {
      query = query.or(`nama.ilike.%${search}%,no_hp.ilike.%${search}%,nama_wali.ilike.%${search}%,alamat.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: pendaftar, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal mengambil data pendaftar' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: pendaftar,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('Get pendaftar error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create pendaftar (semua role bisa create, tapi lembaga hanya untuk lembaganya)
export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - semua role yang login bisa create
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

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

    // Simpan ke database
    const { data, error } = await supabase
      .from('pendaftar')
      .insert([
        {
          nama: nama.trim(),
          jenis_kelamin,
          no_hp: no_hp.trim(),
          nama_wali: nama_wali.trim(),
          alamat: alamat.trim(),
          lembaga_pendidikan,
          created_by: authResult.user.id
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return Response.json(
        { error: 'Gagal menyimpan data pendaftaran' },
        { status: 500 }
      )
    }

    const registrationData = data[0]

    // Kirim notifikasi WhatsApp jika diperlukan (opsional)
    try {
      await sendWhatsAppNotification(registrationData)
    } catch (whatsappError) {
      console.error('WhatsApp notification error:', whatsappError)
    }

    return Response.json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: registrationData
    }, { status: 201 })

  } catch (error) {
    console.error('Create pendaftar error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// Function untuk WhatsApp notification (ambil dari route register yang sudah ada)
async function sendWhatsAppNotification(registrationData) {
  const botEndpoint = process.env.WHATSAPP_BOT_ENDPOINT
  let adminNumber = '085894632505' // Default admin
  
  // Tentukan adminNumber berdasarkan lembaga_pendidikan
  if (registrationData.lembaga_pendidikan === 'SMP') {
    adminNumber = '081345009686'
  } else if (registrationData.lembaga_pendidikan === 'SMA') {
    adminNumber = '085179711916'
  }
  
  if (!botEndpoint) {
    console.warn('WhatsApp bot endpoint not configured')
    return { success: false, message: 'Bot endpoint not configured' }
  }

  try {
    const messageForUser = `🎓 *PENDAFTARAN SANTRI BARU ASY-SYADZILI*

Terima kasih telah mendaftar! Berikut data pendaftaran Anda:

📝 *Data Pendaftar:*
 *Nama:* ${registrationData.nama}
 *Jenis Kelamin:* ${registrationData.jenis_kelamin}
 *No HP:* ${registrationData.no_hp}
 *Wali:* ${registrationData.nama_wali}
 *Alamat:* ${registrationData.alamat}
 *Pendidikan:* ${registrationData.lembaga_pendidikan}
 *Tanggal:* ${new Date(registrationData.created_at).toLocaleString('id-ID')}

_ID Pendaftaran: ${String(registrationData.id).slice(0, 8).toUpperCase()}_

✅ Pendaftaran Anda telah berhasil!

Admin akan segera menghubungi Anda untuk informasi selanjutnya. 🙏

_Pondok Pesantren Asy-Syadzili_`

    const messageForAdmin = `🔔 *PENDAFTAR BARU - ASY-SYADZILI*

Ada pendaftar santri baru yang masuk:

📝 *Detail Pendaftar:*
 *Nama:* ${registrationData.nama}
 *Jenis Kelamin:* ${registrationData.jenis_kelamin}
 *No HP:* ${registrationData.no_hp}
 *Nama Wali:* ${registrationData.nama_wali}
 *Alamat:* ${registrationData.alamat}
 *Jenjang Pendidikan:* ${registrationData.lembaga_pendidikan}
 *Waktu Daftar:* ${new Date(registrationData.created_at).toLocaleString('id-ID')}

_ID Pendaftaran: ${String(registrationData.id).slice(0, 8).toUpperCase()}_

👤 Silakan hubungi calon santri untuk proses selanjutnya.

_Sistem Pendaftaran Asy-Syadzili_`

    const userFormattedPhone = formatNomorHP(registrationData.no_hp)
    const adminFormattedPhone = formatNomorHP(adminNumber)

    const fullEndpoint = `${botEndpoint.replace(/\/$/, '')}/send-message`

    // Kirim ke pendaftar dan admin
    const userFormData = new URLSearchParams()
    userFormData.append('message', messageForUser)
    userFormData.append('number', userFormattedPhone)

    const adminFormData = new URLSearchParams()
    adminFormData.append('message', messageForAdmin)
    adminFormData.append('number', adminFormattedPhone)

    const [userResponse, adminResponse] = await Promise.all([
      fetch(fullEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: userFormData.toString(),
        signal: AbortSignal.timeout(10000)
      }),
      fetch(fullEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: adminFormData.toString(),
        signal: AbortSignal.timeout(10000)
      })
    ])

    return {
      user: { success: userResponse.ok },
      admin: { success: adminResponse.ok }
    }

  } catch (error) {
    console.error('Failed to send WhatsApp notifications:', error.message)
    return { success: false, error: error.message }
  }
}

function formatNomorHP(nomor) {
  nomor = nomor.replace(/[\s\-\(\)]/g, '')
  if (nomor.startsWith('08')) {
    nomor = '628' + nomor.substring(2)
  } else if (nomor.startsWith('+62')) {
    nomor = '62' + nomor.substring(3)
  }
  return nomor
}