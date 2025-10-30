'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import BerkasSantri from '@/components/BerkasSantri'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function DetailSantriPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const santriId = params.id

  const [santri, setSantri] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSantri()
  }, [santriId])

  const fetchSantri = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/santri/${santriId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSantri(data.data)
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
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
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
    
    // Format phone number Indonesia
    let formatted = phone.toString().replace(/\D/g, '')
    if (formatted.startsWith('62')) {
      formatted = '+62 ' + formatted.slice(2)
    } else if (formatted.startsWith('0')) {
      formatted = '+62 ' + formatted.slice(1)
    }
    
    return formatted.replace(/(\d{2})(\d{4})(\d{4})(\d*)/, '$1 $2-$3-$4').trim()
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Detail Santri">
          <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Memuat data santri...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Detail Santri">
          <div className="container-fluid">
            <div className="text-center py-5">
              <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
              <h4 className="text-danger mb-3">{error}</h4>
              <Link href="/admin/santri" className="btn btn-primary">
                Kembali ke Daftar Santri
              </Link>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Detail Santri">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">{santri?.nama_lengkap}</h4>
              <p className="text-muted mb-0">Detail informasi santri</p>
            </div>
            <div className="btn-group">
              <Link href="/admin/santri" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Kembali
              </Link>
              <Link 
                href={`/admin/santri/${santriId}/edit`} 
                className="btn btn-outline-primary"
              >
                <i className="bi bi-pencil me-2"></i>
                Edit
              </Link>
            </div>
          </div>

          <div className="row g-4">
            {/* Data Dasar */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-primary text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-person me-2"></i>
                    Data Dasar
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Nama Lengkap</label>
                      <p className="mb-0">{santri?.nama_lengkap || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Tempat, Tanggal Lahir</label>
                      <p className="mb-0">
                        {santri?.tempat_lahir || '-'}
                        {santri?.tempat_lahir && santri?.tanggal_lahir && ', '}
                        {formatDate(santri?.tanggal_lahir)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Jenis Kelamin</label>
                      <p className="mb-0">{santri?.jenis_kelamin || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">NIK</label>
                      <p className="mb-0">{santri?.nik || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Nomor KK</label>
                      <p className="mb-0">{santri?.nomor_kk || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Status</label>
                      <p className="mb-0">
                        <span className={`badge ${santri?.status_aktif ? 'bg-success' : 'bg-secondary'}`}>
                          {santri?.status_aktif ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </p>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-muted">Alamat</label>
                      <p className="mb-0">{santri?.alamat || '-'}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted">Desa</label>
                      <p className="mb-0">{santri?.desa || '-'}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted">Kecamatan</label>
                      <p className="mb-0">{santri?.kecamatan || '-'}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted">Kabupaten</label>
                      <p className="mb-0">{santri?.kabupaten || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Provinsi</label>
                      <p className="mb-0">{santri?.provinsi || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Kode Pos</label>
                      <p className="mb-0">{santri?.kode_pos || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Orang Tua */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-success text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-people me-2"></i>
                    Data Orang Tua
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="fw-bold text-primary mb-3">Data Ayah</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Nama Ayah</label>
                      <p className="mb-0">{santri?.nama_ayah || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">NIK Ayah</label>
                      <p className="mb-0">{santri?.nik_ayah || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Tahun Lahir</label>
                      <p className="mb-0">{santri?.tahun_lahir_ayah || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Pekerjaan</label>
                      <p className="mb-0">{santri?.pekerjaan_ayah || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Pendidikan</label>
                      <p className="mb-0">{santri?.pendidikan_ayah || '-'}</p>
                    </div>
                    
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-primary mb-3">Data Ibu</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Nama Ibu</label>
                      <p className="mb-0">{santri?.nama_ibu || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">NIK Ibu</label>
                      <p className="mb-0">{santri?.nik_ibu || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Tahun Lahir</label>
                      <p className="mb-0">{santri?.tahun_lahir_ibu || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Pekerjaan</label>
                      <p className="mb-0">{santri?.pekerjaan_ibu || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Pendidikan</label>
                      <p className="mb-0">{santri?.pendidikan_ibu || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat Pendidikan */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-warning text-dark">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-book me-2"></i>
                    Riwayat Pendidikan
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold text-muted">Nama Sekolah Asal</label>
                      <p className="mb-0">{santri?.nama_sekolah_asal || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Provinsi Sekolah</label>
                      <p className="mb-0">{santri?.provinsi_sekolah_asal || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Kabupaten Sekolah</label>
                      <p className="mb-0">{santri?.kabupaten_sekolah_asal || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Kecamatan Sekolah</label>
                      <p className="mb-0">{santri?.kecamatan_sekolah_asal || '-'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted">Tahun Lulus</label>
                      <p className="mb-0">{santri?.tahun_lulus_sekolah_asal || '-'}</p>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-muted">Asal Pesantren</label>
                      <p className="mb-0">{santri?.asal_pesantren || '-'}</p>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-muted">Alamat Pesantren</label>
                      <p className="mb-0">{santri?.alamat_pesantren || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kesehatan */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-danger text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-heart-pulse me-2"></i>
                    Informasi Kesehatan
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold text-muted">Penyakit Kronis</label>
                      <p className="mb-0">{santri?.penyakit_kronis || 'Tidak ada'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Berkas Santri */}
            <div className="col-12">
              <BerkasSantri 
                santriId={santriId} 
                readonly={user?.role === 'lembaga' && !santri?.editable} 
              />
            </div>

            {/* Informasi Sistem */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-secondary text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-info-circle me-2"></i>
                    Informasi Sistem
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted">Lembaga</label>
                      <p className="mb-0">{santri?.lembaga?.nama || '-'}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted">Tanggal Terdaftar</label>
                      <p className="mb-0">{formatDate(santri?.created_at)}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted">ID Pendaftar</label>
                      <p className="mb-0">
                        {santri?.pendaftar_id ? (
                          <Link 
                            href={`/admin/pendaftar/${santri.pendaftar_id}`}
                            className="text-decoration-none"
                          >
                            #{santri.pendaftar_id}
                          </Link>
                        ) : '-'}
                      </p>
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