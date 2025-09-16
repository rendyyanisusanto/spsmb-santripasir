// Test koneksi Supabase
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test koneksi dengan query sederhana
    const { data, error } = await supabase
      .from('pendaftar')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return Response.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Koneksi Supabase berhasil',
      data: data || []
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}