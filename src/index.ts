import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AuthService } from "./services/authService.js";
import { GoogleDocsService } from "./services/googleDocsService.js";
import { createLogger, LogLevel } from "./utils/logger.js";
import config, { validateConfig } from "./config/appConfig.js";
import { AppError, formatError } from "./utils/errors.js";

// アプリケーションロガーを作成
const logger = createLogger('App', { 
  level: config.log.level,
  useStderr: config.log.useStderr
});

// サービスとサーバーのインスタンスを定義
let authService: AuthService;
let docsService: GoogleDocsService;
let server: McpServer;

/**
 * サービスの初期化
 */
async function initializeServices(): Promise<boolean> {
  try {
    // 設定ファイルの検証
    validateConfig();
    
    // 認証サービスの初期化
    authService = new AuthService();
    await authService.authorize();
    
    // Google Docsサービスの初期化
    docsService = new GoogleDocsService(authService);
    
    return true;
  } catch (error) {
    logger.error(`サービスの初期化エラー: ${formatError(error)}`);
    return false;
  }
}

/**
 * MCPサーバーの初期化
 */
function initializeServer(): McpServer {
  // サーバーを作成
  return new McpServer({
    name: config.server.name,
    version: config.server.version
  });
}

/**
 * ツールの登録
 */
function registerTools(): void {
  // ドキュメント読み取りツール
  server.tool(
    "read_google_document", 
    {
      documentId: z.string().describe("読み取るGoogle DocsドキュメントのID")
    },
    async ({ documentId }) => {
      try {
        // サービスが初期化されていない場合は初期化
        if (!authService || !docsService) {
          if (!(await initializeServices())) {
            return {
              content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
              isError: true
            };
          }
        }

        const content = await docsService.readDocumentContent(documentId);
        return {
          content: [{ type: "text", text: content }]
        };
      } catch (error) {
        logger.error(`ドキュメント読み取りエラー: ${formatError(error)}`);
        const message = error instanceof AppError ? error.message : `ドキュメントの読み取りエラー: ${error}`;
        return {
          content: [{ type: "text", text: message }],
          isError: true
        };
      }
    }
  );

  // ドキュメント作成ツール
  server.tool(
    "create_google_document", 
    {
      title: z.string().describe("新しいドキュメントのタイトル"),
      content: z.string().optional().describe("ドキュメントの初期内容（オプション）")
    },
    async ({ title, content }) => {
      try {
        // サービスが初期化されていない場合は初期化
        if (!authService || !docsService) {
          if (!(await initializeServices())) {
            return {
              content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
              isError: true
            };
          }
        }

        const initialContent = content || '';
        const documentId = await docsService.createNewDocument(title, initialContent);
        return {
          content: [{ type: "text", text: `ドキュメントが作成されました。ID: ${documentId}` }]
        };
      } catch (error) {
        logger.error(`ドキュメント作成エラー: ${formatError(error)}`);
        const message = error instanceof AppError ? error.message : `ドキュメント作成エラー: ${error}`;
        return {
          content: [{ type: "text", text: message }],
          isError: true
        };
      }
    }
  );

  // ドキュメント更新ツール
  server.tool(
    "update_google_document", 
    {
      documentId: z.string().describe("更新するGoogle DocsドキュメントのID"),
      content: z.string().describe("追加または更新するコンテンツ"),
      startPosition: z.number().optional().describe("更新を開始する位置（オプション）"),
      endPosition: z.number().optional().describe("更新を終了する位置（オプション）")
    },
    async ({ documentId, content, startPosition, endPosition }) => {
      try {
        // サービスが初期化されていない場合は初期化
        if (!authService || !docsService) {
          if (!(await initializeServices())) {
            return {
              content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
              isError: true
            };
          }
        }

        await docsService.updateDocumentContent(documentId, content, startPosition, endPosition);
        return {
          content: [{ type: "text", text: "ドキュメントが更新されました" }]
        };
      } catch (error) {
        logger.error(`ドキュメント更新エラー: ${formatError(error)}`);
        const message = error instanceof AppError ? error.message : `ドキュメント更新エラー: ${error}`;
        return {
          content: [{ type: "text", text: message }],
          isError: true
        };
      }
    }
  );

  // ドキュメント検索ツール
  server.tool(
    "search_google_documents", 
    {
      query: z.string().describe("検索クエリ"),
      maxResults: z.number().optional().describe("取得する最大結果数（デフォルト: 10）")
    },
    async ({ query, maxResults }) => {
      try {
        // サービスが初期化されていない場合は初期化
        if (!authService || !docsService) {
          if (!(await initializeServices())) {
            return {
              content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
              isError: true
            };
          }
        }

        const limit = maxResults || 10;
        const results = await docsService.searchForDocuments(query, limit);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      } catch (error) {
        logger.error(`ドキュメント検索エラー: ${formatError(error)}`);
        const message = error instanceof AppError ? error.message : `ドキュメント検索エラー: ${error}`;
        return {
          content: [{ type: "text", text: message }],
          isError: true
        };
      }
    }
  );
}

/**
 * サーバーを起動する
 */
async function startServer() {
  try {
    logger.info("Google Docs MCPサーバーの初期化を開始...");
    
    // サーバーの初期化
    server = initializeServer();
    
    // ツールの登録
    registerTools();
    
    // StdioServerTransportを初期化
    const transport = new StdioServerTransport();
    
    // サーバーに接続
    await server.connect(transport);
    
    // 起動成功メッセージ
    logger.info("Google Docs MCPサーバーが起動しました");
    
    // サービスの初期化を試行（ただし、失敗してもサーバー自体は起動している）
    // 実際のツール使用時に再初期化されるので、ここでの失敗は許容可能
    const servicesInitialized = await initializeServices();
    if (servicesInitialized) {
      logger.info("Google Docsサービスの初期化に成功しました");
    } else {
      logger.warn("Google Docsサービスの初期化に失敗しましたが、サーバーは起動しています");
      logger.info("最初のツール使用時に再度初期化を試みます");
    }
    
    // プロセス終了シグナルを捕捉
    process.on('SIGINT', () => {
      logger.info("SIGINTシグナルを受信しました。サーバーを停止します...");
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info("SIGTERMシグナルを受信しました。サーバーを停止します...");
      process.exit(0);
    });
    
    // 未処理の例外をキャッチ
    process.on('uncaughtException', (error) => {
      logger.error(`未処理の例外: ${formatError(error)}`);
    });
    
    // 未処理のPromise拒否をキャッチ
    process.on('unhandledRejection', (reason) => {
      logger.error(`未処理のPromise拒否: ${formatError(reason)}`);
    });
  } catch (error) {
    logger.error(`サーバー起動エラー: ${formatError(error)}`);
    process.exit(1);
  }
}

// サーバーを起動
startServer(); 