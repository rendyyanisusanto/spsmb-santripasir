import { hashPassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, username, password, email, role, lembaga_akses, full_name } = body

    if (action === 'create_user') {
      // Hash password
      const hashedPassword = hashPassword(password)
      
      console.log('Creating user with hashed password length:', hashedPassword.length)

      // Insert user ke database
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username,
          email,
          password_hash: hashedPassword,
          role: role || 'lembaga',
          lembaga_akses,
          full_name,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        return Response.json({ error: error.message }, { status: 400 })
      }

      return Response.json({ 
        success: true, 
        message: 'User berhasil dibuat',
        user: data[0] 
      })
    }

    if (action === 'reset_admin') {
      // Reset user admin dengan password baru
      const hashedPassword = hashPassword('admin123')
      
      const { data, error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('username', 'admin')
        .select()

      if (error) {
        return Response.json({ error: error.message }, { status: 400 })
      }

      return Response.json({ 
        success: true, 
        message: 'Password admin berhasil direset',
        user: data[0] 
      })
    }

    return Response.json({ error: 'Action tidak valid' }, { status: 400 })

  } catch (error) {
    console.error('Setup error:', error)
    return Response.json(
      { error: 'Setup error: ' + error.message },
      { status: 500 }
    )
  }
}