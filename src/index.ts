import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleDocsService } from "./googleDocsService";

// Google Docsサービスのインスタンスを作成
const docsService = new GoogleDocsService();

// MCPサーバーを作成
const server = new McpServer({
  name: "google-docs-mcp-server",
  version: "1.0.0"
});

// ドキュメント読み取りツール
server.tool("read_google_document", "Google Docsからドキュメントの内容を読み取ります", async (extra: any) => {
  try {
    const documentId = extra?.arguments?.documentId;
    if (!documentId || typeof documentId !== 'string') {
      return {
        content: [{ type: "text", text: "ドキュメントIDが指定されていません" }],
        isError: true
      };
    }
    
    const content = await docsService.readDocumentContent(documentId);
    return {
      content: [{ type: "text", text: content }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `ドキュメントの読み取りエラー: ${error.message}` }],
      isError: true
    };
  }
});

// ドキュメント作成ツール
server.tool("create_google_document", "新しいGoogle Docsドキュメントを作成します", async (extra: any) => {
  try {
    const title = extra?.arguments?.title;
    const content = extra?.arguments?.content;
    
    if (!title || typeof title !== 'string') {
      return {
        content: [{ type: "text", text: "タイトルが指定されていません" }],
        isError: true
      };
    }
    
    const initialContent = content && typeof content === 'string' ? content : '';
    const documentId = await docsService.createNewDocument(title, initialContent);
    return {
      content: [{ type: "text", text: `ドキュメントが作成されました。ID: ${documentId}` }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `ドキュメント作成エラー: ${error.message}` }],
      isError: true
    };
  }
});

// ドキュメント更新ツール
server.tool("update_google_document", "既存のGoogle Docsドキュメントを更新します", async (extra: any) => {
  try {
    const documentId = extra?.arguments?.documentId;
    const content = extra?.arguments?.content;
    const startPosition = extra?.arguments?.startPosition;
    const endPosition = extra?.arguments?.endPosition;
    
    if (!documentId || typeof documentId !== 'string') {
      return {
        content: [{ type: "text", text: "ドキュメントIDが指定されていません" }],
        isError: true
      };
    }
    
    if (!content || typeof content !== 'string') {
      return {
        content: [{ type: "text", text: "更新内容が指定されていません" }],
        isError: true
      };
    }

    const start = startPosition && typeof startPosition === 'number' ? startPosition : undefined;
    const end = endPosition && typeof endPosition === 'number' ? endPosition : undefined;
    
    await docsService.updateDocumentContent(documentId, content, start, end);
    return {
      content: [{ type: "text", text: "ドキュメントが更新されました" }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `ドキュメント更新エラー: ${error.message}` }],
      isError: true
    };
  }
});

// ドキュメント検索ツール
server.tool("search_google_documents", "Google Docsドキュメントを検索します", async (extra: any) => {
  try {
    const query = extra?.arguments?.query;
    const maxResults = extra?.arguments?.maxResults;
    
    if (!query || typeof query !== 'string') {
      return {
        content: [{ type: "text", text: "検索クエリが指定されていません" }],
        isError: true
      };
    }

    const limit = maxResults && typeof maxResults === 'number' ? maxResults : 10;
    
    const results = await docsService.searchForDocuments(query, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `ドキュメント検索エラー: ${error.message}` }],
      isError: true
    };
  }
});

// サーバー起動
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Google Docs MCPサーバーが起動しました");
  } catch (error) {
    console.error("サーバー起動エラー:", error);
    process.exit(1);
  }
}

startServer(); 