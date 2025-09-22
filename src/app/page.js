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
