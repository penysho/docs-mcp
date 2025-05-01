# Google Docs MCP サーバー

このプロジェクトは、Google Docs APIと連携するMCP（Model Context Protocol）サーバーを提供します。生成AIを使ってGoogle Docsを操作するためのインターフェースを実装しています。

## 機能

このMCPサーバーは以下の機能を提供します：

- Google Docsドキュメントの読み取り
- 新しいGoogle Docsドキュメントの作成
- 既存のGoogle Docsドキュメントの更新
- Google Docsドキュメントの検索

## 技術スタック

- [Node.js](https://nodejs.org/) （v14以上推奨）
- [TypeScript](https://www.typescriptlang.org/)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/mcp) - MCP SDKの公式実装
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client) - Google APIへのアクセス

## 前提条件

- Node.js （v14以上推奨）
- npm または yarn
- Google Cloud Platformのプロジェクトとアクセス認証情報

## セットアップ

### 1. プロジェクトをクローンまたはダウンロード

```bash
git clone [リポジトリURL]
cd docs-mcp
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Google Cloud Platformの設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成（または既存のプロジェクトを選択）
2. Google Drive APIとGoogle Docs APIを有効化
3. OAuth 2.0クライアントIDを作成し、認証情報をダウンロード
4. ダウンロードした認証情報ファイルを`credentials.json`としてプロジェクトルートに配置

### 4. 環境設定

`.env`ファイルをプロジェクトルートに作成し、以下の内容を設定します：

```
# Google API認証情報
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"

# MCPサーバー設定
MCP_PORT=3000
MCP_HOST="localhost"
```

## ビルドと実行

### ビルド

```bash
npm run build
```

### 実行

```bash
npm start
```

開発モードでの実行:

```bash
npm run dev
```

## MCPツールの使い方

このMCPサーバーは、Model Context Protocolの標準に従って実装されており、以下のツールを提供します：

- `read_google_document` - Google Docsドキュメントを読み取ります
- `create_google_document` - 新しいGoogle Docsドキュメントを作成します
- `update_google_document` - 既存のGoogle Docsドキュメントを更新します
- `search_google_documents` - Google Docsドキュメントを検索します

### MCPクライアントからのツール使用例

```javascript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  baseURL: 'http://localhost:3000'
});

// サーバーの情報を取得
const serverInfo = await client.getServerInfo();
console.log('利用可能なツール:', serverInfo.tools);

// ドキュメントを読み取る
const result = await client.executeTool('read_google_document', {
  documentId: 'your-document-id'
});

if (result.status === 'success') {
  console.log('ドキュメントの内容:', result.result.content);
} else {
  console.error('エラー:', result.message);
}
```

### RESTful APIを直接呼び出す例

#### Google Docsドキュメントの読み取り

```javascript
const response = await fetch('http://localhost:3000/tools/read_google_document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: 'your-document-id'
  })
});
const data = await response.json();
```

#### 新しいGoogle Docsドキュメントの作成

```javascript
const response = await fetch('http://localhost:3000/tools/create_google_document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'ドキュメントタイトル',
    content: '初期コンテンツ'
  })
});
const data = await response.json();
```

#### 既存のGoogle Docsドキュメントの更新

```javascript
const response = await fetch('http://localhost:3000/tools/update_google_document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: 'your-document-id',
    content: '追加または更新するコンテンツ',
    startPosition: 1,  // オプション
    endPosition: 10    // オプション
  })
});
const data = await response.json();
```

#### Google Docsドキュメントの検索

```javascript
const response = await fetch('http://localhost:3000/tools/search_google_documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '検索キーワード',
    maxResults: 5  // オプション
  })
});
const data = await response.json();
```

## 拡張と構成

このMCPサーバーは拡張性を考慮して設計されており、以下のように新しい機能を追加できます：

1. `src/types.ts` - 新しいツールの型定義を追加
2. `src/googleDocsService.ts` - GoogleDocsServiceクラスに新しいメソッドを追加
3. `src/index.ts` - 新しいツールを定義し、サーバーに登録

## 注意事項

- 初回実行時に、Google認証のための承認画面が表示されます。認証後、トークンがファイルに保存され、以降の実行では自動的に使用されます。
- APIの使用量に応じて、Google Cloud Platformの料金が発生する場合があります。
- サーバーは`http://${host}:${port}/docs`でOpenAPI仕様を提供します。これを使ってAPIドキュメントを確認できます。

## ライセンス

[MIT License](LICENSE) 