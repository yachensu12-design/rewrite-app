import { useMemo } from 'react'

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarHeatmap({ log, year = new Date().getFullYear(), month = new Date().getMonth() }) {
  const data = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay()

    const days = []

    // 空白占位（月初之前）
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    // 本月每一天
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayLog = log[dateStr] || []
      const completed = dayLog.filter(l => l.status === 'completed').length
      days.push({ day, completed, dateStr })
    }

    return days
  }, [log, year, month])

  const getColor = (completed) => {
    if (completed === 0) return 'transparent'
    if (completed === 1) return 'rgba(176, 122, 72, 0.25)'
    if (completed === 2) return 'rgba(176, 122, 72, 0.55)'
    return '#B07A48'
  }

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{year}年 {MONTH_NAMES[month]}</h3>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map(day => (
          <div key={day} className="text-center text-xs text-stone-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {data.map((item, index) => (
          <div
            key={index}
            className="aspect-square flex items-center justify-center text-xs rounded-lg"
            style={{
              backgroundColor: item ? getColor(item.completed) : 'transparent',
              color: item?.completed > 0 ? '#fff' : '#2E2720'
            }}
          >
            {item?.day || ''}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-stone-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'transparent', border: '1px solid #e5e5e5' }} />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(176, 122, 72, 0.25)' }} />
          <span>1</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(176, 122, 72, 0.55)' }} />
          <span>2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#B07A48' }} />
          <span>3</span>
        </div>
      </div>
    </div>
  )
}
