'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PendaftarDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pendaftarId = params.id

  const [pendaftar, setPendaftar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [santriStatus, setSantriStatus] = useState(null)

  useEffect(() => {
    fetchPendaftar()
    fetchSantriStatus()
  }, [pendaftarId])

  const fetchPendaftar = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/pendaftar/${pendaftarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendaftar(data.data)
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
  }

  const fetchSantriStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/pendaftar/${pendaftarId}/santri-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSantriStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch santri status:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  const formatPhone = (phone) => {
    if (!phone) return '-'
    // Format: 08xx-xxxx-xxxx
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
    }
    return phone
  }

  const getLembagaBadgeClass = (lembaga) => {
    const lembagaLower = lembaga?.toLowerCase() || ''
    if (lembagaLower.includes('putra')) return 'bg-primary'
    if (lembagaLower.includes('putri')) return 'bg-danger'
    if (lembagaLower.includes('umum')) return 'bg-success'
    if (lembagaLower.includes('takhasus')) return 'bg-warning text-dark'
    return 'bg-secondary'
  }

  const handlePrint = () => {
    window.print()
  }

  const handleConfirmSantri = () => {
    router.push(`/admin/pendaftar/${pendaftarId}/confirm-santri`)
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Detail Pendaftar">
          <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Memuat data pendaftar...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Detail Pendaftar">
          <div className="container-fluid">
            <div className="text-center py-5">
              <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
              <h4 className="text-danger mb-3">{error}</h4>
              <Link href="/admin/pendaftar" className="btn btn-primary">
                Kembali ke Daftar Pendaftar
              </Link>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Detail Pendaftar">
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
              .card {
                border: 1px solid #dee2e6 !important;
                box-shadow: none !important;
              }
              .badge {
                border: 1px solid #000 !important;
                color: #000 !important;
                background: transparent !important;
              }
              body {
                margin: 0;
                padding: 20px;
              }
              .container-fluid {
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            .print-only {
              display: none;
            }
          `}</style>

          {/* Print Header */}
          <div className="print-only text-center mb-4">
            <h2>SISTEM PENDAFTARAN SANTRI BARU</h2>
            <h3>PONDOK PESANTREN SANTRI PASIR</h3>
            <hr />
          </div>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 no-print">
            <div>
              <h4 className="mb-1">Detail Pendaftar</h4>
              <p className="text-muted mb-0">Informasi lengkap pendaftar santri baru</p>
            </div>
            <div className="btn-group">
              <button
                onClick={handlePrint}
                className="btn btn-outline-primary"
                title="Print Detail"
              >
                <i className="bi bi-printer me-2"></i>
                Print
              </button>
              {!santriStatus?.isConfirmed && (
                <button
                  onClick={handleConfirmSantri}
                  className="btn btn-success"
                  title="Konfirmasi menjadi Santri"
                >
                  <i className="bi bi-person-check me-2"></i>
                  Konfirmasi Santri
                </button>
              )}
              <Link href="/admin/pendaftar" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Kembali
              </Link>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            {santriStatus?.isConfirmed ? (
              <div className="alert alert-success d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2"></i>
                <div>
                  <strong>Status: Sudah dikonfirmasi menjadi Santri</strong>
                  <br />
                  <small>
                    Dikonfirmasi pada: {formatDate(santriStatus.santri?.created_at)}
                    {santriStatus.santri?.id && (
                      <>
                        {' - '}
                        <Link 
                          href={`/admin/santri/${santriStatus.santri.id}`} 
                          className="text-decoration-none no-print"
                        >
                          Lihat Data Santri <i className="bi bi-arrow-right"></i>
                        </Link>
                      </>
                    )}
                  </small>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning d-flex align-items-center">
                <i className="bi bi-clock me-2"></i>
                <div>
                  <strong>Status: Masih dalam tahap pendaftaran</strong>
                  <br />
                  <small>Belum dikonfirmasi menjadi santri</small>
                </div>
              </div>
            )}
          </div>

          <div className="row">
            {/* Data Pribadi */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-primary text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-person me-2"></i>
                    Data Pribadi
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>Nama Lengkap:</strong>
                      <p className="mb-2">{pendaftar?.nama || '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>Tempat Lahir:</strong>
                      <p className="mb-2">{pendaftar?.tempat_lahir || '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>Tanggal Lahir:</strong>
                      <p className="mb-2">{pendaftar?.tanggal_lahir ? formatDate(pendaftar.tanggal_lahir) : '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>Jenis Kelamin:</strong>
                      <p className="mb-2">{pendaftar?.jenis_kelamin || '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>No. HP:</strong>
                      <p className="mb-2">{formatPhone(pendaftar?.no_hp)}</p>
                    </div>
                    
                    <div className="col-12">
                      <strong>Alamat:</strong>
                      <p className="mb-2">{pendaftar?.alamat || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Wali/Orang Tua */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-info text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-people me-2"></i>
                    Data Wali/Orang Tua
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>Nama Wali:</strong>
                      <p className="mb-2">{pendaftar?.nama_wali || '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>No. HP Wali:</strong>
                      <p className="mb-2">{formatPhone(pendaftar?.no_hp_wali)}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>Hubungan dengan Santri:</strong>
                      <p className="mb-2">{pendaftar?.hubungan_wali || '-'}</p>
                    </div>
                    
                    <div className="col-12">
                      <strong>Alamat Wali:</strong>
                      <p className="mb-2">{pendaftar?.alamat_wali || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Pendidikan & Lembaga */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-success text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-mortarboard me-2"></i>
                    Data Pendidikan & Lembaga
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>Lembaga Pendidikan:</strong>
                      <p className="mb-2">
                        <span className={`badge ${getLembagaBadgeClass(pendaftar?.lembaga_pendidikan)}`}>
                          {pendaftar?.lembaga_pendidikan || '-'}
                        </span>
                      </p>
                    </div>
                    
                    <div className="col-12">
                      <strong>Asal Sekolah:</strong>
                      <p className="mb-2">{pendaftar?.asal_sekolah || '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>Tahun Lulus:</strong>
                      <p className="mb-2">{pendaftar?.tahun_lulus || '-'}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>Nilai UN/USBN:</strong>
                      <p className="mb-2">{pendaftar?.nilai_un || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Administratif */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-warning text-dark">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-clipboard-data me-2"></i>
                    Data Administratif
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Tanggal Daftar:</strong>
                      <p className="mb-2">{formatDate(pendaftar?.created_at)}</p>
                    </div>
                    
                    <div className="col-md-6">
                      <strong>ID Pendaftar:</strong>
                      <p className="mb-2">#{pendaftar?.id}</p>
                    </div>
                    
                    <div className="col-12">
                      <strong>Status Pendaftaran:</strong>
                      <p className="mb-2">
                        {santriStatus?.isConfirmed ? (
                          <span className="badge bg-success">Sudah Santri</span>
                        ) : (
                          <span className="badge bg-secondary">Pendaftar</span>
                        )}
                      </p>
                    </div>
                    
                    {pendaftar?.keterangan && (
                      <div className="col-12">
                        <strong>Keterangan:</strong>
                        <p className="mb-2">{pendaftar.keterangan}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="print-only mt-5">
            <hr />
            <div className="row">
              <div className="col-6">
                <p>Dicetak pada: {formatDate(new Date().toISOString())}</p>
              </div>
              <div className="col-6 text-end">
                <p>SPSMB - Santri Pasir</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}