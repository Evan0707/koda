
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
 console.error('Missing Supabase credentials')
 process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadLogo() {
 try {
  const fileContent = readFileSync('assets/logo.png')

  // Upload to 'avatars' bucket since it exists
  const bucketName = 'avatars'
  const filePath = 'system/logo.png'

  const { data, error } = await supabase.storage
   .from(bucketName)
   .upload(filePath, fileContent, {
    contentType: 'image/png',
    upsert: true
   })

  if (error) {
   console.error('Upload error:', error)
   return
  }

  const { data: { publicUrl } } = supabase.storage
   .from(bucketName)
   .getPublicUrl(filePath)

  console.log('Logo uploaded successfully!')
  console.log('Public URL:', publicUrl)

 } catch (err) {
  console.error('Error:', err)
 }
}

uploadLogo()
