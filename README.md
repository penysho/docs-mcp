# Google Docs MCP Server

Google Docs APIと連携するMCP（Model Context Protocol）サーバーです。AI システムがGoogle Docsを直接操作できるインターフェースを提供します。

## 機能

このMCPサーバーが提供するツール：

- **read_google_document** - Google Docsドキュメントの読み取り
- **create_google_document** - 新しいGoogle Docsドキュメントの作成
- **update_google_document** - 既存のGoogle Docsドキュメントの更新
- **search_google_documents** - Google Docsドキュメントの検索

## アーキテクチャの特徴

- **依存性注入コンテナ** - ServiceContainerによるサービス管理
- **階層化エラーハンドリング** - 統一されたエラー処理システム
- **自動ツール登録** - 設定ベースのツール管理
- **完全なTypeScript** - 型安全性と開発効率の向上

## 技術スタック

- **Runtime**: [Node.js](https://nodejs.org/) (v14以上)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (ES2020/ESM)
- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) v1.10.2
- **Google APIs**: [googleapis](https://github.com/googleapis/google-api-nodejs-client) v148.0.0
- **Configuration**: [dotenv](https://github.com/motdotla/dotenv) + [zod](https://github.com/colinhacks/zod) validation

## セットアップ

### 1. プロジェクトの準備

```bash
git clone <repository-url>
cd docs-mcp
npm install
```

### 2. Google Cloud Platform の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 以下のAPIを有効化：
   - Google Docs API
   - Google Drive API
3. OAuth 2.0 クライアントIDを作成し、認証情報をダウンロード
4. `credentials.json` としてプロジェクトルートに配置

### 3. 環境設定（オプション）

`.env` ファイルで設定をカスタマイズできます：

```env
# アプリケーション環境 (development, production, test)
NODE_ENV=development

# ログ設定 (ERROR, WARN, INFO, DEBUG, TRACE)
LOG_LEVEL=INFO
LOG_USE_STDERR=true

# サーバー情報
SERVER_NAME=google-docs-mcp-server
SERVER_VERSION=1.0.0

# 認証ファイルパス（カスタマイズ可能）
CREDENTIALS_PATH=./credentials.json
TOKEN_PATH=./token.json
```

### 4. 初回認証

```bash
npm run dev
```

ターミナルに表示される認証URLにアクセスし、Googleアカウントで認証してください。認証後に取得したコードをターミナルに入力すると `token.json` が生成されます。

## 開発コマンド

```bash
# 開発サーバー（hot reload）
npm run dev

# プロダクションビルド
npm run build

# ビルド後の実行
npm start

# MCP デバッグモード
npm run mcp

# コード品質チェック
npm run lint
```

**ビルドプロセス**: TypeScript コンパイル → 実行権限設定 → 認証ファイル複製

## MCP クライアント設定

### Cursor での設定

`.cursor/mcp.json` に追加：

```json
{
  "mcpServers": {
    "google-docs": {
      "command": "node",
      "args": ["/absolute/path/to/docs-mcp/dist/index.js"]
    }
  }
}
```

### Claude Desktop での設定

`claude_desktop_config.json` に追加：

```json
{
  "mcpServers": {
    "google-docs": {
      "command": "node",
      "args": ["/absolute/path/to/docs-mcp/dist/index.js"]
    }
  }
}
```

**注意**: ビルド後の `dist/index.js` を指定してください。

## 提供ツール

### read_google_document
Google Docs ドキュメントの内容を読み取ります。

**パラメータ**:
- `documentId` (string): 読み取るドキュメントのID

### create_google_document
新しい Google Docs ドキュメントを作成します。

**パラメータ**:
- `title` (string): ドキュメントタイトル
- `content` (string, オプション): 初期内容

### update_google_document
既存の Google Docs ドキュメントを更新します。

**パラメータ**:
- `documentId` (string): 更新するドキュメントのID
- `content` (string): 追加または更新するコンテンツ
- `startPosition` (number, オプション): 更新開始位置
- `endPosition` (number, オプション): 更新終了位置

### search_google_documents
Google Docs ドキュメントを検索します。

**パラメータ**:
- `query` (string): 検索クエリ
- `maxResults` (number, オプション): 最大結果数（デフォルト: 10）

## プログラムでの利用例

MCP SDK を使用した TypeScript/JavaScript での利用：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const client = new Client({
    name: "google-docs-client",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["/absolute/path/to/docs-mcp/dist/index.js"]
  });

  await client.connect(transport);

  // ドキュメント検索
  const searchResult = await client.callTool({
    name: "search_google_documents",
    arguments: {
      query: "会議資料",
      maxResults: 5
    }
  });

  // 新規ドキュメント作成
  const createResult = await client.callTool({
    name: "create_google_document",
    arguments: {
      title: "新しいドキュメント",
      content: "初期コンテンツ"
    }
  });

  await client.disconnect();
}

main().catch(console.error);
```

## アーキテクチャ詳細

### コアコンポーネント

- **ServiceContainer** (`src/core/container.ts`) - 依存性注入とサービスライフサイクル管理
- **GoogleDocsMcpServer** (`src/mcp/server.ts`) - MCP サーバーの管理と初期化
- **ToolRegistry** (`src/mcp/registry.ts`) - ツールの自動登録システム
- **BaseMcpTool** (`src/mcp/tools/base.ts`) - 全ツールの共通基底クラス

### サービス層

- **AuthService** (`src/services/authService.ts`) - Google OAuth2 認証管理
- **GoogleDocsService** (`src/services/googleDocsService.ts`) - Google Docs/Drive API操作

### 設定システム

- **統一設定管理** (`src/config/index.ts`) - 環境変数とデフォルト値の統合
- **型安全な設定** - Zod による設定値の検証
- **階層化ログシステム** (`src/utils/logger.ts`) - モジュール別ログ出力

## トラブルシューティング

### MCP クライアント接続エラー

1. **ビルドの確認**: `npm run build` が成功しているか
2. **パス設定**: 設定ファイルで `dist/index.js` への絶対パスを指定
3. **権限設定**: `chmod 755 dist/index.js` で実行権限を確認
4. **手動テスト**: `npm run mcp` でサーバーが起動するか確認

### Google 認証エラー

1. **認証ファイル**: `credentials.json` がプロジェクトルートに存在するか
2. **API有効化**: Google Cloud Console で必要なAPIが有効か
3. **トークン再作成**: `token.json` を削除して再認証
4. **スコープ確認**: Docs API と Drive API の権限が設定されているか

### 開発時のデバッグ

```bash
# 詳細ログでデバッグ実行
LOG_LEVEL=DEBUG npm run dev

# MCP通信のデバッグ
npm run mcp
```

## 拡張ガイド

### 新しいツールの追加

1. `src/mcp/tools/` に新しいツールクラスを作成
2. `BaseMcpTool` を継承して実装
3. `ToolRegistry.registerDefaultTools()` に追加

### サービスの拡張

1. `src/core/interfaces.ts` でインターフェースを定義
2. `src/services/` に実装クラスを作成
3. `ServiceContainer` に追加

## 注意事項

- 初回実行時の Google 認証が必要
- Google Cloud Platform の API 使用料金が発生する可能性
- MCP クライアントでは絶対パスでの指定が必要

## ライセンス

MIT License
