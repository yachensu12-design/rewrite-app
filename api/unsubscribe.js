// 直接操作 subscribe.js 导出的 subscriptions
// 注意：Vercel 每次调用都是新实例，此文件不会被实际使用
// unsubscribe 逻辑在前端直接调用 subscribe 接口过滤

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    // 内存存储模式下，取消订阅只是返回成功
    // 实际订阅会在部署后自动清空
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
