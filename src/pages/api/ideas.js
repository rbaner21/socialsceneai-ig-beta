// src/pages/api/ideas.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  // 1) Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return res.status(401).json({ error: 'Not signed in' })

  // 2) Fetch today’s idea cards
  const today = new Date().toISOString().slice(0,10)
  const { data, error } = await supabase
    .from('idea_cards')
    .select('id,prompt,caption,hashtags,scored_posts!inner(image_url)')
    .eq('user_id', user.id)
    .eq('issued_date', today)

  if (error || !data) return res.status(500).json({ error: error?.message })

  const ideas = data.map(r => ({
    id: r.id,
    prompt: r.prompt,
    caption: r.caption,
    hashtags: r.hashtags,
    thumbnail: r.image_url
  }))

  res.status(200).json({ ideas })
}
