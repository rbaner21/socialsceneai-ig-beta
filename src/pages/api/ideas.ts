/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  // Fetch today’s ideas
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('idea_cards')
    .select('id, prompt, caption, hashtags, scored_posts!inner(image_url)')
    .eq('user_id', user.id)
    .eq('issued_date', today)

  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch' })
  }

  const ideas = data.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    caption: r.caption,
    hashtags: r.hashtags,
    thumbnail: (r as any).image_url,
  }))

  return res.status(200).json({ ideas })
}
