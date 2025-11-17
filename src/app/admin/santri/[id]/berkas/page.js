'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { uploadFile, validateFile } from '@/lib/fileUpload'

export default function BerkasSantriPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const santriId = params.id

  const [santri, setSantri] = useState(null)
  const [berkas, setBerkas] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [jenisBerkas, setJenisBerkas] = useState('')

  const berkasList = [
    { value: 'kartu_keluarga', label: 'Kartu Keluarga' },
    { value: 'akta_kelahiran', label: 'Akta Kelahiran' },
    { value: 'ijazah', label: 'Ijazah/SKHUN' },
    { value: 'foto', label: 'Foto 3x4' },
    { value: 'surat_keterangan_sehat', label: 'Surat Keterangan Sehat' },
    { value: 'surat_pernyataan', label: 'Surat Pernyataan' },
    { value: 'lainnya', label: 'Lainnya' }
  ]

  useEffect(() => {
    fetchSantriAndBerkas()
  }, [santriId])

  const fetchSantriAndBerkas = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')

      if (!token) {
        setError('Token tidak ditemukan. Silakan login kembali.')
        setLoading(false)
        return
      }

      // Fetch santri data
      try {
        const santriResponse = await fetch(`/api/admin/santri/${santriId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (santriResponse.ok) {
          const santriData = await santriResponse.json()
          setSantri(santriData.data)
        } else {
          console.error('Failed to fetch santri:', santriResponse.status)
        }
      } catch (err) {
        console.error('Santri fetch error:', err)
      }

      // Fetch berkas
      try {
        const berkasResponse = await fetch(`/api/admin/santri/${santriId}/berkas`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('Berkas response status:', berkasResponse.status)
        
        if (berkasResponse.ok) {
          const berkasData = await berkasResponse.json()
          console.log('Berkas data:', berkasData)
          
          if (berkasData.success && Array.isArray(berkasData.data)) {
            setBerkas(berkasData.data)
          } else {
            setBerkas([])
          }
        } else {
          try {
            const errorData = await berkasResponse.json()
            console.error('Berkas error:', errorData)
            setError(errorData.error || 'Gagal memuat data berkas')
          } catch (jsonError) {
            console.error('JSON parse error:', jsonError)
            setError('Gagal memuat data berkas (invalid response)')
          }
        }
      } catch (berkasError) {
        console.error('Berkas fetch error:', berkasError)
        setError(`Terjadi kesalahan: ${berkasError.message}`)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      e.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!selectedFile || !jenisBerkas) {
      alert('Mohon pilih file dan jenis berkas')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(10)

      // Upload file
      const uploadResult = await uploadFile(selectedFile, 'santri')
      setUploadProgress(70)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Gagal upload file')
      }

      // Save to database
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/santri/${santriId}/berkas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jenis_berkas: jenisBerkas,
          file_url: uploadResult.url
        })
      })

      setUploadProgress(100)

      if (response.ok) {
        alert('Berkas berhasil diupload!')
        setSelectedFile(null)
        setJenisBerkas('')
        document.getElementById('fileInput').value = ''
        fetchSantriAndBerkas()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan berkas')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error.message || 'Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (berkasId, jenisBerkas) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berkas ${jenisBerkas}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/santri/${santriId}/berkas/${berkasId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Berkas berhasil dihapus')
        fetchSantriAndBerkas()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal menghapus berkas')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Terjadi kesalahan sistem')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileExtension = (url) => {
    const parts = url.split('.')
    return parts[parts.length - 1].toUpperCase()
  }

  const getBerkasLabel = (jenisValue) => {
    const found = berkasList.find(b => b.value === jenisValue)
    return found ? found.label : jenisValue
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Dokumen Santri">
          <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Memuat data...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Dokumen Santri">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">Dokumen Santri</h1>
              <p className="text-muted mb-0">
                Kelola dokumen untuk {santri?.nama_lengkap || 'Santri'}
              </p>
            </div>
            <Link href="/admin/santri" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali
            </Link>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          <div className="row">
            {/* Upload Form */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
                <div className="card-header bg-primary text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-cloud-upload me-2"></i>
                    Upload Dokumen Baru
                  </h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleUpload}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Jenis Berkas *</label>
                      <select
                        className="form-select"
                        value={jenisBerkas}
                        onChange={(e) => setJenisBerkas(e.target.value)}
                        required
                        disabled={uploading}
                      >
                        <option value="">Pilih jenis berkas...</option>
                        {berkasList.map(b => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">File Dokumen *</label>
                      <input
                        type="file"
                        id="fileInput"
                        className="form-control"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        required
                        disabled={uploading}
                      />
                      <small className="text-muted">
                        Format: PDF, JPG, PNG (max 5MB)
                      </small>
                    </div>

                    {selectedFile && (
                      <div className="alert alert-info py-2">
                        <small>
                          <i className="bi bi-file-earmark me-1"></i>
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </small>
                      </div>
                    )}

                    {uploadProgress > 0 && (
                      <div className="mb-3">
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">Uploading... {uploadProgress}%</small>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={uploading || !selectedFile || !jenisBerkas}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-upload me-2"></i>
                          Upload Dokumen
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Berkas List */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                    Dokumen Tersimpan
                    <span className="badge bg-primary ms-2">{berkas.length}</span>
                  </h6>
                </div>
                <div className="card-body p-0">
                  {berkas.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-file-earmark-x fs-1 text-muted mb-3"></i>
                      <p className="text-muted">Belum ada dokumen tersimpan</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {berkas.map((item) => (
                        <div key={item.id} className="list-group-item">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center flex-grow-1">
                              <div className="bg-light rounded p-3 me-3">
                                <i className="bi bi-file-earmark-pdf fs-3 text-danger"></i>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-semibold">{getBerkasLabel(item.jenis_berkas)}</h6>
                                <div className="text-muted small">
                                  <i className="bi bi-calendar me-1"></i>
                                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="btn-group">
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary btn-sm"
                                title="Lihat Dokumen"
                              >
                                <i className="bi bi-eye"></i>
                              </a>
                              <a
                                href={item.file_url}
                                download
                                className="btn btn-outline-success btn-sm"
                                title="Download"
                              >
                                <i className="bi bi-download"></i>
                              </a>
                              <button
                                onClick={() => handleDelete(item.id, getBerkasLabel(item.jenis_berkas))}
                                className="btn btn-outline-danger btn-sm"
                                title="Hapus"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
