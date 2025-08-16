# 開発環境セットアップ

## 必要な前提条件

### システム要件
- **OS**: macOS (Darwin 24.5.0)
- **Node.js**: v14以上
- **npm**: 最新版

### Google Cloud Platform
1. Google Cloud Consoleでプロジェクト作成
2. 以下のAPIを有効化:
   - Google Docs API
   - Google Drive API
3. OAuth 2.0 クライアントID作成
4. `credentials.json` をプロジェクトルートに配置

## プロジェクトセットアップ

### 初期セットアップ
```bash
# プロジェクトクローン
git clone <repository-url>
cd docs-mcp

# 依存関係インストール
npm install

# TypeScript設定確認
cat tsconfig.json
```

### 環境設定 (オプション)
`.env` ファイルで設定カスタマイズ:
```env
# 環境設定
NODE_ENV=development

# ログレベル (ERROR, WARN, INFO, DEBUG, TRACE)
LOG_LEVEL=INFO
LOG_USE_STDERR=true

# サーバー情報
SERVER_NAME=google-docs-mcp-server
SERVER_VERSION=1.0.0

# 認証ファイルパス
CREDENTIALS_PATH=./credentials.json
TOKEN_PATH=./token.json
```

### 初回認証
```bash
# 開発サーバー起動
npm run dev

# ターミナルの認証URLにアクセス
# Googleアカウントで認証
# 認証コードを入力
# → token.json が自動生成
```

## MCP クライアント設定

### Cursor設定 (`.cursor/mcp.json`)
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

### Claude Desktop設定
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

**重要**: 必ずビルド後の `dist/index.js` への絶対パスを指定

## トラブルシューティング

### よくある問題
1. **TypeScriptエラー**: `npx tsc --noEmit` で確認
2. **認証エラー**: `token.json` 削除して再認証
3. **パス問題**: 絶対パス使用、実行権限確認
4. **API エラー**: Google Cloud Console で API有効化確認