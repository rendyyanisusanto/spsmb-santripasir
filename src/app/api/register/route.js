import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
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

    // Validasi jenis kelamin
    const validJenisKelamin = ['Pria', 'Wanita']
    if (!validJenisKelamin.includes(jenis_kelamin)) {
      return Response.json(
        { error: 'Jenis kelamin tidak valid' },
        { status: 400 }
      )
    }

    // Validasi nomor HP (harus numerik dan minimal 10 digit)
    const phoneRegex = /^[0-9]{10,15}$/
    if (!phoneRegex.test(no_hp.replace(/[^\d]/g, ''))) {
      return Response.json(
        { error: 'Nomor HP tidak valid' },
        { status: 400 }
      )
    }

    // Simpan ke database
    console.log('Attempting to save to database with data:', {
      nama: nama.trim(),
      jenis_kelamin,
      no_hp: no_hp.trim(),
      nama_wali: nama_wali.trim(),
      alamat: alamat.trim(),
      lembaga_pendidikan
    })

    const { data, error } = await supabase
      .from('pendaftar')  // Ubah dari 'pendaftaran' ke 'pendaftar'
      .insert([
        {
          nama: nama.trim(),
          jenis_kelamin,
          no_hp: no_hp.trim(),
          nama_wali: nama_wali.trim(),
          alamat: alamat.trim(),
          lembaga_pendidikan
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return Response.json(
        { 
          error: 'Gagal menyimpan data pendaftaran',
          details: error.message,
          supabaseError: error
        },
        { status: 500 }
      )
    }

    const registrationData = data[0]

    // Kirim notifikasi ke WhatsApp Bot
    try {
      await sendWhatsAppNotification(registrationData)
    } catch (whatsappError) {
      console.error('WhatsApp notification error:', whatsappError)
      // Jangan gagalkan pendaftaran jika WhatsApp gagal
      // Log error untuk debugging tapi tetap lanjutkan proses
    }

    return Response.json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: registrationData
    })

  } catch (error) {
    console.error('Registration error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

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
    // Pesan untuk pendaftar
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

    // Pesan untuk admin
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

    // Format nomor HP
    const userFormattedPhone = formatNomorHP(registrationData.no_hp)
    const adminFormattedPhone = formatNomorHP(adminNumber)

    const fullEndpoint = `${botEndpoint.replace(/\/$/, '')}/send-message`

    // Kirim pesan ke pendaftar
    const userFormData = new URLSearchParams()
    userFormData.append('message', messageForUser)
    userFormData.append('number', userFormattedPhone)

    console.log('Sending WhatsApp notification to user:', userFormattedPhone)

    const userResponse = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: userFormData.toString(),
      signal: AbortSignal.timeout(10000)
    })

    // Kirim pesan ke admin
    const adminFormData = new URLSearchParams()
    adminFormData.append('message', messageForAdmin)
    adminFormData.append('number', adminFormattedPhone)

    console.log('Sending WhatsApp notification to admin:', adminFormattedPhone)

    const adminResponse = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: adminFormData.toString(),
      signal: AbortSignal.timeout(10000)
    })

    // Cek respons
    const results = {
      user: { success: userResponse.ok },
      admin: { success: adminResponse.ok }
    }

    if (userResponse.ok) {
      const userResult = await userResponse.json()
      results.user.data = userResult
      console.log('WhatsApp notification sent to user successfully:', userResult)
    } else {
      console.error('Failed to send WhatsApp to user:', userResponse.status, userResponse.statusText)
    }

    if (adminResponse.ok) {
      const adminResult = await adminResponse.json()
      results.admin.data = adminResult
      console.log('WhatsApp notification sent to admin successfully:', adminResult)
    } else {
      console.error('Failed to send WhatsApp to admin:', adminResponse.status, adminResponse.statusText)
    }

    return results

  } catch (error) {
    console.error('Failed to send WhatsApp notifications:', error.message)
    return { success: false, error: error.message }
  }
}

// Helper function untuk format nomor HP sesuai dengan CodeIgniter
function formatNomorHP(nomor) {
  // Hapus spasi atau tanda minus (-) yang mungkin dimasukkan oleh pengguna
  nomor = nomor.replace(/[\s\-\(\)]/g, '')

  // Jika nomor diawali dengan "08", ubah menjadi "628"
  if (nomor.startsWith('08')) {
    nomor = '628' + nomor.substring(2)
  }
  // Jika nomor diawali dengan "+62", ubah menjadi "62"
  else if (nomor.startsWith('+62')) {
    nomor = '62' + nomor.substring(3)
  }

  return nomor
}