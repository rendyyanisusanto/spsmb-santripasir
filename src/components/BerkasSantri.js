'use client'

import { useState, useEffect } from 'react'
import { uploadFile, validateFile, deleteFile } from '@/lib/fileUpload'

export default function BerkasSantri({ santriId, readonly = false }) {
  const [berkas, setBerkas] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newBerkas, setNewBerkas] = useState({
    jenis_berkas: '',
    file: null
  })

  const jenisberkasList = [
    'Kartu Keluarga',
    'Akta Kelahiran', 
    'Ijazah/SKHUN',
    'Foto 3x4',
    'Kartu Identitas',
    'Surat Keterangan Sehat',
    'Surat Pernyataan Orang Tua',
    'Lainnya'
  ]

  useEffect(() => {
    fetchBerkas()
  }, [santriId])

  const fetchBerkas = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/santri/${santriId}/berkas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBerkas(data.data)
      } else {
        console.error('Failed to fetch berkas')
      }
    } catch (error) {
      console.error('Failed to fetch berkas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setNewBerkas(prev => ({
      ...prev,
      file
    }))
  }

  const handleUpload = async () => {
    if (!newBerkas.jenis_berkas || !newBerkas.file) {
      alert('Pilih jenis berkas dan file yang akan diupload')
      return
    }

    try {
      setUploading(true)
      
      // Upload file
      const uploadResult = await uploadFile(newBerkas.file, 'santri')
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
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
          jenis_berkas: newBerkas.jenis_berkas,
          file_url: uploadResult.url
        })
      })

      if (response.ok) {
        alert('Berkas berhasil diupload!')
        setNewBerkas({ jenis_berkas: '', file: null })
        fetchBerkas() // Refresh list
        
        // Reset file input
        const fileInput = document.getElementById('berkas-file')
        if (fileInput) fileInput.value = ''
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan berkas')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (berkasId, fileName) => {
    if (!confirm(`Hapus berkas ${fileName}?`)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/santri/${santriId}/berkas/${berkasId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Berkas berhasil dihapus!')
        fetchBerkas() // Refresh list
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Gagal menghapus berkas'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const openFile = (url) => {
    window.open(url, '_blank')
  }

  const getFileIcon = (jenisBerkas) => {
    switch (jenisBerkas.toLowerCase()) {
      case 'foto 3x4':
      case 'foto':
        return 'bi-image'
      case 'ijazah/skhun':
      case 'ijazah':
      case 'skhun':
        return 'bi-award'
      case 'kartu keluarga':
      case 'kk':
        return 'bi-people'
      case 'akta kelahiran':
      case 'akta':
        return 'bi-card-text'
      default:
        return 'bi-file-earmark'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2">Memuat berkas...</p>
      </div>
    )
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-info text-white">
        <h6 className="card-title mb-0 fw-bold">
          <i className="bi bi-folder me-2"></i>
          Berkas Santri
        </h6>
      </div>
      <div className="card-body">
        {/* Upload Form - hanya tampil jika tidak readonly */}
        {!readonly && (
          <div className="mb-4 p-3 bg-light rounded">
            <h6 className="fw-bold mb-3">Upload Berkas Baru</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={newBerkas.jenis_berkas}
                  onChange={(e) => setNewBerkas(prev => ({ ...prev, jenis_berkas: e.target.value }))}
                >
                  <option value="">Pilih Jenis Berkas</option>
                  {jenisberkasList.map(jenis => (
                    <option key={jenis} value={jenis}>{jenis}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-5">
                <input
                  type="file"
                  className="form-control"
                  id="berkas-file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
              </div>
              <div className="col-md-3">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleUpload}
                  disabled={uploading || !newBerkas.jenis_berkas || !newBerkas.file}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Upload...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
            <small className="text-muted">
              Format yang didukung: JPG, PNG, PDF. Maksimal 5MB.
            </small>
          </div>
        )}

        {/* Daftar Berkas */}
        <div className="row g-3">
          {berkas.length === 0 ? (
            <div className="col-12">
              <div className="text-center py-4 text-muted">
                <i className="bi bi-folder2-open fs-1 mb-3"></i>
                <p>Belum ada berkas yang diupload</p>
              </div>
            </div>
          ) : (
            berkas.map((item) => (
              <div key={item.id} className="col-md-6 col-lg-4">
                <div className="card h-100 border">
                  <div className="card-body text-center">
                    <i className={`${getFileIcon(item.jenis_berkas)} fs-1 text-primary mb-3`}></i>
                    <h6 className="card-title">{item.jenis_berkas}</h6>
                    <p className="card-text text-muted small">
                      Diupload: {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <div className="btn-group" role="group">
                      <button
                        onClick={() => openFile(item.file_url)}
                        className="btn btn-outline-primary btn-sm"
                        title="Lihat File"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {!readonly && (
                        <button
                          onClick={() => handleDelete(item.id, item.jenis_berkas)}
                          className="btn btn-outline-danger btn-sm"
                          title="Hapus File"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}