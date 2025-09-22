'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  const demoCredentials = []

  const quickLogin = (username, password) => {
    setCredential(username)
    setPassword(password)
  }
  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #1A4D2E 0%, #2d6741 30%, #1A4D2E 70%, #0f3a1f 100%)',
      fontFamily: '"Poppins", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(245, 241, 227, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(245, 241, 227, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }}></div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(1deg);
          }
          66% {
            transform: translateY(20px) rotate(-1deg);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .loadingSpinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(26, 77, 46, 0.3);
          border-radius: 50%;
          border-top-color: #1A4D2E;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        paddingTop: '40px'
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }} className="fadeIn">
          <div style={{
            marginBottom: '20px'
          }}>
            <Image 
              src="/1.png" 
              alt="Logo Asy-Syadzili" 
              width={120} 
              height={120} 
              style={{
                borderRadius: '0',
                border: 'none',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              priority
            />
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '600',
            margin: '0 0 10px 0',
            color: 'white',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Admin Login
          </h1>
          <p style={{
            fontSize: '1rem',
            margin: '0 0 30px 0',
            color: '#F5F1E3',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            SPMB Santri Pasir Asy-Syadzili
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '40px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '20px'
        }} className="fadeIn">

          {/* Error Alert */}
          {error && (
            <div style={{
              background: 'rgba(220, 53, 69, 0.9)',
              color: 'white',
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              borderLeft: '4px solid #dc3545'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '0.85rem',
                fontWeight: '500',
                marginBottom: '8px',
                color: 'white',
                display: 'block'
              }}>
                👤 Username atau Email
              </label>
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Masukkan username atau email"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontFamily: '"Poppins", sans-serif',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#F5F1E3'
                  e.target.style.background = 'rgba(255, 255, 255, 1)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 241, 227, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                fontSize: '0.85rem',
                fontWeight: '500',
                marginBottom: '8px',
                color: 'white',
                display: 'block'
              }}>
                🔒 Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 45px 12px 15px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontFamily: '"Poppins", sans-serif',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#333',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F5F1E3'
                    e.target.style.background = 'rgba(255, 255, 255, 1)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(245, 241, 227, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: '#666'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(245, 241, 227, 0.7)' : 'linear-gradient(135deg, #F5F1E3 0%, #e8e4d1 100%)',
                color: '#1A4D2E',
                border: 'none',
                padding: '15px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: '"Poppins", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                minWidth: '180px',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
                  e.target.style.background = 'linear-gradient(135deg, #e8e4d1 0%, #F5F1E3 100%)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = 'linear-gradient(135deg, #F5F1E3 0%, #e8e4d1 100%)'
                }
              }}
            >
              {loading && <span className="loadingSpinner"></span>}
              {loading ? 'Sedang Login...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <Link 
            href="/" 
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#F5F1E3'
              e.target.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'rgba(255, 255, 255, 0.8)'
              e.target.style.textDecoration = 'none'
            }}
          >
            ← Kembali ke Halaman Utama
          </Link>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px'
        }}>
          <small style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.8rem'
          }}>
            © 2024 SPMB Santri Pasir Asy-Syadzili. All rights reserved.
          </small>
        </div>

      </div>
    </div>
  )
}