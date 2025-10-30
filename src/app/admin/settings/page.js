'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState(null)

  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    full_name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [systemForm, setSystemForm] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    maxFileSize: 5
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
        
        // Set profile form
        setProfileForm(prev => ({
          ...prev,
          username: data.data.user.username || '',
          email: data.data.user.email || '',
          full_name: data.data.user.full_name || ''
        }))

        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal memuat pengaturan')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setError('Konfirmasi password tidak sesuai')
      return
    }

    if (profileForm.newPassword && profileForm.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter')
      return
    }

    if (profileForm.newPassword && !profileForm.currentPassword) {
      setError('Password lama harus diisi untuk mengganti password')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settingType: 'profile',
          username: profileForm.username,
          email: profileForm.email,
          full_name: profileForm.full_name,
          currentPassword: profileForm.currentPassword || undefined,
          newPassword: profileForm.newPassword || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Profil berhasil diupdate')
        
        // Clear password fields
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        
        // Refresh settings
        fetchSettings()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal mengupdate profil')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setSaving(false)
    }
  }

  const handleSystemSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settingType: 'system',
          ...systemForm
        })
      })

      if (response.ok) {
        setSuccess('Pengaturan sistem berhasil diupdate')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal mengupdate pengaturan sistem')
      }
    } catch (error) {
      console.error('Failed to update system settings:', error)
      setError('Terjadi kesalahan sistem')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target
    setSystemForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
        <AdminLayout pageTitle="Pengaturan">
          <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Memuat pengaturan...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <AdminLayout pageTitle="Pengaturan">
        <div className="container-fluid">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">Pengaturan</h4>
              <p className="text-muted mb-0">Kelola profil dan pengaturan sistem</p>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

          <div className="row">
            {/* Profile Settings */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-primary text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-person-gear me-2"></i>
                    Profil Pengguna
                  </h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProfileSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Username *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={profileForm.username}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label fw-semibold">Nama Lengkap *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="full_name"
                          value={profileForm.full_name}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <hr className="my-4" />
                        <h6 className="fw-bold text-secondary mb-3">Ganti Password</h6>
                        <p className="text-muted small mb-3">Kosongkan jika tidak ingin mengganti password</p>
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Password Lama</label>
                        <input
                          type="password"
                          className="form-control"
                          name="currentPassword"
                          value={profileForm.currentPassword}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Password Baru</label>
                        <input
                          type="password"
                          className="form-control"
                          name="newPassword"
                          value={profileForm.newPassword}
                          onChange={handleProfileChange}
                          minLength="6"
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Konfirmasi Password Baru</label>
                        <input
                          type="password"
                          className="form-control"
                          name="confirmPassword"
                          value={profileForm.confirmPassword}
                          onChange={handleProfileChange}
                          minLength="6"
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check me-2"></i>
                            Simpan Profil
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* User Info & System Stats */}
            <div className="col-lg-4">
              {/* User Info */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-info-circle me-2"></i>
                    Informasi Akun
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <small className="text-muted">Role</small>
                    <div className="fw-bold text-capitalize">{settings?.user?.role}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Bergabung</small>
                    <div className="fw-bold">
                      {new Date(settings?.user?.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Login Terakhir</small>
                    <div className="fw-bold">
                      {settings?.user?.last_login 
                        ? new Date(settings?.user?.last_login).toLocaleDateString('id-ID')
                        : 'Belum pernah login'
                      }
                    </div>
                  </div>
                  <div>
                    <small className="text-muted">Status</small>
                    <div>
                      <span className={`badge ${settings?.user?.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {settings?.user?.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Stats for Superadmin */}
              {user?.role === 'superadmin' && settings?.systemStats && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-success text-white">
                    <h6 className="card-title mb-0 fw-bold">
                      <i className="bi bi-graph-up me-2"></i>
                      Statistik Sistem
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="h5 fw-bold text-primary mb-0">{settings.systemStats.totalPendaftar}</div>
                          <small className="text-muted">Pendaftar</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="h5 fw-bold text-success mb-0">{settings.systemStats.totalSantri}</div>
                          <small className="text-muted">Santri</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="h5 fw-bold text-info mb-0">{settings.systemStats.totalLembaga}</div>
                          <small className="text-muted">Lembaga</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="h5 fw-bold text-warning mb-0">{settings.systemStats.totalUsers}</div>
                          <small className="text-muted">Users</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Settings for Superadmin */}
          {user?.role === 'superadmin' && (
            <div className="row">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-warning text-dark">
                    <h6 className="card-title mb-0 fw-bold">
                      <i className="bi bi-gear me-2"></i>
                      Pengaturan Sistem (Superadmin)
                    </h6>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSystemSubmit}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="maintenanceMode"
                              id="maintenanceMode"
                              checked={systemForm.maintenanceMode}
                              onChange={handleSystemChange}
                            />
                            <label className="form-check-label fw-semibold" htmlFor="maintenanceMode">
                              Mode Maintenance
                            </label>
                            <div className="text-muted small">Menonaktifkan akses publik untuk maintenance</div>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="registrationOpen"
                              id="registrationOpen"
                              checked={systemForm.registrationOpen}
                              onChange={handleSystemChange}
                            />
                            <label className="form-check-label fw-semibold" htmlFor="registrationOpen">
                              Pendaftaran Terbuka
                            </label>
                            <div className="text-muted small">Mengizinkan pendaftaran santri baru</div>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Maksimal Ukuran File (MB)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="maxFileSize"
                            value={systemForm.maxFileSize}
                            onChange={handleSystemChange}
                            min="1"
                            max="50"
                          />
                          <div className="text-muted small">Ukuran maksimal file yang dapat diupload</div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-4">
                        <button
                          type="submit"
                          className="btn btn-warning"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-gear me-2"></i>
                              Simpan Pengaturan Sistem
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="col-lg-4">
                {settings?.recentActivities && (
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-secondary text-white">
                      <h6 className="card-title mb-0 fw-bold">
                        <i className="bi bi-clock-history me-2"></i>
                        Aktivitas Terbaru
                      </h6>
                    </div>
                    <div className="card-body p-0">
                      <div className="list-group list-group-flush">
                        {settings.recentActivities.length > 0 ? (
                          settings.recentActivities.map((activity, index) => (
                            <div key={activity.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-1 fw-bold">{activity.nama}</h6>
                                  <p className="mb-1 text-muted small">{activity.lembaga_pendidikan}</p>
                                  <small className="text-muted">
                                    {new Date(activity.created_at).toLocaleDateString('id-ID')}
                                  </small>
                                </div>
                                <span className="badge bg-primary">Pendaftar</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="list-group-item text-center text-muted">
                            Tidak ada aktivitas terbaru
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}