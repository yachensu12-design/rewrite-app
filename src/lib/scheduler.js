import { getProgress, getLog, getPlan, today, getDynamicExercises, saveDynamicExercises, generateDynamicExercise } from './storage'

let exercisesCache = null

export async function loadExercises() {
  if (exercisesCache) return exercisesCache
  try {
    const res = await fetch('/exercises.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    exercisesCache = await res.json()
    return exercisesCache
  } catch (err) {
    console.error('加载练习库失败:', err)
    // 返回空数组，让页面显示错误状态
    exercisesCache = []
    return exercisesCache
  }
}

export function getMergedExercises() {
  const base = exercisesCache || []
  const dynamic = getDynamicExercises()
  const dynamicList = Object.values(dynamic)
  return [...base, ...dynamicList]
}

export function selectDailyExercises(exercises, progress) {
  const mechanisms = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']
  const log = getLog()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const yesterdayLog = log[yesterdayStr] || []

  const weights = mechanisms.map(m => {
    const p = progress[m] || { total_completed: 0, total_skipped: 0, consecutive_days: 0, last_completed_date: null }
    let weight = 1

    const completed = p.total_completed
    const skipped = p.total_skipped
    const total = completed + skipped
    const rate = total > 0 ? completed / total : 0.5

    if (rate < 0.5) weight *= 2
    if (p.consecutive_days >= 3) weight *= 0.5

    const wasSkippedYesterday = yesterdayLog.some(l => {
      const ex = exercises.find(e => e.id === l.id)
      return ex && ex.mechanism === m && l.status === 'skipped'
    })
    if (wasSkippedYesterday) weight *= 1.5

    return { mechanism: m, weight }
  })

  // 按权重降序排序，权重高的优先被选中
  weights.sort((a, b) => b.weight - a.weight)
  const selected = weights.slice(0, 3).map(w => w.mechanism)

  const plan = selected.map(mechanism => {
    const p = progress[mechanism]
    const level = p?.water_level || 10
    const candidates = exercises.filter(e => e.mechanism === mechanism)

    candidates.sort((a, b) => {
      const diffA = Math.abs(a.difficulty - level)
      const diffB = Math.abs(b.difficulty - level)
      return diffA - diffB
    })

    return candidates[0] || candidates[candidates.length - 1]
  }).filter(Boolean)

  return plan.sort((a, b) => a.difficulty - b.difficulty)
}

export function generateDailyPlan(exercises, progress) {
  const plan = selectDailyExercises(exercises, progress)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const yesterdayPlan = getPlan(yesterdayStr)
  const yesterdayLog = getLog()[yesterdayStr] || []

  // 处理降级：昨天未完成的练习，今天推送简化版
  const processedPlan = plan.map(exercise => {
    const yesterdayItem = yesterdayPlan?.items?.find(i => i.id === exercise.id)
    const yesterdayEntry = yesterdayLog.find(l => l.id === exercise.id)

    if (yesterdayEntry?.status === 'skipped' && yesterdayItem) {
      // 昨天未完成，检查是否有简化版本
      const simplifiedVersions = exercise.simplified_versions || []
      const currentSimplifiedIndex = yesterdayItem.simplified_index || 0

      if (currentSimplifiedIndex < simplifiedVersions.length) {
        // 使用下一个简化版本
        const simplified = simplifiedVersions[currentSimplifiedIndex]
        return {
          ...exercise,
          original_id: exercise.id,
          id: `${exercise.id}-simplified-${currentSimplifiedIndex}`,
          instruction: simplified.instruction,
          difficulty: simplified.difficulty,
          simplified_index: currentSimplifiedIndex + 1,
          is_simplified: true
        }
      }
      // 所有简化版本都未完成，跳过这个练习
      return null
    }

    return exercise
  }).filter(Boolean)

  // 如果降级后不足3个，补充其他机制的简单练习
  while (processedPlan.length < 3) {
    const usedMechanisms = processedPlan.map(e => e.mechanism)
    const available = exercises.filter(e =>
      !usedMechanisms.includes(e.mechanism) &&
      e.difficulty <= 15
    )
    if (available.length === 0) break
    const extra = available[Math.floor(Math.random() * available.length)]
    processedPlan.push(extra)
  }

  return {
    date: today(),
    exercises: processedPlan.map(e => e.id),
    completion_count: 0,
    items: processedPlan.map(e => ({
      id: e.id,
      original_id: e.original_id || e.id,
      status: 'pending',
      feeling_text: '',
      difficulty_at_time: e.difficulty,
      was_simplified: e.is_simplified || false,
      simplified_index: e.simplified_index || 0
    }))
  }
}

// 检查某机制是否需要生成动态练习
function shouldGenerateDynamic(exercises, mechanism, progress) {
  const mechanismExercises = exercises.filter(e => e.mechanism === mechanism && !e.isDynamic)
  const dynamicExercises = exercises.filter(e => e.mechanism === mechanism && e.isDynamic)
  const log = getLog()

  // 获取该机制已完成的固定练习数量
  let completedFixedCount = 0
  Object.values(log).forEach(dayLog => {
    dayLog.forEach(entry => {
      if (entry.mechanism === mechanism && entry.status === 'completed') {
        const ex = mechanismExercises.find(e => e.id === entry.id || entry.id.startsWith(e.id))
        if (ex) completedFixedCount++
      }
    })
  })

  // 测试模式：完成 1 道就触发（生产环境改回 0.7）
  const fixedThreshold = 1  // Math.floor(mechanismExercises.length * 0.7)
  return completedFixedCount >= fixedThreshold && dynamicExercises.length < 3
}

// 获取最近感受记录
function getRecentFeelings(mechanism, limit = 3) {
  const log = getLog()
  const feelings = []

  Object.entries(log)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7) // 最近7天
    .forEach(([date, entries]) => {
      entries.forEach(entry => {
        if (entry.mechanism === mechanism && entry.feeling_text) {
          feelings.push(entry.feeling_text)
        }
      })
    })

  return feelings.slice(0, limit)
}

// 检查并生成动态练习
export async function checkAndGenerateDynamicExercises(exercises, progress) {
  const mechanisms = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']
  const dynamicExercises = getDynamicExercises()
  let generated = false

  for (const mechanism of mechanisms) {
    if (shouldGenerateDynamic(exercises, mechanism, progress)) {
      try {
        const waterLevel = progress[mechanism]?.water_level || 10
        const recentFeelings = getRecentFeelings(mechanism)

        console.log(`正在为 ${mechanism} 生成动态练习...`)
        const newExercise = await generateDynamicExercise(mechanism, waterLevel, recentFeelings)

        // 保存到动态练习库
        dynamicExercises[newExercise.id] = newExercise
        generated = true
        console.log(`已生成动态练习: ${newExercise.id}`)
      } catch (err) {
        console.error(`生成 ${mechanism} 动态练习失败:`, err)
      }
    }
  }

  if (generated) {
    saveDynamicExercises(dynamicExercises)
  }

  return generated
}
