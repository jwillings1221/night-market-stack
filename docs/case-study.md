# 夜市叠叠高：移动端 Canvas 游戏案例

版本：`v1.0-rc.2`  
在线试玩：[jwillings1221.github.io/night-market-stack](https://jwillings1221.github.io/night-market-stack/)  
源码：[github.com/jwillings1221/night-market-stack](https://github.com/jwillings1221/night-market-stack)

## English Summary

Night Market Stack is a mobile-first one-tap stacking game built with vanilla JavaScript, Canvas 2D, and WebAudio. Gameplay rules live in a browser/Node-compatible UMD module so deterministic logic can be tested without a browser. The project includes 13 smoke tests, a 98-snapshot pre/post-refactor comparison, and a fixed-seed 20-game balance run. It is deployed as a static site on GitHub Pages, with original pixel-art visuals and code-generated audio. The current release is a candidate; real-device playtesting is still the main validation gap.

## 项目目标

这个项目是为前端/全栈实习准备的可公开玩作品，目标不是堆叠功能，而是完整走一遍产品与工程闭环：

1. 把通用“点击叠放”玩法拆成可解释的规则和参数。
2. 在手机浏览器中做到触控可用、画面清晰、帧率稳定。
3. 用自动化测试验证规则，而不是只靠反复手玩。
4. 以零运行时第三方依赖发布到 GitHub Pages。
5. 如实记录已完成项、自动化验证和尚未完成的人工验收。

项目刻意不包含账号、排行榜、内购、广告、多人模式和后端。这些功能不能帮助当前作品更快证明核心能力，反而会增加范围和数据合规成本。

## 核心玩法

玩家点击或触摸屏幕，让移动中的小吃落到牌堆顶部。

- 新方块只保留与上一块重叠的部分。
- 中心偏差不超过 12px 时触发 PERFECT，连击数增加。
- PERFECT 基础得分为 11 分，随连击提高，单次最高 30 分。
- 普通落块得 5 分并清空连击。
- 水平重叠不足 10px 时游戏结束。
- 最高分和静音状态保存在浏览器 `localStorage`。

核心循环是：观察移动轨迹 → 点击落块 → 判定 → 视听反馈 → 速度上升 → 重复或失败。

## 技术架构

| 层级 | 实现 | 原因 |
|---|---|---|
| 页面与输入 | 单页 HTML、Pointer Events | 减少加载和交互层级，兼容触屏与鼠标 |
| 游戏画面 | Canvas 2D | 适合高频方块、像素场景和粒子渲染 |
| 游戏规则 | `logic.js`，UMD | 浏览器和 Node 共用同一份纯逻辑 |
| 音效与 BGM | WebAudio 振荡器实时合成 | 不下载音频文件，不依赖第三方素材 |
| 存档 | `localStorage` | 仅保存最高分和静音设置，需求足够简单 |
| 自动测试 | Node.js `assert` | 无测试框架依赖，命令直接运行 |
| 发布 | GitHub Pages | 静态文件可直接托管，无需服务器 |

`logic.js` 对外提供：

- `overlap(current, previous)`：计算水平重叠宽度。
- `judge(current, previous, config)`：返回重叠区间、中心偏差和判定状态。
- `scoreFor(status, combo)`：返回本次得分和新的连击数。
- `createRoundState(options)`：通过注入的随机函数和类型函数创建回合状态。

## 关键难点与处理

### 1. 让“手感”可调，同时保持结果可复现

如果使用真人每次点击来调难度，结果会受到注意力和操作习惯影响。项目使用固定种子和固定误差模型的机器人完成 20 局，记录每局点击数、分数、方块数和失败位置。最终平均为 30.75 次点击，最短 27、最长 38。

这组数据只能说明自动模型下的难度稳定，不能冒充真人体验数据。

### 2. 特效随机不能污染玩法随机

粒子方向、颜色和寿命如果直接调用 `Math.random()`，会改变后续方块位置，使同一操作无法复现。项目使用独立的 `fxR()` 随机流，视觉效果不会消耗玩法随机序列；固定种子 20 局在不同特效种子下结果完全一致。

### 3. 把埋在大脚本里的规则抽成可测试模块

初期判定、计分和重开状态都写在 `index.html` 中，只能通过浏览器运行。Day 4 将纯逻辑抽到 `logic.js`，保留 98 个抽离前后的固定种子状态快照进行对比，要求分数、连击、方块宽度和失败位置完全一致。

随后编写 13 项 Node 测试，覆盖：

- 完全重合、部分重合、完全错开。
- PERFECT 边界、普通判定、失败阈值。
- 连击计分、封顶和普通落块清零。
- 重开初始状态与对象独立性。
- PERFECT、普通、失败的组合流程。

为确认测试不是永远通过，曾在临时副本中故意把 PERFECT 的 `<=` 改成 `<`，测试立即失败。

### 4. 手机布局与触控

- 使用 9:16 舞台与 `100dvh`，适配不同手机可视高度。
- 使用 `env(safe-area-inset-*)` 避开刘海和底部安全区。
- Canvas 最高使用 2× DPR，兼顾清晰度和像素风一致性。
- 页面禁用滚动、缩放和长按选择，避免触屏操作被浏览器手势打断。
- 全屏响应 Pointer Events，同时用 120ms 输入锁防止双击误消费两块。

自动验收使用 390×844、2× DPR 的移动视口。真实手机上的刘海、外放音量和震屏强度仍需真人确认。

### 5. 零素材的视听表达

所有像素场景、小吃、粒子和界面均由 Canvas/CSS 代码绘制；音效、BGM 和铃声由 WebAudio 实时合成。色彩来自固定像素风调色板，BGM 使用 92 BPM 五声音阶循环，避免引入第三方图片、字体、音乐或版权不明的素材。

AudioContext 只在首次用户手势后创建，满足移动浏览器自动播放限制。BGM 与音效共用静音状态和总增益，刷新后仍保留用户选择。

## 验证结果

| 验证项 | 结果 |
|---|---|
| Node 逻辑测试 | 13/13 通过，连续运行结果一致 |
| 逻辑抽离前后对比 | 98 个固定种子快照完全一致 |
| 难度回归 | 20 局平均 30.75 次点击，最短 27、最长 38 |
| 帧率 | Chrome 手机视口约 60.28 FPS |
| 移动布局 | 390×844、2× DPR，无滚动或横向溢出 |
| 浏览器流程 | 开始、落块、计分、失败、重开、音效、静音和 BGM 正常 |
| 网络依赖 | 无外部图片、字体、音频或 API 请求 |
| 运行时体积 | `index.html` + `logic.js` 约 35.4 KB |
| 线上地址 | GitHub Pages 返回 200，无控制台错误 |

## 局限

- 尚未完成 3~5 名真人在真实手机上的试玩，因此没有用户留存、完成率或主观满意度数据。
- 20 局机器人测试只能验证规则和难度稳定性，不能代替真人操作习惯。
- BGM 和音效由程序合成，不是专业混音；手机外放效果仍需试听。
- 当前没有后端，所以最高分和静音状态不会跨设备同步。
- GitHub Pages 依赖公开仓库与 Pages 服务，并不是独立部署基础设施。
- AI 参与了代码生成，但玩法取舍、视觉反馈、验收标准、测试结果和限制判断需要开发者能够解释和负责。

## 下一步

1. 邀请 3~5 人完成真实手机试玩，不先解释玩法，观察前 30 秒。
2. 按“能否独立开始、是否理解判定、触控是否延迟、音量是否合适”排序问题，最多修 3 项。
3. 修复后重新运行逻辑测试、移动端浏览器回归和 20 局统计。
4. 只有真人反馈完成后再创建 `v1.0` 标签，不把候选版说成最终用户验证版本。

## 面试要点

这个项目最有价值的不是“用了多少技术”，而是形成了可解释的工程闭环：

- 先把玩法写成明确规则，再实现最小可玩版本。
- 用量化参数调整手感，用独立随机流保护可复现性。
- 把关键规则从表现层抽离，用测试和快照证明重构没有改变行为。
- 把移动端适配、音频手势限制和静态部署作为交付的一部分。
- 对没有做完的真人验证保持诚实，不拿自动测试冒充用户反馈。
