'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

export default function CreateUserPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lembagaList, setLembagaList] = useState([])
  const [loadingLembaga, setLoadingLembaga] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'admin',
    lembaga_id: '',
    is_active: true
  })

  // Fetch data lembaga
  useEffect(() => {
    fetchLembaga()
  }, [])

  const fetchLembaga = async () => {
    try {
      setLoadingLembaga(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('Token tidak ditemukan di localStorage')
        return
      }
      
      const response = await fetch('/api/admin/lembaga', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLembagaList(data.data || [])
      } else {
        const errorData = await response.json()
        console.error('Gagal memuat data lembaga:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching lembaga:', error)
    } finally {
      setLoadingLembaga(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    const errors = []

    if (!formData.username.trim()) {
      errors.push('Username wajib diisi')
    } else if (formData.username.length < 3) {
      errors.push('Username minimal 3 karakter')
    }

    if (!formData.email.trim()) {
      errors.push('Email wajib diisi')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Format email tidak valid')
    }

    if (!formData.password) {
      errors.push('Password wajib diisi')
    } else if (formData.password.length < 6) {
      errors.push('Password minimal 6 karakter')
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Konfirmasi password tidak cocok')
    }

    if (!formData.full_name.trim()) {
      errors.push('Nama lengkap wajib diisi')
    }

    if (formData.role === 'lembaga' && !formData.lembaga_id) {
      errors.push('Lembaga harus dipilih untuk role lembaga')
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        role: formData.role,
        lembaga_id: formData.role === 'lembaga' ? formData.lembaga_id : null,
        is_active: formData.is_active
      }
      
      console.log('Payload yang dikirim:', payload)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert('User berhasil dibuat!')
        router.push('/admin/users')
      } else {
        const errorData = await response.json()
        console.error('API Error:', response.status, errorData)
        setError(errorData.error || `Gagal membuat user (Status: ${response.status})`)
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      <AdminLayout pageTitle="Tambah User Baru">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">Tambah User Baru</h1>
              <p className="text-muted mb-0">Buat akun user baru untuk sistem</p>
            </div>
            <Link href="/admin/users" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali ke Users
            </Link>
          </div>

          {/* Create User Form */}
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="alert alert-danger d-flex align-items-center mb-4">
                        <i className="bi bi-exclamation-triangle me-3"></i>
                        <div>{error}</div>
                      </div>
                    )}

                    {/* Basic Information */}
                    <div className="mb-4">
                    
                      
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Username <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="username"
                            className="form-control"
                            placeholder="Masukkan username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            minLength={3}
                          />
                          <div className="form-text">
                            Minimal 3 karakter, hanya huruf, angka, dan underscore
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Masukkan email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="form-label fw-semibold">
                          Nama Lengkap <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          className="form-control"
                          placeholder="Masukkan nama lengkap"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                      
                      
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Password <span className="text-danger">*</span>
                          </label>
                          <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="Masukkan password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            minLength={6}
                          />
                          <div className="form-text">
                            Minimal 6 karakter
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Konfirmasi Password <span className="text-danger">*</span>
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            className="form-control"
                            placeholder="Ulangi password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role & Access */}
                    <div className="mb-4">
                      
                      
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Role <span className="text-danger">*</span>
                          </label>
                          <select
                            name="role"
                            className="form-select"
                            value={formData.role}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="admin">Admin</option>
                            <option value="lembaga">Lembaga</option>
                            {user?.role === 'superadmin' && (
                              <option value="superadmin">Super Admin</option>
                            )}
                          </select>
                          <div className="form-text">
                            Pilih role sesuai dengan tanggung jawab user
                          </div>
                        </div>

                        {formData.role === 'lembaga' && (
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">
                              Lembaga Akses <span className="text-danger">*</span>
                            </label>
                            {loadingLembaga ? (
                              <select className="form-control" disabled>
                                <option>Loading lembaga...</option>
                              </select>
                            ) : (
                              <select
                                name="lembaga_id"
                                className="form-select"
                                value={formData.lembaga_id}
                                onChange={handleInputChange}
                                required={formData.role === 'lembaga'}
                              >
                                <option value="">Pilih Lembaga</option>
                                {lembagaList.map((lembaga) => (
                                  <option key={lembaga.id} value={lembaga.id}>
                                    {lembaga.nama} {lembaga.no_hp && `(${lembaga.no_hp})`}
                                  </option>
                                ))}
                              </select>
                            )}
                            <div className="form-text">
                              User hanya bisa akses data dari lembaga ini
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                      
                      
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_active"
                          id="isActiveSwitch"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="isActiveSwitch">
                          User Aktif
                        </label>
                        <div className="form-text">
                          User nonaktif tidak dapat login ke sistem
                        </div>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="d-flex gap-3 pt-3 border-top">
                      <button
                        type="button"
                        onClick={() => router.push('/admin/users')}
                        className="btn btn-outline-secondary"
                        disabled={loading}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Simpan User
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}