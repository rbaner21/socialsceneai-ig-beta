// src/pages/api/library.js
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

  const { data, error } = await supabaseAdmin
    .from('idea_cards')
    .select('id,prompt,caption,hashtags,issued_date,scored_posts!inner(image_url)')
    .eq('user_id', user.id)
    .order('issued_date', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const ideas = data.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    caption: r.caption,
    hashtags: r.hashtags,
    thumbnail: r.image_url,
    issued_date: r.issued_date,
  }))
  res.status(200).json({ ideas })
}
