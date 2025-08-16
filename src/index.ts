import { getConfig } from "./config/index.js";
import { ServiceContainer } from "./core/container.js";
import { GoogleDocsMcpServer } from "./mcp/server.js";
import { formatError } from "./utils/errors.js";
import { createLogger } from "./utils/logger.js";

/**
 * アプリケーションのメインエントリーポイント
 */
async function main(): Promise<void> {
	let logger;

	try {
		// 設定の読み込み
		const config = getConfig();

		// ロガーの初期化
		logger = createLogger("Main", {
			level: config.log.level,
			useStderr: config.log.useStderr,
		});

		logger.info("Google Docs MCPサーバーのアプリケーションを開始します...");
		logger.debug("設定情報:", config);

		// サービスコンテナの初期化
		const serviceContainer = new ServiceContainer(config);

		// MCPサーバーの初期化
		const mcpServer = new GoogleDocsMcpServer(serviceContainer);

		// サーバーの初期化と開始
		await mcpServer.initialize();
		await mcpServer.start();

		// サーバー情報をログ出力
		const toolsInfo = mcpServer.getRegisteredToolsInfo();
		logger.info(
			`サーバーが正常に起動しました。登録ツール数: ${toolsInfo.count}`,
		);
		logger.debug("登録ツール一覧:", toolsInfo.names);
	} catch (error) {
		// ロガーが初期化されていない場合のフォールバック
		const errorLogger = logger || createLogger("Main");
		errorLogger.error(`アプリケーション起動エラー: ${formatError(error)}`);
		process.exit(1);
	}
}

// アプリケーションの起動
main().catch((error) => {
	console.error(`致命的エラー: ${formatError(error)}`);
	process.exit(1);
});
