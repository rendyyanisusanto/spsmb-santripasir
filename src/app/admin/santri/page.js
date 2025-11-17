'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

export default function SantriPage() {
  const { user } = useAuth()
  const [santri, setSantri] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingIds, setUpdatingIds] = useState(new Set())
  const [filters, setFilters] = useState({
    search: '',
    lembaga: '',
    status: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchSantri = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.set(key, value)
      })

      const response = await fetch(`/api/admin/santri?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSantri(data.data)
        setPagination(data.pagination)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat data santri')
      }
    } catch (error) {
      console.error('Failed to fetch santri:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchSantri()
  }, [fetchSantri])

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
      lembaga: user?.role === 'lembaga' ? user.lembaga_id : '',
      status: '',
      page: 1,
      limit: 10
    })
  }

  const handleUpdateStatus = async (santriId, santriName, currentStatus) => {
    const newStatus = !currentStatus
    const statusText = newStatus ? 'aktif' : 'non-aktif'
    
    if (!confirm(`Apakah Anda yakin ingin mengubah status "${santriName}" menjadi ${statusText}?`)) {
      return
    }

    try {
      setUpdatingIds(prev => new Set([...prev, santriId]))
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/admin/santri', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          santriId,
          status_aktif: newStatus
        })
      })

      if (response.ok) {
        alert(`Status ${santriName} berhasil diubah menjadi ${statusText}`)
        fetchSantri()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal mengubah status santri')
      }
    } catch (error) {
      console.error('Failed to update santri status:', error)
      alert('Terjadi kesalahan sistem')
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(santriId)
        return newSet
      })
    }
  }

  const handleDelete = async (santriId, santriName) => {
    if (!confirm(`PERHATIAN: Apakah Anda yakin ingin menghapus santri "${santriName}"?\n\nTindakan ini akan menghapus:\n- Data santri\n- Semua dokumen santri\n- Riwayat terkait\n\nData yang dihapus TIDAK DAPAT dikembalikan!`)) {
      return
    }

    // Double confirmation
    if (!confirm(`Konfirmasi terakhir: Hapus "${santriName}" secara permanen?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/santri/${santriId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert(`Santri ${santriName} berhasil dihapus`)
        fetchSantri()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal menghapus santri')
      }
    } catch (error) {
      console.error('Failed to delete santri:', error)
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
      year: 'numeric'
    })
  }

  const formatBirthDate = (dateString) => {
    if (!dateString) return 'Belum diisi'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateAge = (birthDate) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
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
      return [{ value: user.lembaga_id, label: user.lembaga_nama || 'Lembaga Saya' }]
    }
    return [
      { value: '', label: 'Semua Lembaga' },
      { value: '1', label: 'SD' },
      { value: '2', label: 'SMP' },
      { value: '3', label: 'SMA' },
      { value: '4', label: 'SMK' },
      { value: '5', label: 'Non Formal' }
    ]
  }

  // Set default lembaga filter for lembaga users
  useEffect(() => {
    if (user?.role === 'lembaga' && !filters.lembaga) {
      setFilters(prev => ({ ...prev, lembaga: user.lembaga_id }))
    }
  }, [user, filters.lembaga])

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Data Santri">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">Data Santri</h1>
              <p className="text-muted mb-0">Kelola data santri yang telah dikonfirmasi</p>
            </div>
            <Link href="/admin/pendaftar" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali ke Pendaftar
            </Link>
          </div>

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Cari Santri</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Cari nama, NIK, nomor KK, alamat..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">Lembaga</label>
                  <select
                    className="form-select"
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

                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Semua Status</option>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
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
                
                <div className="col-md-1 d-flex align-items-end">
                  <button
                    onClick={clearFilters}
                    className="btn btn-outline-secondary w-100"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  <div className="text-muted small">
                    <i className="bi bi-info-circle me-1"></i>
                    Total: {pagination.total} santri
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Santri Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 py-3">
              <h5 className="card-title mb-0 fw-bold">
                <i className="bi bi-person-badge me-2 text-primary"></i>
                Data Santri
              </h5>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="spinner-border text-primary me-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted">Memuat data santri...</span>
                </div>
              ) : error ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                  <h6 className="text-danger mb-3">{error}</h6>
                  <button onClick={fetchSantri} className="btn btn-outline-primary">
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Coba Lagi
                  </button>
                </div>
              ) : santri.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <i className="bi bi-person-badge fs-1 text-muted mb-3"></i>
                  <h6 className="text-muted mb-3">Belum ada santri dikonfirmasi</h6>
                  <Link href="/admin/pendaftar" className="btn btn-primary">
                    <i className="bi bi-person-plus me-2"></i>
                    Konfirmasi Pendaftar
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Santri
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Jenis Kelamin
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Umur
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          NIK
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Lembaga
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Status
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {santri.map((data) => (
                        <tr key={data.id}>
                          <td className="border-0 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                                   style={{ width: '40px', height: '40px' }}>
                                <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>
                                  {getInitials(data.nama_lengkap)}
                                </span>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{data.nama_lengkap}</div>
                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                  {data.alamat ? (data.alamat.length > 30 ? data.alamat.substring(0, 30) + '...' : data.alamat) : 'Alamat belum diisi'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${data.jenis_kelamin === 'Laki-laki' ? 'bg-info' : 'bg-warning'}`}>
                              {data.jenis_kelamin || 'Belum diisi'}
                            </span>
                          </td>
                          <td className="border-0 py-3 text-muted">
                            {data.tanggal_lahir ? (
                              <span>
                                <i className="bi bi-calendar me-1"></i>
                                {calculateAge(data.tanggal_lahir)} tahun
                              </span>
                            ) : (
                              <span className="text-muted">Belum diisi</span>
                            )}
                          </td>
                          <td className="border-0 py-3 text-muted">
                            <i className="bi bi-credit-card me-1"></i>
                            {data.nik || 'Belum diisi'}
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${getLembagaBadgeClass(data.lembaga?.nama)}`}>
                              {data.lembaga?.nama || 'Belum diisi'}
                            </span>
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${data.status_aktif ? 'bg-success' : 'bg-danger'}`}>
                              <i className={`bi ${data.status_aktif ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                              {data.status_aktif ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </td>
                          <td className="border-0 py-3">
                            <div className="btn-group" role="group">
                              <Link
                                href={`/admin/santri/${data.id}`}
                                className="btn btn-outline-primary btn-sm"
                                title="Lihat Detail"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              
                              <Link
                                href={`/admin/santri/${data.id}/edit`}
                                className="btn btn-outline-secondary btn-sm"
                                title="Edit Santri"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>

                              <Link
                                href={`/admin/santri/${data.id}/berkas`}
                                className="btn btn-outline-success btn-sm"
                                title="Kelola Dokumen"
                              >
                                <i className="bi bi-file-earmark-text"></i>
                              </Link>
                              
                              {/* Tombol Update Status - hanya untuk superadmin dan admin */}
                              {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleUpdateStatus(data.id, data.nama_lengkap, data.status_aktif)}
                                  className={`btn btn-outline-${data.status_aktif ? 'warning' : 'success'} btn-sm`}
                                  title={data.status_aktif ? 'Non-aktifkan' : 'Aktifkan'}
                                  disabled={updatingIds.has(data.id)}
                                >
                                  {updatingIds.has(data.id) ? (
                                    <div className="spinner-border spinner-border-sm" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  ) : (
                                    <i className={`bi ${data.status_aktif ? 'bi-pause' : 'bi-play'}`}></i>
                                  )}
                                </button>
                              )}

                              {/* Tombol Hapus - hanya untuk superadmin dan admin */}
                              {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleDelete(data.id, data.nama_lengkap)}
                                  className="btn btn-outline-danger btn-sm"
                                  title="Hapus Santri"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                              
                              {/* Link ke data pendaftar asli */}
                              {data.pendaftar && (
                                <Link
                                  href={`/admin/pendaftar/${data.pendaftar.id}`}
                                  className="btn btn-outline-info btn-sm"
                                  title="Lihat Data Pendaftar"
                                >
                                  <i className="bi bi-person"></i>
                                </Link>
                              )}
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
            {!loading && !error && santri.length > 0 && (
              <div className="card-footer bg-white border-top-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} santri
                  </div>
                  
                  <nav aria-label="Pagination Navigation">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handleFilterChange('page', pagination.page - 1)}
                          disabled={pagination.page <= 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                          <span className="d-none d-sm-inline ms-1">Previous</span>
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
                          <span className="d-none d-sm-inline me-1">Next</span>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}