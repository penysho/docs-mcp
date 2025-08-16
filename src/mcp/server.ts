import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type {
	IMcpServer,
	IServiceContainer,
	IToolRegistry,
} from "../core/interfaces.js";
import { formatError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";
import { ToolRegistry } from "./registry.js";

/**
 * MCP サーバー管理クラス
 * MCPサーバーの初期化、ツール登録、起動を担当
 */
export class GoogleDocsMcpServer implements IMcpServer {
	private mcpServer?: McpServer;
	private toolRegistry?: IToolRegistry;
	private readonly logger = createLogger("McpServer");

	constructor(private readonly serviceContainer: IServiceContainer) {}

	/**
	 * サーバーの初期化
	 */
	async initialize(): Promise<void> {
		try {
			this.logger.info("Google Docs MCPサーバーの初期化を開始...");

			const config = this.serviceContainer.getConfig();

			// MCPサーバーインスタンスを作成
			this.mcpServer = new McpServer({
				name: config.server.name,
				version: config.server.version,
			});

			// ツールレジストリを初期化
			this.toolRegistry = new ToolRegistry(this.serviceContainer);
			this.toolRegistry.registerDefaultTools();

			// ツールを登録
			this.registerTools();

			this.logger.info("Google Docs MCPサーバーの初期化が完了しました");
		} catch (error) {
			this.logger.error(`サーバー初期化エラー: ${formatError(error)}`);
			throw error;
		}
	}

	/**
	 * サーバーの開始
	 */
	async start(): Promise<void> {
		if (!this.mcpServer) {
			throw new Error(
				"サーバーが初期化されていません。initialize()を先に呼び出してください。",
			);
		}

		try {
			this.logger.info("Google Docs MCPサーバーを起動しています...");

			// StdioServerTransportを初期化
			const transport = new StdioServerTransport();

			// サーバーに接続
			await this.mcpServer.connect(transport);

			this.logger.info("Google Docs MCPサーバーが起動しました");

			// プロセス終了シグナルを捕捉
			this.setupProcessHandlers();
		} catch (error) {
			this.logger.error(`サーバー起動エラー: ${formatError(error)}`);
			throw error;
		}
	}

	/**
	 * ツールをMCPサーバーに登録
	 */
	private registerTools(): void {
		if (!this.mcpServer || !this.toolRegistry) {
			throw new Error("サーバーまたはツールレジストリが初期化されていません。");
		}

		const tools = this.toolRegistry.getTools();
		this.logger.info(`${tools.length}個のツールを登録します...`);

		for (const tool of tools) {
			this.mcpServer.tool(tool.name, tool.schema, async (args: any) => {
				return await tool.execute(args);
			});

			this.logger.debug(`ツールを登録しました: ${tool.name}`);
		}

		this.logger.info("全ツールの登録が完了しました");
	}

	/**
	 * プロセス終了ハンドラの設定
	 */
	private setupProcessHandlers(): void {
		// SIGINT（Ctrl+C）シグナルの処理
		process.on("SIGINT", () => {
			this.logger.info("SIGINTシグナルを受信しました。サーバーを停止します...");
			this.gracefulShutdown();
		});

		// SIGTERMシグナルの処理
		process.on("SIGTERM", () => {
			this.logger.info(
				"SIGTERMシグナルを受信しました。サーバーを停止します...",
			);
			this.gracefulShutdown();
		});

		// 未処理の例外をキャッチ
		process.on("uncaughtException", (error) => {
			this.logger.error(`未処理の例外: ${formatError(error)}`);
			this.gracefulShutdown(1);
		});

		// 未処理のPromise拒否をキャッチ
		process.on("unhandledRejection", (reason) => {
			this.logger.error(`未処理のPromise拒否: ${formatError(reason)}`);
			this.gracefulShutdown(1);
		});
	}

	/**
	 * グレースフルシャットダウン
	 */
	private async gracefulShutdown(exitCode: number = 0): Promise<void> {
		try {
			this.logger.info("リソースを解放しています...");

			// サービスコンテナのリソース解放
			await this.serviceContainer.dispose();

			this.logger.info("グレースフルシャットダウンが完了しました");
			process.exit(exitCode);
		} catch (error) {
			this.logger.error(`シャットダウンエラー: ${formatError(error)}`);
			process.exit(1);
		}
	}

	/**
	 * 登録済みツール情報を取得
	 */
	getRegisteredToolsInfo(): { count: number; names: string[] } {
		if (!this.toolRegistry) {
			return { count: 0, names: [] };
		}

		return {
			count: this.toolRegistry.getToolCount(),
			names: this.toolRegistry.getToolNames(),
		};
	}
}
