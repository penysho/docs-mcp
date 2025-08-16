import { type docs_v1, type drive_v3, google } from "googleapis";
import type { IGoogleDocsService } from "../core/interfaces.js";
import { ApiError, DocumentError, NotFoundError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";
import type { AuthService } from "./authService.js";
import type { DocumentSearchResult } from "./types.js";

/**
 * Google Docsサービスクラス
 * Google DocsのAPIを使用してドキュメントの操作を行うクラス
 */
export class GoogleDocsService implements IGoogleDocsService {
	private docsClient: docs_v1.Docs;
	private driveClient: drive_v3.Drive;
	private authService: AuthService;
	private readonly logger = createLogger("GoogleDocsService");

	/**
	 * コンストラクタ
	 * @param authService 認証サービス
	 */
	constructor(authService: AuthService) {
		this.authService = authService;
		this.docsClient = google.docs({ version: "v1" });
		this.driveClient = google.drive({ version: "v3" });
	}

	/**
	 * ドキュメントを読み取る
	 * @param documentId ドキュメントID
	 * @returns ドキュメントの内容
	 */
	async readDocumentContent(documentId: string): Promise<string> {
		if (!this.authService.isAuthorized()) {
			await this.authService.authorize();
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
			this.logger.error("ドキュメント読み取りエラー:", error);

			// APIからのエラーを分析して適切なエラータイプに変換
			if (error instanceof Error && error.message.includes("not found")) {
				throw new NotFoundError(`ドキュメントが見つかりません: ${documentId}`);
			}

			throw new DocumentError(
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
		if (!this.authService.isAuthorized()) {
			await this.authService.authorize();
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
				throw new DocumentError("ドキュメントIDが取得できませんでした。");
			}

			// 内容を追加
			if (content) {
				await this.updateDocumentContent(documentId, content);
			}

			this.logger.info(`新しいドキュメントを作成しました: ${documentId}`);
			return documentId;
		} catch (error) {
			this.logger.error("ドキュメント作成エラー:", error);
			throw new DocumentError(
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
		if (!this.authService.isAuthorized()) {
			await this.authService.authorize();
		}

		try {
			const normalizedId = this.normalizeDocumentId(documentId);

			const requests: docs_v1.Schema$Request[] = [];

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

			this.logger.debug(`ドキュメントを更新しました: ${documentId}`);
		} catch (error) {
			this.logger.error("ドキュメント更新エラー:", error);

			// APIからのエラーを分析して適切なエラータイプに変換
			if (error instanceof Error && error.message.includes("not found")) {
				throw new NotFoundError(`ドキュメントが見つかりません: ${documentId}`);
			}

			throw new DocumentError(
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
	): Promise<DocumentSearchResult[]> {
		if (!this.authService.isAuthorized()) {
			await this.authService.authorize();
		}

		try {
			const response = await this.driveClient.files.list({
				q: `mimeType='application/vnd.google-apps.document' and fullText contains '${query}'`,
				fields: "files(id, name, createdTime, modifiedTime, webViewLink)",
				pageSize: maxResults,
			});

			const files = response.data.files || [];
			const results: DocumentSearchResult[] = [];

			// 検索結果の各ドキュメントについて詳細情報を取得
			for (const file of files) {
				if (file.id) {
					try {
						const content = await this.readDocumentContent(file.id);
						results.push({
							documentId: file.id,
							title: file.name || "",
							content:
								content.substring(0, 200) + (content.length > 200 ? "..." : ""),
							url: file.webViewLink || undefined,
							lastModified: file.modifiedTime || undefined,
						});
					} catch (error) {
						this.logger.warn(
							`ドキュメント ${file.id} の詳細取得に失敗しました:`,
							error,
						);
					}
				}
			}

			return results;
		} catch (error) {
			this.logger.error("ドキュメント検索エラー:", error);
			throw new ApiError(
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
