// src/pages/api/scrapeTrending.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import axios from 'axios'

// same niche list you use elsewhere
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
    const actorId = process.env.APIFY_ACTOR_ID      // should be "apify~instagram-scraper"
    const token   = process.env.APIFY_TOKEN
    if (!actorId || !token) throw new Error('Missing APIFY_ACTOR_ID or APIFY_TOKEN')

    for (const tag of NICHES) {
      // 1) Run the actor and pull its dataset items
      const run = await axios.post(
        `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`,
        { searchMode: 'hashtag', searchQuery: tag, resultsLimit: 200 },
        { headers: { 'Content-Type': 'application/json' } }
      )
      // run.data **is** the array of items in the dataset
      const items = Array.isArray(run.data) ? run.data : []

      // 2) Upsert each scraped post into trending_posts
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
