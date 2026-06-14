const CACHE_NAME = 'rewrite-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/exercises.json',
  '/manifest.json'
]

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// 拦截请求，优先从缓存读取
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 缓存命中直接返回
      if (response) {
        return response
      }
      // 否则网络请求并缓存
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }
        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return networkResponse
      })
    })
  )
})

// 处理推送通知
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = {
      title: '覆写',
      body: '今日练习已准备好',
      icon: '/icon-192.png'
    }
  }

  const options = {
    body: data.body || '今日练习已准备好',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'daily-exercise',
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '覆写', options)
  )
})

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})
