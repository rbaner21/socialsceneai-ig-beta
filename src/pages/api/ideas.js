// src/pages/api/ideas.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  // 1) read Bearer token
  const token = (req.headers.authorization || '').split(' ')[1] || ''

  // 2) authenticate
  const {
    data: { user },
    error: userErr,
  } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  // 3) load today’s cards
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabaseAdmin
    .from('idea_cards')
    .select('id,prompt,caption,hashtags,scored_posts!inner(image_url)')
    .eq('user_id', user.id)
    .eq('issued_date', today)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // 4) map & return
  const ideas = data.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    caption: r.caption,
    hashtags: r.hashtags,
    thumbnail: r.image_url,
  }))
  res.status(200).json({ ideas })
}
