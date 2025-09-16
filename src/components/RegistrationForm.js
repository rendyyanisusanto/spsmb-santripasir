'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './RegistrationForm.module.css'

export default function RegistrationForm({ onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1) // 1: Info, 2: Form
  const [formData, setFormData] = useState({
    nama: '',
    jenis_kelamin: '',
    no_hp: '',
    nama_wali: '',
    alamat: '',
    lembaga_pendidikan: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Terjadi kesalahan')
      }

      // Call onSuccess callback with registration data
      onSuccess(result.data)
      
      // Reset form
      setFormData({
        nama: '',
        jenis_kelamin: '',
        no_hp: '',
        nama_wali: '',
        alamat: '',
        lembaga_pendidikan: ''
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainWrapper}>
        <div className={styles.greenPanel}>
          {/* Header - Always Visible */}
          <div className={styles.header}>
            <h1 className={styles.mainTitle}>Seleksi Penerimaan Santri dan Murid Baru (SPSMB) Asy-Syadzili</h1>
            <div className={styles.logoContainer}>
              <Image 
                src="/1.png" 
                alt="Logo Asy-Syadzili" 
                width={180} 
                height={180} 
                className={styles.logo} 
                priority
              />
            </div>
          </div>

          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${currentStep === 1 ? styles.activeStep : styles.completedStep}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Petunjuk</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep === 2 ? styles.activeStep : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Pendaftaran</span>
            </div>
          </div>

          {/* Step 1: Information */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>Tata Cara Pendaftaran :</h3>
                <ol className={styles.infoList}>
                  <li>Isi form pendaftaran dengan benar</li>
                  <li>Pastikan nomor WA yang bisa di hubungi</li>
                  <li>Setelah semua benar silahkan klik daftar</li>
                  <li>Admin akan menghubungi nomor yang terdaftar untuk data lanjutan</li>
                  <li>Apabila terkendala silahkan hubungi admin melalui live chat</li>
                </ol>
                
                <div className={styles.stepActions}>
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className={styles.nextButton}
                  >
                    Mulai Pendaftaran →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.formSection}>
                <h3 className={styles.formTitle}>Form Pendaftaran</h3>

                {error && (
                  <div className={styles.error}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="nama" className={styles.label}>
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        required
                        className={styles.input}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="jenis_kelamin" className={styles.label}>
                        Jenis Kelamin
                      </label>
                      <select
                        id="jenis_kelamin"
                        name="jenis_kelamin"
                        value={formData.jenis_kelamin}
                        onChange={handleChange}
                        required
                        className={styles.select}
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="Pria">Pria</option>
                        <option value="Wanita">Wanita</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="no_hp" className={styles.label}>
                        No. WhatsApp <span className={styles.highlight}>*gunakan nomor ortu jika ada</span>
                      </label>
                      <input
                        type="tel"
                        id="no_hp"
                        name="no_hp"
                        value={formData.no_hp}
                        onChange={handleChange}
                        required
                        className={styles.input}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="nama_wali" className={styles.label}>
                        Nama Orang Tua/Wali
                      </label>
                      <input
                        type="text"
                        id="nama_wali"
                        name="nama_wali"
                        value={formData.nama_wali}
                        onChange={handleChange}
                        required
                        className={styles.input}
                        placeholder="Nama Ayah/Ibu"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="alamat" className={styles.label}>
                      Alamat Lengkap
                    </label>
                    <textarea
                      id="alamat"
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleChange}
                      required
                      className={styles.textarea}
                      placeholder="Alamat lengkap dengan RT/RW, Kelurahan, Kecamatan, Kota"
                      rows="3"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="lembaga_pendidikan" className={styles.label}>
                      Jenjang Pendidikan
                    </label>
                    <select
                      id="lembaga_pendidikan"
                      name="lembaga_pendidikan"
                      value={formData.lembaga_pendidikan}
                      onChange={handleChange}
                      required
                      className={styles.select}
                    >
                      <option value="">Pilih jenjang pendidikan</option>
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                      <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                      <option value="Non Formal">Non Formal</option>
                    </select>
                  </div>

                  <div className={styles.stepActions}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className={styles.backButton}
                    >
                      ← Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={styles.submitButton}
                    >
                      {isLoading ? 'Sedang memproses...' : 'Daftar Sekarang'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}