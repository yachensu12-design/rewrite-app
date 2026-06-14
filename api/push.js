import webPush from 'web-push'
import { subscriptions } from './subscribe.js'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BAbgAPphrkImdSSYcgCSrfL2md_ftyCXnZ_pEHZt-NwEb9qtMZug1Dnz8LT5ax8BvbXLdKbnkt-CuaZXVKSFceQ'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:test@example.com'

if (VAPID_PRIVATE_KEY) {
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
    if (!VAPID_PRIVATE_KEY) {
      return res.status(500).json({ error: 'VAPID keys not configured' })
    }

    if (subscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        sent: 0,
        failed: 0,
        message: 'No subscriptions'
      })
    }

    const payload = JSON.stringify({
      title: '覆写',
      body: '今日练习已准备好',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-exercise'
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webPush.sendNotification(sub, payload).catch(err => {
          console.error('Push failed:', err.message)
          return null
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length
    const failed = results.length - sent

    return res.status(200).json({
      success: true,
      sent,
      failed,
      total: subscriptions.length
    })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
