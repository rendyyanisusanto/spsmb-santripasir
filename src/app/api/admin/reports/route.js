import { authenticate, authorize } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Statistics and reports data
export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Authorize - all authenticated roles can view reports
    const authzResult = await authorize(['superadmin', 'admin', 'lembaga'])(request, authResult.user)
    if (authzResult.error) {
      return Response.json({ error: authzResult.error }, { status: authzResult.status })
    }

    const url = new URL(request.url)
    const reportType = url.searchParams.get('type')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const lembagaId = url.searchParams.get('lembagaId')

    let data = {}

    switch (reportType) {
      case 'daily':
        data = await getDailyRegistrations(authResult.user, startDate, endDate, lembagaId)
        break
      case 'monthly':
        data = await getMonthlyRegistrations(authResult.user, startDate, endDate, lembagaId)
        break
      case 'lembaga':
        data = await getLembagaStatistics(authResult.user)
        break
      case 'overview':
        data = await getOverviewStatistics(authResult.user)
        break
      default:
        return Response.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return Response.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Reports error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

async function getDailyRegistrations(user, startDate, endDate, lembagaId) {
  let query = supabase
    .from('pendaftar')
    .select('created_at, lembaga_id, lembaga:lembaga_id(nama)')

  // Apply user-based filtering
  if (user.role === 'lembaga') {
    query = query.eq('lembaga_id', user.lembaga_id)
  } else if (lembagaId) {
    query = query.eq('lembaga_id', lembagaId)
  }

  // Apply date filtering
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate + 'T23:59:59')
  }

  const { data: pendaftar, error } = await query

  if (error) throw error

  // Group by date
  const dailyData = pendaftar.reduce((acc, p) => {
    const date = new Date(p.created_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, count: 0, lembaga: {} }
    }
    acc[date].count++
    
    const lembagaName = p.lembaga?.nama || 'Unknown'
    if (!acc[date].lembaga[lembagaName]) {
      acc[date].lembaga[lembagaName] = 0
    }
    acc[date].lembaga[lembagaName]++
    
    return acc
  }, {})

  return {
    daily: Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date)),
    total: pendaftar.length
  }
}

async function getMonthlyRegistrations(user, startDate, endDate, lembagaId) {
  let query = supabase
    .from('pendaftar')
    .select('created_at, lembaga_id, lembaga:lembaga_id(nama)')

  // Apply user-based filtering
  if (user.role === 'lembaga') {
    query = query.eq('lembaga_id', user.lembaga_id)
  } else if (lembagaId) {
    query = query.eq('lembaga_id', lembagaId)
  }

  // Apply date filtering
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate + 'T23:59:59')
  }

  const { data: pendaftar, error } = await query

  if (error) throw error

  // Group by month
  const monthlyData = pendaftar.reduce((acc, p) => {
    const date = new Date(p.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = { 
        month: monthKey, 
        count: 0, 
        lembaga: {},
        monthName: date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
      }
    }
    acc[monthKey].count++
    
    const lembagaName = p.lembaga?.nama || 'Unknown'
    if (!acc[monthKey].lembaga[lembagaName]) {
      acc[monthKey].lembaga[lembagaName] = 0
    }
    acc[monthKey].lembaga[lembagaName]++
    
    return acc
  }, {})

  return {
    monthly: Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month)),
    total: pendaftar.length
  }
}

async function getLembagaStatistics(user) {
  let lembagaQuery = supabase
    .from('lembaga')
    .select('id, nama')

  // If user is lembaga, only show their lembaga
  if (user.role === 'lembaga') {
    lembagaQuery = lembagaQuery.eq('id', user.lembaga_id)
  }

  const { data: lembagaList, error: lembagaError } = await lembagaQuery

  if (lembagaError) throw lembagaError

  const statistics = []

  for (const lembaga of lembagaList) {
    // Get pendaftar count
    const { count: pendaftarCount, error: pendaftarError } = await supabase
      .from('pendaftar')
      .select('*', { count: 'exact', head: true })
      .eq('lembaga_id', lembaga.id)

    if (pendaftarError) throw pendaftarError

    // Get santri count (accepted)
    const { count: santriCount, error: santriError } = await supabase
      .from('santri')
      .select('*', { count: 'exact', head: true })
      .eq('lembaga_id', lembaga.id)
      .eq('status_aktif', true)

    if (santriError) throw santriError

    statistics.push({
      lembaga: lembaga.nama,
      lembagaId: lembaga.id,
      totalPendaftar: pendaftarCount || 0,
      totalSantri: santriCount || 0,
      acceptanceRate: pendaftarCount > 0 ? ((santriCount || 0) / pendaftarCount * 100).toFixed(1) : '0'
    })
  }

  return { lembagaStats: statistics }
}

async function getOverviewStatistics(user) {
  // Overall statistics
  let pendaftarQuery = supabase
    .from('pendaftar')
    .select('*', { count: 'exact', head: true })

  let santriQuery = supabase
    .from('santri')
    .select('*', { count: 'exact', head: true })
    .eq('status_aktif', true)

  // Apply user-based filtering
  if (user.role === 'lembaga') {
    pendaftarQuery = pendaftarQuery.eq('lembaga_id', user.lembaga_id)
    santriQuery = santriQuery.eq('lembaga_id', user.lembaga_id)
  }

  const [
    { count: totalPendaftar, error: pendaftarError },
    { count: totalSantri, error: santriError }
  ] = await Promise.all([
    pendaftarQuery,
    santriQuery
  ])

  if (pendaftarError) throw pendaftarError
  if (santriError) throw santriError

  // Recent registrations (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  let recentQuery = supabase
    .from('pendaftar')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())

  if (user.role === 'lembaga') {
    recentQuery = recentQuery.eq('lembaga_id', user.lembaga_id)
  }

  const { count: recentRegistrations, error: recentError } = await recentQuery

  if (recentError) throw recentError

  return {
    overview: {
      totalPendaftar: totalPendaftar || 0,
      totalSantri: totalSantri || 0,
      recentRegistrations: recentRegistrations || 0,
      acceptanceRate: totalPendaftar > 0 ? ((totalSantri || 0) / totalPendaftar * 100).toFixed(1) : '0'
    }
  }
}