// MCPツールの引数の型
export interface AccessGoogleDocsArgs {
  documentId: string;
  maxLength?: number;
  startPosition?: number;
}

export interface CreateGoogleDocsArgs {
  title: string;
  content?: string;
}

export interface UpdateGoogleDocsArgs {
  documentId: string;
  content: string;
  startPosition?: number;
  endPosition?: number;
}

export interface SearchGoogleDocsArgs {
  query: string;
  maxResults?: number;
}

// Google Docsのレスポンス型
export interface GoogleDocResult {
  documentId: string;
  title: string;
  content: string;
  url: string;
  lastModified?: string;
}

// GoogleドキュメントAPIからの検索結果型
export interface DocSearchResult extends GoogleDocResult {
  lastModified: string | undefined;
}

export interface SearchResult {
  documents: GoogleDocResult[];
  nextPageToken?: string;
}

// MCPの設定型
export interface MCPConfig {
  port: number;
  host: string;
} 