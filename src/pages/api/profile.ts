import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, instagram_handle, niche } = req.body
  const { error } = await supabase
    .from('users')
    .insert([{ id, instagram_handle, niche }])
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ ok: true })
}
