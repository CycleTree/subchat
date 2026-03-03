# subchat

OpenClaw サブエージェント間会話観測UI

## Overview

OpenClaw WebUIレベルのチャット機能を提供し、サブエージェント同士の会話をリアルタイムで観測できるツール。

## Features

- 🤖 サブエージェント一覧（階層表示）
- 💬 会話履歴ビューワー（リアルタイムストリーム）
- 🔄 セッション切り替え
- 🔗 OpenClaw Gateway API 直結

## Architecture

```
packages/
├── core/          # OpenClaw WebSocket クライアント
├── ui/            # Vite + React フロントエンド
└── shared/        # 共通型定義
```

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **WebSocket**: OpenClaw Gateway API

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

MIT