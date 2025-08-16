import type {
	IMcpTool,
	IServiceContainer,
	McpToolResponse,
} from "../../core/interfaces.js";
import { AppError, formatError } from "../../utils/errors.js";
import { createLogger, type Logger } from "../../utils/logger.js";

/**
 * MCPツールの基底抽象クラス
 * 共通のエラーハンドリングとサービス初期化ロジックを提供
 */
export abstract class BaseMcpTool implements IMcpTool {
	protected readonly logger: Logger;
	protected readonly serviceContainer: IServiceContainer;

	constructor(
		protected readonly toolName: string,
		serviceContainer: IServiceContainer,
	) {
		this.logger = createLogger(`Tool:${toolName}`);
		this.serviceContainer = serviceContainer;
	}

	/**
	 * ツール名を取得
	 */
	get name(): string {
		return this.toolName;
	}

	/**
	 * ツールスキーマを取得（派生クラスで実装）
	 */
	abstract get schema(): any;

	/**
	 * ツール実行のメインエントリーポイント
	 */
	async execute(args: any): Promise<McpToolResponse> {
		this.logger.debug(
			`ツール ${this.toolName} を実行開始: ${JSON.stringify(args)}`,
		);

		try {
			// サービスの初期化確認
			await this.ensureServicesInitialized();

			// 実際のツール処理を実行
			const result = await this.executeInternal(args);

			this.logger.debug(`ツール ${this.toolName} を実行完了`);
			return result;
		} catch (error) {
			this.logger.error(`ツール ${this.toolName} 実行エラー:`, error);
			return this.createErrorResponse(error);
		}
	}

	/**
	 * 実際のツール処理（派生クラスで実装）
	 */
	protected abstract executeInternal(args: any): Promise<McpToolResponse>;

	/**
	 * サービス初期化の確認
	 */
	private async ensureServicesInitialized(): Promise<void> {
		try {
			await this.serviceContainer.ensureServicesInitialized();
		} catch (error) {
			throw new AppError(
				`Google Docsサービスの初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
				"SERVICE_INITIALIZATION_ERROR",
			);
		}
	}

	/**
	 * 成功レスポンスを作成
	 */
	protected createSuccessResponse(text: string): McpToolResponse {
		return {
			content: [{ type: "text", text }],
			isError: false,
		};
	}

	/**
	 * エラーレスポンスを作成
	 */
	protected createErrorResponse(error: unknown): McpToolResponse {
		let message: string;

		if (error instanceof AppError) {
			message = error.message;
		} else if (error instanceof Error) {
			message = `${this.toolName}の実行エラー: ${error.message}`;
		} else {
			message = `${this.toolName}の実行エラー: ${String(error)}`;
		}

		this.logger.error(`エラーレスポンス作成: ${formatError(error)}`);

		return {
			content: [{ type: "text", text: message }],
			isError: true,
		};
	}

	/**
	 * 引数の検証（オプション）
	 */
	protected validateArgs(args: any, requiredFields: string[]): void {
		for (const field of requiredFields) {
			if (
				!(field in args) ||
				args[field] === undefined ||
				args[field] === null
			) {
				throw new AppError(
					`必須パラメータが不足しています: ${field}`,
					"VALIDATION_ERROR",
					400,
				);
			}
		}
	}
}
