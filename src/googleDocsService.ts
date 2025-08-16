import * as fs from "fs";
import type { OAuth2Client } from "google-auth-library";
import { type docs_v1, type drive_v3, google } from "googleapis";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

// ESモジュール環境での__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// トークン情報と認証情報のパスを絶対パスで指定
const TOKEN_PATH = path.resolve(__dirname, "../token.json");
const CREDENTIALS_PATH = path.resolve(__dirname, "../credentials.json");

/**
 * Google Docsサービスクラス
 * Google DocsのAPIを使用してドキュメントの操作を行うクラス
 */
export class GoogleDocsService {
	private docsClient: docs_v1.Docs;
	private driveClient: drive_v3.Drive;
	private authorized: boolean = false;

	constructor() {
		this.docsClient = google.docs({ version: "v1" });
		this.driveClient = google.drive({ version: "v3" });
		this.authorize();
	}

	/**
	 * 認証を行う
	 */
	private async authorize(): Promise<void> {
		try {
			// 認証情報ファイルの存在確認
			if (!fs.existsSync(CREDENTIALS_PATH)) {
				throw new Error(
					"credentials.jsonファイルが見つかりません。Google Cloud Consoleから認証情報をダウンロードしてください。",
				);
			}

			// 認証情報を読み込む
			const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
			const credentials = JSON.parse(content);

			const { client_secret, client_id, redirect_uris } =
				credentials.installed || credentials.web;
			const oAuth2Client = new google.auth.OAuth2(
				client_id,
				client_secret,
				redirect_uris[0],
			);

			// トークンの存在確認
			if (fs.existsSync(TOKEN_PATH)) {
				// 既存のトークンを読み込む
				const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
				oAuth2Client.setCredentials(token);

				// クライアントに認証情報をセット
				google.options({ auth: oAuth2Client });
				this.authorized = true;
			} else {
				// 新しいトークンを取得
				await this.getNewToken(oAuth2Client);
			}
		} catch (error) {
			process.stderr.write(`認証エラー: ${error}\n`);
			throw new Error("Google APIの認証に失敗しました。");
		}
	}

