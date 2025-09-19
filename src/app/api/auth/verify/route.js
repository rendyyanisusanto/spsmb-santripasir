import { authenticate } from '@/lib/auth'

export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await authenticate(request)
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Return user data without sensitive info
    const { password_hash, ...userWithoutPassword } = authResult.user

    return Response.json({
      success: true,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return Response.json(
      { error: 'Token tidak valid' },
      { status: 401 }
    )
  }
}