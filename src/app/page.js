'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import RegistrationForm from '@/components/RegistrationForm'
import Receipt from '@/components/Receipt'
import Link from 'next/link'

export default function Home() {
  const [registrationData, setRegistrationData] = useState(null)
  const { isAuthenticated, user } = useAuth()

  const handleRegistrationSuccess = (data) => {
    setRegistrationData(data)
  }

  const handleNewRegistration = () => {
    setRegistrationData(null)
  }

  return (
    <>
      {/* Admin Access Link */}
      {isAuthenticated ? (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>
            🏠 Dashboard Admin
          </Link>
        </div>
      ) : (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.9)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>
            🔐 Login Admin
          </Link>
        </div>
      )}

      {registrationData ? (
        <Receipt 
          registrationData={registrationData} 
          onNewRegistration={handleNewRegistration}
        />
      ) : (
        <RegistrationForm onSuccess={handleRegistrationSuccess} />
      )}
    </>
  )
}
