// src/pages/api/scrapeTrending.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import axios from 'axios'

// your exact niche list—keep it in sync with your frontend
const NICHES = [
  'Fitness','Beauty & Fashion','Food & Cooking','Travel',
  'Tech & Gadgets','DIY & Crafts','Parenting & Family','Gaming',
  'Comedy & Entertainment','Art & Illustration','Music & Performance',
  'Photography','Health & Wellness','Finance & Investing','Home Decor',
  'Pets & Animals','Education & Learning','Sports & Outdoor',
  'Automotive','Lifestyle & Inspiration',
]

export default async function handler(req, res) {
  try {
    const actorId = process.env.APIFY_ACTOR_ID
    const token   = process.env.APIFY_TOKEN
    if (!actorId || !token) throw new Error('Missing APIFY_ACTOR_ID or APIFY_TOKEN')

    for (const tag of NICHES) {
      // 1) Run the Instagram Scraper actor in “hashtag” mode
      const run = await axios.post(
        `https://api.apify.com/v2/acts/${actorId}/run-sync?token=${token}`,
        { searchMode: 'hashtag', searchQuery: tag, resultsLimit: 200 }
      )

      const items = run.data.items || []
      // 2) Upsert each result into your `trending_posts` table
      for (const item of items) {
        const { id, imageUrl, likes, comments, bookmarks, views, avgWatchTime } = item
        await supabaseAdmin
          .from('trending_posts')
          .upsert(
            {
              ig_post_id: id,
              image_url: imageUrl,
              metrics: { likes, comments, saves: bookmarks, views, avgWatchTime },
            },
            { onConflict: ['ig_post_id'] }
          )
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('🛑 /api/scrapeTrending error:', err)
    return res.status(500).json({ error: err.message })
  }
}
