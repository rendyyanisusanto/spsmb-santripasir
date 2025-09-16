'use client'

import { useRef } from 'react'
import styles from './Receipt.module.css'

export default function Receipt({ registrationData, onNewRegistration }) {
  const receiptRef = useRef()

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML
    const originalContent = document.body.innerHTML
    
    document.body.innerHTML = printContent
    window.print()
    document.body.innerHTML = originalContent
    
    // Reload the page to restore React functionality
    window.location.reload()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.receiptWrapper} ref={receiptRef}>
        <div className={styles.receipt}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>PONDOK PESANTREN ASY-SYADZILI</h1>
            <h2 className={styles.subtitle}>BUKTI PENDAFTARAN SANTRI BARU</h2>
            <div className={styles.divider}></div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.registrationId}>
              <strong>ID Pendaftaran: {String(registrationData.id).slice(0, 8).toUpperCase()}</strong>
            </div>

            <div className={styles.dataSection}>
              <h3 className={styles.sectionTitle}>Data Pendaftar</h3>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Nama Lengkap:</span>
                <span className={styles.value}>{registrationData.nama}</span>
              </div>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Jenis Kelamin:</span>
                <span className={styles.value}>{registrationData.jenis_kelamin}</span>
              </div>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Nomor HP/WA:</span>
                <span className={styles.value}>{registrationData.no_hp}</span>
              </div>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Nama Wali:</span>
                <span className={styles.value}>{registrationData.nama_wali}</span>
              </div>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Alamat:</span>
                <span className={styles.value}>{registrationData.alamat}</span>
              </div>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Pendidikan:</span>
                <span className={styles.value}>{registrationData.lembaga_pendidikan}</span>
              </div>
              
              <div className={styles.dataRow}>
                <span className={styles.label}>Tanggal Daftar:</span>
                <span className={styles.value}>{formatDate(registrationData.created_at)}</span>
              </div>
            </div>

            <div className={styles.notice}>
              <h3 className={styles.noticeTitle}>📋 Informasi Penting</h3>
              <ul className={styles.noticeList}>
                <li>Simpan bukti pendaftaran ini dengan baik</li>
                <li>Anda akan dihubungi melalui WhatsApp untuk informasi selanjutnya</li>
                <li>Pastikan nomor HP/WhatsApp dapat dihubungi</li>
                <li>Untuk informasi lebih lanjut, hubungi panitia PPDB</li>
              </ul>
            </div>

            <div className={styles.footer}>
              <p>Terima kasih telah mendaftar di Pondok Pesantren Asy-Syadzili</p>
              <p>Admin akan segera menghubungi Anda untuk informasi selanjutnya</p>
              <p className={styles.footerDate}>
                Dicetak pada: {new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button 
          onClick={handlePrint}
          className={styles.printButton}
        >
          🖨️ Cetak Struk
        </button>
        
        <button 
          onClick={onNewRegistration}
          className={styles.newRegistrationButton}
        >
          ➕ Pendaftaran Baru
        </button>
      </div>
    </div>
  )
}