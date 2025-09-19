import { authenticate, authorize } from '@/lib/auth'

/**
 * Higher-order function untuk membuat middleware authentication dan authorization
 * 
 * @param {Array} allowedRoles - Array of roles that are allowed to access the endpoint
 * @param {Function} handler - The actual API handler function
 * @returns {Function} - Wrapped handler with auth middleware
 */
export function withAuth(allowedRoles = []) {
  return function(handler) {
    return async function(request, context) {
      try {
        // Authenticate user
        const authResult = await authenticate(request)
        if (authResult.error) {
          return Response.json({ error: authResult.error }, { status: authResult.status })
        }

        // Authorize if roles are specified
        if (allowedRoles.length > 0) {
          const authzResult = await authorize(allowedRoles)(request, authResult.user)
          if (authzResult.error) {
            return Response.json({ error: authzResult.error }, { status: authzResult.status })
          }
        }

        // Add user to request context
        const enhancedContext = {
          ...context,
          user: authResult.user
        }

        // Call the actual handler
        return await handler(request, enhancedContext)

      } catch (error) {
        console.error('Auth middleware error:', error)
        return Response.json(
          { error: 'Terjadi kesalahan autentikasi' },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * Middleware untuk error handling
 */
export function withErrorHandler(handler) {
  return async function(request, context) {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)
      
      // Return user-friendly error messages
      if (error.name === 'ValidationError') {
        return Response.json(
          { error: 'Data tidak valid', details: error.message },
          { status: 400 }
        )
      }
      
      if (error.name === 'NotFoundError') {
        return Response.json(
          { error: 'Data tidak ditemukan' },
          { status: 404 }
        )
      }
      
      return Response.json(
        { error: 'Terjadi kesalahan server' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware untuk CORS
 */
export function withCORS(handler) {
  return async function(request, context) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = await handler(request, context)
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  }
}

/**
 * Combine multiple middlewares
 */
export function withMiddlewares(...middlewares) {
  return function(handler) {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc)
    }, handler)
  }
}

// Helper untuk validasi input
export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Data tidak ditemukan') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Validator untuk input pendaftar
 */
export function validatePendaftarInput(data) {
  const { nama, jenis_kelamin, no_hp, nama_wali, alamat, lembaga_pendidikan } = data
  
  if (!nama || !jenis_kelamin || !no_hp || !nama_wali || !alamat || !lembaga_pendidikan) {
    throw new ValidationError('Semua field harus diisi')
  }
  
  const validLembaga = ['SD', 'SMP', 'SMA', 'SMK', 'Non Formal']
  if (!validLembaga.includes(lembaga_pendidikan)) {
    throw new ValidationError('Lembaga pendidikan tidak valid')
  }
  
  const validJenisKelamin = ['Pria', 'Wanita']
  if (!validJenisKelamin.includes(jenis_kelamin)) {
    throw new ValidationError('Jenis kelamin tidak valid')
  }
  
  const phoneRegex = /^[0-9]{10,15}$/
  if (!phoneRegex.test(no_hp.replace(/[^\d]/g, ''))) {
    throw new ValidationError('Nomor HP tidak valid')
  }
  
  return true
}

/**
 * Validator untuk input user
 */
export function validateUserInput(data, isUpdate = false) {
  const { username, email, password, full_name, role, lembaga_akses } = data
  
  if (!username || !email || !full_name || !role) {
    throw new ValidationError('Field wajib harus diisi')
  }
  
  if (!isUpdate && !password) {
    throw new ValidationError('Password harus diisi')
  }
  
  const validRoles = ['superadmin', 'admin', 'lembaga']
  if (!validRoles.includes(role)) {
    throw new ValidationError('Role tidak valid')
  }
  
  if (role === 'lembaga') {
    const validLembaga = ['SD', 'SMP', 'SMA', 'SMK', 'Non Formal']
    if (!lembaga_akses || !validLembaga.includes(lembaga_akses)) {
      throw new ValidationError('Lembaga akses harus diisi untuk role lembaga')
    }
  }
  
  return true
}