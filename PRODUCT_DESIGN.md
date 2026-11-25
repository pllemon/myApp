# 🌟 「生活记」产品设计方案 v1.1

> 创建日期: 2026-11-24
> 项目路径: /Users/peiling/Desktop/hey/myApp
> 技术栈: 微信小程序（本地优先 + 微信云开发可选）

---

## 目录

- [一、产品定位](#一产品定位)
- [二、竞品分析](#二竞品分析)
- [三、信息架构](#三信息架构)
- [四、数据库设计](#四数据库设计)
- [五、核心交互设计](#五核心交互设计)
- [六、产品创新点](#六产品创新点结合潮流趋势)
- [七、迭代路线图](#七迭代路线图)
- [八、技术亮点](#八技术亮点)
- [九、当前项目状态](#九当前项目状态)
- [十、后续开发跟踪](#十后续开发跟踪)

---

## 一、产品定位

**Slogan**: 记录生活的每一个瞬间 ✨

### 1.1 核心定位

一款**全场景个人生活数据记录与洞察工具**，让用户以最低成本记录生活的方方面面，并通过 AI 分析提供有价值的自我洞察。

### 1.2 目标用户

| 用户画像 | 核心诉求 |
|---------|---------|
| 🎯 自我提升派 | 养成好习惯、管理时间、追踪进步 |
| 💰 精明消费派 | 清晰掌控收支、拒绝月光 |
| 📝 情感表达派 | 留下生活痕迹、需要情绪出口 |
| 💪 健康关注派 | 量化身体数据、科学管理健康 |

### 1.3 差异化价值

- ✅ **全能记录**：一个 App 搞定记账、日记、打卡、待办、健康
- ✅ **最低摩擦**：一键记账、表情打日记、快速打卡
- ✅ **数据互通**：支出趋势影响心情？睡眠差是否影响执行力？多维交叉洞察
- ✅ **AI 赋能**：智能分类、情绪分析、习惯建议、年度报告

---

## 二、竞品分析

| 产品 | 核心功能 | 亮点 | 痛点 |
|------|---------|------|------|
| 随手记 | 记账 | 分类全、报表强 | 功能臃肿、广告多 |
| iCost | 记账 | 界面极简 | 只有记账 |
| 小日常 | 打卡 | 连续天数、日历热力图 | 只做打卡 |
| 滴答清单 | 待办 | 提醒功能强 | 没有生活感 |
| Day One | 日记 | 多媒体日记 | 付费、重 |
| 薄荷健康 | 健康 | 饮食运动 | 商业化重 |
| Notion | 全能笔记 | 自由度高 | 重、学习成本大 |

### 市场空白

市面上缺少一款**轻量、全能、数据互通**的个人生活记录工具。用户需要装 4-5 个 App 才能覆盖记账、打卡、日记、待办，切换成本高，数据割裂。

### 我们的机会

用**微信小程序**的轻量特性 + **云开发**的数据天然互通 + **AI 能力**的分析赋能，打造"生活的操作系统"。

---

## 三、信息架构

```
生活记
├── 🏠 首页 (Dashboard)           ← Tab 1
│   ├── 时段问候 + 日期
│   ├── 今日概览（支出/日记/打卡/待办 4 项核心数据）
│   ├── 6 宫格快捷入口
│   ├── 今日习惯打卡进度条
│   └── AI 今日摘要（一句话总结）
│
├── 💰 记账 (Accounting)          ← Tab 2
│   ├── 月度收支卡片（渐变色总览）
│   ├── 快速记账弹窗（金额+分类+备注+时间）
│   ├── 分类管理（支持自定义）
│   ├── 账单列表（按日分组 + 日小计）
│   └── 预算管理（月预算 + 分类预算 + 预警）
│
├── 📝 日记 (Diary)               ← Tab 3
│   ├── 日历视图（已记录日期高亮）
│   ├── 心情选择器（6 种表情 + 天气标签）
│   ├── 富文本编辑（支持图片/语音）
│   ├── 日记列表（卡片式 + 心情表情）
│   └── 年度回忆（自动生成年度画册）
│
├── 📋 我的 (Profile)             ← Tab 4
│   ├── 个人信息（头像/昵称/连续记录天数）
│   ├── 成就徽章系统（游戏化激励）
│   ├── 设置入口（数据导出/提醒/主题/隐私）
│   └── 关于 + 反馈
│
├── 🔗 二级页面（非 TabBar）
│   ├── ✅ 打卡 (Checkin)         ← 从首页/我的进入
│   │   ├── 习惯列表（图标+颜色+连续天数）
│   │   ├── 创建习惯（图标库 + 自定义颜色）
│   │   ├── 日历热力图（打卡趋势）
│   │   └── 激励语系统（AI 生成）
│   │
│   ├── 🎯 待办 (Todo)           ← 从首页/我的进入
│   │   ├── 今日/全部/已完成/已逾期筛选
│   │   ├── 优先级标记（高/中/低）
│   │   ├── 截止日期 + 提醒
│   │   ├── 番茄钟计时
│   │   └── 完成统计
│   │
│   ├── 💪 健康 (Health)         ← 从首页/我的进入
│   │   ├── 饮水追踪（环形进度 + 快捷添加）
│   │   ├── 睡眠记录（手动录入 + 自动分析）
│   │   ├── 运动记录（6 种运动类型）
│   │   └── 健康周报
│   │
│   └── 📊 统计 (Stats)          ← 从首页/我的进入
│       ├── 支出趋势图（周/月/年柱状图）
│       ├── 分类占比饼图
│       ├── 心情热力图
│       ├── 习惯养成日历
│       └── AI 深度洞察报告
```

---

## 四、数据库设计

### 4.0 数据访问层与存储策略（本地优先）

本项目采用 **数据抽象层 + 双适配器** 架构（`miniprogram/utils/db.js`），业务代码只依赖统一接口，不直接接触底层存储：

- `utils/db.js`：统一数据访问接口（`add / list / query / getById / update / remove / count / page / switchMode / exportAll / importAll`），并暴露 `db.COLLECTIONS` 集合常量
- `utils/storage/local.js`：本地适配器，基于 `wx.setStorageSync`，每个集合对应一个 Storage key，纯前端可用、离线可用、无需后端
- `utils/storage/cloud.js`：云端适配器，直接调用 `wx.cloud.database()`（需配置 `utils/config.js` 的 `CLOUD_ENV`）

默认 `config.STORAGE_MODE = 'local'`，即 **本地优先**：开箱即用，数据仅存本机；设置页可切换到云端模式实现多端同步。集合结构在两种模式下完全一致，切换无需改动业务代码（通过 `db.switchMode` 热切换适配器）。

### 集合结构

> 以下为代码真实使用的集合（与 `config.COLLECTIONS` 一一对应）。约定：所有时间字段 `createdAt` / `updatedAt` 为 **毫秒时间戳**（`Date.now()`）；记账金额 `amount` 为 **浮点元**（如 `25.5` 表示 25.50 元）。

#### 4.1 用户与设置

本项目不设独立 `users` 集合，用户信息分散在本地 Storage：

| 信息 | 存储位置 | 说明 |
|------|---------|------|
| 昵称 | Storage key `__user_nickname` | 个人中心页可编辑 |
| openId / 用户标识 | `utils/user.js` → `__local_user_key` | 本地生成唯一标识；云端模式下由云开发 `_openid` 自动隔离 |
| 主题配置 | `utils/theme.js` → `__theme_config` | 4 套预设主题，运行时切换 |
| 通用设置 | 集合 `settings`（`COLLECTIONS.SETTINGS`） | 预留扩展 |

> 成就徽章不落库，由 `pages/profile/achievements` 基于各模块真实数据实时计算解锁状态。

#### 4.2 记账集合（accounting）

收入与支出 **合并存储** 在同一集合，用 `type` 字段区分：

```javascript
accounting
{
  _id: "...",
  type: "expense",            // expense 支出 / income 收入
  amount: 25.5,               // 金额（浮点元，非"分"）
  categoryId: "c_xxx",        // 子分类 id
  category: "午餐",            // 子分类名称（冗余，便于展示）
  categoryIcon: "🍜",
  parentCategoryId: "p_xxx",  // 父分类 id
  parentCategory: "餐饮",
  parentCategoryIcon: "🍽️",
  note: "和同事聚餐",
  images: [],                 // 本地图片路径数组（wxfile://）
  createdAt: 1700000000000    // 毫秒时间戳
}

accounting_category           // 自定义分类（父-子两级）
{
  _id: "...",
  type: "expense",            // expense / income
  name: "餐饮",
  icon: "🍽️",
  children: [{ _id, name, icon }],
  createdAt: 1700000000000
}
```

> 说明：早期规划曾用"分"存储以规避浮点误差，实际落地为**浮点元**；聚合误差由 `utils/stats-cache.js` 本地预聚合缓存控制，展示层统一格式化。

#### 4.3 日记集合（diary）

```javascript
diary
{
  _id: "...",
  title: "",
  content: "",
  mood: "happy",              // happy / calm / sad / angry / tired / excited
  moodIcon: "😄",
  weather: "☀️",
  images: [],                 // 本地图片路径数组
  createdAt: 1700000000000,   // 毫秒时间戳
  updatedAt: 1700000000000
}
```

#### 4.4 打卡集合（checkin_habit / checkin_record）

```javascript
checkin_habit                 // 习惯列表
{
  _id: "...",
  name: "每日喝水",
  icon: "💧",
  color: "#4A90D9",
  createdAt: 1700000000000
}

checkin_record                // 打卡日志
{
  _id: "...",
  habitId: "...",
  habitName: "每日喝水",
  date: "2026-11-24",         // YYYY-MM-DD，按日去重统计
  createdAt: 1700000000000
}
```

连续打卡天数不冗余存储，由 `utils/checkin.js` 的 `calcStreaks` 基于 `checkin_record.date` 实时计算（含最长连续、当前连续）。

#### 4.5 待办集合（todo）

```javascript
todo
{
  _id: "...",
  title: "写周报",
  note: "",                   // 备注
  priority: "high",           // high / medium / low
  dueDate: "2026-11-24",      // 截止日期 YYYY-MM-DD（可选）
  completed: false,           // 是否已完成（字段名是 completed，不是 done）
  completedAt: null,          // 完成时间戳
  createdAt: 1700000000000
}
```

> 首页"待办"统计 = `todo` 集合中 `completed === true` 的记录数；番茄钟（`pages/todo/pomodoro`）完成后可一键关联标记待办完成。

#### 4.6 健康集合（health_*）

健康模块拆分为多个细粒度集合，便于独立录入与统计：

| 集合 | 用途 |
|------|------|
| `health_profile` | 健康档案（身高、血型、过敏史等基础信息） |
| `health_medication` | 用药记录 |
| `health_visit` | 就诊记录 |
| `health_period` | 经期记录 |
| `health_height` | 身高记录（历史曲线追踪） |
| `health_weight` | 体重记录 |
| `health_bp` | 血压记录（含脉搏） |
| `health_glucose` | 血糖记录 |
| `health_water` | 饮水记录（`amount` 单位 ml） |
| `health_sleep` | 睡眠记录（`duration` 单位小时） |
| `health_exercise` | 运动记录 |
| `health_oxygen` | 血氧记录 |
| `health_temperature` | 体温记录 |
| `health_uric_acid` | 尿酸记录 |
| `health_cholesterol` | 血脂记录（总胆 / LDL / HDL / 甘油三酯 TG） |

各集合通用字段：`_id` + 业务数值字段 + `date` / `createdAt`（毫秒时间戳）。

#### 4.7 统计缓存集合（stats_daily）

`utils/stats-cache.js` 将记账数据按日预聚合后写入 `stats_daily`，避免每次打开页面全量扫描，提升首页 / 统计页加载速度。

### 设计原则

1. **本地优先**: 默认全部数据存本机 Storage，开箱即用、离线可用；云端为可选增强，通过 `db.switchMode` 切换
2. **数据隔离**: 云端模式通过 `_openid` 自动隔离；本地模式天然单用户
3. **时间一致**: 统一使用**毫秒时间戳**（`Date.now()`），不依赖服务端时钟，排序与区间查询统一
4. **引用冗余**: 分类/习惯等引用信息冗余存储名称/图标（如 `categoryIcon`），减少联查
5. **金额单位**: 记账金额用**浮点元**存储；统计层用 `utils/stats-cache.js` 预聚合，展示统一格式化
6. **集合常量化**: 所有集合名集中定义在 `config.COLLECTIONS`，业务代码不硬编码

---

## 五、核心交互设计

### 5.1 记账流程（目标：3 秒完成记账）

```
点击 Tab「记账」
    ↓
点击「+ 记支出」或「- 记收入」
    ↓
弹出底部半屏面板
    ├── 大金额输入（自动聚焦，数字键盘）
    ├── 分类网格（8-12 个图标按钮）
    ├── 备注输入（可选，折叠）
    └── 时间选择（默认当前时间）
    ↓
选中分类后 → 自动保存（无需点确认）
    ↓
返回列表 → 顶部 Toast「已保存 💰」
```

**关键优化**:
- 金额输入框**自动聚焦**，数字键盘弹出
- 分类选择后**立即保存**，不需要二次确认
- 分类网格用**大图标 + 少文字**，一眼可点

### 5.2 日记流程（目标：表情打日记 + AI 帮写）

```
首页点击「写日记」
    ↓
进入全屏编辑页
    ├── 标题输入（可选）
    ├── 心情选择器（6 个表情，点击即选）
    ├── 天气标签（横向滚动）
    ├── 正文输入（支持语音转文字）
    └── 图片附件（最多 9 张）
    ↓
点击右上角「AI 帮我写」→ 调用大模型生成内容
    ↓
点击「保存」→ 存入云数据库
```

### 5.3 打卡流程（目标：一键点亮）

```
首页今日概览 → 显示今日未完成习惯
    ↓
点击习惯卡片 → 「打卡」按钮变亮
    ↓
连续天数 +1，触发：
    ├── 🔥 连续 X 天火焰图标
    ├── 🎉 成就解锁（连续 7/30/100 天）
    └── 💬 AI 激励语（"已经坚持 X 天了，真棒！"）
```

### 5.4 数据统计交互

```
进入统计页
    ↓
顶部筛选: 本周 / 本月 / 全年
    ↓
数据卡片:
    ├── 支出趋势柱状图（按天展示）
    ├── 分类占比饼图
    ├── 心情热力图（日记情绪分布）
    └── 交叉洞察（睡眠 vs 运动 vs 情绪）
    ↓
底部: AI 智能洞察文本
```

---

## 六、产品创新点（结合潮流趋势）

### 🔮 趋势 1: AI 原生（AI-Native）

| 功能 | 描述 |
|------|------|
| AI 语音记账 | 说"午饭 25"→ 自动识别金额、分类、时间 |
| AI 日记润色 | 写完草稿 → AI 帮你润色成有温度的文字 |
| AI 情绪洞察 | 分析日记情绪曲线，发现"我什么时候最焦虑" |
| AI 年度报告 | 年底自动生成"你的 2026"，带数据可视化和 AI 总结 |
| AI 智能提醒 | 根据你的习惯数据，AI 判断"你今天该喝水了" |

### 🌙 趋势 2: 极简设计 + Dark Mode

- iOS 风格大圆角卡片 + 柔和阴影
- Emoji 替代图标，零学习成本
- 支持深色模式切换
- 主色 `#4A90D9`（晴空蓝）代表记录的心情

### 🎮 趋势 3: 游戏化激励（Gamification）

| 机制 | 详情 |
|------|------|
| 连续天数 | 每连续 7/30/100 天有里程碑奖励 |
| 成就徽章 | 初心者 🥉 / 坚持者 🥈 / 达人 🥇 |
| 日历热力图 | GitHub 风格的打卡日历，直观展示坚持程度 |
| 每日激励语 | AI 根据你的数据生成个性化鼓励 |

### 🔗 趋势 4: 数据互通 + 交叉分析

**差异化功能**:

- "你最近加班多吗？" → 待办完成时间 + 日记情绪 + 睡眠时长 → AI 给答案
- "这月钱花哪了？" → 支出分类饼图 + 趋势柱状图 + AI 建议
- "你的能量曲线" → 睡眠 + 运动 + 打卡完成率 → 每天精力评分

### ☁️ 趋势 5: 本地优先 + 云端可选同步

- 默认数据存本机 Storage，开箱即用、离线可用、隐私可控
- 需要多端同步时，在设置页切换到云端模式（配置云环境 ID 后），数据通过 `wx.cloud.database` 同步
- 集合结构在本地 / 云端完全一致，切换无需改业务代码
- 支持本地数据一键导出（复制到剪贴板），便于备份迁移

### 🧘 趋势 6: 反内卷 + 松弛感

- 首页只有"今日概览"，没有焦虑的排名和 KPI
- 所有数据只属于用户自己，没有公开社交
- 偶尔中断打卡不会清零连续天数（宽容机制）
- AI 建议是"温柔的提醒"而非"焦虑的催促"

---

## 七、迭代路线图

### Phase 1: MVP（1-2 个月）✅ 当前阶段

| 任务 | 状态 | 备注 |
|------|------|------|
| 项目框架搭建 | ✅ 已完成 | 模块化嵌套目录 + 21 个页面骨架 |
| 模板清理 | ✅ 已完成 | 删除所有模板无用代码 |
| 全局样式系统 | ✅ 已完成 | 卡片/按钮/颜色变量 |
| TabBar 导航 | ✅ 已完成 | 首页/记账/日记/我的（4 Tab） |
| 云函数通用 CRUD | ✅ 已完成 | create/query/update/delete/stats |
| 模块化目录结构 | ✅ 已完成 | 8 模块 → 21 子页面 |
| **记账模块完整功能** | 🔨 开发中 | 分类/预算/报表 |
| **首页 Dashboard 数据联动** | 📋 待开始 | 聚合各模块数据 |

### Phase 2: 核心体验（2-3 个月）

- [ ] 完整记账功能（自定义分类、预算管理、月度报表）
- [ ] 日记功能完善（心情日历、图片上传、富文本编辑）
- [ ] 打卡功能（习惯管理、连续天数、日历热力图）
- [ ] 数据本地缓存 + 云端同步策略
- [ ] 成就徽章系统初版

### Phase 3: 健康 + 待办（3-4 个月）

- [ ] 饮水追踪（环形进度、快捷添加、每日目标）
- [ ] 睡眠记录（手动录入、质量评分）
- [ ] 运动记录（6 种类型、时长/距离/卡路里）
- [ ] 待办管理（优先级、截止日期、番茄钟计时器）

### Phase 4: AI 赋能（4-6 个月）

- [ ] AI 语音记账
- [ ] AI 日记润色
- [ ] 情绪曲线分析
- [ ] AI 年度报告生成
- [ ] 交叉洞察功能（睡眠 vs 情绪 vs 消费）

### Phase 5: 差异化（6+ 个月）

- [ ] 数据导出（PDF / Excel）
- [ ] 年度回忆视频
- [ ] 深色模式
- [ ] 桌面小组件（快捷打卡）
- [ ] 微信服务消息通知

---

## 八、技术亮点

### 8.1 云函数架构

采用 **Action 路由模式**，一个云函数搞定所有业务：

```javascript
// cloudfunctions/quickstartFunctions/index.js
exports.main = async (event, context) => {
  const { action } = event;
  switch (action) {
    case "getOpenId":  return await getOpenId();
    case "create":     return await createRecord(event);
    case "query":      return await queryRecords(event);
    case "update":     return await updateRecord(event);
    case "delete":     return await deleteRecord(event);
    case "stats":      return await aggregateStats(event);
    default:           return { success: false, errMsg: `unknown action: ${action}` };
  }
};
```

> 实际前端并不直接调用云函数做 CRUD，而是通过 `utils/db.js` 抽象层访问数据（详见 4.0 / 8.4）。云函数 `quickstartFunctions` 主要用于 `getOpenId` 等需要服务端鉴权的场景。云端模式下集合名与字段结构与本地完全一致：

```javascript
// 真实前端用法（本地 / 云端自适应）
const db = require('./utils/db.js');
await db.add(db.COLLECTIONS.ACCOUNTING, {
  type: "expense",
  amount: 25.5,                 // 浮点元
  categoryId: "c_xxx",
  createdAt: Date.now()
});
```

### 8.2 云函数 Action 说明

| Action | 说明 | 参数 |
|--------|------|------|
| `getOpenId` | 获取用户 openid | 无 |
| `create` | 创建记录 | collection, data |
| `query` | 查询记录 | collection, where, orderBy, limit, skip |
| `update` | 更新记录 | collection, _id, data |
| `delete` | 删除记录 | collection, _id |
| `stats` | 聚合统计 | collection, pipeline (聚合管道) |

### 8.3 数据安全

- 所有数据通过 `_openid` 自动隔离（云开发内置）
- 用户无需手动登录，openid 在云函数中自动获取
- 敏感操作（导出数据）可加二次确认

### 8.4 数据访问层与金额精度

前端通过 `utils/db.js` 统一访问数据，屏蔽本地 / 云端差异：

```javascript
const db = require('./utils/db.js');

// 新增记账
await db.add(db.COLLECTIONS.ACCOUNTING, {
  type: 'expense',
  amount: 25.5,          // 浮点元
  categoryId: 'c_xxx',
  createdAt: Date.now()
});

// 切换存储模式（设置页调用）
db.switchMode('cloud');  // 或 'local'
```

金额单位为**浮点元**（如 `25.5` = 25.50 元）。为降低多次累加的浮点误差对统计的影响，`utils/stats-cache.js` 在每次记账变更时按日预聚合，页面优先读缓存。

---

## 九、当前项目状态

### 9.1 已完成 ✅

- 模板无用代码全部清除（example 页面、模板图片、示例云函数、cloudTipModal 组件、envList.js）
- 项目重命名为 `life-journal`（生活记）
- **模块化嵌套目录结构**：每个大模块一个文件夹，模块内多个子页面文件夹
- 21 个页面骨架（每个页面包含 .js / .json / .wxml / .wxss）

| 模块 | 页面 | 路径 | 状态 |
|------|------|------|------|
| 🏠 首页 | 首页 Dashboard | pages/home/index/ | ✅ 骨架完成（TabBar） |
| 💰 记账 | 记账列表 | pages/accounting/index/ | ✅ 骨架完成（TabBar） |
| | 新增记账 | pages/accounting/edit/ | ✅ 骨架完成 |
| | 记账统计 | pages/accounting/stats/ | ✅ 骨架完成 |
| 📝 日记 | 日记列表 | pages/diary/index/ | ✅ 骨架完成（TabBar） |
| | 写日记 | pages/diary/editor/ | ✅ 骨架完成 |
| | 日记详情 | pages/diary/detail/ | ✅ 骨架完成 |
| ✅ 打卡 | 习惯列表 | pages/checkin/index/ | ✅ 骨架完成 |
| | 创建习惯 | pages/checkin/create/ | ✅ 骨架完成 |
| | 打卡日历 | pages/checkin/calendar/ | ✅ 骨架完成 |
| 🎯 待办 | 任务列表 | pages/todo/index/ | ✅ 已实现（筛选 / 优先级 / 逾期 / 快速完成） |
| | 新建待办 | pages/todo/edit/ | ✅ 已实现（标题 / 优先级 / 截止日期 / 备注） |
| | 番茄钟 | pages/todo/pomodoro/ | ✅ 已实现（25/5/15 分钟模式，完成可标记待办） |
| 💪 健康 | 健康总览 | pages/health/index/ | ✅ 骨架完成 |
| | 饮水追踪 | pages/health/water/ | ✅ 骨架完成 |
| | 睡眠记录 | pages/health/sleep/ | ✅ 骨架完成 |
| | 运动记录 | pages/health/exercise/ | ✅ 骨架完成 |
| 📊 统计 | 数据洞察 | pages/stats/index/ | ✅ 已实现（月度收支 / 近 7 天柱状图 / 打卡 / 待办完成率） |
| 📋 我的 | 个人中心 | pages/profile/index/ | ✅ 已实现（昵称编辑 / 累计概览 / 菜单入口，TabBar） |
| | 成就徽章 | pages/profile/achievements/ | ✅ 已实现（8 枚徽章，基于真实数据实时计算） |
| | 设置 | pages/profile/settings/ | ✅ 已实现（4 套主题切换 / 存储模式切换 / 数据导出 / 清除） |

- 云函数通用 CRUD 入口（quickstartFunctions）
- 全局样式系统（app.wxss: 卡片、按钮、颜色变量）
- TabBar 导航结构（app.json: 首页 / 记账 / 日记 / 我的）
- 全局数据结构（app.js: userInfo / openId）

### 9.2 待配置 ⚠️

| 任务 | 位置 | 说明 |
|------|------|------|
| 填入云环境 ID（本地模式无需） | `miniprogram/utils/config.js` 的 `CLOUD_ENV` | 开通云开发后获取；仅云端模式需要 |
| 部署云函数（本地模式无需） | cloudfunctions/quickstartFunctions/ | 右键 → 上传并部署：云端安装依赖 |
| 创建数据库集合（仅云端模式需要） | 云开发控制台 | accounting, accounting_category, diary, checkin_habit, checkin_record, todo, health_profile, health_medication, health_visit, health_period, health_weight, health_bp, health_glucose, health_water, health_sleep, health_exercise, health_oxygen, health_temperature, health_uric_acid, health_cholesterol, stats_daily, settings |

### 9.3 项目目录结构

```
myApp/
├── cloudfunctions/
│   └── quickstartFunctions/
│       ├── index.js              # 云函数入口（通用 CRUD）
│       ├── package.json
│       └── config.json
├── miniprogram/
│   ├── app.js                    # 入口（云开发初始化）
│   ├── app.json                  # 全局配置（21 个路由 + 4 TabBar）
│   ├── app.wxss                  # 全局样式
│   ├── sitemap.json
│   └── pages/                           # 模块化嵌套结构
│       ├── home/                        # 🏠 首页模块
│       │   ├── index.js/json/wxml/wxss  #   Dashboard（TabBar）
│       ├── accounting/                  # 💰 记账模块
│       │   ├── index.js/json/wxml/wxss  #   记账列表（TabBar）
│       │   ├── edit.js/json/wxml/wxss   #   新增记账
│       │   └── stats.js/json/wxml/wxss  #   记账统计
│       ├── diary/                       # 📝 日记模块
│       │   ├── index.js/json/wxml/wxss  #   日记列表（TabBar）
│       │   ├── editor.js/json/wxml/wxss #   写日记
│       │   └── detail.js/json/wxml/wxss #   日记详情
│       ├── checkin/                     # ✅ 打卡模块
│       │   ├── index.js/json/wxml/wxss  #   习惯列表
│       │   ├── create.js/json/wxml/wxss #   创建习惯
│       │   └── calendar.js/json/wxml/wxss # 打卡日历
│       ├── todo/                        # 🎯 待办模块
│       │   ├── index.js/json/wxml/wxss  #   任务列表
│       │   ├── edit.js/json/wxml/wxss   #   新建待办
│       │   └── pomodoro.js/json/wxml/wxss # 番茄钟
│       ├── health/                      # 💪 健康模块
│       │   ├── index.js/json/wxml/wxss  #   健康总览
│       │   ├── water.js/json/wxml/wxss  #   饮水追踪
│       │   ├── sleep.js/json/wxml/wxss  #   睡眠记录
│       │   └── exercise.js/json/wxml/wxss # 运动记录
│       ├── stats/                       # 📊 统计模块
│       │   ├── index.js/json/wxml/wxss  #   数据洞察
│       └── profile/                     # 📋 个人中心模块
│           ├── index.js/json/wxml/wxss  #   个人中心（TabBar）
│           ├── achievements.js/json/wxml/wxss # 成就徽章
│           └── settings.js/json/wxml/wxss # 设置
├── project.config.json
├── project.private.config.json
└── PRODUCT_DESIGN.md             # 本文档
```

---

## 十、后续开发跟踪

### 下一步开发建议

按优先级依次实现：

| 优先级 | 模块 | 理由 |
|--------|------|------|
| P0 | 💰 记账模块 | 核心高频功能，首页 Dashboard 的数据基础 |
| P0 | 🏠 首页 Dashboard | 需要聚合各模块数据，依赖记账模块 |
| P1 | 📝 日记模块 | 情感连接强，用户留存关键 |
| P1 | ✅ 打卡模块 | 游戏化激励，增长引擎 |
| P2 | 🎯 待办模块 | 生产力工具 |
| P2 | 💪 健康模块 | 数据完整性 |
| P3 | 📊 统计模块 | 依赖所有模块数据 |
| P3 | 📋 个人中心 | 设置/成就/导出 |

### 开发日志

> 后续每次重要开发更新都在此记录，保持文档与代码同步。

**2026-11-24（对齐真实代码）**
- 修正文档与实现的三处偏差：集合结构、金额单位、存储策略
- 数据库章节重写：集合名对齐 `config.COLLECTIONS`（记账合并为 `accounting`、日记 `diary`、打卡 `checkin_habit`/`checkin_record`、待办 `todo`、健康拆分为 14 个 `health_*` 集合、新增 `stats_daily` 缓存集合）
- 金额单位由"分"更正为**浮点元**，并说明 `utils/stats-cache.js` 预聚合策略
- 新增「4.0 数据访问层与本地优先存储策略」：`db.js` 抽象层 + `local`/`cloud` 双适配器，默认本地模式，设置页可切换
- 待办完成字段由 `done` 更正为 `completed`；时间字段统一为毫秒时间戳
- 健康集合由 3 个补全为 14 个细粒度集合
- 移除独立 `users` 集合描述，改为本地 Storage + `settings` 集合的真实方案
- 同步修复 `db.switchMode` 闭包 Bug（`adapter` 改为 `let` 并在切换时同步更新），设置页存储模式切换真实可用
- 落地 todo 模块 3 页、stats 数据洞察页、profile 个人中心 / 成就 / 设置 3 页；清理 `app.js` 与首页调试日志，仅保留真实错误日志

---

## 附录

### A. 设计规范

| 元素 | 规格 |
|------|------|
| 主色 | `#4A90D9` 晴空蓝 |
| 辅色 | `#FF6B6B` 暖红（支出）/ `#2ECC71` 翠绿（收入）/ `#9B59B6` 紫（日记） |
| 背景色 | `#FAFAFA` |
| 卡片圆角 | 20rpx |
| 按钮圆角 | 48rpx |
| 字体 | -apple-system / PingFang SC |
| 正文大小 | 28rpx |
| 标题大小 | 34rpx |

### B. 参考资源

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云开发数据库 API](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/database/database.html)
- [云函数最佳实践](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/scf/)

---

> 本文档为 v1.0 版本，后续随产品迭代持续更新。最后更新: 2026-11-24