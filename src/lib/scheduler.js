import { getProgress, getLog, today, getDynamicExercises } from './storage'

let exercisesCache = null

export async function loadExercises() {
  if (exercisesCache) return exercisesCache
  const res = await fetch('/exercises.json')
  exercisesCache = await res.json()
  return exercisesCache
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
