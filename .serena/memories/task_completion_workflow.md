# タスク完了時のワークフロー

## コード修正後の必須チェック

### 1. TypeScriptコンパイル確認
```bash
# TypeScriptエラーチェック
npx tsc --noEmit

# または
npm run build
```

### 2. リント実行
```bash
# ESLintチェック
npm run lint
```

### 3. ビルドテスト
```bash
# プロダクションビルドが成功するか確認
npm run build

# 実行権限確認
ls -la dist/index.js

# 必要に応じて権限設定
chmod 755 dist/index.js
```

### 4. 動作確認
```bash
# 開発モードで起動確認
npm run dev

# または MCPデバッグモード
npm run mcp
```

## 新機能追加時

### ツール追加の場合
1. `src/mcp/tools/` に新ツールクラス作成
2. `BaseMcpTool` を継承
3. `src/mcp/tools/index.ts` でエクスポート
4. `ToolRegistry.registerDefaultTools()` に登録

### サービス追加の場合  
1. `src/core/interfaces.ts` でインターフェース定義
2. `src/services/` に実装クラス作成
3. `ServiceContainer` に登録

## Git操作

### コミット前チェック
```bash
# ステージング確認
git status

# 変更差分確認
git diff --cached

# コミット
git commit -m "feat: 新機能の説明" 

# プッシュ
git push origin main
```

## MCP設定更新

### クライアント設定ファイル更新
- `.cursor/mcp.json` 
- Claude Desktop設定
- ビルド後のパス (`dist/index.js`) を指定

### 設定変更後の確認
1. クライアント再起動
2. ツール一覧の確認
3. 各ツールの動作テスト