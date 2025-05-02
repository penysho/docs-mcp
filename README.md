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
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) - MCP SDKの公式実装
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

1. `.env`ファイルをプロジェクトルートに作成し、環境変数を設定します：

```ini
# アプリケーション環境
NODE_ENV=development

# ログ設定
# ログレベル: ERROR, WARN, INFO, DEBUG, TRACE
LOG_LEVEL=INFO
# 標準エラー出力にログを出力するかどうか（MCPの仕様に準拠）
LOG_USE_STDERR=true

# サーバー設定
SERVER_NAME=google-docs-mcp-server
SERVER_VERSION=1.0.0

# Google API認証情報
# 認証情報ファイルのパス（デフォルトは./credentials.json）
CREDENTIALS_PATH=./credentials.json
# トークンファイルのパス（デフォルトは./token.json）
TOKEN_PATH=./token.json
```

環境変数の説明:
- `NODE_ENV`: アプリケーションの実行環境（development, production, test）
- `LOG_LEVEL`: ログの詳細レベル（ERROR, WARN, INFO, DEBUG, TRACE）
- `LOG_USE_STDERR`: ログを標準エラー出力に出力するかどうか（MCP仕様では標準エラー出力を使用）
- `SERVER_NAME`: MCPサーバー名
- `SERVER_VERSION`: MCPサーバーのバージョン
- `CREDENTIALS_PATH`: Google APIの認証情報ファイルのパス
- `TOKEN_PATH`: 認証トークン保存先のパス

2. 開発サーバーを起動し、トークンを取得します:
   ```bash
   npm run dev
   ```
   実行後、ターミナルに認可用URLが表示されます。そのURLにブラウザでアクセスし、Googleアカウントでログインして認可を行ってください。
   認可完了後に表示される認可コードをコピーし、ターミナルに貼り付けてEnterキーを押してください。
   この操作により`token.json`ファイルが生成され、以降は自動的に認証されます。

## ビルドと実行

### ビルド

```bash
npm run build
```

### 実行

通常のサーバーとして実行:

```bash
npm start
```

開発モードでの実行:

```bash
npm run dev
```

## MCPサーバーとしての利用

このプロジェクトはModel Context Protocol（MCP）の仕様に準拠したサーバーです。MCPクライアント（Cursor、Claude.aiなど）から直接接続して利用できます。

### MCPクライアントでの設定

#### Cursorでの設定

Cursorで使用するには、`.cursor/mcp.json`ファイルに以下の設定を追加します：

```json
{
  "mcpServers": {
    "google-docs": {
      "command": "node",
      "args": ["/{プロジェクトへの絶対パス}/docs-mcp/dist/index.js"]
    }
  }
}
```

#### その他のMCPクライアント

その他のMCPクライアントでは、標準入出力（stdio）を使用して通信します。クライアントの設定に応じて適切なコマンドを指定してください。

### 提供されるMCPツール

#### read_google_document

Google Docsドキュメントの内容を読み取ります。

**パラメータ**:
- `documentId` (string): 読み取るGoogle DocsドキュメントのID

**使用例**:
```javascript
// MCPクライアントでの使用例
const response = await client.callTool({
  name: "read_google_document",
  arguments: {
    documentId: "your-document-id"
  }
});
```

#### create_google_document

新しいGoogle Docsドキュメントを作成します。

**パラメータ**:
- `title` (string): 新しいドキュメントのタイトル
- `content` (string, オプション): ドキュメントの初期内容

**使用例**:
```javascript
const response = await client.callTool({
  name: "create_google_document",
  arguments: {
    title: "ドキュメントタイトル",
    content: "初期コンテンツ"
  }
});
```

#### update_google_document

既存のGoogle Docsドキュメントを更新します。

**パラメータ**:
- `documentId` (string): 更新するGoogle DocsドキュメントのID
- `content` (string): 追加または更新するコンテンツ
- `startPosition` (number, オプション): 更新を開始する位置
- `endPosition` (number, オプション): 更新を終了する位置

**使用例**:
```javascript
const response = await client.callTool({
  name: "update_google_document",
  arguments: {
    documentId: "your-document-id",
    content: "追加または更新するコンテンツ",
    startPosition: 1,
    endPosition: 10
  }
});
```

#### search_google_documents

Google Docsドキュメントを検索します。

**パラメータ**:
- `query` (string): 検索クエリ
- `maxResults` (number, オプション): 取得する最大結果数（デフォルト: 10）

**使用例**:
```javascript
const response = await client.callTool({
  name: "search_google_documents",
  arguments: {
    query: "検索キーワード",
    maxResults: 5
  }
});
```

## プログラムからの利用例

TypeScriptやJavaScriptプログラムからMCPクライアントを通じて利用する例：

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  // MCPクライアントの作成
  const client = new Client({
    name: "google-docs-client",
    version: "1.0.0"
  });

  // Google Docs MCPサーバーへの接続
  const transport = new StdioClientTransport({
    command: "npm",
    args: ["run", "mcp"]
  });

  await client.connect(transport);

  // サーバー情報の取得
  const info = await client.getServerInfo();
  console.log("利用可能なツール:", info.tools);

  // ドキュメントの検索
  const searchResult = await client.callTool({
    name: "search_google_documents",
    arguments: {
      query: "会議資料",
      maxResults: 5
    }
  });
  console.log("検索結果:", searchResult);

  // 接続を閉じる
  await client.disconnect();
}

main().catch(console.error);
```

## トラブルシューティング

### Cursorで接続エラーが発生する場合

1. Cursorを完全に再起動してください。
2. `.cursor/mcp.json`の設定が正しいことを確認してください。
3. 手動でMCPサーバーを起動して動作確認：
   ```bash
   npm run dev
   ```
   このコマンドを実行したときに「Google Docs MCPサーバーが起動しました」というメッセージが表示され、プロセスが終了せずに動作し続けることを確認します。
4. Cursorの設定から「MCPサーバー」セクションを確認し、「google-docs」サーバーが表示されていることを確認します。

### Google認証エラーが発生する場合

1. `credentials.json`ファイルが正しくプロジェクトルートに配置されていることを確認します。
2. `token.json`ファイルが存在する場合は削除し、再認証を試みてください。
3. Google Cloud Consoleで該当のプロジェクトに対してGoogle Drive APIとGoogle Docs APIが有効になっていることを確認します。

## 拡張と構成

このMCPサーバーは拡張性を考慮して設計されており、以下のように新しい機能を追加できます：

1. `src/googleDocsService.ts` - GoogleDocsServiceクラスに新しいメソッドを追加
2. `src/index.ts` - 新しいツールを定義し、サーバーに登録

## 注意事項

- 初回実行時に、Google認証のための承認画面が表示されます。認証後、トークンがファイルに保存され、以降の実行では自動的に使用されます。
- APIの使用量に応じて、Google Cloud Platformの料金が発生する場合があります。

## ライセンス

[MIT License](LICENSE) 