import { 
  IServiceContainer, 
  IAuthService, 
  IGoogleDocsService, 
  IAppConfig 
} from './interfaces.js';
import { AuthService } from '../services/authService.js';
import { GoogleDocsService } from '../services/googleDocsService.js';
import { createLogger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * 依存性注入コンテナ
 * アプリケーション全体のサービス管理とライフサイクル制御を行う
 */
export class ServiceContainer implements IServiceContainer {
  private authService?: IAuthService;
  private googleDocsService?: IGoogleDocsService;
  private readonly config: IAppConfig;
  private readonly logger = createLogger('ServiceContainer');

  constructor(config: IAppConfig) {
    this.config = config;
  }

  /**
   * 認証サービスのインスタンスを取得
   * シングルトンパターンで管理
   */
  async getAuthService(): Promise<IAuthService> {
    if (!this.authService) {
      this.logger.debug('認証サービスを初期化しています...');
      this.authService = new AuthService();
      await this.authService.authorize();
      this.logger.debug('認証サービスの初期化が完了しました');
    }
    return this.authService;
  }

  /**
   * Google Docsサービスのインスタンスを取得
   * シングルトンパターンで管理
   */
  async getGoogleDocsService(): Promise<IGoogleDocsService> {
    if (!this.googleDocsService) {
      this.logger.debug('Google Docsサービスを初期化しています...');
      const authService = await this.getAuthService();
      this.googleDocsService = new GoogleDocsService(authService as AuthService);
      this.logger.debug('Google Docsサービスの初期化が完了しました');
    }
    return this.googleDocsService;
  }

  /**
   * アプリケーション設定を取得
   */
  getConfig(): IAppConfig {
    return this.config;
  }

  /**
   * サービスの初期化状態を確認
   */
  async ensureServicesInitialized(): Promise<void> {
    try {
      await this.getAuthService();
      await this.getGoogleDocsService();
      this.logger.info('全サービスの初期化が完了しました');
    } catch (error) {
      this.logger.error('サービス初期化エラー:', error);
      throw new AppError(
        `サービスの初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        'SERVICE_INITIALIZATION_ERROR'
      );
    }
  }

  /**
   * リソースの解放
   */
  async dispose(): Promise<void> {
    this.logger.debug('サービスコンテナのリソースを解放しています...');
    this.authService = undefined;
    this.googleDocsService = undefined;
    this.logger.debug('サービスコンテナのリソース解放が完了しました');
  }
}