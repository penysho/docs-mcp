import { z } from "zod";
import type {
	IServiceContainer,
	McpToolResponse,
} from "../../core/interfaces.js";
import { BaseMcpTool } from "./base.js";

/**
 * Google Docsドキュメント読み取りツール
 */
export class ReadDocumentTool extends BaseMcpTool {
	constructor(serviceContainer: IServiceContainer) {
		super("read_google_document", serviceContainer);
	}

	/**
	 * ツールスキーマ定義
	 */
	get schema() {
		return {
			documentId: z.string().describe("読み取るGoogle DocsドキュメントのID"),
		};
	}

	/**
	 * ドキュメント読み取りの実装
	 */
	protected async executeInternal(args: {
		documentId: string;
	}): Promise<McpToolResponse> {
		// 引数検証
		this.validateArgs(args, ["documentId"]);

		const { documentId } = args;
		this.logger.info(`ドキュメント読み取り開始: ${documentId}`);

		try {
			// Google Docsサービスを取得
			const docsService = await this.serviceContainer.getGoogleDocsService();

			// ドキュメント内容を取得
			const content = await docsService.readDocumentContent(documentId);

			this.logger.info(
				`ドキュメント読み取り完了: ${documentId}, 文字数: ${content.length}`,
			);

			return this.createSuccessResponse(content);
		} catch (error) {
			this.logger.error(`ドキュメント読み取りエラー: ${documentId}`, error);
			throw error; // BaseMcpToolでエラーハンドリング
		}
	}
}
