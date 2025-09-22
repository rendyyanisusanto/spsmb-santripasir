'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'

export default function AdminLayout({ children, pageTitle = 'Dashboard' }) {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const menuItems = [
    {
      icon: 'bi-speedometer2',
      label: 'Dashboard',
      href: '/admin',
      roles: ['superadmin', 'admin', 'lembaga']
    },
    {
      icon: 'bi-people',
      label: 'Management Users',
      href: '/admin/users',
      roles: ['superadmin']
    },
    {
      icon: 'bi-file-text',
      label: 'Data Pendaftar',
      href: '/admin/pendaftar',
      roles: ['superadmin', 'admin', 'lembaga']
    },
    {
      icon: 'bi-bar-chart',
      label: 'Laporan',
      href: '/admin/reports',
      roles: ['superadmin', 'admin']
    },
    {
      icon: 'bi-gear',
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
      {/* Bootstrap 5 CSS */}
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" 
        rel="stylesheet" 
      />

      <div className="d-flex vh-100 overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        {sidebarVisible && (
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
            style={{ zIndex: 1040 }}
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <nav 
          className="text-white h-100 d-flex flex-column sidebar-nav"
        >
          {/* Sidebar Header */}
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="d-flex align-items-center">
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                style={{ 
                  width: '48px', 
                  height: '48px',
                  background: 'rgba(245, 241, 227, 0.9)',
                  color: '#1A4D2E'
                }}
              >
                <i className="bi bi-building fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold text-white">Admin Panel</h5>
                <small style={{ color: 'rgba(245, 241, 227, 0.8)' }}>SPMB Asy-Syadzili</small>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-grow-1 p-3">
            <ul className="nav nav-pills flex-column">
              <li className="nav-item mb-1">
                <small className="text-uppercase fw-bold px-3 py-2 d-block" 
                       style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 227, 0.6)' }}>
                  MENU UTAMA
                </small>
              </li>
              {visibleMenuItems.map((item) => (
                <li key={item.href} className="nav-item mb-1">
                  <Link
                    href={item.href}
                    className={`nav-link d-flex align-items-center rounded-3 px-3 py-2 ${
                      pathname === item.href 
                        ? 'active text-white' 
                        : 'text-light'
                    }`}
                    onClick={closeSidebar}
                    style={{
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                      backgroundColor: pathname === item.href 
                        ? 'rgba(245, 241, 227, 0.15)' 
                        : 'transparent',
                      border: pathname === item.href 
                        ? '1px solid rgba(245, 241, 227, 0.3)' 
                        : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (pathname !== item.href) {
                        e.target.style.backgroundColor = 'rgba(245, 241, 227, 0.08)'
                        e.target.style.borderColor = 'rgba(245, 241, 227, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pathname !== item.href) {
                        e.target.style.backgroundColor = 'transparent'
                        e.target.style.borderColor = 'transparent'
                      }
                    }}
                  >
                    <i className={`${item.icon} me-3`}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* User Info & Logout */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="rounded-3 p-3 mb-3" 
                 style={{ backgroundColor: 'rgba(245, 241, 227, 0.1)', border: '1px solid rgba(245, 241, 227, 0.2)' }}>
              <div className="d-flex align-items-center mb-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-2" 
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    background: 'rgba(245, 241, 227, 0.9)',
                    color: '#1A4D2E'
                  }}
                >
                  <span className="fw-bold" style={{ fontSize: '0.8rem' }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-grow-1">
                  <div className="text-white fw-semibold" style={{ fontSize: '0.9rem' }}>
                    {user?.full_name}
                  </div>
                  <div className="text-capitalize" style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 227, 0.7)' }}>
                    {user?.role}
                  </div>
                </div>
              </div>
              {user?.lembaga_akses && (
                <div 
                  className="rounded-2 px-2 py-1 text-center"
                  style={{ backgroundColor: 'rgba(245, 241, 227, 0.15)', border: '1px solid rgba(245, 241, 227, 0.3)' }}
                >
                  <small style={{ fontSize: '0.7rem', color: 'rgba(245, 241, 227, 0.8)' }}>
                    Lembaga: {user.lembaga_akses}
                  </small>
                </div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="btn w-100 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: 'rgba(220, 53, 69, 0.8)',
                color: 'white',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.8)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main 
          className="flex-grow-1 d-flex flex-column main-content"
        >
          {/* Top Header */}
          <header className="bg-white border-bottom sticky-top shadow-sm">
            <div className="d-flex align-items-center justify-content-between p-3">
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary d-lg-none me-3"
                  onClick={toggleSidebar}
                >
                  <i className="bi bi-list"></i>
                </button>
                
                <div>
                  <h4 className="mb-0 fw-bold text-dark">{pageTitle}</h4>
                  <small className="text-muted">
                    Selamat datang kembali, {user?.full_name}
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                  <div className="bg-success rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                  <small className="text-muted fw-medium">{user?.username}</small>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-grow-1 bg-light p-4" style={{ overflowY: 'auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Bootstrap 5 JS */}
      <script 
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
        async
      ></script>
      
      <style jsx>{`
        .start-n100 {
          left: -280px;
        }
        
        /* Responsive styles */
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }
          
          .sidebar-nav {
            position: fixed !important;
            left: ${sidebarVisible ? '0' : '-280px'} !important;
          }
        }
        
        @media (min-width: 992px) {
          .main-content {
            margin-left: 280px !important;
          }
          
          .sidebar-nav {
            position: fixed !important;
            left: 0 !important;
          }
        }
        
        .sidebar-nav {
          width: 280px;
          z-index: 1050;
          transition: all 0.3s ease;
          background: linear-gradient(180deg, #1A4D2E 0%, #2d6741 50%, #1A4D2E 100%);
          box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
        }
        
        @media (min-width: 992px) {
          .start-n100 {
            left: 0 !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  )
}