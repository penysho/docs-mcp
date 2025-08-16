# 推奨コマンド一覧

## 開発コマンド

### 基本開発
```bash
# 依存関係インストール
npm install

# 開発サーバー起動 (hot reload)
npm run dev

# プロダクションビルド
npm run build

# ビルド後実行
npm start

# MCPデバッグモード
npm run mcp
```

### コード品質
```bash
# ESLint実行
npm run lint

# TypeScriptコンパイルチェック
npx tsc --noEmit
```

### 認証設定
```bash
# 初回認証 (Google OAuth2)
npm run dev
# → ブラウザで認証URL → コード入力 → token.json生成
```

## システムコマンド (macOS)

### ファイル操作
```bash
# ディレクトリ一覧
ls -la

# ファイル検索
find . -name "*.ts" -type f

# 文字列検索
grep -r "pattern" src/

# ファイル権限変更
chmod 755 dist/index.js
```

### プロセス管理
```bash
# プロセス確認
ps aux | grep node

# ポート使用確認
lsof -i :3000
```

### Git操作
```bash
# ステータス確認
git status

# 変更のコミット
git add .
git commit -m "message"

# プッシュ
git push origin main
```