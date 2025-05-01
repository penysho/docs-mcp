import { Server, Context, Tool, ToolOutput } from '@modelcontextprotocol/sdk';
import * as dotenv from 'dotenv';
import { readGoogleDoc, createGoogleDoc, updateGoogleDoc, searchGoogleDocs } from './googleDocsService';
import {
  AccessGoogleDocsArgs,
  CreateGoogleDocsArgs,
  UpdateGoogleDocsArgs,
  SearchGoogleDocsArgs,
  MCPConfig,
  GoogleDocResult,
  SearchResult
} from './types/index';

// 環境変数を読み込む
dotenv.config();

// MCPサーバーの設定
const config: MCPConfig = {
  port: parseInt(process.env.MCP_PORT || '3000', 10),
  host: process.env.MCP_HOST || 'localhost'
};

// MCP Serverインスタンスの作成
const server = new Server({
  name: 'google-docs-mcp',
  version: '1.0.0',
  summary: 'Google Docsを操作するためのMCPサーバー',
  description: 'Google Docsドキュメントの読み取り、作成、更新、検索を提供するMCPサーバー',
  contact: {
    name: 'MCP Developer',
    url: 'https://github.com/your-username/docs-mcp'
  }
});

// ツールのエラーハンドリングを共通化
const handleToolError = (error: unknown, operation: string): ToolOutput => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Google Docsの${operation}中にエラーが発生しました:`, error);
  
  return {
    status: 'error',
    message: `Google Docsの${operation}中にエラーが発生しました: ${errorMessage}`
  };
};

// ユーティリティ関数：ドキュメントIDを正規化
const normalizeDocumentId = (documentId: string): string => {
  const documentIdMatch = documentId.match(/[-\w]{25,}/);
  return documentIdMatch ? documentIdMatch[0] : documentId;
};

// ドキュメント読み取りツール
const readDocumentTool: Tool<AccessGoogleDocsArgs> = {
  name: 'read_google_document',
  description: 'Google Docsからドキュメントの内容を読み取ります。指定されたドキュメントIDのGoogle Docsドキュメントにアクセスし、そのテキスト内容を返します。',
  inputSchema: {
    documentId: {
      type: 'string',
      description: 'ドキュメントのID（URLまたはドキュメントIDを指定）',
      required: true
    },
    maxLength: {
      type: 'number',
      description: '取得する最大文字数（省略可）'
    },
    startPosition: {
      type: 'number',
      description: '取得を開始する位置（省略可）'
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      url: { type: 'string' },
      lastModified: { type: 'string', nullable: true }
    }
  },
  execute: async (args: AccessGoogleDocsArgs, ctx: Context): Promise<ToolOutput<GoogleDocResult>> => {
    try {
      const normalizedId = normalizeDocumentId(args.documentId);
      const result = await readGoogleDoc({
        ...args,
        documentId: normalizedId
      });
      
      return {
        status: 'success',
        result
      };
    } catch (error) {
      return handleToolError(error, '読み取り');
    }
  }
};

// ドキュメント作成ツール
const createDocumentTool: Tool<CreateGoogleDocsArgs> = {
  name: 'create_google_document',
  description: '新しいGoogle Docsドキュメントを作成します。タイトルと初期コンテンツを指定して新しいドキュメントを作成し、そのドキュメントIDとURLを返します。',
  inputSchema: {
    title: {
      type: 'string',
      description: 'ドキュメントのタイトル',
      required: true
    },
    content: {
      type: 'string',
      description: 'ドキュメントの初期内容（省略可）'
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      url: { type: 'string' }
    }
  },
  execute: async (args: CreateGoogleDocsArgs, ctx: Context): Promise<ToolOutput<GoogleDocResult>> => {
    try {
      const result = await createGoogleDoc(args);
      
      return {
        status: 'success',
        result
      };
    } catch (error) {
      return handleToolError(error, '作成');
    }
  }
};

// ドキュメント更新ツール
const updateDocumentTool: Tool<UpdateGoogleDocsArgs> = {
  name: 'update_google_document',
  description: '既存のGoogle Docsドキュメントを更新します。指定されたドキュメントIDのドキュメントの内容を更新し、更新後のドキュメント情報を返します。',
  inputSchema: {
    documentId: {
      type: 'string',
      description: 'ドキュメントのID（URLまたはドキュメントIDを指定）',
      required: true
    },
    content: {
      type: 'string',
      description: '追加または更新するコンテンツ',
      required: true
    },
    startPosition: {
      type: 'number',
      description: '更新を開始する位置（省略時は文書の先頭）'
    },
    endPosition: {
      type: 'number',
      description: '更新を終了する位置（省略時は追加のみ）'
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      url: { type: 'string' },
      lastModified: { type: 'string', nullable: true }
    }
  },
  execute: async (args: UpdateGoogleDocsArgs, ctx: Context): Promise<ToolOutput<GoogleDocResult>> => {
    try {
      const normalizedId = normalizeDocumentId(args.documentId);
      const result = await updateGoogleDoc({
        ...args,
        documentId: normalizedId
      });
      
      return {
        status: 'success',
        result
      };
    } catch (error) {
      return handleToolError(error, '更新');
    }
  }
};

// ドキュメント検索ツール
const searchDocumentsTool: Tool<SearchGoogleDocsArgs> = {
  name: 'search_google_documents',
  description: 'Google Docsドキュメントを検索します。指定されたクエリに基づいてGoogle Docsドキュメントを検索し、一致するドキュメントのリストを返します。',
  inputSchema: {
    query: {
      type: 'string',
      description: '検索クエリ',
      required: true
    },
    maxResults: {
      type: 'number',
      description: '取得する最大結果数（省略時は10）'
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      documents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            documentId: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            url: { type: 'string' },
            lastModified: { type: 'string', nullable: true }
          }
        }
      },
      nextPageToken: { type: 'string', nullable: true }
    }
  },
  execute: async (args: SearchGoogleDocsArgs, ctx: Context): Promise<ToolOutput<SearchResult>> => {
    try {
      const result = await searchGoogleDocs(args);
      
      return {
        status: 'success',
        result
      };
    } catch (error) {
      return handleToolError(error, '検索');
    }
  }
};

// ツールを登録
server.registerTool(readDocumentTool);
server.registerTool(createDocumentTool);
server.registerTool(updateDocumentTool);
server.registerTool(searchDocumentsTool);

// サーバーを起動
server.listen(config.port, config.host, () => {
  console.log(`Google Docs MCPサーバーが起動しました: http://${config.host}:${config.port}`);
  console.log(`使用可能なツール:`);
  console.log(` - ${readDocumentTool.name}: ${readDocumentTool.description}`);
  console.log(` - ${createDocumentTool.name}: ${createDocumentTool.description}`);
  console.log(` - ${updateDocumentTool.name}: ${updateDocumentTool.description}`);
  console.log(` - ${searchDocumentsTool.name}: ${searchDocumentsTool.description}`);
}); 