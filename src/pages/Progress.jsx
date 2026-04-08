import { useEffect, useState } from 'react'
import { getProgress, getLog } from '../lib/storage'
import CalendarHeatmap from '../components/CalendarHeatmap'

const MECHANISM_NAMES = {
  M1: '自我消除',
  M2: '情绪容器',
  M3: '愤怒内折',
  M4: '价值外包',
  M5: '幻想系统',
  M6: '信任有效期',
  M7: '将就模板'
}

const MECHANISM_ICONS = {
  M1: '🌱',
  M2: '🫖',
  M3: '⚡',
  M4: '💎',
  M5: '🌙',
  M6: '👁️',
  M7: '🚪'
}

const MECHANISM_COLORS = {
  M1: '#D4A574',
  M2: '#7BA59B',
  M3: '#C9A9C7',
  M4: '#A5B4C4',
  M5: '#D4B5A0',
  M6: '#9FB4A1',
  M7: '#C4A995'
}

function getGrowthStage(level) {
  if (level <= 20) return { label: '萌芽', desc: '刚刚破土' }
  if (level <= 40) return { label: '扎根', desc: '正在扎根' }
  if (level <= 60) return { label: '抽枝', desc: '开始生长' }
  if (level <= 80) return { label: '舒展', desc: '逐步展开' }
  return { label: '盛放', desc: '自在表达' }
}

export default function Progress() {
  const [progress, setProgress] = useState(null)
  const [log, setLog] = useState({})

  useEffect(() => {
    setProgress(getProgress())
    setLog(getLog())
  }, [])

  if (!progress) {
    return (
      <div className="pt-8">
        <p className="text-stone-400 text-sm">加载中...</p>
      </div>
    )
  }

  const totalCompleted = Object.values(progress).reduce((sum, p) => sum + p.total_completed, 0)
  const totalDays = Math.ceil(totalCompleted / 3)

  return (
    <div className="pt-8">
      <h1 className="text-xl font-medium mb-6">我的成长</h1>

      <div className="space-y-4 mb-8">
        {Object.entries(progress).map(([mechanism, p]) => (
          <div
            key={mechanism}
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{MECHANISM_ICONS[mechanism]}</span>
                <div>
                  <p className="font-medium">{MECHANISM_NAMES[mechanism]}</p>
                  <p className="text-xs text-stone-400">
                    完成 {p.total_completed} · 跳过 {p.total_skipped}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${MECHANISM_COLORS[mechanism]}20`,
                    color: MECHANISM_COLORS[mechanism]
                  }}
                >
                  {getGrowthStage(p.water_level).label}
                </span>
              </div>
            </div>

            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${p.water_level}%`,
                  backgroundColor: MECHANISM_COLORS[mechanism]
                }}
              />
            </div>

            {p.consecutive_days > 0 && (
              <p className="text-xs text-emerald-600 mt-2">
                连续 {p.consecutive_days} 天完成
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-stone-50 rounded-2xl p-5 text-center mb-8">
        <p className="text-stone-400 text-sm mb-1">总完成天数</p>
        <p className="text-3xl font-medium" style={{ color: '#B07A48' }}>
          {totalDays}
        </p>
        <p className="text-stone-400 text-xs mt-1">/ 365 天</p>
      </div>

      <h2 className="text-lg font-medium mb-4">练习记录</h2>
      <CalendarHeatmap log={log} />
    </div>
  )
}
