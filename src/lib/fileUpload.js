import { supabase } from './supabase'

export const uploadFile = async (file, folder = 'santri') => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('berkas') // Bucket name
      .upload(filePath, file)

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('berkas')
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('berkas')
      .remove([filePath])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File terlalu besar. Maksimal ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Format file tidak didukung. Gunakan: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
    }
  }

  return { valid: true }
}