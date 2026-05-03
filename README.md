# AbyssalBlackjack

深渊21点（AbyssalBlackjack）是一个围绕 21 点规则展开的单人卡牌对战游戏。你将在层层推进的深渊中与庄家对弈，通过抽牌、停牌、定向塞牌、重抽、小丑牌博弈与附魔构筑来完成整局挑战。

## 在线预览

- Pages: <http://blog.onovich.com/AbyssalBlackjack/>

## 玩法特点

- 以 21 点为核心，但加入了牌组构筑与层级推进
- 小丑牌具有独立的掷骰增长机制，风险与收益同步放大
- 支持定向塞牌与战术重抽，能主动改变对局节奏
- 每层胜利后可获得附魔或商店选择，逐步塑造牌组

## 技术栈

- React
- Vite
- Tailwind CSS
- GitHub Actions + GitHub Pages

## 本地运行

### 环境要求

- Node.js 20+
- npm

### 启动开发环境

```bash
npm install
npm run dev
```

### 生产构建

```bash
npm run build
```

## 部署

项目在推送到 `main` 后通过 GitHub Actions 自动构建，并发布到 GitHub Pages。

## 项目结构

```text
.
├── .github/workflows/
├── docs/
├── origin/
├── src/
│   ├── components/game/
│   ├── game/
│   │   ├── domain/
│   │   └── hooks/
│   └── styles/
├── package.json
└── vite.config.js
```

## 文档

- 待办清单：[docs/TODO.md](docs/TODO.md)
- 经验归档：[docs/lessons-learned.md](docs/lessons-learned.md)
- 后续路线：[docs/next-steps.md](docs/next-steps.md)
