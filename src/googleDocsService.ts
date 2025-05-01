import { getDocsClient, getDriveClient } from './auth';
import {
  GoogleDocResult,
  DocSearchResult,
  SearchResult,
  AccessGoogleDocsArgs,
  CreateGoogleDocsArgs,
  UpdateGoogleDocsArgs,
  SearchGoogleDocsArgs
} from './types/index';
import { docs_v1 } from 'googleapis';

/**
 * GoogleDocsServiceクラス
 * Google Docsの操作を行うメソッドを提供します
 */
export class GoogleDocsService {
  /**
   * Googleドキュメントのコンテンツをテキストに変換します
   */
  private static extractTextFromDocument(document: docs_v1.Schema$Document): string {
    if (!document.body || !document.body.content) {
      return '';
    }
    
    let text = '';
    document.body.content.forEach(element => {
      if (element.paragraph) {
        element.paragraph.elements?.forEach(paraElement => {
          if (paraElement.textRun && paraElement.textRun.content) {
            text += paraElement.textRun.content;
          }
        });
      }
    });
    
    return text;
  }

  /**
   * ドキュメントIDを正規化します（URL形式から抽出など）
   */
  public static normalizeDocumentId(documentId: string): string {
    const documentIdMatch = documentId.match(/[-\w]{25,}/);
    return documentIdMatch ? documentIdMatch[0] : documentId;
  }

  /**
   * Google Docsドキュメントを読み込みます
   */
  public static async readDocument(args: AccessGoogleDocsArgs): Promise<GoogleDocResult> {
    const { documentId, maxLength, startPosition } = args;
    
    try {
      const docsClient = await getDocsClient();
      const { data: document } = await docsClient.documents.get({
        documentId,
      });
      
      if (!document || !document.title) {
        throw new Error(`ドキュメントが見つかりませんでした: ${documentId}`);
      }
      
      let content = this.extractTextFromDocument(document);
      
      // startPositionとmaxLengthが指定されている場合、その範囲のテキストを抽出
      if (startPosition !== undefined && maxLength !== undefined) {
        content = content.substring(startPosition, startPosition + maxLength);
      } else if (maxLength !== undefined) {
        content = content.substring(0, maxLength);
      }
      
      return {
        documentId,
        title: document.title,
        content,
        url: `https://docs.google.com/document/d/${documentId}/edit`,
        lastModified: document.revisionId || undefined
      };
    } catch (error) {
      console.error('Google Docsの読み込み中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * 新しいGoogle Docsドキュメントを作成します
   */
  public static async createDocument(args: CreateGoogleDocsArgs): Promise<GoogleDocResult> {
    const { title, content } = args;
    
    try {
      const docsClient = await getDocsClient();
      
      // 空のドキュメントを作成
      const { data: document } = await docsClient.documents.create({
        requestBody: {
          title,
        },
      });
      
      if (!document.documentId) {
        throw new Error('ドキュメントの作成に失敗しました');
      }
      
      // コンテンツが指定されている場合は、ドキュメントに挿入
      if (content) {
        await docsClient.documents.batchUpdate({
          documentId: document.documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: {
                    index: 1,
                  },
                  text: content,
                },
              },
            ],
          },
        });
      }
      
      return {
        documentId: document.documentId,
        title: document.title || title,
        content: content || '',
        url: `https://docs.google.com/document/d/${document.documentId}/edit`,
      };
    } catch (error) {
      console.error('Google Docsの作成中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * 既存のGoogle Docsドキュメントを更新します
   */
  public static async updateDocument(args: UpdateGoogleDocsArgs): Promise<GoogleDocResult> {
    const { documentId, content, startPosition = 1, endPosition } = args;
    
    try {
      const docsClient = await getDocsClient();
      
      // ドキュメントを取得して存在確認
      const { data: document } = await docsClient.documents.get({
        documentId,
      });
      
      if (!document || !document.title) {
        throw new Error(`ドキュメントが見つかりませんでした: ${documentId}`);
      }
      
      // ドキュメントを更新
      const updateRequests = [];
      
      // 更新範囲が指定されている場合は、その範囲のテキストを置換
      if (endPosition) {
        updateRequests.push({
          deleteContentRange: {
            range: {
              startIndex: startPosition,
              endIndex: endPosition,
            },
          },
        });
        
        updateRequests.push({
          insertText: {
            location: {
              index: startPosition,
            },
            text: content,
          },
        });
      } else {
        // 範囲指定がない場合は、指定位置にテキストを挿入
        updateRequests.push({
          insertText: {
            location: {
              index: startPosition,
            },
            text: content,
          },
        });
      }
      
      await docsClient.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: updateRequests,
        },
      });
      
      // 更新後のドキュメントを取得
      const { data: updatedDocument } = await docsClient.documents.get({
        documentId,
      });
      
      return {
        documentId,
        title: updatedDocument.title || document.title,
        content: this.extractTextFromDocument(updatedDocument),
        url: `https://docs.google.com/document/d/${documentId}/edit`,
        lastModified: updatedDocument.revisionId || undefined,
      };
    } catch (error) {
      console.error('Google Docsの更新中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * Google Docsドキュメントを検索します
   */
  public static async searchDocuments(args: SearchGoogleDocsArgs): Promise<SearchResult> {
    const { query, maxResults = 10 } = args;
    
    try {
      const driveClient = await getDriveClient();
      
      // Google Driveでドキュメントを検索
      const response = await driveClient.files.list({
        q: `mimeType='application/vnd.google-apps.document' and fullText contains '${query}' and trashed=false`,
        pageSize: maxResults,
        fields: 'nextPageToken, files(id, name, modifiedTime)',
      });
      
      const files = response.data.files || [];
      const nextPageToken = response.data.nextPageToken || undefined;
      
      // 検索結果からドキュメント情報を取得
      const documentsPromises = files
        .filter(file => !!file.id)
        .map(async (file) => {
          try {
            const doc = await this.readDocument({ documentId: file.id! });
            const searchResult: DocSearchResult = {
              ...doc,
              lastModified: file.modifiedTime || undefined
            };
            return searchResult;
          } catch (error) {
            console.error(`ドキュメント ${file.id} の取得中にエラーが発生しました:`, error);
            return null;
          }
        });
      
      const documentsWithNulls = await Promise.all(documentsPromises);
      const documents = documentsWithNulls
        .filter((doc): doc is DocSearchResult => doc !== null)
        .map(doc => ({
          documentId: doc.documentId,
          title: doc.title,
          content: doc.content,
          url: doc.url,
          lastModified: doc.lastModified
        }));
      
      return {
        documents,
        nextPageToken,
      };
    } catch (error) {
      console.error('Google Docsの検索中にエラーが発生しました:', error);
      throw error;
    }
  }
}

// 既存の関数をGoogleDocsServiceのメソッドにマッピング
export const readGoogleDoc = GoogleDocsService.readDocument.bind(GoogleDocsService);
export const createGoogleDoc = GoogleDocsService.createDocument.bind(GoogleDocsService);
export const updateGoogleDoc = GoogleDocsService.updateDocument.bind(GoogleDocsService);
export const searchGoogleDocs = GoogleDocsService.searchDocuments.bind(GoogleDocsService); 