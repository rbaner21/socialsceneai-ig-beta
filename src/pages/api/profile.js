// src/pages/api/profile.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  const { data:{user}, error:authErr } = await supabase.auth.getUser()
  if(authErr||!user) return res.status(401).json({error:'Not signed in'})
  if(req.method==='GET') {
    const { data, error } = await supabase
      .from('users').select('instagram_handle,niche')
      .eq('id',user.id).single()
    if(error) return res.status(500).json({error:error.message})
    return res.status(200).json(data)
  }
  if(req.method==='POST') {
    const { instagram_handle,niche } = req.body
    const { error } = await supabase
      .from('users').update({instagram_handle,niche})
      .eq('id',user.id)
    if(error) return res.status(500).json({error:error.message})
    return res.status(200).json({ ok:true })
  }
  res.setHeader('Allow','GET,POST')
  res.status(405).json({ error:'Method not allowed' })
}
