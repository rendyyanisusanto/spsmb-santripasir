import { supabase } from './supabase'

// Function to check if bucket exists and test upload
export const debugStorage = async () => {
  try {
    // 1. List all buckets
    console.log('1. Checking available buckets...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError)
      return { success: false, error: bucketError.message }
    }
    
    console.log('Available buckets:', buckets.map(b => b.name))
    
    // 2. Check if 'berkas' bucket exists
    const berkasBucket = buckets.find(b => b.name === 'berkas')
    if (!berkasBucket) {
      console.error('Bucket "berkas" not found!')
      return { 
        success: false, 
        error: 'Bucket "berkas" not found. Available buckets: ' + buckets.map(b => b.name).join(', ') 
      }
    }
    
    console.log('2. Bucket "berkas" found:', berkasBucket)
    
    // 3. Test creating a test file
    console.log('3. Testing file upload...')
    const testFile = new Blob(['test content'], { type: 'text/plain' })
    const testFileName = `test/debug_${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('berkas')
      .upload(testFileName, testFile)
    
    if (uploadError) {
      console.error('Upload test failed:', uploadError)
      return { 
        success: false, 
        error: 'Upload test failed: ' + uploadError.message 
      }
    }
    
    console.log('3. Upload test successful:', uploadData)
    
    // 4. Test getting public URL
    const { data: { publicUrl } } = supabase.storage
      .from('berkas')
      .getPublicUrl(testFileName)
    
    console.log('4. Public URL:', publicUrl)
    
    // 5. Clean up - delete test file
    const { error: deleteError } = await supabase.storage
      .from('berkas')
      .remove([testFileName])
    
    if (deleteError) {
      console.warn('Could not delete test file:', deleteError)
    } else {
      console.log('5. Test file cleaned up')
    }
    
    return { 
      success: true, 
      message: 'Storage is working correctly',
      bucket: berkasBucket,
      testUrl: publicUrl
    }
    
  } catch (error) {
    console.error('Storage debug error:', error)
    return { success: false, error: error.message }
  }
}

// Function to list files in berkas bucket
export const listBerkasFiles = async (folder = '') => {
  try {
    const { data, error } = await supabase.storage
      .from('berkas')
      .list(folder)
    
    if (error) {
      throw error
    }
    
    return { success: true, files: data }
  } catch (error) {
    console.error('List files error:', error)
    return { success: false, error: error.message }
  }
}