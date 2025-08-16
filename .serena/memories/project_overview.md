# Google Docs MCP Server プロジェクト概要

## プロジェクトの目的
このプロジェクトは、Google Docs APIと連携するMCP（Model Context Protocol）サーバーです。AIシステムがGoogle Docsを直接操作できるインターフェースを提供します。

## 提供する機能
- **read_google_document** - Google Docsドキュメントの読み取り
- **create_google_document** - 新しいGoogle Docsドキュメントの作成
- **update_google_document** - 既存のGoogle Docsドキュメントの更新
- **search_google_documents** - Google Docsドキュメントの検索

## 技術スタック
- **Runtime**: Node.js (v14以上)
- **Language**: TypeScript (ES2020/ESM) - 完全な型安全性
- **MCP SDK**: @modelcontextprotocol/sdk v1.10.2
- **Google APIs**: googleapis v148.0.0
- **認証**: Google OAuth2 + @google-cloud/local-auth
- **設定管理**: dotenv + zod validation
- **開発**: ts-node, cross-env

## アーキテクチャの特徴
- **依存性注入コンテナ** (ServiceContainer) - サービス管理とライフサイクル
- **階層化エラーハンドリング** - 統一されたエラー処理システム
- **自動ツール登録** - 設定ベースのツール管理
- **型安全性** - 完全なTypeScript実装