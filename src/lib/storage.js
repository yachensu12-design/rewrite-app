const KEYS = {
  PROGRESS: 'mechanism_progress',
  LOG: 'exercise_log',
  PLAN: 'daily_plan',
  SETTINGS: 'settings',
  DYNAMIC: 'dynamic_exercises',
}

const DEFAULT_PROGRESS = {
  M1: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
  M2: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
  M3: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
  M4: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
  M5: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
  M6: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
  M7: { water_level: 10, consecutive_days: 0, total_completed: 0, total_skipped: 0, last_completed_date: null },
}

export function getProgress() {
  const raw = localStorage.getItem(KEYS.PROGRESS)
  if (raw) return JSON.parse(raw)
  // 首次访问，初始化并保存
  saveProgress(DEFAULT_PROGRESS)
  return { ...DEFAULT_PROGRESS }
}

export function saveProgress(progress) {
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress))
}

export function getLog() {
  const raw = localStorage.getItem(KEYS.LOG)
  return raw ? JSON.parse(raw) : {}
}

export function saveLog(log) {
  localStorage.setItem(KEYS.LOG, JSON.stringify(log))
}

export function getPlan(date) {
  const raw = localStorage.getItem(`${KEYS.PLAN}_${date}`)
  return raw ? JSON.parse(raw) : null
}

export function savePlan(date, plan) {
  localStorage.setItem(`${KEYS.PLAN}_${date}`, JSON.stringify(plan))
}

export function getSettings() {
  const raw = localStorage.getItem(KEYS.SETTINGS)
  const defaults = { notification_time: '08:00', start_date: new Date().toISOString().slice(0, 10) }
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

export function getDynamicExercises() {
  const raw = localStorage.getItem(KEYS.DYNAMIC)
  return raw ? JSON.parse(raw) : {}
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function getDayNumber() {
  const settings = getSettings()
  const start = new Date(settings.start_date)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff + 1
}
