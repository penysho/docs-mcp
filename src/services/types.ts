/**
 * Google Docsサービスのインターフェース
 * 依存性注入を可能にするためのインターフェース定義
 */
export interface IGoogleDocsService {
	/**
	 * ドキュメントを読み取る
	 * @param documentId ドキュメントID
	 * @returns ドキュメントの内容
	 */
	readDocumentContent(documentId: string): Promise<string>;

	/**
	 * 新しいドキュメントを作成する
	 * @param title ドキュメントのタイトル
	 * @param content ドキュメントの初期内容
	 * @returns 作成されたドキュメントのID
	 */
	createNewDocument(title: string, content: string): Promise<string>;

	/**
	 * ドキュメントを更新する
	 * @param documentId ドキュメントID
	 * @param content 追加または更新するコンテンツ
	 * @param startPosition 更新を開始する位置
	 * @param endPosition 更新を終了する位置
	 */
	updateDocumentContent(
		documentId: string,
		content: string,
		startPosition?: number,
		endPosition?: number,
	): Promise<void>;

	/**
	 * ドキュメントを検索する
	 * @param query 検索クエリ
	 * @param maxResults 取得する最大結果数
	 * @returns 検索結果
	 */
	searchForDocuments(
		query: string,
		maxResults?: number,
	): Promise<DocumentSearchResult[]>;
}

/**
 * 認証サービスのインターフェース
 */
export interface IAuthService {
	/**
	 * 認証を行う
	 */
	authorize(): Promise<void>;

	/**
	 * 認証されているか確認
	 */
	isAuthorized(): boolean;
}

/**
 * ドキュメント検索結果の型定義
 */
export interface DocumentSearchResult {
	documentId: string;
	title: string;
	content: string;
	url?: string;
	lastModified?: string;
}
