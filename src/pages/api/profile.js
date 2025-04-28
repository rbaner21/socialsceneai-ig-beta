// src/pages/api/profile.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Read body
  const { id, instagram_handle, niche } = req.body

  // Insert the user record
  const { error } = await supabase
    .from('users')
    .insert([{ id, instagram_handle, niche }])

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}
