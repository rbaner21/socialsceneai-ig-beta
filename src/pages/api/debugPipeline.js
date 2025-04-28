// src/pages/api/debugPipeline.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  try {
    const [{ data: trending }, { data: scored }, { data: cards }] = await Promise.all([
      supabaseAdmin.from('trending_posts').select('id'),
      supabaseAdmin.from('scored_posts').select('id'),
      supabaseAdmin.from('idea_cards').select('id'),
    ])

    return res.status(200).json({
      trending_posts:  Array.isArray(trending) ? trending.length : 0,
      scored_posts:    Array.isArray(scored)   ? scored.length   : 0,
      idea_cards:     Array.isArray(cards)    ? cards.length    : 0,
    })
  } catch (err) {
    console.error('❌ debugPipeline error', err)
    res.status(500).json({ error: err.message })
  }
}
