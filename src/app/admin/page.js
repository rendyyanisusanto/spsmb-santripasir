'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import StatsCard from '@/components/admin/StatsCard'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPendaftar: 0,
    pendaftarHariIni: 0,
    totalUsers: 0,
    pendaftarByLembaga: {}
  })
  const [recentPendaftar, setRecentPendaftar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        // Fetch pendaftar data
        const pendaftarResponse = await fetch('/api/admin/pendaftar?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (pendaftarResponse.ok) {
          const pendaftarData = await pendaftarResponse.json()
          setRecentPendaftar(pendaftarData.data)
          
          // Calculate stats
          calculateStats(pendaftarData.data, pendaftarData.pagination.total)
        }

        // Fetch users data (only for superadmin)
        if (user?.role === 'superadmin') {
          const usersResponse = await fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            setStats(prev => ({ ...prev, totalUsers: usersData.pagination.total }))
          }
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setError('Gagal memuat data dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.role])

  const calculateStats = (pendaftarList, totalCount) => {
    const today = new Date().toDateString()
    const todayCount = pendaftarList.filter(p => 
      new Date(p.created_at).toDateString() === today
    ).length

    const byLembaga = pendaftarList.reduce((acc, p) => {
      acc[p.lembaga_pendidikan] = (acc[p.lembaga_pendidikan] || 0) + 1
      return acc
    }, {})

    setStats(prev => ({
      ...prev,
      totalPendaftar: totalCount,
      pendaftarHariIni: todayCount,
      pendaftarByLembaga: byLembaga
    }))
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getBadgeClass = (lembaga) => {
    const classes = {
      'SMP': 'bg-primary',
      'SMA': 'bg-success',
      'SMK': 'bg-warning',
      'SD': 'bg-info',
      'Non Formal': 'bg-secondary'
    }
    return classes[lembaga] || 'bg-primary'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleDisplayName = (role) => {
    const roles = {
      'superadmin': 'Super Administrator',
      'admin': 'Administrator', 
      'lembaga': 'Admin Lembaga'
    }
    return roles[role] || role
  }

  return (
    <AdminLayout pageTitle="Dashboard">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <StatsCard
            title="Total Pendaftar"
            value={loading ? '...' : stats.totalPendaftar.toLocaleString()}
            icon="bi-people"
            color="primary"
            description={user?.role === 'lembaga' 
              ? `Pendaftar ${user.lembaga_akses}` 
              : 'Semua lembaga'
            }
          />
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <StatsCard
            title="Pendaftar Hari Ini"
            value={loading ? '...' : stats.pendaftarHariIni.toLocaleString()}
            icon="bi-graph-up"
            color="success"
            trend="up"
            trendValue="+12%"
            description="Pendaftaran baru hari ini"
          />
        </div>

        {user?.role === 'superadmin' && (
          <div className="col-xl-3 col-lg-6 col-md-6">
            <StatsCard
              title="Total Users"
              value={loading ? '...' : stats.totalUsers.toLocaleString()}
              icon="bi-person-gear"
              color="info"
              description="Admin dan user sistem"
            />
          </div>
        )}

        <div className="col-xl-3 col-lg-6 col-md-6">
          <StatsCard
            title={user?.role === 'lembaga' ? user.lembaga_akses : 'Status Sistem'}
            value={user?.role === 'lembaga' 
              ? (loading ? '...' : (stats.pendaftarByLembaga[user.lembaga_akses] || 0).toLocaleString())
              : 'Online'
            }
            icon="bi-lightning"
            color="warning"
            description={user?.role === 'lembaga' 
              ? 'Pendaftar lembaga Anda'
              : 'Sistem berjalan normal'
            }
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Link href="/admin/pendaftar" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm card-hover">
              <div className="card-body d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3"
                     style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-file-text text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="card-title mb-1 fw-semibold">Data Pendaftar</h6>
                  <p className="card-text text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                    Kelola pendaftar
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {user?.role === 'superadmin' && (
          <div className="col-md-4">
            <Link href="/admin/users" className="text-decoration-none">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3"
                       style={{ width: '48px', height: '48px' }}>
                    <i className="bi bi-people text-success fs-4"></i>
                  </div>
                  <div>
                    <h6 className="card-title mb-1 fw-semibold">Management Users</h6>
                    <p className="card-text text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                      Kelola pengguna
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="col-md-4">
          <Link href="/admin/reports" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm card-hover">
              <div className="card-body d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3"
                     style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-bar-chart text-info fs-4"></i>
                </div>
                <div>
                  <h6 className="card-title mb-1 fw-semibold">Laporan</h6>
                  <p className="card-text text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                    Lihat statistik
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Pendaftar Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom-0 d-flex align-items-center justify-content-between py-3">
          <div>
            <h5 className="card-title mb-1 fw-bold">Pendaftar Terbaru</h5>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
              Total {recentPendaftar.length} item
            </p>
          </div>
          <Link href="/admin/pendaftar" className="btn btn-primary btn-sm">
            <i className="bi bi-eye me-2"></i>
            Lihat Semua
          </Link>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-3 text-muted">Memuat data...</span>
            </div>
          ) : recentPendaftar.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 mb-3"></i>
              <p className="mb-0">Belum ada data pendaftar</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Nama
                    </th>
                    <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Lembaga
                    </th>
                    <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Tanggal Daftar
                    </th>
                    <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPendaftar.map((pendaftar) => (
                    <tr key={pendaftar.id}>
                      <td className="border-0 py-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ width: '40px', height: '40px' }}>
                            <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>
                              {getInitials(pendaftar.nama)}
                            </span>
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{pendaftar.nama}</div>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                              {pendaftar.no_hp}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border-0 py-3">
                        <span className={`badge ${getBadgeClass(pendaftar.lembaga_pendidikan)}`}>
                          {pendaftar.lembaga_pendidikan}
                        </span>
                      </td>
                      <td className="border-0 py-3 text-muted">
                        {formatDate(pendaftar.created_at)}
                      </td>
                      <td className="border-0 py-3">
                        <Link 
                          href={`/admin/pendaftar/${pendaftar.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-eye me-1"></i>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .card-hover {
          transition: all 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </AdminLayout>
  )
}