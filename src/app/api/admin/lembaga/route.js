import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// GET - Mengambil data lembaga
export async function GET(request) {
  try {
    // Verifikasi token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    // Hanya superadmin dan admin yang bisa mengakses
    if (!['superadmin', 'admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    // Query untuk mendapatkan semua lembaga
    const { data: lembagaData, error } = await supabase
      .from('lembaga')
      .select('id, nama, no_hp')
      .order('nama', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil data lembaga', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lembagaData
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    )
  }
}