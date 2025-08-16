import * as fs from "fs";
import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import * as readline from "readline";
import { getConfig } from "../config/index.js";
import type { IAuthService } from "../core/interfaces.js";
import { AuthError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";

/**
 * 認証サービスクラス
 * Google APIの認証処理を担当するサービス
 */
export class AuthService implements IAuthService {
	private oAuth2Client: OAuth2Client | null = null;
	private authorized: boolean = false;
	private readonly logger = createLogger("AuthService");

	/**
	 * 認証を行う
	 */
	async authorize(): Promise<void> {
		try {
			const config = getConfig();

			// クレデンシャルの取得
			if (!fs.existsSync(config.googleApi.credentialsPath)) {
				throw new AuthError(
					"credentials.jsonファイルが見つかりません。Google Cloud Consoleから認証情報をダウンロードしてください。",
				);
			}

			// 認証情報を読み込む
			const content = fs.readFileSync(config.googleApi.credentialsPath, "utf8");
			const credentials = JSON.parse(content);

			const { client_secret, client_id, redirect_uris } =
				credentials.installed || credentials.web;
			this.oAuth2Client = new google.auth.OAuth2(
				client_id,
				client_secret,
				redirect_uris[0],
			);

			// トークンの存在確認
			if (fs.existsSync(config.googleApi.tokenPath)) {
				// 既存のトークンを読み込む
				const token = JSON.parse(
					fs.readFileSync(config.googleApi.tokenPath, "utf8"),
				);
				this.oAuth2Client.setCredentials(token);

				// クライアントに認証情報をセット
				google.options({ auth: this.oAuth2Client });
				this.authorized = true;
				this.logger.info("既存のトークンを使用して認証しました");
			} else {
				// 新しいトークンを取得
				await this.getNewToken();
			}
		} catch (error) {
			this.logger.error("認証エラー:", error);
			throw new AuthError(
				`Google APIの認証に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 認証されているか確認
	 */
	isAuthorized(): boolean {
		return this.authorized;
	}

	/**
	 * OAuth2クライアントを取得
	 */
	getOAuth2Client(): OAuth2Client {
		if (!this.oAuth2Client) {
			throw new AuthError(
				"OAuth2クライアントが初期化されていません。authorize()を先に呼び出してください。",
			);
		}
		return this.oAuth2Client;
	}

	/**
	 * 新しいトークンを取得する
	 */
	private async getNewToken(): Promise<void> {
		if (!this.oAuth2Client) {
			throw new AuthError("OAuth2クライアントが初期化されていません。");
		}

		const config = getConfig();
		const authUrl = this.oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: config.googleApi.scopes,
			prompt: "consent",
			include_granted_scopes: true,
		});

		this.logger.info("以下のURLにアクセスして認証を行ってください:");
		this.logger.info(authUrl);

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stderr,
		});

		const code = await new Promise<string>((resolve) => {
			rl.question("認証コードを入力してください: ", (code) => {
				resolve(code);
			});
		});

		rl.close();

		try {
			const { tokens } = await this.oAuth2Client.getToken(code);
			this.oAuth2Client.setCredentials(tokens);

			// トークンを保存
			const config = getConfig();
			fs.writeFileSync(config.googleApi.tokenPath, JSON.stringify(tokens));
			this.logger.info(
				`トークンが保存されました: ${config.googleApi.tokenPath}`,
			);

			// クライアントに認証情報をセット
			google.options({ auth: this.oAuth2Client });
			this.authorized = true;
		} catch (error) {
			this.logger.error("トークンの取得に失敗しました:", error);
			throw new AuthError(
				`認証コードが無効です: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
