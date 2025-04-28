// src/pages/api/feedback.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = (req.headers.authorization || '').split(' ')[1] || ''
  const {
    data: { user },
    error: userErr,
  } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  const { idea_card_id, action } = req.body
  const { error } = await supabaseAdmin
    .from('feedback')
    .insert([{ user_id: user.id, idea_card_id, action }])

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  res.status(200).json({ ok: true })
}
