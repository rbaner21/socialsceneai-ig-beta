// src/pages/api/scrapeTrending.js
import axios from 'axios'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  // List of niches
  const niches = [
    'Fitness','Beauty & Fashion','Food & Cooking','Travel','Tech & Gadgets',
    'DIY & Crafts','Parenting & Family','Gaming','Comedy & Entertainment',
    'Art & Illustration','Music & Performance','Photography','Health & Wellness',
    'Finance & Investing','Home Decor','Pets & Animals','Education & Learning',
    'Sports & Outdoor','Automotive','Lifestyle & Inspiration'
  ]

  try {
    for (const tag of niches) {
      // 1) Call Apify actor
      const { data } = await axios.post(
        `https://api.apify.com/v2/acts/${process.env.APIFY_ACTOR_ID}/run-sync?token=${process.env.APIFY_TOKEN}`,
        {
          searchMode: 'hashtag',
          searchQuery: tag,
          resultsLimit: 200,
        }
      )
      // 2) Upsert into Supabase
      for (const item of data.items) {
        await supabase.from('trending_posts').upsert({
          ig_post_id: item.id,
          image_url: item.imageUrl,
          metrics: {
            likes: item.likes,
            comments: item.comments,
            saves: item.bookmarks,
            views: item.views,
            avgWatchTime: item.avgWatchTime,
          },
          fetched_at: new Date().toISOString(),
        })
      }
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}
