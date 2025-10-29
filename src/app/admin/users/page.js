'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

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
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-danger'
      case 'admin': return 'bg-primary'
      case 'lembaga': return 'bg-success'
      default: return 'bg-secondary'
    }
  }

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'bg-success' : 'bg-danger'
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
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">Management Users</h1>
              <p className="text-muted mb-0">Kelola data users sistem</p>
            </div>
            <Link href="/admin/users/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Tambah User
            </Link>
          </div>

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold">Cari User</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Cari username, email, atau nama..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">Role</label>
                  <select
                    className="form-select"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="">Semua Role</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="lembaga">Lembaga</option>
                  </select>
                </div>
                
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">Per Halaman</label>
                  <select
                    className="form-select"
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    onClick={clearFilters}
                    className="btn btn-outline-secondary w-100"
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Reset Filter
                  </button>
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  <div className="text-muted small">
                    <i className="bi bi-info-circle me-1"></i>
                    Total: {pagination.total} users
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 py-3">
              <h5 className="card-title mb-0 fw-bold">
                <i className="bi bi-people me-2 text-primary"></i>
                Data Users
              </h5>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="spinner-border text-primary me-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted">Memuat data users...</span>
                </div>
              ) : error ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                  <h6 className="text-danger mb-3">{error}</h6>
                  <button onClick={fetchUsers} className="btn btn-outline-primary">
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Coba Lagi
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <h6 className="text-muted mb-3">Tidak ada data users ditemukan</h6>
                  <Link href="/admin/users/create" className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i>
                    Tambah User Pertama
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          User
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Role
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Lembaga
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Status
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Dibuat
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="border-0 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                   style={{ width: '40px', height: '40px' }}>
                                <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>
                                  {getInitials(user.username)}
                                </span>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{user.username}</div>
                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="border-0 py-3 text-muted">
                            {user.lembaga?.nama || '-'}
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${getStatusBadgeClass(user.is_active)}`}>
                              {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="border-0 py-3 text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {formatDate(user.created_at)}
                          </td>
                          <td className="border-0 py-3">
                            <div className="btn-group" role="group">
                              <Link
                                href={`/admin/users/${user.id}/edit`}
                                className="btn btn-outline-secondary btn-sm"
                                title="Edit User"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="btn btn-outline-danger btn-sm"
                                title="Hapus User"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          {/* Pagination */}
          {users.length > 0 && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} users
                  </div>
                  
                  <nav aria-label="Pagination">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handleFilterChange('page', pagination.page - 1)}
                          disabled={pagination.page <= 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      
                      {generatePageNumbers().map(pageNum => (
                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handleFilterChange('page', pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handleFilterChange('page', pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  
  )
}