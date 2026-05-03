# AbyssalBlackjack

深渊21点（AbyssalBlackjack）是一个以 21 点为核心规则、带有轻度 roguelike 牌组构筑循环的 Web 游戏原型。当前版本以 Web 为主，后续目标是平滑迁移到 Unity。

## 当前状态

- 已提供可运行的 Web 版本
- 已接入 GitHub Actions 自动构建与 GitHub Pages 发布
- `origin/` 目录保留为原始 demo 参考，不参与正式实现开发
- 正式项目代码已从单文件组件拆分为规则层、状态层、界面层，便于维护和后续移植

## 在线预览

- Pages 站点：<http://blog.onovich.com/AbyssalBlackjack/>

## 开发目标

1. 严格参考 `origin/` 中 demo 的整体样式、节奏和交互体验
2. 不修改 `origin/` 中的原始参考文件
3. 在正式实现中完成逻辑、表现、数据的分层
4. 为未来 Unity 移植保留清晰的规则边界与状态边界

## 项目结构

```text
.
├── .github/workflows/        # Pages 自动部署工作流
├── docs/                     # 维护文档与架构说明
├── origin/                   # 原始 demo 参考，只读
├── src/
│   ├── features/game/        # UI 组件与页面壳层
│   ├── game/
│   │   ├── config.js         # 游戏常量
│   │   ├── domain/           # 纯规则与状态转移
│   │   └── hooks/            # React 侧状态绑定
│   └── styles/               # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 本地开发

### 依赖

- Node.js 20+
- npm

### 启动

```bash
npm install
npm run dev
```

### 构建

```bash
npm run build
```

## 部署

仓库使用 GitHub Actions 构建，并通过 GitHub Pages 发布。

- 工作流文件：[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
- Vite 基路径配置：[vite.config.js](vite.config.js)

当代码推送到 `main` 分支时，Pages 会自动重新部署。

## 分层说明

- 规则层：`src/game/domain/`
  - 负责发牌、计分、胜负判定、商店结算、阶段推进
  - 尽量保持与 React 无关，方便以后抽离到 Unity 共享规则实现
- 状态绑定层：`src/game/hooks/`
  - 负责把规则状态接入 React 生命周期
  - 当前结算延时等 UI 相关时序放在这里管理
- 表现层：`src/features/game/`
  - 负责页面组织、组件拆分与交互映射
- 样式层：`src/styles/`
  - 负责视觉复刻与界面氛围，不承担游戏规则

更多细节见 [docs/architecture.md](docs/architecture.md)。

## 迁移到 Unity 的建议路径

1. 先冻结当前 Web 版的规则行为，补齐关键机制测试
2. 把 `src/game/domain/` 的状态机逻辑抽象为更纯粹的数据驱动接口
3. 在 Unity 中重建表现层与动画层，仅复用规则与数据结构设计
4. 将局内配置、卡牌定义、商店参数逐步改造成可配置资源

## 约束

- 不在 `origin/` 下开发正式功能
- 不把演示样式与游戏规则混写回单文件组件
- 新功能优先遵守既有分层边界
