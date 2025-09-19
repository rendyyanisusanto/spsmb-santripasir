'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import styles from './admin.module.css'

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
      'SMP': styles.badgeSmp,
      'SMA': styles.badgeSma,
      'SMK': styles.badgeSmk,
      'SD': styles.badgeSd,
      'Non Formal': styles.badgeSd
    }
    return classes[lembaga] || styles.badgeSd
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
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <h1 className={styles.welcomeTitle}>
          Selamat Datang, {user?.full_name}!
        </h1>
        <p className={styles.welcomeSubtitle}>
          {getRoleDisplayName(user?.role)} - SPMB Asy-Syadzili
          {user?.lembaga_akses && ` • Lembaga ${user.lembaga_akses}`}
        </p>
      </div>

      {error && (
        <div className={styles.errorState}>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Total Pendaftar</h3>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              👥
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? '...' : stats.totalPendaftar}
          </div>
          <p className={styles.statDescription}>
            {user?.role === 'lembaga' 
              ? `Pendaftar ${user.lembaga_akses}` 
              : 'Semua lembaga'
            }
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Pendaftar Hari Ini</h3>
            <div className={`${styles.statIcon} ${styles.green}`}>
              📈
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? '...' : stats.pendaftarHariIni}
          </div>
          <p className={styles.statDescription}>
            Pendaftaran baru hari ini
          </p>
        </div>

        {user?.role === 'superadmin' && (
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>Total Users</h3>
              <div className={`${styles.statIcon} ${styles.purple}`}>
                🔧
              </div>
            </div>
            <div className={styles.statValue}>
              {loading ? '...' : stats.totalUsers}
            </div>
            <p className={styles.statDescription}>
              Admin dan user sistem
            </p>
          </div>
        )}

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>
              {user?.role === 'lembaga' ? user.lembaga_akses : 'Status Sistem'}
            </h3>
            <div className={`${styles.statIcon} ${styles.orange}`}>
              ⚡
            </div>
          </div>
          <div className={styles.statValue}>
            {user?.role === 'lembaga' 
              ? (stats.pendaftarByLembaga[user.lembaga_akses] || 0)
              : 'Aktif'
            }
          </div>
          <p className={styles.statDescription}>
            {user?.role === 'lembaga' 
              ? 'Pendaftar lembaga Anda'
              : 'Sistem berjalan normal'
            }
          </p>
        </div>
      </div>

      {/* Recent Pendaftar */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pendaftar Terbaru</h2>
          <Link href="/admin/pendaftar" className={styles.viewAllBtn}>
            Lihat Semua →
          </Link>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            Memuat data...
          </div>
        ) : recentPendaftar.length === 0 ? (
          <div className={styles.loadingState}>
            Belum ada data pendaftar
          </div>
        ) : (
          <ul className={styles.recentList}>
            {recentPendaftar.map((pendaftar) => (
              <li key={pendaftar.id} className={styles.recentItem}>
                <div className={styles.recentAvatar}>
                  {getInitials(pendaftar.nama)}
                </div>
                <div className={styles.recentInfo}>
                  <p className={styles.recentName}>{pendaftar.nama}</p>
                  <p className={styles.recentDetails}>
                    {pendaftar.no_hp} • {formatDate(pendaftar.created_at)}
                  </p>
                </div>
                <div className={`${styles.recentBadge} ${getBadgeClass(pendaftar.lembaga_pendidikan)}`}>
                  {pendaftar.lembaga_pendidikan}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  )
}