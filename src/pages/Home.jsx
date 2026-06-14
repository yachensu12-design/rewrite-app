import { useState, useEffect } from 'react'
import { loadExercises, getMergedExercises, generateDailyPlan, checkAndGenerateDynamicExercises } from '../lib/scheduler'
import { getPlan, savePlan, getProgress, saveProgress, getLog, saveLog, today, getDayNumber } from '../lib/storage'

export default function Home() {
  const [plan, setPlan] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [feelingText, setFeelingText] = useState('')
  const [showFeelingInput, setShowFeelingInput] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        await loadExercises()
        let allExercises = getMergedExercises()
        console.log('加载的练习数量:', allExercises.length)

        // 如果没有加载到练习，显示错误
        if (allExercises.length === 0) {
          setLoading(false)
          return
        }

        // 确保 progress 数据已初始化
        const progress = getProgress()

        // 检查是否需要生成动态练习
        await checkAndGenerateDynamicExercises(allExercises, progress)

        // 重新获取练习（可能已生成新的）
        allExercises = getMergedExercises()
        setExercises(allExercises)

        const date = today()
        let dailyPlan = getPlan(date)

        if (!dailyPlan) {
          dailyPlan = generateDailyPlan(allExercises, progress)
          savePlan(date, dailyPlan)
        }

        setPlan(dailyPlan)
      } catch (err) {
        console.error('初始化失败:', err)
      }
      setLoading(false)
    }
    init()
  }, [])

  const getExerciseDetails = (id) => exercises.find(e => e.id === id)

  const handleComplete = (id) => {
    setShowFeelingInput(id)
    setExpandedId(null)
  }

  const handleSkip = (id) => {
    const newPlan = { ...plan }
    const item = newPlan.items.find(i => i.id === id)
    if (item) {
      item.status = 'skipped'
      savePlan(today(), newPlan)
      setPlan(newPlan)
      updateProgress(id, 'skipped')
    }
    setExpandedId(null)
  }

  const submitFeeling = () => {
    if (!showFeelingInput) return
    const newPlan = { ...plan }
    const item = newPlan.items.find(i => i.id === showFeelingInput)
    if (item) {
      item.status = 'completed'
      item.feeling_text = feelingText
      savePlan(today(), newPlan)
      setPlan(newPlan)
      updateProgress(showFeelingInput, 'completed', feelingText)
    }
    setShowFeelingInput(null)
    setFeelingText('')
  }

  const skipFeeling = () => {
    submitFeeling()
  }

  const updateProgress = (exerciseId, status, feeling = '') => {
    // 处理简化版本 ID，获取原练习
    const originalId = exerciseId.replace(/-simplified-\d+$/, '')
    const ex = getExerciseDetails(originalId) || getExerciseDetails(exerciseId)
    if (!ex) return

    const progress = getProgress()
    const mechanism = ex.mechanism
    const p = progress[mechanism]
    let waterChange = 0

    if (status === 'completed') {
      p.total_completed += 1
      waterChange += 5

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)

      if (p.last_completed_date === yesterdayStr) {
        p.consecutive_days += 1
        if (p.consecutive_days >= 3) {
          waterChange += 10
        }
      } else if (p.last_completed_date !== today()) {
        p.consecutive_days = 1
      }
      p.last_completed_date = today()

      // 感受关键词分析
      const positiveWords = ['简单', '容易', '轻松', '做到了', '不错', '好', '开心', '满意']
      const difficultWords = ['难', '做不到', '痛苦', '焦虑', '害怕', '恐惧', '不行', '失败']

      if (positiveWords.some(w => feeling.includes(w))) {
        waterChange += 3
      }
      if (difficultWords.some(w => feeling.includes(w))) {
        waterChange -= 5
      }
    } else {
      p.total_skipped += 1
      p.consecutive_days = 0
      waterChange -= 10

      // 连续 2 天未完成，额外 -15
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)
      const log = getLog()
      const yesterdayLog = log[yesterdayStr] || []
      const wasSkippedYesterday = yesterdayLog.some(l => {
        const yEx = exercises.find(e => e.id === l.id)
        return yEx && yEx.mechanism === mechanism && l.status === 'skipped'
      })
      if (wasSkippedYesterday) {
        waterChange -= 15
      }
    }

    // 更新水位（1-100 范围）
    p.water_level = Math.max(1, Math.min(100, p.water_level + waterChange))

    saveProgress(progress)

    const log = getLog()
    if (!log[today()]) log[today()] = []
    log[today()].push({
      id: exerciseId,
      status,
      mechanism,
      feeling_text: feeling,
      timestamp: new Date().toISOString()
    })
    saveLog(log)
  }

  const completedCount = plan?.items?.filter(i => i.status === 'completed').length || 0

  if (loading) {
    return (
      <div className="pt-8">
        <p className="text-stone-400 text-sm">加载中...</p>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="pt-8 text-center">
        <p className="text-stone-400 text-sm mb-4">练习库加载失败</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-full text-white text-sm"
          style={{ backgroundColor: '#B07A48' }}
        >
          重新加载
        </button>
      </div>
    )
  }


  if (showFeelingInput) {
    const ex = getExerciseDetails(showFeelingInput)
    return (
      <div className="pt-8">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600 font-medium">做到了</span>
        </div>

        <p className="text-stone-600 mb-4">{ex?.completion_prompt || '今天你注意到了什么？'}</p>

        <textarea
          value={feelingText}
          onChange={(e) => setFeelingText(e.target.value)}
          placeholder="写一句感受..."
          maxLength={200}
          className="w-full h-32 p-4 rounded-2xl border border-stone-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/20"
        />
        <p className="text-right text-stone-400 text-xs mt-2">{feelingText.length}/200</p>

        <button
          onClick={submitFeeling}
          className="w-full mt-6 py-3 rounded-full text-white font-medium"
          style={{ backgroundColor: '#B07A48' }}
        >
          提交
        </button>

        <button
          onClick={skipFeeling}
          className="w-full mt-3 py-3 text-stone-400 text-sm"
        >
          也可以跳过 →
        </button>
      </div>
    )
  }

  return (
    <div className="pt-8">
      <p className="text-stone-400 text-sm">覆写 · 第 {getDayNumber()} 天</p>
      <h1 className="text-xl font-medium mt-1 mb-6">今日练习</h1>

      <div className="space-y-4">
        {plan?.exercises?.map((id, index) => {
          const ex = getExerciseDetails(id)
          const item = plan.items?.find(i => i.id === id)
          const isExpanded = expandedId === id
          if (!ex) return null

          return (
            <div
              key={id}
              onClick={() => !item?.status || item?.status === 'pending' ? setExpandedId(isExpanded ? null : id) : null}
              className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${!item?.status || item?.status === 'pending' ? 'cursor-pointer' : ''}`}
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: getMechanismColor(ex.mechanism),
                    color: '#fff'
                  }}
                >
                  {index + 1}
                </span>
                <span className="text-xs text-stone-400">
                  {ex.mechanism} · {ex.mechanismName}
                </span>
                {ex.isDynamic && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    AI生成
                  </span>
                )}
              </div>

              <h3 className="font-medium text-lg mb-1">{ex.title}</h3>

              {!isExpanded ? (
                <p className="text-stone-500 text-sm line-clamp-2">{ex.instruction}</p>
              ) : (
                <div className="animate-fade-in">
                  <p className="text-stone-600 text-sm leading-relaxed mb-4">{ex.instruction}</p>

                  <div className="bg-stone-50 rounded-xl p-4 mb-5">
                    <p className="text-xs text-stone-400 mb-1">为什么做这个</p>
                    <p className="text-sm text-stone-600">{ex.why}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleComplete(id); }}
                      className="flex-1 py-3 rounded-full text-white font-medium text-sm"
                      style={{ backgroundColor: '#B07A48' }}
                    >
                      做到了
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSkip(id); }}
                      className="flex-1 py-3 rounded-full text-stone-500 font-medium text-sm border border-stone-200"
                    >
                      今天做不到
                    </button>
                  </div>
                </div>
              )}

              {item?.status === 'completed' && (
                <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已完成
                </div>
              )}

              {item?.status === 'skipped' && (
                <div className="mt-3 text-stone-400 text-sm">
                  没关系。明天会有一个更简单的版本。
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-sm text-stone-400 mb-2">
          <span>今日进度</span>
          <span>{completedCount}/3</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%`, backgroundColor: '#B07A48' }}
          />
        </div>
      </div>
    </div>
  )
}

function getMechanismColor(mechanism) {
  const colors = {
    M1: '#D4A574',
    M2: '#7BA59B',
    M3: '#C9A9C7',
    M4: '#A5B4C4',
    M5: '#D4B5A0',
    M6: '#9FB4A1',
    M7: '#C4A995'
  }
  return colors[mechanism] || '#B5A99A'
}
