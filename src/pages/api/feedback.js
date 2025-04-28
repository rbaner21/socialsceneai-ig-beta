// src/pages/api/feedback.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  // Insert feedback
  const { idea_card_id, action } = req.body
  const { error: insertError } = await supabase
    .from('feedback')
    .insert([{ user_id: user.id, idea_card_id, action }])
  if (insertError) {
    return res.status(500).json({ error: insertError.message })
  }

  return res.status(200).json({ ok: true })
}
