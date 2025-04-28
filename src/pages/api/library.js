// src/pages/api/library.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  // 1) Authenticate
  const token = (req.headers.authorization || '').split(' ')[1] || ''
  const {
    data: { user },
    error: userErr,
  } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  // 2) Fetch all saved cards, with nested image_url
  const { data, error } = await supabaseAdmin
    .from('idea_cards')
    .select(`
      id,
      prompt,
      caption,
      hashtags,
      issued_date,
      scored_posts (
        trending_posts (
          image_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('issued_date', { ascending: false })

  if (error) {
    console.error('🛑 /api/library error:', error)
    return res.status(500).json({ error: error.message })
  }

  // 3) Map into the shape the client expects
  const ideas = data.map((r) => {
    const sp = r.scored_posts?.[0]
    const tp = sp?.trending_posts?.[0]
    return {
      id: r.id,
      prompt: r.prompt,
      caption: r.caption,
      hashtags: r.hashtags,
      thumbnail: tp?.image_url || '',
      issued_date: r.issued_date,
    }
  })

  return res.status(200).json({ ideas })
}
