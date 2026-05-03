# Architecture Notes

本文件用于固定深渊21点当前 Web 版本的结构边界，避免后续继续膨胀回单文件实现。

## 一、设计原则

1. `origin/` 是只读参考
2. 正式实现优先保持规则纯函数化
3. 视觉表现和状态转移分离
4. 面向 Unity 迁移时，优先迁移规则层而不是 React 组件

## 二、当前分层

### 1. 配置层

文件：[src/game/config.js](src/game/config.js)

职责：

- 统一管理生命值、关卡目标、商店价格、结算时长、花色池等常量
- 避免“魔法数字”散落在组件里

### 2. 规则层

文件：

- [src/game/domain/cards.js](src/game/domain/cards.js)
- [src/game/domain/engine.js](src/game/domain/engine.js)

职责：

- 卡牌数据创建
- 牌堆洗牌和抽牌
- 手牌计分
- 开局、拿牌、停牌、结算、商店、下一阶段等状态转移

约束：

- 不依赖 React
- 尽量返回新状态而不是修改原状态
- 尽量不包含浏览器或 DOM 逻辑

### 3. 状态适配层

文件：[src/game/hooks/useAbyssalBlackjack.js](src/game/hooks/useAbyssalBlackjack.js)

职责：

- 用 `useReducer` 承接规则层状态机
- 把结算延时这类 UI 时序绑定到 React 生命周期
- 向页面层暴露明确的 actions

### 4. 页面与组件层

文件：

- [src/features/game/GameShell.jsx](src/features/game/GameShell.jsx)
- [src/features/game/components/StartScreen.jsx](src/features/game/components/StartScreen.jsx)
- [src/features/game/components/BattleScreen.jsx](src/features/game/components/BattleScreen.jsx)
- [src/features/game/components/ShopScreen.jsx](src/features/game/components/ShopScreen.jsx)
- [src/features/game/components/EndScreen.jsx](src/features/game/components/EndScreen.jsx)
- [src/features/game/components/CardView.jsx](src/features/game/components/CardView.jsx)
- [src/features/game/components/StatBar.jsx](src/features/game/components/StatBar.jsx)

职责：

- 负责场景切换
- 负责交互按钮映射到 actions
- 负责卡牌、状态栏、结算提示等显示逻辑

约束：

- 不直接写核心规则判断
- 不在组件里复制规则层已有计算
- UI 只消费状态，不重定义状态含义

### 5. 样式层

文件：[src/styles/app.css](src/styles/app.css)

职责：

- 复刻原 demo 的暗色、霓虹、移动端单屏卡牌体验
- 管理组件视觉规范

## 三、为什么这样拆

原始 demo 是单文件组件，适合快速验证，但会出现几个问题：

1. 状态和副作用混在一起，结算容易出现重复判断
2. UI 与规则耦合，后续改动画或改数值都容易互相影响
3. 很难迁移到 Unity，因为大部分逻辑附着在 React 生命周期上

现在的拆法，核心目标是把“什么状态会发生变化”与“状态如何被呈现”分开。

## 四、后续扩展建议

### 新增卡牌效果

优先改这里：

- [src/game/domain/cards.js](src/game/domain/cards.js)
- [src/game/domain/engine.js](src/game/domain/engine.js)

做法：

- 先定义卡牌数据结构变化
- 再定义抽到、使用、结算时的状态转移
- 最后在 UI 上补展示

### 新增商店服务

优先改这里：

- [src/game/config.js](src/game/config.js)
- [src/game/domain/engine.js](src/game/domain/engine.js)
- [src/features/game/components/ShopScreen.jsx](src/features/game/components/ShopScreen.jsx)

### 新增场景或流程

优先改这里：

- [src/features/game/GameShell.jsx](src/features/game/GameShell.jsx)
- [src/game/hooks/useAbyssalBlackjack.js](src/game/hooks/useAbyssalBlackjack.js)

## 五、面向 Unity 的迁移策略

推荐拆成三步：

1. 把规则层进一步收敛成纯数据输入输出
2. 给关键结算路径补测试，防止迁移时行为漂移
3. 在 Unity 中用 ScriptableObject 或配置资源承载卡牌定义与阶段配置

对应关系建议：

- `config.js` -> Unity 配置资源
- `domain/*.js` -> Unity 规则服务或状态机
- `hooks/*.js` -> Unity 控制器层
- `features/game/components/*` -> Unity UI Prefab 与视图脚本

## 六、当前已知不足

1. 当前版本完成的是“复刻后重构”的第一步，规则仍然偏轻量
2. 还没有自动化测试
3. 还没有把卡牌与阶段改成外部数据配置
4. 与 origin 中更复杂的 NPC、技能、特殊牌机制相比，当前正式版仍是简化版本

## 七、下一阶段建议

1. 对照 `origin/` 补齐缺失机制清单
2. 给规则层补单元测试
3. 把卡牌、阶段、商店改造成可配置数据
4. 再决定是否开始 Unity 原型迁移
