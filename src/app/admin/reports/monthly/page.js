'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

export default function MonthlyReportsPage() {
  const { user } = useAuth()
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0],
    lembagaId: ''
  })
  const [lembagaOptions, setLembagaOptions] = useState([])

  useEffect(() => {
    fetchLembagaOptions()
  }, [])

  useEffect(() => {
    fetchMonthlyData()
  }, [filters])

  const fetchLembagaOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/lembaga', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLembagaOptions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch lembaga options:', error)
    }
  }

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const params = new URLSearchParams({
        type: 'monthly',
        ...filters
      })
      
      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMonthlyData(data.data.monthly || [])
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat data laporan')
      }
    } catch (error) {
      console.error('Failed to fetch monthly data:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const getTotalByMonth = () => {
    return monthlyData.reduce((sum, month) => sum + month.count, 0)
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Laporan Bulanan">
          <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Memuat data laporan...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Laporan Bulanan">
        <div className="container-fluid">
          {/* Print Styles */}
          <style jsx>{`
            @media print {
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              .container-fluid {
                padding: 0 !important;
              }
              .card {
                border: 1px solid #ddd !important;
                box-shadow: none !important;
              }
              table {
                font-size: 12px !important;
              }
            }
            .print-only {
              display: none;
            }
          `}</style>

          {/* Print Header */}
          <div className="print-only text-center mb-4">
            <h2>Laporan Pendaftaran Bulanan</h2>
            <p>Periode: {new Date(filters.startDate).toLocaleDateString('id-ID')} - {new Date(filters.endDate).toLocaleDateString('id-ID')}</p>
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <hr />
          </div>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 no-print">
            <div>
              <Link href="/admin/reports" className="text-decoration-none text-muted">
                <i className="bi bi-arrow-left me-2"></i>
                Kembali ke Laporan
              </Link>
              <h1 className="h3 mb-0 text-gray-800 mt-2">Laporan Bulanan</h1>
              <p className="text-muted mb-0">Statistik pendaftaran per bulan</p>
            </div>
            <button 
              onClick={handlePrint}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-printer me-2"></i>
              Cetak Laporan
            </button>
          </div>

          {/* Filters */}
          <div className="card shadow mb-4 no-print">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Tanggal Selesai</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                {user?.role !== 'lembaga' && (
                  <div className="col-md-4">
                    <label className="form-label">Lembaga</label>
                    <select
                      className="form-select"
                      value={filters.lembagaId}
                      onChange={(e) => handleFilterChange('lembagaId', e.target.value)}
                    >
                      <option value="">Semua Lembaga</option>
                      {lembagaOptions.map(lembaga => (
                        <option key={lembaga.id} value={lembaga.id}>
                          {lembaga.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Pendaftar (Periode)
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {getTotalByMonth().toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-people text-gray-300 fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-left-info shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                        Rata-rata per Bulan
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {monthlyData.length > 0 ? (getTotalByMonth() / monthlyData.length).toFixed(1) : '0'}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-calculator text-gray-300 fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <i className="bi bi-table me-2"></i>
                Data Pendaftaran Bulanan
              </h6>
            </div>
            <div className="card-body">
              {monthlyData.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox text-muted fs-1 mb-3 d-block"></i>
                  <p className="text-muted">Tidak ada data untuk periode yang dipilih</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>No</th>
                        <th>Bulan</th>
                        <th>Jumlah Pendaftar</th>
                        <th>Detail per Lembaga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month, index) => (
                        <tr key={month.month}>
                          <td>{index + 1}</td>
                          <td>{month.monthName}</td>
                          <td className="fw-bold">{month.count}</td>
                          <td>
                            {Object.entries(month.lembaga).map(([lembaga, count]) => (
                              <div key={lembaga} className="mb-1">
                                <span className="badge bg-secondary me-1">
                                  {lembaga}: {count}
                                </span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colspan="2">Total</th>
                        <th>{getTotalByMonth()}</th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}