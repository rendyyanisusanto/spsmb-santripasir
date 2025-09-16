'use client'

import { useState } from 'react'
import RegistrationForm from '@/components/RegistrationForm'
import Receipt from '@/components/Receipt'

export default function Home() {
  const [registrationData, setRegistrationData] = useState(null)

  const handleRegistrationSuccess = (data) => {
    setRegistrationData(data)
  }

  const handleNewRegistration = () => {
    setRegistrationData(null)
  }

  return (
    <>
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
