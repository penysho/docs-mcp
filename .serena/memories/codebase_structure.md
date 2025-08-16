# コードベース構造

## ディレクトリ構成
```
src/
├── index.ts              # アプリケーションエントリーポイント
├── auth.ts               # (レガシー？) 認証関連
├── googleDocsService.ts  # (レガシー？) サービス関連
├── config/               # 設定管理
│   ├── index.ts          # 統一設定管理 (ConfigManager, getConfig)
│   └── appConfig.ts      # アプリケーション設定定義
├── core/                 # コアアーキテクチャ
│   ├── container.ts      # ServiceContainer - 依存性注入
│   └── interfaces.ts     # TypeScript インターフェース定義
├── mcp/                  # MCP関連
│   ├── server.ts         # GoogleDocsMcpServer - メインサーバー
│   ├── registry.ts       # ToolRegistry - ツール自動登録
│   └── tools/            # MCPツール実装
│       ├── base.ts       # BaseMcpTool - 基底クラス
│       ├── index.ts      # ツールエクスポート
│       ├── createDocument.ts
│       ├── readDocument.ts
│       ├── searchDocuments.ts
│       └── updateDocument.ts
├── services/             # サービス層
│   ├── authService.ts    # Google OAuth2 認証管理
│   ├── googleDocsService.ts # Google Docs/Drive API操作
│   └── types.ts          # サービス型定義
└── utils/                # ユーティリティ
    ├── logger.ts         # Logger - モジュール別ログシステム
    └── errors.ts         # AppError - エラーハンドリング
```

## 重要なコンポーネント
1. **ServiceContainer** - 全サービスの管理と初期化
2. **GoogleDocsMcpServer** - MCPサーバーのメイン制御
3. **ToolRegistry** - ツールの自動登録と管理
4. **BaseMcpTool** - 全ツールの共通基底クラス