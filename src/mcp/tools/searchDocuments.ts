import { z } from 'zod';
import { BaseMcpTool } from './base.js';
import { McpToolResponse, IServiceContainer } from '../../core/interfaces.js';

/**
 * Google Docsドキュメント検索ツール
 */
export class SearchDocumentsTool extends BaseMcpTool {
  constructor(serviceContainer: IServiceContainer) {
    super('search_google_documents', serviceContainer);
  }

  /**
   * ツールスキーマ定義
   */
  get schema() {
    return {
      query: z.string().describe("検索クエリ"),
      maxResults: z.number().optional().describe("取得する最大結果数（デフォルト: 10）")
    };
  }

  /**
   * ドキュメント検索の実装
   */
  protected async executeInternal(args: { 
    query: string; 
    maxResults?: number 
  }): Promise<McpToolResponse> {
    // 引数検証
    this.validateArgs(args, ['query']);

    const { query, maxResults = 10 } = args;
    this.logger.info(`ドキュメント検索開始: クエリ="${query}", 最大結果数=${maxResults}`);

    try {
      // Google Docsサービスを取得
      const docsService = await this.serviceContainer.getGoogleDocsService();

      // ドキュメントを検索
      const results = await docsService.searchForDocuments(query, maxResults);

      this.logger.info(`ドキュメント検索完了: クエリ="${query}", 結果件数=${results.length}`);

      return this.createSuccessResponse(JSON.stringify(results, null, 2));

    } catch (error) {
      this.logger.error(`ドキュメント検索エラー: クエリ="${query}"`, error);
      throw error; // BaseMcpToolでエラーハンドリング
    }
  }
}