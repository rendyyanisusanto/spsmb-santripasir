'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PendaftarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pendaftar, setPendaftar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [santriStatus, setSantriStatus] = useState({}) // Track santri status for each pendaftar
  const [confirmingIds, setConfirmingIds] = useState(new Set()) // Track confirming process
  const [sendingWhatsApp, setSendingWhatsApp] = useState({}) // Track WhatsApp sending status
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

        // Fetch santri status for each pendaftar
        await fetchSantriStatus(data.data)
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

  const fetchSantriStatus = async (pendaftarList) => {
    const token = localStorage.getItem('token')
    const statusPromises = pendaftarList.map(async (p) => {
      try {
        const response = await fetch(`/api/admin/pendaftar/${p.id}/santri-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          return { id: p.id, ...data.data }
        }
      } catch (error) {
        console.error(`Failed to fetch santri status for ${p.id}:`, error)
      }
      return { id: p.id, isConfirmed: false, santri: null }
    })

    const statuses = await Promise.all(statusPromises)
    const statusMap = {}
    statuses.forEach(status => {
      statusMap[status.id] = status
    })
    setSantriStatus(statusMap)
  }

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
      lembaga: user?.role === 'lembaga' ? user.lembaga_name : '',
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

  const handleConfirmSantri = async (pendaftarId, pendaftarName) => {
    // Redirect ke halaman form konfirmasi
    router.push(`/admin/pendaftar/${pendaftarId}/confirm-santri`)
  }

  const handleSendWhatsApp = async (pendaftarId, pendaftarName) => {
    if (!confirm(`Kirim konfirmasi WhatsApp ke "${pendaftarName}"?`)) {
      return
    }

    setSendingWhatsApp(prev => ({ ...prev, [pendaftarId]: true }))

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/pendaftar/${pendaftarId}/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert('WhatsApp berhasil dikirim!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal mengirim WhatsApp')
      }
    } catch (error) {
      console.error('Failed to send WhatsApp:', error)
      alert('Terjadi kesalahan sistem')
    } finally {
      setSendingWhatsApp(prev => ({ ...prev, [pendaftarId]: false }))
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
      return [{ value: user.lembaga_name, label: user.lembaga_name }]
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
      setFilters(prev => ({ ...prev, lembaga: user.lembaga_name }))
    }
  }, [user, filters.lembaga])

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Data Pendaftar">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">Data Pendaftar</h1>
              <p className="text-muted mb-0">Kelola data pendaftar SPMB</p>
            </div>
            <div className="d-flex gap-2">
              <Link href="/admin/santri" className="btn btn-outline-success">
                <i className="bi bi-person-badge me-2"></i>
                Lihat Data Santri
              </Link>
              <Link href="/admin/pendaftar/create" className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i>
                Tambah Pendaftar
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title opacity-75">Total Pendaftar</h6>
                      <h2 className="mb-0">{pagination.total}</h2>
                    </div>
                    <i className="bi bi-people fs-1 opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title opacity-75">Sudah Santri</h6>
                      <h2 className="mb-0">
                        {Object.values(santriStatus).filter(s => s.isConfirmed).length}
                      </h2>
                    </div>
                    <i className="bi bi-person-check fs-1 opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title opacity-75">Menunggu Konfirmasi</h6>
                      <h2 className="mb-0">
                        {Object.values(santriStatus).filter(s => !s.isConfirmed).length}
                      </h2>
                    </div>
                    <i className="bi bi-clock fs-1 opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title opacity-75">Tingkat Konfirmasi</h6>
                      <h2 className="mb-0">
                        {pagination.total > 0
                          ? Math.round((Object.values(santriStatus).filter(s => s.isConfirmed).length / pagination.total) * 100)
                          : 0
                        }%
                      </h2>
                    </div>
                    <i className="bi bi-graph-up fs-1 opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold">Cari Pendaftar</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Cari nama, no HP, wali, atau alamat..."
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
                    Total: {pagination.total} pendaftar
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pendaftar Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 py-3">
              <h5 className="card-title mb-0 fw-bold">
                <i className="bi bi-people me-2 text-primary"></i>
                Data Pendaftar
              </h5>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="spinner-border text-primary me-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted">Memuat data pendaftar...</span>
                </div>
              ) : error ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                  <h6 className="text-danger mb-3">{error}</h6>
                  <button onClick={fetchPendaftar} className="btn btn-outline-primary">
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Coba Lagi
                  </button>
                </div>
              ) : pendaftar.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <h6 className="text-muted mb-3">Tidak ada data pendaftar ditemukan</h6>
                  <Link href="/admin/pendaftar/create" className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i>
                    Tambah Pendaftar Pertama
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Pendaftar
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Jenis Kelamin
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          No HP
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Wali
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Lembaga
                        </th>
                        <th className="border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                          Status Santri
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
                      {pendaftar.map((data) => (
                        <tr key={data.id}>
                          <td className="border-0 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ width: '40px', height: '40px' }}>
                                <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>
                                  {getInitials(data.nama)}
                                </span>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{data.nama}</div>
                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                  {data.alamat.length > 30 ? data.alamat.substring(0, 30) + '...' : data.alamat}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${data.jenis_kelamin === 'Laki-laki' ? 'bg-info' : 'bg-warning'}`}>
                              {data.jenis_kelamin}
                            </span>
                          </td>
                          <td className="border-0 py-3 text-muted">
                            <i className="bi bi-telephone me-1"></i>
                            {formatPhone(data.no_hp)}
                          </td>
                          <td className="border-0 py-3 text-muted">
                            <i className="bi bi-person me-1"></i>
                            {data.nama_wali}
                          </td>
                          <td className="border-0 py-3">
                            <span className={`badge ${getLembagaBadgeClass(data.lembaga_pendidikan)}`}>
                              {data.lembaga_pendidikan}
                            </span>
                          </td>
                          <td className="border-0 py-3">
                            {santriStatus[data.id]?.isConfirmed ? (
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Sudah Santri
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                <i className="bi bi-clock me-1"></i>
                                Pendaftar
                              </span>
                            )}
                          </td>
                          <td className="border-0 py-3 text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {formatDate(data.created_at)}
                          </td>
                          <td className="border-0 py-3">
                            <div className="btn-group" role="group">
                              <Link
                                href={`/admin/pendaftar/${data.id}`}
                                className="btn btn-outline-primary btn-sm"
                                title="Lihat Detail"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>

                              {/* Tombol WhatsApp */}
                              <button
                                onClick={() => handleSendWhatsApp(data.id, data.nama)}
                                className="btn btn-outline-success btn-sm"
                                title="Kirim WhatsApp"
                                disabled={sendingWhatsApp[data.id]}
                              >
                                {sendingWhatsApp[data.id] ? (
                                  <i className="bi bi-hourglass-split"></i>
                                ) : (
                                  <i className="bi bi-whatsapp"></i>
                                )}
                              </button>

                              {/* Tombol Konfirmasi Santri - untuk superadmin, admin, dan lembaga */}
                              {!santriStatus[data.id]?.isConfirmed && (
                                <button
                                  onClick={() => handleConfirmSantri(data.id, data.nama)}
                                  className="btn btn-outline-success btn-sm"
                                  title="Konfirmasi menjadi Santri"
                                >
                                  <i className="bi bi-person-check"></i>
                                </button>
                              )}

                              {/* Link ke halaman santri jika sudah dikonfirmasi */}
                              {santriStatus[data.id]?.isConfirmed && (
                                <Link
                                  href={`/admin/santri/${santriStatus[data.id].santri?.id}`}
                                  className="btn btn-outline-info btn-sm"
                                  title="Lihat Data Santri"
                                >
                                  <i className="bi bi-person-badge"></i>
                                </Link>
                              )}

                              {!santriStatus[data.id]?.isConfirmed && (
                                <button
                                  onClick={() => handleDeletePendaftar(data.id, data.nama)}
                                  className="btn btn-outline-danger btn-sm"
                                  title="Hapus Pendaftar"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
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
            {!loading && !error && pendaftar.length > 0 && (
              <div className="card-footer bg-white border-top-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pendaftar
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