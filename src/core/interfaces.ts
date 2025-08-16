import type { OAuth2Client } from "google-auth-library";
import type { DocumentSearchResult } from "../services/types.js";
import type { LogLevel } from "../utils/logger.js";

/**
 * アプリケーション設定インターフェース
 */
export interface IAppConfig {
	env: string;
	log: ILogConfig;
	googleApi: IGoogleApiConfig;
	server: IServerConfig;
}

/**
 * ログ設定インターフェース
 */
export interface ILogConfig {
	level: LogLevel;
	useStderr: boolean;
}

/**
 * Google API設定インターフェース
 */
export interface IGoogleApiConfig {
	tokenPath: string;
	credentialsPath: string;
	scopes: string[];
}

/**
 * サーバー設定インターフェース
 */
export interface IServerConfig {
	name: string;
	version: string;
}

/**
 * 認証サービスインターフェース
 */
export interface IAuthService {
	authorize(): Promise<void>;
	isAuthorized(): boolean;
	getOAuth2Client(): OAuth2Client;
}

/**
 * Google Docsサービスインターフェース
 */
export interface IGoogleDocsService {
	readDocumentContent(documentId: string): Promise<string>;
	createNewDocument(title: string, content: string): Promise<string>;
	updateDocumentContent(
		documentId: string,
		content: string,
		startPosition?: number,
		endPosition?: number,
	): Promise<void>;
	searchForDocuments(
		query: string,
		maxResults?: number,
	): Promise<DocumentSearchResult[]>;
}

/**
 * サービスコンテナインターフェース
 */
export interface IServiceContainer {
	getAuthService(): Promise<IAuthService>;
	getGoogleDocsService(): Promise<IGoogleDocsService>;
	getConfig(): IAppConfig;
	ensureServicesInitialized(): Promise<void>;
	dispose(): Promise<void>;
}

/**
 * MCPツールの基底インターフェース
 */
export interface IMcpTool {
	readonly name: string;
	readonly schema: any;
	execute(args: any): Promise<McpToolResponse>;
}

/**
 * MCPツールレスポンス
 */
export interface McpToolResponse {
	[key: string]: unknown;
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

/**
 * MCPサーバーインターフェース
 */
export interface IMcpServer {
	initialize(): Promise<void>;
	start(): Promise<void>;
}

/**
 * ツールレジストリインターフェース
 */
export interface IToolRegistry {
	registerTool(tool: IMcpTool): void;
	getTools(): IMcpTool[];
	registerDefaultTools(): void;
	getToolCount(): number;
	getToolNames(): string[];
}
