'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState(null)
  const [lembagaList, setLembagaList] = useState([])
  const [loadingLembaga, setLoadingLembaga] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'admin',
    lembaga_id: '',
    is_active: true,
    changePassword: false,
    newPassword: '',
    confirmPassword: ''
  })

  // Fetch lembaga data
  useEffect(() => {
    fetchLembaga()
  }, [])

  const fetchLembaga = async () => {
    try {
      setLoadingLembaga(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/admin/lembaga', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLembagaList(data.data || [])
      } else {
        console.error('Gagal memuat data lembaga')
      }
    } catch (error) {
      console.error('Error fetching lembaga:', error)
    } finally {
      setLoadingLembaga(false)
    }
  }

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/admin/users/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserData(data.data)
          setFormData({
            username: data.data.username,
            email: data.data.email,
            full_name: data.data.full_name,
            role: data.data.role,
            lembaga_id: data.data.lembaga_id || '',
            is_active: data.data.is_active,
            changePassword: false,
            newPassword: '',
            confirmPassword: ''
          })
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'User tidak ditemukan')
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        setError('Terjadi kesalahan sistem')
      } finally {
        setLoadingUser(false)
      }
    }

    if (params.id) {
      fetchUser()
    }
  }, [params.id])

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

    if (!formData.full_name.trim()) {
      errors.push('Nama lengkap wajib diisi')
    }

    if (formData.role === 'lembaga' && !formData.lembaga_id) {
      errors.push('Lembaga harus dipilih untuk role lembaga')
    }

    if (formData.changePassword) {
      if (!formData.newPassword) {
        errors.push('Password baru wajib diisi')
      } else if (formData.newPassword.length < 6) {
        errors.push('Password minimal 6 karakter')
      }

      if (formData.newPassword !== formData.confirmPassword) {
        errors.push('Konfirmasi password tidak cocok')
      }
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
      
      const token = localStorage.getItem('token')
      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        lembaga_id: formData.role === 'lembaga' ? formData.lembaga_id : null,
        is_active: formData.is_active
      }

      if (formData.changePassword) {
        updateData.password = formData.newPassword
      }

      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        alert('User berhasil diupdate!')
        router.push('/admin/users')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal mengupdate user')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser) {
    return (
      <ProtectedRoute allowedRoles={['superadmin']}>
        <AdminLayout pageTitle="Loading...">
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary me-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Memuat data user...</span>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (error && !userData) {
    return (
      <ProtectedRoute allowedRoles={['superadmin']}>
        <AdminLayout pageTitle="Error">
          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
            <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
            <h6 className="text-danger mb-3">{error}</h6>
            <Link href="/admin/users" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali ke Users
            </Link>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      <AdminLayout pageTitle={`Edit User: ${userData?.full_name}`}>
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">Edit User: {userData?.full_name}</h1>
              <p className="text-muted mb-0">Update informasi user</p>
            </div>
            <Link href="/admin/users" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali ke Users
            </Link>
          </div>

          {/* Edit User Form */}
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

                    {/* Change Password */}
                    <div className="mb-4">
                      
                      
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="changePassword"
                          id="changePasswordSwitch"
                          checked={formData.changePassword}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="changePasswordSwitch">
                          Ubah Password
                        </label>
                      </div>

                      {formData.changePassword && (
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">
                              Password Baru <span className="text-danger">*</span>
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              className="form-control"
                              placeholder="Masukkan password baru"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              required={formData.changePassword}
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
                              placeholder="Ulangi password baru"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              required={formData.changePassword}
                            />
                          </div>
                        </div>
                      )}
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
                            Update User
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