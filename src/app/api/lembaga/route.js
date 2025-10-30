import { supabase } from '@/lib/supabase'

// GET - Mendapatkan daftar lembaga untuk registrasi publik
export async function GET(request) {
  try {
    const { data: lembaga, error } = await supabase
      .from('lembaga')
      .select('id, nama')
      .order('nama', { ascending: true })

    if (error) {
      console.error('Error fetching lembaga:', error)
      return Response.json(
        { error: 'Gagal mengambil data lembaga' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: lembaga
    })

  } catch (error) {
    console.error('Lembaga API error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}