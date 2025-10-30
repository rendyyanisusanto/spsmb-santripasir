'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

export default function LembagaReportsPage() {
  const { user } = useAuth()
  const [lembagaStats, setLembagaStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLembagaStats()
  }, [])

  const fetchLembagaStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/admin/reports?type=lembaga', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLembagaStats(data.data.lembagaStats || [])
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat data laporan')
      }
    } catch (error) {
      console.error('Failed to fetch lembaga stats:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getTotalPendaftar = () => {
    return lembagaStats.reduce((sum, lembaga) => sum + lembaga.totalPendaftar, 0)
  }

  const getTotalSantri = () => {
    return lembagaStats.reduce((sum, lembaga) => sum + lembaga.totalSantri, 0)
  }

  const getOverallAcceptanceRate = () => {
    const totalPendaftar = getTotalPendaftar()
    const totalSantri = getTotalSantri()
    return totalPendaftar > 0 ? ((totalSantri / totalPendaftar) * 100).toFixed(1) : '0'
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Laporan Per Lembaga">
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
      <AdminLayout pageTitle="Laporan Per Lembaga">
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
            <h2>Laporan Statistik Per Lembaga</h2>
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
              <h1 className="h3 mb-0 text-gray-800 mt-2">Laporan Per Lembaga</h1>
              <p className="text-muted mb-0">Statistik pendaftaran dan penerimaan per lembaga</p>
            </div>
            <button 
              onClick={handlePrint}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-printer me-2"></i>
              Cetak Laporan
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Lembaga
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {lembagaStats.length}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-building text-gray-300 fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-info shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                        Total Pendaftar
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {getTotalPendaftar().toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-people text-gray-300 fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-success shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Total Diterima
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {getTotalSantri().toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-person-check text-gray-300 fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-warning shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                        Tingkat Penerimaan
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {getOverallAcceptanceRate()}%
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-percent text-gray-300 fs-2"></i>
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
                Statistik Per Lembaga
              </h6>
            </div>
            <div className="card-body">
              {lembagaStats.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox text-muted fs-1 mb-3 d-block"></i>
                  <p className="text-muted">Tidak ada data lembaga</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>No</th>
                        <th>Nama Lembaga</th>
                        <th>Total Pendaftar</th>
                        <th>Total Diterima</th>
                        <th>Belum Diterima</th>
                        <th>Tingkat Penerimaan</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lembagaStats.map((lembaga, index) => {
                        const belumDiterima = lembaga.totalPendaftar - lembaga.totalSantri
                        return (
                          <tr key={lembaga.lembagaId}>
                            <td>{index + 1}</td>
                            <td className="fw-bold">{lembaga.lembaga}</td>
                            <td>{lembaga.totalPendaftar}</td>
                            <td className="text-success fw-bold">{lembaga.totalSantri}</td>
                            <td className="text-warning">{belumDiterima}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="me-2">{lembaga.acceptanceRate}%</span>
                                <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
                                    role="progressbar" 
                                    style={{ width: `${lembaga.acceptanceRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {parseFloat(lembaga.acceptanceRate) >= 80 ? (
                                <span className="badge bg-success">Sangat Baik</span>
                              ) : parseFloat(lembaga.acceptanceRate) >= 60 ? (
                                <span className="badge bg-info">Baik</span>
                              ) : parseFloat(lembaga.acceptanceRate) >= 40 ? (
                                <span className="badge bg-warning">Cukup</span>
                              ) : (
                                <span className="badge bg-danger">Perlu Perhatian</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan="2">Total</th>
                        <th>{getTotalPendaftar()}</th>
                        <th className="text-success">{getTotalSantri()}</th>
                        <th className="text-warning">{getTotalPendaftar() - getTotalSantri()}</th>
                        <th>{getOverallAcceptanceRate()}%</th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Chart visualization could be added here */}
          <div className="row mt-4 no-print">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-secondary">
                    <i className="bi bi-bar-chart me-2"></i>
                    Visualisasi Data
                  </h6>
                </div>
                <div className="card-body">
                  <p className="text-muted text-center py-4">
                    <i className="bi bi-graph-up fs-1 d-block mb-2"></i>
                    Grafik dan chart akan ditambahkan pada versi selanjutnya
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}