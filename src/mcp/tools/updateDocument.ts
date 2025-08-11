import { z } from 'zod';
import { BaseMcpTool } from './base.js';
import { McpToolResponse, IServiceContainer } from '../../core/interfaces.js';

/**
 * Google Docsドキュメント更新ツール
 */
export class UpdateDocumentTool extends BaseMcpTool {
  constructor(serviceContainer: IServiceContainer) {
    super('update_google_document', serviceContainer);
  }

  /**
   * ツールスキーマ定義
   */
  get schema() {
    return {
      documentId: z.string().describe("更新するGoogle DocsドキュメントのID"),
      content: z.string().describe("追加または更新するコンテンツ"),
      startPosition: z.number().optional().describe("更新を開始する位置（オプション）"),
      endPosition: z.number().optional().describe("更新を終了する位置（オプション）")
    };
  }

  /**
   * ドキュメント更新の実装
   */
  protected async executeInternal(args: { 
    documentId: string; 
    content: string; 
    startPosition?: number; 
    endPosition?: number 
  }): Promise<McpToolResponse> {
    // 引数検証
    this.validateArgs(args, ['documentId', 'content']);

    const { documentId, content, startPosition, endPosition } = args;
    this.logger.info(`ドキュメント更新開始: ${documentId}, 位置: ${startPosition}-${endPosition}`);

    try {
      // Google Docsサービスを取得
      const docsService = await this.serviceContainer.getGoogleDocsService();

      // ドキュメントを更新
      await docsService.updateDocumentContent(documentId, content, startPosition, endPosition);

      this.logger.info(`ドキュメント更新完了: ${documentId}`);

      return this.createSuccessResponse("ドキュメントが更新されました");

    } catch (error) {
      this.logger.error(`ドキュメント更新エラー: ${documentId}`, error);
      throw error; // BaseMcpToolでエラーハンドリング
    }
  }
}