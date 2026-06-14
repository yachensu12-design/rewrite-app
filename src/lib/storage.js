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
  const defaults = { notification_time: '08:00', start_date: new Date().toISOString().slice(0, 10), kimi_api_key: '' }
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

export function getDynamicExercises() {
  const raw = localStorage.getItem(KEYS.DYNAMIC)
  return raw ? JSON.parse(raw) : {}
}

export function saveDynamicExercises(exercises) {
  localStorage.setItem(KEYS.DYNAMIC, JSON.stringify(exercises))
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

export const MECHANISM_NAMES = {
  M1: { name: '自我消除', desc: '练习表达真实需求、不缩小自己' },
  M2: { name: '情绪容器', desc: '练习觉察自己在照顾谁的情绪' },
  M3: { name: '愤怒内折', desc: '练习允许愤怒向外、不攻击自己' },
  M4: { name: '价值外包', desc: '练习从内在体验确认自己' },
  M5: { name: '幻想系统', desc: '练习待在当下、不沉迷幻想' },
  M6: { name: '信任有效期', desc: '练习看到真实的人、不理想化' },
  M7: { name: '将就模板', desc: '练习忍受断裂的不适、为自己争取' }
}

export async function generateDynamicExercise(mechanism, waterLevel, recentFeelings) {
  const settings = getSettings()
  if (!settings.kimi_api_key) {
    throw new Error('未设置 Kimi API Key')
  }

  const mechanismInfo = MECHANISM_NAMES[mechanism]
  const stage = waterLevel <= 30 ? '入门阶段' : waterLevel <= 60 ? '进阶阶段' : '深入阶段'
  const feelingsText = recentFeelings.length > 0 ? recentFeelings.join('；') : '暂无'
  const difficultyDesc = waterLevel <= 30 ? '简单，以觉察为主' : waterLevel <= 60 ? '中等，需要一些行动' : '较难，需要面对不适'

  const prompt = `你是一位专业的心理行为练习设计师。

请为用户生成一道个性化的心理行为练习。

练习主题：${mechanismInfo.name}（${mechanismInfo.desc}）
用户当前成长阶段：${stage}
用户近期感受记录：${feelingsText}

请严格按照以下 JSON 格式返回（不要包含任何其他文字）：
{
  "title": "练习标题（3-8个字）",
  "instruction": "具体练习内容，可执行、不超过100字",
  "why": "为什么做这个练习，一句话解释背后的心理机制，不超过60字",
  "completion_prompt": "完成后的引导语，引导用户写感受"
}

要求：
1. 练习难度要适合用户的成长阶段（${difficultyDesc}）
2. 标题要简洁有力
3. instruction 要具体可操作
4. why 要温暖、不评判
5. 不要和常见练习重复`

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.kimi_api_key}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: '你是一个专业的心理行为练习设计师，擅长设计温和、可执行的心理练习。' },
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || '生成练习失败')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('返回格式错误')
    const exercise = JSON.parse(jsonMatch[0])

    const dynamicExercises = getDynamicExercises()
    const dynamicCount = Object.keys(dynamicExercises).filter(k => k.startsWith(mechanism)).length

    const result = {
      id: `${mechanism}-D${String(dynamicCount + 1).padStart(3, '0')}`,
      mechanism,
      mechanismName: mechanismInfo.name,
      difficulty: waterLevel,
      isDynamic: true,
      ...exercise
    }

    return result
  } catch (e) {
    console.error('解析练习失败:', content)
    throw new Error('解析生成的练习失败')
  }
}
