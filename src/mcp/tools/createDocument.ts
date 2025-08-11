import { z } from 'zod';
import { BaseMcpTool } from './base.js';
import { McpToolResponse, IServiceContainer } from '../../core/interfaces.js';

/**
 * Google Docsドキュメント作成ツール
 */
export class CreateDocumentTool extends BaseMcpTool {
  constructor(serviceContainer: IServiceContainer) {
    super('create_google_document', serviceContainer);
  }

  /**
   * ツールスキーマ定義
   */
  get schema() {
    return {
      title: z.string().describe("新しいドキュメントのタイトル"),
      content: z.string().optional().describe("ドキュメントの初期内容（オプション）")
    };
  }

  /**
   * ドキュメント作成の実装
   */
  protected async executeInternal(args: { title: string; content?: string }): Promise<McpToolResponse> {
    // 引数検証
    this.validateArgs(args, ['title']);

    const { title, content = '' } = args;
    this.logger.info(`ドキュメント作成開始: タイトル="${title}"`);

    try {
      // Google Docsサービスを取得
      const docsService = await this.serviceContainer.getGoogleDocsService();

      // ドキュメントを作成
      const documentId = await docsService.createNewDocument(title, content);

      this.logger.info(`ドキュメント作成完了: ${documentId}, タイトル="${title}"`);

      return this.createSuccessResponse(`ドキュメントが作成されました。ID: ${documentId}`);

    } catch (error) {
      this.logger.error(`ドキュメント作成エラー: タイトル="${title}"`, error);
      throw error; // BaseMcpToolでエラーハンドリング
    }
  }
}