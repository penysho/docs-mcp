import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GoogleDocsService } from "./googleDocsService.js";

// デバッグ用にエラーをログに出力する関数
function logError(message: string): void {
  process.stderr.write(`${message}\n`);
}

// サーバー起動メッセージを出力
logError("Google Docs MCPサーバーの初期化を開始...");

// MCPサーバーを作成
const server = new McpServer({
  name: "google-docs-mcp-server",
  version: "1.0.0"
});

// Google Docsサービスのインスタンス
let docsService: GoogleDocsService;

// 遅延初期化関数
const initGoogleDocsService = async () => {
  if (!docsService) {
    try {
      docsService = new GoogleDocsService();
      return true;
    } catch (error) {
      logError(`Google Docsサービスの初期化エラー: ${error}`);
      return false;
    }
  }
  return true;
};

// ドキュメント読み取りツール
server.tool(
  "read_google_document", 
  {
    documentId: z.string().describe("読み取るGoogle DocsドキュメントのID")
  },
  async ({ documentId }) => {
    try {
      // サービスが初期化されていなければ初期化
      if (!(await initGoogleDocsService())) {
        return {
          content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
          isError: true
        };
      }

      const content = await docsService.readDocumentContent(documentId);
      return {
        content: [{ type: "text", text: content }]
      };
    } catch (error: any) {
      logError(`ドキュメント読み取りエラー: ${error.message}`);
      return {
        content: [{ type: "text", text: `ドキュメントの読み取りエラー: ${error.message}` }],
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
      // サービスが初期化されていなければ初期化
      if (!(await initGoogleDocsService())) {
        return {
          content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
          isError: true
        };
      }

      const initialContent = content || '';
      const documentId = await docsService.createNewDocument(title, initialContent);
      return {
        content: [{ type: "text", text: `ドキュメントが作成されました。ID: ${documentId}` }]
      };
    } catch (error: any) {
      logError(`ドキュメント作成エラー: ${error.message}`);
      return {
        content: [{ type: "text", text: `ドキュメント作成エラー: ${error.message}` }],
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
      // サービスが初期化されていなければ初期化
      if (!(await initGoogleDocsService())) {
        return {
          content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
          isError: true
        };
      }

      await docsService.updateDocumentContent(documentId, content, startPosition, endPosition);
      return {
        content: [{ type: "text", text: "ドキュメントが更新されました" }]
      };
    } catch (error: any) {
      logError(`ドキュメント更新エラー: ${error.message}`);
      return {
        content: [{ type: "text", text: `ドキュメント更新エラー: ${error.message}` }],
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
      // サービスが初期化されていなければ初期化
      if (!(await initGoogleDocsService())) {
        return {
          content: [{ type: "text", text: "Google Docsサービスの初期化に失敗しました" }],
          isError: true
        };
      }

      const limit = maxResults || 10;
      const results = await docsService.searchForDocuments(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    } catch (error: any) {
      logError(`ドキュメント検索エラー: ${error.message}`);
      return {
        content: [{ type: "text", text: `ドキュメント検索エラー: ${error.message}` }],
        isError: true
      };
    }
  }
);

// サーバー起動
async function startServer() {
  try {
    // StdioServerTransportを初期化
    const transport = new StdioServerTransport();
    
    // サーバーに接続
    await server.connect(transport);
    
    // 起動成功メッセージ（stdoutではなくstderrに出力）
    logError("Google Docs MCPサーバーが起動しました");
    
    // GoogleDocsServiceの初期化を試行（ただし、失敗してもサーバー自体は起動している）
    initGoogleDocsService().then(success => {
      if (success) {
        logError("Google Docsサービスの初期化に成功しました");
      } else {
        logError("Google Docsサービスの初期化に失敗しましたが、サーバーは起動しています");
        logError("最初のツール使用時に再度初期化を試みます");
      }
    });
    
    // プロセス終了シグナルを捕捉
    process.on('SIGINT', () => {
      logError("SIGINTシグナルを受信しました。サーバーを停止します...");
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logError("SIGTERMシグナルを受信しました。サーバーを停止します...");
      process.exit(0);
    });
  } catch (error) {
    logError(`サーバー起動エラー: ${error}`);
    process.exit(1);
  }
}

// サーバーを起動
startServer(); 