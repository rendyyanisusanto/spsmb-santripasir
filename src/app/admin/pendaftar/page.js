'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import styles from '../users/users.module.css' // Reuse styles

export default function PendaftarPage() {
  const { user } = useAuth()
  const [pendaftar, setPendaftar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    lembaga: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchPendaftar = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.set(key, value)
      })

      const response = await fetch(`/api/admin/pendaftar?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendaftar(data.data)
        setPagination(data.pagination)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat data pendaftar')
      }
    } catch (error) {
      console.error('Failed to fetch pendaftar:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchPendaftar()
  }, [fetchPendaftar])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      lembaga: user?.role === 'lembaga' ? user.lembaga_akses : '',
      page: 1,
      limit: 10
    })
  }

  const handleDeletePendaftar = async (pendaftarId, pendaftarName) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pendaftar "${pendaftarName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/pendaftar/${pendaftarId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchPendaftar()
        alert('Data pendaftar berhasil dihapus')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal menghapus data pendaftar')
      }
    } catch (error) {
      console.error('Failed to delete pendaftar:', error)
      alert('Terjadi kesalahan sistem')
    }
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getLembagaBadgeClass = (lembaga) => {
    const classes = {
      'SMP': styles.roleLembaga,
      'SMA': styles.roleAdmin,
      'SMK': styles.roleSuperadmin,
      'SD': styles.statusActive,
      'Non Formal': styles.statusInactive
    }
    return classes[lembaga] || styles.roleAdmin
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

  const formatPhone = (phone) => {
    // Format: 0812-3456-7890
    if (phone.length >= 10) {
      return phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
    }
    return phone
  }

  const generatePageNumbers = () => {
    const pages = []
    const current = pagination.page
    const total = pagination.totalPages
    
    if (total > 0) pages.push(1)
    
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    
    if (total > 1 && !pages.includes(total)) pages.push(total)
    
    return pages
  }

  // Available lembaga options based on user role
  const getLembagaOptions = () => {
    if (user?.role === 'lembaga') {
      return [{ value: user.lembaga_akses, label: user.lembaga_akses }]
    }
    return [
      { value: '', label: 'Semua Lembaga' },
      { value: 'SD', label: 'SD' },
      { value: 'SMP', label: 'SMP' },
      { value: 'SMA', label: 'SMA' },
      { value: 'SMK', label: 'SMK' },
      { value: 'Non Formal', label: 'Non Formal' }
    ]
  }

  // Set default lembaga filter for lembaga users
  useEffect(() => {
    if (user?.role === 'lembaga' && !filters.lembaga) {
      setFilters(prev => ({ ...prev, lembaga: user.lembaga_akses }))
    }
  }, [user, filters.lembaga])

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Data Pendaftar">
        <div className={styles.usersPage}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Data Pendaftar</h1>
            <Link href="/admin/pendaftar/create" className={styles.addUserBtn}>
              ➕ Tambah Pendaftar
            </Link>
          </div>

          {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Cari Pendaftar</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Cari nama, no HP, wali, atau alamat..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Lembaga</label>
                <select
                  className={styles.filterSelect}
                  value={filters.lembaga}
                  onChange={(e) => handleFilterChange('lembaga', e.target.value)}
                  disabled={user?.role === 'lembaga'}
                >
                  {getLembagaOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Per Halaman</label>
                <select
                  className={styles.filterSelect}
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <button
                  onClick={clearFilters}
                  className={styles.clearFiltersBtn}
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Pendaftar Table */}
          <div className={styles.usersTableContainer}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Memuat data pendaftar...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p>❌ {error}</p>
                <button onClick={fetchPendaftar} style={{ marginTop: '16px', padding: '8px 16px' }}>
                  Coba Lagi
                </button>
              </div>
            ) : pendaftar.length === 0 ? (
              <div className={styles.emptyState}>
                <p>📭 Tidak ada data pendaftar ditemukan</p>
                <Link href="/admin/pendaftar/create" style={{ marginTop: '16px' }}>
                  Tambah Pendaftar Pertama
                </Link>
              </div>
            ) : (
              <>
                <table className={styles.usersTable}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Pendaftar</th>
                      <th>Jenis Kelamin</th>
                      <th>No HP</th>
                      <th>Wali</th>
                      <th>Lembaga</th>
                      <th>Tanggal Daftar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendaftar.map((data) => (
                      <tr key={data.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                              {getInitials(data.nama)}
                            </div>
                            <div className={styles.userDetails}>
                              <h4>{data.nama}</h4>
                              <p>{data.alamat.length > 30 ? data.alamat.substring(0, 30) + '...' : data.alamat}</p>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          {data.jenis_kelamin}
                        </td>
                        <td className={styles.tableCell}>
                          {formatPhone(data.no_hp)}
                        </td>
                        <td className={styles.tableCell}>
                          {data.nama_wali}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.roleBadge} ${getLembagaBadgeClass(data.lembaga_pendidikan)}`}>
                            {data.lembaga_pendidikan}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {formatDate(data.created_at)}
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.actionsCell}>
                            <Link
                              href={`/admin/pendaftar/${data.id}`}
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                              title="Lihat Detail"
                            >
                              👁️
                            </Link>
                            <Link
                              href={`/admin/pendaftar/${data.id}/edit`}
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                              title="Edit Pendaftar"
                            >
                              ✏️
                            </Link>
                            <button
                              onClick={() => handleDeletePendaftar(data.id, data.nama)}
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              title="Hapus Pendaftar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className={styles.pagination}>
                  <div className={styles.paginationInfo}>
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pendaftar
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      className={styles.paginationBtn}
                      onClick={() => handleFilterChange('page', pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      ← Prev
                    </button>
                    
                    {generatePageNumbers().map(pageNum => (
                      <button
                        key={pageNum}
                        className={`${styles.paginationBtn} ${pagination.page === pageNum ? styles.active : ''}`}
                        onClick={() => handleFilterChange('page', pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      className={styles.paginationBtn}
                      onClick={() => handleFilterChange('page', pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}