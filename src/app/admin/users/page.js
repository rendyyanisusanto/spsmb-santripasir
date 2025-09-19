'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import styles from './users.module.css'

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.set(key, value)
      })

      const response = await fetch(`/api/admin/users?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.data)
        setPagination(data.pagination)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat data users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [filters, fetchUsers])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when filter changes
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      page: 1,
      limit: 10
    })
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchUsers() // Refresh data
        alert('User berhasil dihapus')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal menghapus user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
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

  const getRoleBadgeClass = (role) => {
    const classes = {
      'superadmin': styles.roleSuperadmin,
      'admin': styles.roleAdmin,
      'lembaga': styles.roleLembaga
    }
    return classes[role] || styles.roleAdmin
  }

  const getStatusBadgeClass = (isActive) => {
    return isActive ? styles.statusActive : styles.statusInactive
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const generatePageNumbers = () => {
    const pages = []
    const current = pagination.page
    const total = pagination.totalPages
    
    // Always show first page
    if (total > 0) pages.push(1)
    
    // Add pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    
    // Always show last page if more than 1 page
    if (total > 1 && !pages.includes(total)) pages.push(total)
    
    return pages
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      <AdminLayout pageTitle="Management Users">
        <div className={styles.usersPage}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Management Users</h1>
            <Link href="/admin/users/create" className={styles.addUserBtn}>
              ➕ Tambah User
            </Link>
          </div>

          {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Cari User</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Cari username, email, atau nama..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Role</label>
                <select
                  className={styles.filterSelect}
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">Semua Role</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="lembaga">Lembaga</option>
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

          {/* Users Table */}
          <div className={styles.usersTableContainer}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Memuat data users...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p>❌ {error}</p>
                <button onClick={fetchUsers} style={{ marginTop: '16px', padding: '8px 16px' }}>
                  Coba Lagi
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                <p>📭 Tidak ada data users ditemukan</p>
                <Link href="/admin/users/create" style={{ marginTop: '16px' }}>
                  Tambah User Pertama
                </Link>
              </div>
            ) : (
              <>
                <table className={styles.usersTable}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Lembaga</th>
                      <th>Status</th>
                      <th>Login Terakhir</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userData) => (
                      <tr key={userData.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                              {getInitials(userData.full_name)}
                            </div>
                            <div className={styles.userDetails}>
                              <h4>{userData.full_name}</h4>
                              <p>@{userData.username} • {userData.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.roleBadge} ${getRoleBadgeClass(userData.role)}`}>
                            {userData.role}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {userData.lembaga_akses || '-'}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(userData.is_active)}`}>
                            {userData.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {formatDate(userData.last_login)}
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.actionsCell}>
                            <Link
                              href={`/admin/users/${userData.id}/edit`}
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                              title="Edit User"
                            >
                              ✏️
                            </Link>
                            <button
                              onClick={() => handleDeleteUser(userData.id, userData.full_name)}
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              title="Hapus User"
                              disabled={userData.id === user?.id} // Tidak bisa hapus diri sendiri
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
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} users
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