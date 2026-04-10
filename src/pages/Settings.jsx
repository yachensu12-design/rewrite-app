import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../lib/storage'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [permission, setPermission] = useState('default')
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    setSettings(getSettings())
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
    // 检查是否已有订阅
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub)
        })
      })
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('您的浏览器不支持通知功能')
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === 'granted') {
      // 订阅 Push
      try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('BAbgAPphrkImdSSYcgCSrfL2md_ftyCXnZ_pEHZt-NwEb9qtMZug1Dnz8LT5ax8BvbXLdKbnkt-CuaZXVKSFceQ')
        })
        setSubscription(sub)

        // 发送到后端保存
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        })

        // 测试推送
        new Notification('覆写', {
          body: '通知已开启，明天早上 8:00 会提醒你练习',
          icon: '/icon-192.png'
        })
      } catch (err) {
        console.error('订阅失败:', err)
        alert('订阅失败，请重试')
      }
    }
  }

  const unsubscribe = async () => {
    if (subscription) {
      await subscription.unsubscribe()
      setSubscription(null)
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })
    }
  }

  if (!settings) {
    return (
      <div className="pt-8">
        <p className="text-stone-400 text-sm">加载中...</p>
      </div>
    )
  }

  return (
    <div className="pt-8">
      <h1 className="text-xl font-medium mb-6">设置</h1>

      {/* 通知设置 */}
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h2 className="font-medium mb-4">每日提醒</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">开启通知</p>
              <p className="text-xs text-stone-400">每天早上 8:00 提醒练习</p>
            </div>
            {subscription ? (
              <button
                onClick={unsubscribe}
                className="px-4 py-2 rounded-full text-sm border border-stone-200"
              >
                关闭
              </button>
            ) : (
              <button
                onClick={requestPermission}
                disabled={permission === 'denied'}
                className="px-4 py-2 rounded-full text-sm text-white"
                style={{ backgroundColor: permission === 'denied' ? '#ccc' : '#B07A48' }}
              >
                {permission === 'denied' ? '已被拒绝' : '开启'}
              </button>
            )}
          </div>

          {subscription && (
            <p className="text-xs text-emerald-600">
              已开启，明天早上 8:00 会收到提醒
            </p>
          )}
        </div>
      </div>

      {/* 关于 */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h2 className="font-medium mb-2">关于</h2>
        <p className="text-sm text-stone-400">覆写 · 365天行为练习</p>
        <p className="text-xs text-stone-400 mt-1">v1.0</p>
      </div>
    </div>
  )
}

// VAPID key 转换
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
