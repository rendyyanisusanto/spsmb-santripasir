'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './login.module.css'

export default function LoginPage() {
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(credential, password)
      
      if (result.success) {
        router.push('/admin')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    const demoCredentials = {
      superadmin: { credential: 'superadmin', password: 'admin123' },
      admin: { credential: 'admin', password: 'admin123' },
      smp: { credential: 'smp_admin', password: 'admin123' },
      sma: { credential: 'sma_admin', password: 'admin123' },
      smk: { credential: 'smk_admin', password: 'admin123' }
    }
    
    const demo = demoCredentials[role]
    setCredential(demo.credential)
    setPassword(demo.password)
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Admin Login</h1>
          <p className={styles.loginSubtitle}>SPMB Santri Pasir Asy-Syadzili</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Username atau Email</label>
            <input
              type="text"
              className={styles.formInput}
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder="Masukkan username atau email"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading && <span className={styles.loadingSpinner}></span>}
            {loading ? 'Sedang Login...' : 'Login'}
          </button>
        </form>

        <div className={styles.demoCredentials}>
          <div className={styles.demoTitle}>Demo Credentials:</div>
          <div className={styles.demoItem}>
            <strong>Superadmin:</strong> 
            <button 
              type="button" 
              onClick={() => fillDemo('superadmin')}
              style={{ marginLeft: '8px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              superadmin / admin123
            </button>
          </div>
          <div className={styles.demoItem}>
            <strong>Admin:</strong> 
            <button 
              type="button" 
              onClick={() => fillDemo('admin')}
              style={{ marginLeft: '8px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              admin / admin123
            </button>
          </div>
          <div className={styles.demoItem}>
            <strong>Lembaga SMP:</strong> 
            <button 
              type="button" 
              onClick={() => fillDemo('smp')}
              style={{ marginLeft: '8px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              smp_admin / admin123
            </button>
          </div>
          <div className={styles.demoItem}>
            <strong>Lembaga SMA:</strong> 
            <button 
              type="button" 
              onClick={() => fillDemo('sma')}
              style={{ marginLeft: '8px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              sma_admin / admin123
            </button>
          </div>
          <div className={styles.demoItem}>
            <strong>Lembaga SMK:</strong> 
            <button 
              type="button" 
              onClick={() => fillDemo('smk')}
              style={{ marginLeft: '8px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              smk_admin / admin123
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}