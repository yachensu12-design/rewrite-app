# 覆写 (Rewrite) - 项目进度追踪

> 365天行为练习 PWA 应用
> 个人 iOS 使用，基于7大心理机制

---

## 项目信息

- **技术栈**: React + Vite + Tailwind CSS
- **数据存储**: LocalStorage (纯前端，无后端数据库)
- **部署**: Vercel
- **通知**: Web Push API + VAPID

---

## 开发任务清单

### 已完成 (Task 1-11)

| Task | 描述 | 状态 | 关键文件 |
|------|------|------|----------|
| 1 | 项目初始化 + Vite + Tailwind 配置 | ✅ 完成 | `package.json`, `vite.config.js`, `tailwind.config.js` |
| 2 | PWA 基础配置 (manifest.json + Service Worker) | ✅ 完成 | `public/manifest.json`, `public/sw.js` |
| 3 | 数据结构设计 (progress, exercises, plan) | ✅ 完成 | `src/lib/storage.js`, `public/exercises.json` |
| 4 | 7大心理机制练习内容 (60道) | ✅ 完成 | `public/exercises.json` |
| 5 | 核心调度算法 (权重系统) | ✅ 完成 | `src/lib/scheduler.js` |
| 6 | LocalStorage 持久化层 | ✅ 完成 | `src/lib/storage.js` |
| 7 | 首页 - 今日练习卡片 | ✅ 完成 | `src/pages/Home.jsx` |
| 8 | 进度页 - 7机制成长可视化 | ✅ 完成 | `src/pages/Progress.jsx` |
| 9 | 设置页 - 通知开关 + 数据管理 | ✅ 完成 | `src/pages/Settings.jsx` |
| 10 | 降级机制 (简化版练习) | ✅ 完成 | `public/exercises.json` (simplified_versions) |
| 11 | 完成练习流程 + 感受记录 | ✅ 完成 | `src/pages/Home.jsx` |

### 进行中/待完成 (Task 12-15)

| Task | 描述 | 状态 | 阻塞项/待办 |
|------|------|------|------------|
| 12 | **Web Push 每日通知** | 🟡 接近完成 | 1. 在 Vercel Dashboard 设置 `VAPID_PRIVATE_KEY=3NmktjtqNmYh58jSLRwaAIx3U9s_Oz5G3iFtbPwOfTk`<br>2. 部署后测试订阅功能<br>3. 测试每日8:00推送 |
| 13 | **每周AI回顾** | ⏳ 待开始 | 用 Claude API 分析一周练习数据，生成个性化回顾报告 |
| 14 | **动态练习生成** | ⏳ 待开始 | 基于用户表现，Claude API 生成定制化练习内容 |
| 15 | **Figma 视觉优化** | ⏳ 待开始 | 整体设计美化 |

---

## 关键配置信息

### VAPID 密钥 (Web Push)
- **Public Key**: `BAbgAPphrkImdSSYcgCSrfL2md_ftyCXnZ_pEHZt-NwEb9qtMZug1Dnz8LT5ax8BvbXLdKbnkt-CuaZXVKSFceQ`
- **Private Key**: `3NmktjtqNmYh58jSLRwaAIx3U9s_Oz5G3iFtbPwOfTk` (需设置到 Vercel 环境变量)

### Vercel 环境变量待设置
```
VAPID_PRIVATE_KEY=3NmktjtqNmYh58jSLRwaAIx3U9s_Oz5G3iFtbPwOfTk
```

### Cron 配置 (vercel.json)
```json
{
  "crons": [{
    "path": "/api/push",
    "schedule": "0 8 * * *"
  }]
}
```

---

## 7大心理机制 (M1-M7)

| 机制 | 英文名 | 水位范围 | 成长阶段 |
|------|--------|----------|----------|
| M1 | 被看见 | 0-100 | 萌芽 → 扎根 → 抽枝 → 舒展 → 盛放 |
| M2 | 有选择 | 0-100 | 同上 |
| M3 | 能放手 | 0-100 | 同上 |
| M4 | 会呼吸 | 0-100 | 同上 |
| M5 | 有连接 | 0-100 | 同上 |
| M6 | 有边界 | 0-100 | 同上 |
| M7 | 能扎根 | 0-100 | 同上 |

---

## 测试指南

### 通知功能测试步骤
1. 确保 Vercel 环境变量 `VAPID_PRIVATE_KEY` 已设置
2. 重新部署项目
3. 在 iPhone Safari 中打开应用
4. 设置页打开"每日提醒"开关
5. 允许浏览器通知权限
6. 手动触发测试: `POST /api/push` (或在设置页找测试按钮)

---

## 已知问题

| 问题 | 状态 | 解决方案 |
|------|------|----------|
| Service Worker 缓存旧版本 | 已解决 | 用户需手动在 Safari 设置中清除缓存 |
| 进度数据返回 null | 已解决 | `getProgress()` 中添加了默认初始化 |
| 卡片点击无响应 | 已解决 | 修复了状态检查逻辑 |

---

## 下一步行动

1. **立即**: 在 Vercel Dashboard 设置 VAPID_PRIVATE_KEY
2. **然后**: 部署并测试 Web Push 通知
3. **接着**: 开始 Task 13 - 每周AI回顾功能

---

*最后更新: 2026/04/10*
