'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

export default function ReportsPage() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/admin/reports?type=overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOverview(data.data.overview)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat data laporan')
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Laporan">
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
      <AdminLayout pageTitle="Laporan">
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
            }
            .print-only {
              display: none;
            }
          `}</style>

          {/* Print Header */}
          <div className="print-only text-center mb-4">
            <h2>Laporan Sistem Penerimaan Santri Baru</h2>
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
              <h1 className="h3 mb-0 text-gray-800">Laporan</h1>
              <p className="text-muted mb-0">Dashboard laporan dan statistik</p>
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

          {/* Overview Statistics */}
          {overview && (
            <div className="row mb-4">
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Total Pendaftar
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {overview.totalPendaftar.toLocaleString('id-ID')}
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
                          Total Santri Diterima
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {overview.totalSantri.toLocaleString('id-ID')}
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
                <div className="card border-left-info shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                          Tingkat Penerimaan
                        </div>
                        <div className="row no-gutters align-items-center">
                          <div className="col-auto">
                            <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">
                              {overview.acceptanceRate}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="progress progress-sm mr-2">
                              <div 
                                className="progress-bar bg-info" 
                                role="progressbar" 
                                style={{ width: `${overview.acceptanceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-auto">
                        <i className="bi bi-clipboard-data text-gray-300 fs-2"></i>
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
                          Pendaftaran (7 hari terakhir)
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {overview.recentRegistrations.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="col-auto">
                        <i className="bi bi-calendar-week text-gray-300 fs-2"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Navigation */}
          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="card shadow">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <i className="bi bi-calendar me-2"></i>
                    Laporan Harian & Bulanan
                  </h6>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-3">
                    Lihat statistik pendaftaran berdasarkan periode harian dan bulanan
                  </p>
                  <div className="d-grid gap-2">
                    <Link 
                      href="/admin/reports/daily" 
                      className="btn btn-outline-primary"
                    >
                      <i className="bi bi-calendar-day me-2"></i>
                      Laporan Harian
                    </Link>
                    <Link 
                      href="/admin/reports/monthly" 
                      className="btn btn-outline-info"
                    >
                      <i className="bi bi-calendar-month me-2"></i>
                      Laporan Bulanan
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 mb-4">
              <div className="card shadow">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-success">
                    <i className="bi bi-building me-2"></i>
                    Laporan Per Lembaga
                  </h6>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-3">
                    Statistik pendaftaran dan penerimaan per lembaga pendidikan
                  </p>
                  <div className="d-grid gap-2">
                    <Link 
                      href="/admin/reports/lembaga" 
                      className="btn btn-outline-success"
                    >
                      <i className="bi bi-bar-chart me-2"></i>
                      Statistik Per Lembaga
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Reports */}
          <div className="row no-print">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-secondary">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Laporan Tambahan
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="border rounded p-3 h-100">
                        <h6 className="text-primary">
                          <i className="bi bi-graph-up me-2"></i>
                          Trend Pendaftaran
                        </h6>
                        <p className="text-muted small mb-2">
                          Analisis trend pendaftaran dalam periode tertentu
                        </p>
                        <small className="text-secondary">Segera hadir</small>
                      </div>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <div className="border rounded p-3 h-100">
                        <h6 className="text-info">
                          <i className="bi bi-geo-alt me-2"></i>
                          Sebaran Geografis
                        </h6>
                        <p className="text-muted small mb-2">
                          Peta sebaran asal daerah pendaftar
                        </p>
                        <small className="text-secondary">Segera hadir</small>
                      </div>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <div className="border rounded p-3 h-100">
                        <h6 className="text-warning">
                          <i className="bi bi-person-lines-fill me-2"></i>
                          Analisis Demografi
                        </h6>
                        <p className="text-muted small mb-2">
                          Analisis berdasarkan jenis kelamin, usia, dll
                        </p>
                        <small className="text-secondary">Segera hadir</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}