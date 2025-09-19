import { getUserByCredential, verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { credential, password } = body

    console.log('Debug - Input credential:', credential)
    console.log('Debug - Input password:', password)

    // Test hash password baru
    const newHash = hashPassword(password)
    console.log('Debug - New hash for password:', newHash)

    // Cari user berdasarkan username atau email
    const { user, error } = await getUserByCredential(credential)
    
    console.log('Debug - Supabase error:', error)
    console.log('Debug - User found:', user ? 'YES' : 'NO')
    
    if (user) {
      console.log('Debug - User data:', {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password_hash_length: user.password_hash?.length
      })

      // Test password verification
      const passwordMatch = verifyPassword(password, user.password_hash)
      console.log('Debug - Password match:', passwordMatch)

      // Test dengan hash baru
      const newPasswordMatch = verifyPassword(password, newHash)
      console.log('Debug - New password match:', newPasswordMatch)
    }

    return Response.json({
      success: true,
      debug: {
        credential_received: credential,
        user_found: !!user,
        supabase_error: error?.message || null,
        password_hash_exists: !!user?.password_hash,
        new_hash: newHash
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return Response.json(
      { error: 'Debug error: ' + error.message },
      { status: 500 }
    )
  }
}