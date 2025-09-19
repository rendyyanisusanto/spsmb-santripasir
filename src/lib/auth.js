import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from './supabase'

// Secret key untuk JWT (dalam production harus di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'

/**
 * Hash password menggunakan bcrypt
 */
export function hashPassword(password) {
  const saltRounds = 10
  return bcrypt.hashSync(password, saltRounds)
}

/**
 * Verifikasi password
 */
export function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword)
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    lembaga_akses: user.lembaga_akses,
    full_name: user.full_name
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h' // Token berlaku 24 jam
  })
}

/**
 * Verifikasi JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Middleware untuk autentikasi
 */
export async function authenticate(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Token tidak ditemukan', status: 401 }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return { error: 'Token tidak valid', status: 401 }
    }

    // Verifikasi user masih aktif di database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return { error: 'User tidak ditemukan atau tidak aktif', status: 401 }
    }

    return { user }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Gagal autentikasi', status: 500 }
  }
}

/**
 * Middleware untuk authorization berdasarkan role
 */
export function authorize(allowedRoles = []) {
  return async function(request, user) {
    if (!user) {
      return { error: 'User tidak terautentikasi', status: 401 }
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return { error: 'Tidak memiliki akses untuk resource ini', status: 403 }
    }

    return { authorized: true }
  }
}

/**
 * Check apakah user bisa mengakses data lembaga tertentu
 */
export function canAccessLembaga(user, lembaga) {
  // Superadmin dan admin bisa akses semua
  if (user.role === 'superadmin' || user.role === 'admin') {
    return true
  }
  
  // User lembaga hanya bisa akses lembaganya sendiri
  if (user.role === 'lembaga') {
    return user.lembaga_akses === lembaga
  }
  
  return false
}

/**
 * Get user dari database berdasarkan username atau email
 */
export async function getUserByCredential(credential) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${credential},email.eq.${credential}`)
    .eq('is_active', true)
    .single()

  if (error) {
    return { error }
  }

  return { user: data }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId) {
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update last login:', error)
  }
}