// src/pages/api/ideas.js
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

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabaseAdmin
    .from('idea_cards')
    .select('id,prompt,caption,hashtags,scored_posts!inner(image_url)')
    .eq('user_id', user.id)
    .eq('issued_date', today)

  if (error) {
    console.error('🛑 /api/ideas error:', error)
    return res.status(500).json({ error: error.message })
  }

  const ideas = data.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    caption: r.caption,
    hashtags: r.hashtags,
    thumbnail: r.image_url,
  }))
  return res.status(200).json({ ideas })
}
