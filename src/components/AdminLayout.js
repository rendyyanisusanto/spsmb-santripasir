'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import styles from './AdminLayout.module.css'

export default function AdminLayout({ children, pageTitle = 'Dashboard' }) {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const menuItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      href: '/admin',
      roles: ['superadmin', 'admin', 'lembaga']
    },
    {
      icon: '👥',
      label: 'Management Users',
      href: '/admin/users',
      roles: ['superadmin']
    },
    {
      icon: '📝',
      label: 'Data Pendaftar',
      href: '/admin/pendaftar',
      roles: ['superadmin', 'admin', 'lembaga']
    },
    {
      icon: '📈',
      label: 'Laporan',
      href: '/admin/reports',
      roles: ['superadmin', 'admin']
    },
    {
      icon: '⚙️',
      label: 'Pengaturan',
      href: '/admin/settings',
      roles: ['superadmin', 'admin']
    }
  ]

  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  )

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const closeSidebar = () => {
    setSidebarVisible(false)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'lembaga']}>
      <div className={styles.adminLayout}>
        {/* Mobile Overlay */}
        <div 
          className={`${styles.mobileOverlay} ${sidebarVisible ? styles.visible : ''}`}
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarVisible ? styles.visible : ''}`}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Admin Panel</h1>
            <p className={styles.sidebarSubtitle}>SPMB Asy-Syadzili</p>
          </div>

          <nav className={styles.sidebarNav}>
            {visibleMenuItems.map((item) => (
              <div key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
                  onClick={closeSidebar}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.full_name}</p>
              <p className={styles.userRole}>{user?.role}</p>
              {user?.lembaga_akses && (
                <p className={styles.userRole}>Lembaga: {user.lembaga_akses}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
            >
              <span className={styles.navIcon}>🚪</span>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`${styles.mainContent} ${sidebarVisible ? '' : styles.fullWidth}`}>
          <div className={styles.topBar}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className={styles.menuToggle}
                onClick={toggleSidebar}
              >
                ☰
              </button>
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
            </div>
            <div className={styles.topBarActions}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                {user?.username}
              </span>
            </div>
          </div>

          <div className={styles.contentArea}>
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}