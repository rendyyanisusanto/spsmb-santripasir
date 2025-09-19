import { getUserByCredential, verifyPassword, generateToken, updateLastLogin } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { credential, password } = body

    console.log('Login attempt for:', credential)

    // Validasi input
    if (!credential || !password) {
      return Response.json(
        { error: 'Username/email dan password harus diisi' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan username atau email
    const { user, error } = await getUserByCredential(credential)
    
    console.log('User lookup result:', { 
      found: !!user, 
      error: error?.message,
      has_password_hash: !!user?.password_hash
    })
    
    if (error || !user) {
      console.log('User not found:', { credential, error: error?.message })
      return Response.json(
        { error: 'Username/email atau password salah' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const passwordValid = verifyPassword(password, user.password_hash)
    console.log('Password verification:', passwordValid)
    
    if (!passwordValid) {
      console.log('Password mismatch for user:', user.username)
      return Response.json(
        { error: 'Username/email atau password salah' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken(user)
    console.log('Login successful for:', user.username)

    // Update last login
    await updateLastLogin(user.id)

    // Return response tanpa password hash
    const { password_hash, ...userWithoutPassword } = user

    return Response.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '24h'
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}