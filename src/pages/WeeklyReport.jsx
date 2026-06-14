import { useState, useEffect } from 'react'
import { getLog, getProgress, getSettings, today } from '../lib/storage'

const MECHANISM_NAMES = {
  M1: '自我消除',
  M2: '情绪容器',
  M3: '愤怒内折',
  M4: '价值外包',
  M5: '幻想系统',
  M6: '信任有效期',
  M7: '将就模板'
}

export default function WeeklyReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const generateReport = async () => {
    if (!settings?.kimi_api_key) {
      setError('请先设置 Kimi API Key')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 获取本周数据
      const weekData = getWeekData()

      // 调用 Kimi API
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.kimi_api_key}`
        },
        body: JSON.stringify({
          model: 'kimi-k2.5',
          messages: [
            {
              role: 'system',
              content: '你是一位温暖的心理陪伴者。用户正在进行365天的行为练习，试图覆写旧的心理模式。请根据用户本周的练习数据，生成一份温柔的周报回顾。语气要平静、不评判、不催促，像了解他的朋友一样。不要使用"加油""你很棒"等空洞鼓励。'
            },
            {
              role: 'user',
              content: `请根据以下数据生成周报：\n${JSON.stringify(weekData, null, 2)}\n\n请包含：\n1. 本周完成概览（几天完成，总共完成几个练习）\n2. 进步最大的机制（水位变化）\n3. 最有挑战的机制\n4. 精选2-3条用户的感受记录\n5. 一句温柔的总结，不带评判`
            }
          ],
          temperature: 1
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'API 调用失败')
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || '生成失败'

      setReport({
        content,
        weekData,
        generatedAt: new Date().toISOString()
      })

      // 保存到本地
      localStorage.setItem('last_weekly_report', JSON.stringify({
        content,
        weekData,
        generatedAt: new Date().toISOString()
      }))

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  const getWeekData = () => {
    const log = getLog()
    const progress = getProgress()
    const todayStr = today()

    // 获取本周日期（周日到周六）
    const todayDate = new Date()
    const dayOfWeek = todayDate.getDay()
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() - dayOfWeek)

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      weekDates.push(d.toISOString().slice(0, 10))
    }

    // 统计本周完成
    let totalCompleted = 0
    let totalSkipped = 0
    const mechanismStats = {}
    const feelings = []

    weekDates.forEach(date => {
      const dayLog = log[date] || []
      dayLog.forEach(entry => {
        if (entry.status === 'completed') {
          totalCompleted++
          if (!mechanismStats[entry.mechanism]) {
            mechanismStats[entry.mechanism] = { completed: 0, skipped: 0 }
          }
          mechanismStats[entry.mechanism].completed++
        } else {
          totalSkipped++
          if (!mechanismStats[entry.mechanism]) {
            mechanismStats[entry.mechanism] = { completed: 0, skipped: 0 }
          }
          mechanismStats[entry.mechanism].skipped++
        }
      })
    })

    // 收集感受记录
    Object.entries(log).forEach(([date, entries]) => {
      if (weekDates.includes(date)) {
        entries.forEach(entry => {
          if (entry.feeling_text) {
            feelings.push({ date, text: entry.feeling_text })
          }
        })
      }
    })

    return {
      weekRange: `${weekDates[0]} 至 ${weekDates[6]}`,
      daysWithData: weekDates.filter(d => log[d]?.length > 0).length,
      totalCompleted,
      totalSkipped,
      mechanismStats,
      feelings: feelings.slice(0, 5),
      currentWaterLevels: Object.fromEntries(
        Object.entries(progress).map(([k, v]) => [k, v.water_level])
      )
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('last_weekly_report')
    if (saved) {
      setReport(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="pt-8">
      <h1 className="text-xl font-medium mb-6">本周回顾</h1>

      {!report && !loading && (
        <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <p className="text-stone-500 mb-4">让 AI 为你生成本周练习回顾</p>
          <button
            onClick={generateReport}
            className="px-6 py-3 rounded-full text-white font-medium"
            style={{ backgroundColor: '#B07A48' }}
          >
            生成周报
          </button>
          {error && (
            <p className="text-red-500 text-sm mt-3">{error}</p>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <p className="text-stone-400">正在生成回顾...请稍候</p>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="text-xs text-stone-400 mb-4">
              {report.weekData?.weekRange} · Kimi 生成
            </div>
            <div className="prose prose-stone prose-sm max-w-none">
              {report.content.split('\n').map((line, i) => (
                <p key={i} className="mb-3 leading-relaxed">{line}</p>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generateReport}
              className="flex-1 py-3 rounded-full text-sm border border-stone-200"
            >
              重新生成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
