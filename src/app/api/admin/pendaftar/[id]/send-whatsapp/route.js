import { authenticate, authorize, canAccessLembaga } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - Send WhatsApp notification to a specific pendaftar
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

        const pendaftarId = params.id

        // Fetch pendaftar data
        const { data: pendaftar, error: fetchError } = await supabase
            .from('pendaftar')
            .select('*')
            .eq('id', pendaftarId)
            .single()

        if (fetchError || !pendaftar) {
            return Response.json(
                { error: 'Pendaftar tidak ditemukan' },
                { status: 404 }
            )
        }

        // Check access for lembaga role
        if (authResult.user.role === 'lembaga') {
            if (authResult.user.lembaga_id && pendaftar.lembaga_id !== authResult.user.lembaga_id) {
                return Response.json(
                    { error: 'Tidak memiliki akses untuk pendaftar ini' },
                    { status: 403 }
                )
            }
        }

        // Send WhatsApp notification
        const result = await sendWhatsAppNotification(pendaftar)

        if (result.success === false && result.error) {
            return Response.json(
                { error: 'Gagal mengirim WhatsApp', details: result.error },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            message: 'WhatsApp berhasil dikirim',
            data: result
        })

    } catch (error) {
        console.error('Send WhatsApp error:', error)
        return Response.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}

// Function untuk WhatsApp notification
async function sendWhatsAppNotification(registrationData) {
    const botEndpoint = process.env.WHATSAPP_BOT_ENDPOINT || 'https://wa.simsmk.sch.id'
    let adminNumber = '085894632505' // Default admin

    // Tentukan adminNumber berdasarkan lembaga_pendidikan
    if (registrationData.lembaga_pendidikan === 'SMP') {
        adminNumber = '081345009686'
    } else if (registrationData.lembaga_pendidikan === 'SMA') {
        adminNumber = '085179711916'
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

        // Format nomor HP ke format WhatsApp
        const userFormattedPhone = formatWhatsAppPhone(registrationData.no_hp)
        const adminFormattedPhone = formatWhatsAppPhone(adminNumber)

        const fullEndpoint = `${botEndpoint.replace(/\/$/, '')}/send/message`

        // Basic auth credentials
        const authHeader = 'Basic ' + Buffer.from('admin:admin').toString('base64')

        console.log('Sending WhatsApp notification to user:', userFormattedPhone)
        console.log('Sending WhatsApp notification to admin:', adminFormattedPhone)

        // Kirim ke pendaftar dan admin
        const [userResponse, adminResponse] = await Promise.all([
            fetch(fullEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    phone: userFormattedPhone,
                    message: messageForUser,
                    is_forwarded: false
                }),
                signal: AbortSignal.timeout(10000)
            }),
            fetch(fullEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    phone: adminFormattedPhone,
                    message: messageForAdmin,
                    is_forwarded: false
                }),
                signal: AbortSignal.timeout(10000)
            })
        ])

        const results = {
            user: { success: userResponse.ok },
            admin: { success: adminResponse.ok }
        }

        if (userResponse.ok) {
            const userResult = await userResponse.json()
            results.user.data = userResult
            console.log('WhatsApp notification sent to user successfully:', userResult)
        } else {
            const userError = await userResponse.text()
            console.error('Failed to send WhatsApp to user:', userResponse.status, userError)
            results.user.error = userError
        }

        if (adminResponse.ok) {
            const adminResult = await adminResponse.json()
            results.admin.data = adminResult
            console.log('WhatsApp notification sent to admin successfully:', adminResult)
        } else {
            const adminError = await adminResponse.text()
            console.error('Failed to send WhatsApp to admin:', adminResponse.status, adminError)
            results.admin.error = adminError
        }

        return results

    } catch (error) {
        console.error('Failed to send WhatsApp notifications:', error.message)
        return { success: false, error: error.message }
    }
}

function formatWhatsAppPhone(nomor) {
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
    // Jika sudah diawali "62", biarkan saja
    else if (!nomor.startsWith('62')) {
        // Jika tidak ada prefix, tambahkan 62
        nomor = '62' + nomor
    }

    // Tambahkan suffix WhatsApp
    return `${nomor}@s.whatsapp.net`
}
