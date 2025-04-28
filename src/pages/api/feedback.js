// src/pages/api/feedback.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  if(req.method!=='POST') {
    res.setHeader('Allow','POST')
    return res.status(405).json({ error:'Method not allowed' })
  }
  const { data:{user}, error:authErr } = await supabase.auth.getUser()
  if(authErr||!user) return res.status(401).json({error:'Not signed in'})
  const { idea_card_id, action } = req.body
  const { error } = await supabase
    .from('feedback')
    .insert([{user_id:user.id,idea_card_id,action}])
  if(error) return res.status(500).json({ error:error.message })
  res.status(200).json({ ok:true })
}
