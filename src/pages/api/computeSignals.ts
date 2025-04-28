// src/pages/api/computeSignals.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  // Fetch all raw trending posts
  const { data: posts, error: fetchError } = await supabase
    .from('trending_posts')
    .select('*')
  if (fetchError) return res.status(500).json({ error: fetchError.message })

  // Compute & upsert signals
  for (const p of posts) {
    const m = p.metrics as any
    const ageHrs = (Date.now() - new Date(p.fetched_at).getTime()) / 36e5
    const signals = {
      engVel: (m.likes + m.comments + m.saves) / Math.max(ageHrs, 1),
      engRate: (m.likes + m.comments + m.saves) / Math.max(m.views, 1),
      commentVel: m.comments / Math.max(ageHrs, 1),
      saveRate: m.saves / Math.max(m.views, 1),
      watchComp: (m.avgWatchTime || 0) / Math.max(m.watchTime || 30, 1),
    }
    const score = Object.values(signals).reduce((a, b) => a + b, 0)
    await supabase.from('scored_posts').upsert({
      trending_post_id: p.id,
      signals,
      score,
    })
  }

  return res.status(200).json({ ok: true })
}