	/**
	 * 新しいトークンを取得する
	 * @param oAuth2Client OAuth2クライアント
	 */
	private async getNewToken(oAuth2Client: OAuth2Client): Promise<void> {
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: [
				"https://www.googleapis.com/auth/documents",
				"https://www.googleapis.com/auth/drive",
			],
			prompt: "consent",
			include_granted_scopes: true,
		});

		process.stderr.write("以下のURLにアクセスして認証を行ってください:\n");
		process.stderr.write(`${authUrl}\n`);

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
			const { tokens } = await oAuth2Client.getToken(code);
			oAuth2Client.setCredentials(tokens);

			// トークンを保存
			fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
			process.stderr.write(`トークンが保存されました: ${TOKEN_PATH}\n`);

			// クライアントに認証情報をセット
			google.options({ auth: oAuth2Client });
			this.authorized = true;
		} catch (error) {
			process.stderr.write(`トークンの取得に失敗しました: ${error}\n`);
			throw new Error("認証コードが無効です。");
		}
	}

	/**
	 * ドキュメントを読み取る
	 * @param documentId ドキュメントID
	 * @returns ドキュメントの内容
	 */
	async readDocumentContent(documentId: string): Promise<string> {
		if (!this.authorized) {
			await this.authorize();
		}

		try {
			// ドキュメントを取得
			const response = await this.docsClient.documents.get({
				documentId: this.normalizeDocumentId(documentId),
			});

			// ドキュメントの内容を抽出
			const document = response.data;
			let content = "";

			if (document.body && document.body.content) {
				document.body.content.forEach((element) => {
					if (element.paragraph) {
						element.paragraph.elements?.forEach((paragraphElement) => {
							if (paragraphElement.textRun) {
								content += paragraphElement.textRun.content || "";
							}
						});
					}
				});
			}

			return content;
		} catch (error) {
			process.stderr.write(`ドキュメント読み取りエラー: ${error}\n`);
			throw new Error(
				`ドキュメントの読み取りに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 新しいドキュメントを作成する
	 * @param title ドキュメントのタイトル
	 * @param content ドキュメントの初期内容
	 * @returns 作成されたドキュメントのID
	 */
	async createNewDocument(title: string, content: string): Promise<string> {
		if (!this.authorized) {
			await this.authorize();
		}

		try {
			// 空のドキュメントを作成
			const createResponse = await this.docsClient.documents.create({
				requestBody: {
					title: title,
				},
			});

			const documentId = createResponse.data.documentId;

			if (!documentId) {
				throw new Error("ドキュメントIDが取得できませんでした。");
			}

			// 内容を追加
			if (content) {
				await this.updateDocumentContent(documentId, content);
			}

			return documentId;
		} catch (error) {
			process.stderr.write(`ドキュメント作成エラー: ${error}\n`);
			throw new Error(
				`ドキュメントの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * ドキュメントを更新する
	 * @param documentId ドキュメントID
	 * @param content 追加または更新するコンテンツ
	 * @param startPosition 更新を開始する位置
	 * @param endPosition 更新を終了する位置
	 */
	async updateDocumentContent(
		documentId: string,
		content: string,
		startPosition?: number,
		endPosition?: number,
	): Promise<void> {
		if (!this.authorized) {
			await this.authorize();
		}

		try {
			const normalizedId = this.normalizeDocumentId(documentId);

			const requests: any[] = [];

			// 範囲指定がある場合は置き換え
			if (startPosition !== undefined && endPosition !== undefined) {
				requests.push({
					deleteContentRange: {
						range: {
							startIndex: startPosition,
							endIndex: endPosition,
						},
					},
				});
				requests.push({
					insertText: {
						text: content,
						location: {
							index: startPosition,
						},
					},
				});
			} else {
				// 範囲指定がない場合は末尾に追加
				requests.push({
					insertText: {
						text: content,
						endOfSegmentLocation: {
							segmentId: "",
						},
					},
				});
			}

			await this.docsClient.documents.batchUpdate({
				documentId: normalizedId,
				requestBody: {
					requests: requests,
				},
			});
		} catch (error) {
			process.stderr.write(`ドキュメント更新エラー: ${error}\n`);
			throw new Error(
				`ドキュメントの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * ドキュメントを検索する
	 * @param query 検索クエリ
	 * @param maxResults 取得する最大結果数
	 * @returns 検索結果
	 */
	async searchForDocuments(
		query: string,
		maxResults: number = 10,
	): Promise<any[]> {
		if (!this.authorized) {
			await this.authorize();
		}

		try {
			const response = await this.driveClient.files.list({
				q: `mimeType='application/vnd.google-apps.document' and fullText contains '${query}'`,
				fields: "files(id, name, createdTime, modifiedTime, webViewLink)",
				pageSize: maxResults,
			});

			const files = response.data.files || [];
			const results = [];

			// 検索結果の各ドキュメントについて詳細情報を取得
			for (const file of files) {
				if (file.id) {
					try {
						const content = await this.readDocumentContent(file.id);
						results.push({
							documentId: file.id,
							title: file.name,
							content:
								content.substring(0, 200) + (content.length > 200 ? "..." : ""),
							url: file.webViewLink,
							lastModified: file.modifiedTime,
						});
					} catch (error) {
						process.stderr.write(
							`ドキュメント ${file.id} の詳細取得に失敗しました: ${error}\n`,
						);
					}
				}
			}

			return results;
		} catch (error) {
			process.stderr.write(`ドキュメント検索エラー: ${error}\n`);
			throw new Error(
				`ドキュメントの検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * ドキュメントIDを正規化する
	 * URLからIDを抽出する場合があるため
	 * @param documentId ドキュメントID
	 * @returns 正規化されたドキュメントID
	 */
	private normalizeDocumentId(documentId: string): string {
		const documentIdMatch = documentId.match(/[-\w]{25,}/);
		return documentIdMatch ? documentIdMatch[0] : documentId;
	}
}
