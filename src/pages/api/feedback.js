// src/pages/api/feedback.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = (req.headers.authorization || '').split(' ')[1] || ''
  supabase.auth.setAuth(token)

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  const { idea_card_id, action } = req.body
  const { error } = await supabase
    .from('feedback')
    .insert([{ user_id: user.id, idea_card_id, action }])

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ ok: true })
}
