'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { uploadFile, validateFile } from '@/lib/fileUpload'
import { debugStorage } from '@/lib/storageDebug'

export default function ConfirmSantriPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pendaftarId = params.id

  const [pendaftar, setPendaftar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})

  const [formData, setFormData] = useState({
    // Data dasar - akan diisi dari data pendaftar
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    nomor_kk: '',
    nik: '',
    alamat: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    kode_pos: '',

    // Data orang tua
    nama_ayah: '',
    nik_ayah: '',
    tahun_lahir_ayah: '',
    pekerjaan_ayah: '',
    pendidikan_ayah: '',
    nama_ibu: '',
    nik_ibu: '',
    tahun_lahir_ibu: '',
    pekerjaan_ibu: '',
    pendidikan_ibu: '',

    // Riwayat pendidikan
    nama_sekolah_asal: '',
    provinsi_sekolah_asal: '',
    kabupaten_sekolah_asal: '',
    kecamatan_sekolah_asal: '',
    tahun_lulus_sekolah_asal: '',
    asal_pesantren: '',
    alamat_pesantren: '',

    // Kesehatan
    penyakit_kronis: ''
  })

  const berkasList = [
    { key: 'kartu_keluarga', label: 'Kartu Keluarga', required: false },
    { key: 'akta_kelahiran', label: 'Akta Kelahiran', required: false },
    { key: 'ijazah', label: 'Ijazah/SKHUN', required: false },
    { key: 'foto', label: 'Foto 3x4', required: false },
  ]

  const pendidikanOptions = [
    'Tidak Sekolah',
    'SD/Sederajat',
    'SMP/Sederajat', 
    'SMA/Sederajat',
    'D1/D2/D3',
    'S1/D4',
    'S2',
    'S3'
  ]

  useEffect(() => {
    fetchPendaftar()
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
        
        // Isi form dengan data pendaftar yang ada
        setFormData(prev => ({
          ...prev,
          nama_lengkap: data.data.nama || '',
          jenis_kelamin: data.data.jenis_kelamin || '',
          alamat: data.data.alamat || '',
          tempat_lahir: data.data.tempat_lahir || '',
          tanggal_lahir: data.data.tanggal_lahir ? data.data.tanggal_lahir.split('T')[0] : ''
        }))
        
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (berkasKey, file) => {
    if (!file) return

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setFiles(prev => ({
      ...prev,
      [berkasKey]: file
    }))
  }

  const uploadFileWithProgress = async (file, berkasKey) => {
    try {
      setUploadProgress(prev => ({ ...prev, [berkasKey]: 10 }))
      
      const result = await uploadFile(file, 'santri')
      
      setUploadProgress(prev => ({ ...prev, [berkasKey]: 100 }))
      
      if (result.success) {
        return result.url
      } else {
        // If upload fails, run debug to help identify the issue
        console.error('Upload failed, running storage debug...')
        const debugResult = await debugStorage()
        console.log('Storage debug result:', debugResult)
        
        throw new Error(result.error + (debugResult.error ? ' (Debug: ' + debugResult.error + ')' : ''))
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress(prev => ({ ...prev, [berkasKey]: 0 }))
      throw error
    }
  }

  const validateForm = () => {
    const requiredFields = [
      'nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
      'nomor_kk', 'nik', 'alamat', 'desa', 'kecamatan', 'kabupaten', 'provinsi',
      'nama_ayah', 'nama_ibu'
    ]

    for (const field of requiredFields) {
      if (!formData[field]) {
        return `Field ${field.replace('_', ' ')} harus diisi`
      }
    }

    // Validasi berkas wajib - dibuat optional untuk sementara
    // const requiredBerkas = berkasList.filter(b => b.required)
    // for (const berkas of requiredBerkas) {
    //   if (!files[berkas.key]) {
    //     return `Berkas ${berkas.label} harus diupload`
    //   }
    // }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validation = validateForm()
    if (validation) {
      alert(validation)
      return
    }

    try {
      setSubmitting(true)
      
      // Upload semua berkas terlebih dahulu
      const uploadedFiles = {}
      const uploadErrors = []
      
      for (const [berkasKey, file] of Object.entries(files)) {
        if (file) {
          try {
            const fileUrl = await uploadFileWithProgress(file, berkasKey)
            uploadedFiles[berkasKey] = fileUrl
          } catch (uploadError) {
            console.error(`Failed to upload ${berkasKey}:`, uploadError)
            uploadErrors.push(`${berkasKey}: ${uploadError.message}`)
            // Continue with other uploads even if one fails
          }
        }
      }

      // Show upload errors but continue with submission
      if (uploadErrors.length > 0) {
        const continueAnyway = confirm(
          `Beberapa berkas gagal diupload:\n${uploadErrors.join('\n')}\n\nLanjutkan tanpa berkas ini? Berkas bisa diupload nanti.`
        )
        if (!continueAnyway) {
          return
        }
      }

      // Submit data santri
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/pendaftar/${pendaftarId}/confirm-santri`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          santri_data: formData,
          berkas_data: uploadedFiles
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Data santri berhasil disimpan!')
        router.push('/admin/pendaftar')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal menyimpan data santri')
      }
    } catch (error) {
      console.error('Failed to submit santri data:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
        <AdminLayout pageTitle="Konfirmasi Santri">
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
      <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
        <AdminLayout pageTitle="Konfirmasi Santri">
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
    <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
      <AdminLayout pageTitle="Konfirmasi Santri">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <p className="text-muted mb-0">Lengkapi data untuk mengkonfirmasi {pendaftar?.nama} menjadi santri</p>
            </div>
            <Link href="/admin/pendaftar" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali
            </Link>
          </div>

          {/* Pendaftar Info */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="card-title fw-bold mb-3">
                <i className="bi bi-person-circle me-2 text-primary"></i>
                Informasi Pendaftar
              </h6>
              <div className="row">
                <div className="col-md-3">
                  <strong>Nama:</strong> {pendaftar?.nama}
                </div>
                <div className="col-md-3">
                  <strong>No HP:</strong> {pendaftar?.no_hp}
                </div>
                <div className="col-md-3">
                  <strong>Lembaga:</strong> {pendaftar?.lembaga_pendidikan}
                </div>
                <div className="col-md-3">
                  <strong>Tanggal Daftar:</strong> {new Date(pendaftar?.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Data Dasar */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-primary text-white">
                    <h6 className="card-title mb-0 fw-bold">
                      <i className="bi bi-person me-2"></i>
                      Data Dasar Santri
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Nama Lengkap *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nama_lengkap"
                          value={formData.nama_lengkap}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Tempat Lahir *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="tempat_lahir"
                          value={formData.tempat_lahir}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Tanggal Lahir *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="tanggal_lahir"
                          value={formData.tanggal_lahir}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Jenis Kelamin *</label>
                        <select
                          className="form-select"
                          name="jenis_kelamin"
                          value={formData.jenis_kelamin}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Pilih...</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">NIK</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nik"
                          value={formData.nik}
                          onChange={handleInputChange}
                          maxLength="16"
                          
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label fw-semibold">Nomor KK</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nomor_kk"
                          value={formData.nomor_kk}
                          onChange={handleInputChange}
                          maxLength="16"
                          
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label fw-semibold">Alamat Lengkap </label>
                        <textarea
                          className="form-control"
                          name="alamat"
                          value={formData.alamat}
                          onChange={handleInputChange}
                          rows="3"
                          
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Desa </label>
                        <input
                          type="text"
                          className="form-control"
                          name="desa"
                          value={formData.desa}
                          onChange={handleInputChange}
                          
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Kecamatan </label>
                        <input
                          type="text"
                          className="form-control"
                          name="kecamatan"
                          value={formData.kecamatan}
                          onChange={handleInputChange}
                          
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Kabupaten </label>
                        <input
                          type="text"
                          className="form-control"
                          name="kabupaten"
                          value={formData.kabupaten}
                          onChange={handleInputChange}
                          
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Provinsi </label>
                        <input
                          type="text"
                          className="form-control"
                          name="provinsi"
                          value={formData.provinsi}
                          onChange={handleInputChange}
                          
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Kode Pos</label>
                        <input
                          type="text"
                          className="form-control"
                          name="kode_pos"
                          value={formData.kode_pos}
                          onChange={handleInputChange}
                          maxLength="5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Orang Tua */}
                <div className="card border-0 shadow-sm mb-4">
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
                        <label className="form-label fw-semibold">Nama Ayah *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nama_ayah"
                          value={formData.nama_ayah}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">NIK Ayah</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nik_ayah"
                          value={formData.nik_ayah}
                          onChange={handleInputChange}
                          maxLength="16"
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Tahun Lahir Ayah</label>
                        <input
                          type="number"
                          className="form-control"
                          name="tahun_lahir_ayah"
                          value={formData.tahun_lahir_ayah}
                          onChange={handleInputChange}
                          min="1940"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Pekerjaan Ayah</label>
                        <input
                          type="text"
                          className="form-control"
                          name="pekerjaan_ayah"
                          value={formData.pekerjaan_ayah}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Pendidikan Ayah</label>
                        <select
                          className="form-select"
                          name="pendidikan_ayah"
                          value={formData.pendidikan_ayah}
                          onChange={handleInputChange}
                        >
                          <option value="">Pilih...</option>
                          {pendidikanOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-12">
                        <h6 className="fw-bold text-primary mb-3 mt-3">Data Ibu</h6>
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Nama Ibu *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nama_ibu"
                          value={formData.nama_ibu}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">NIK Ibu</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nik_ibu"
                          value={formData.nik_ibu}
                          onChange={handleInputChange}
                          maxLength="16"
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Tahun Lahir Ibu</label>
                        <input
                          type="number"
                          className="form-control"
                          name="tahun_lahir_ibu"
                          value={formData.tahun_lahir_ibu}
                          onChange={handleInputChange}
                          min="1940"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Pekerjaan Ibu</label>
                        <input
                          type="text"
                          className="form-control"
                          name="pekerjaan_ibu"
                          value={formData.pekerjaan_ibu}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Pendidikan Ibu</label>
                        <select
                          className="form-select"
                          name="pendidikan_ibu"
                          value={formData.pendidikan_ibu}
                          onChange={handleInputChange}
                        >
                          <option value="">Pilih...</option>
                          {pendidikanOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riwayat Pendidikan & Kesehatan */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-info text-white">
                    <h6 className="card-title mb-0 fw-bold">
                      <i className="bi bi-mortarboard me-2"></i>
                      Riwayat Pendidikan
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Nama Sekolah Asal</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nama_sekolah_asal"
                          value={formData.nama_sekolah_asal}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Provinsi Sekolah Asal</label>
                        <input
                          type="text"
                          className="form-control"
                          name="provinsi_sekolah_asal"
                          value={formData.provinsi_sekolah_asal}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Kabupaten Sekolah Asal</label>
                        <input
                          type="text"
                          className="form-control"
                          name="kabupaten_sekolah_asal"
                          value={formData.kabupaten_sekolah_asal}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Kecamatan Sekolah Asal</label>
                        <input
                          type="text"
                          className="form-control"
                          name="kecamatan_sekolah_asal"
                          value={formData.kecamatan_sekolah_asal}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Tahun Lulus</label>
                        <input
                          type="number"
                          className="form-control"
                          name="tahun_lulus_sekolah_asal"
                          value={formData.tahun_lulus_sekolah_asal}
                          onChange={handleInputChange}
                          min="2000"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label fw-semibold">Asal Pesantren (jika ada)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="asal_pesantren"
                          value={formData.asal_pesantren}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label fw-semibold">Alamat Pesantren (jika ada)</label>
                        <textarea
                          className="form-control"
                          name="alamat_pesantren"
                          value={formData.alamat_pesantren}
                          onChange={handleInputChange}
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kesehatan */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-warning text-white">
                    <h6 className="card-title mb-0 fw-bold">
                      <i className="bi bi-heart-pulse me-2"></i>
                      Informasi Kesehatan
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Penyakit Kronis (jika ada)</label>
                        <textarea
                          className="form-control"
                          name="penyakit_kronis"
                          value={formData.penyakit_kronis}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Tuliskan jika ada riwayat penyakit kronis atau kondisi kesehatan khusus"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Berkas */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-secondary text-white">
                    <h6 className="card-title mb-0 fw-bold">
                      <i className="bi bi-file-earmark-arrow-up me-2"></i>
                      Upload Berkas
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {berkasList.map(berkas => (
                        <div key={berkas.key} className="col-12">
                          <label className="form-label fw-semibold">
                            {berkas.label} {berkas.required && <span className="text-danger">*</span>}
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(berkas.key, e.target.files[0])}
                          />
                          {uploadProgress[berkas.key] && (
                            <div className="progress mt-2" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ width: `${uploadProgress[berkas.key]}%` }}
                              ></div>
                            </div>
                          )}
                          <small className="text-muted">Format: PDF, JPG, PNG (max 5MB)</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    <i className="bi bi-info-circle me-2"></i>
                    Pastikan semua data telah diisi dengan benar sebelum menyimpan.
                  </div>
                  <div>
                    <Link href="/admin/pendaftar" className="btn btn-outline-secondary me-3">
                      <i className="bi bi-arrow-left me-2"></i>
                      Batal
                    </Link>
                    <button 
                      type="submit" 
                      className="btn btn-success" 
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Konfirmasi Santri
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}