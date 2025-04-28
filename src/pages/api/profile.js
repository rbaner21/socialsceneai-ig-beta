// src/pages/api/profile.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').split(' ')[1] || ''
  const {
    data: { user },
    error: userErr,
  } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('instagram_handle,niche')
      .eq('id', user.id)
      .single()
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { instagram_handle, niche } = req.body
    const { error } = await supabaseAdmin
      .from('users')
      .update({ instagram_handle, niche })
      .eq('id', user.id)
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).json({ error: 'Method not allowed' })
}
