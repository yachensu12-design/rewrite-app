import webPush from 'web-push'
import { subscriptions } from './subscribe.js'

// VAPID keys - 需要生成新的
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:your@email.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({ error: 'VAPID keys not configured' })
    }

    const payload = JSON.stringify({
      title: '覆写',
      body: '今日练习已准备好',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-exercise'
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =
      webPush.sendNotification(sub, payload).catch(err => {
          console.error('Push failed:', err)
          return null
        })
      )
    )

    return res.status(200).json({
      success: true,
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
