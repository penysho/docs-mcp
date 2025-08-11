import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { LogLevel } from '../utils/logger.js';
import { IAppConfig, ILogConfig, IGoogleApiConfig, IServerConfig } from '../core/interfaces.js';
import { AppError } from '../utils/errors.js';

// ESモジュール環境での__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 統合設定管理クラス
 * 環境変数、設定ファイル、デフォルト値を統一的に管理
 */
export class ConfigManager {
  private config?: IAppConfig;

  constructor() {
    // .envファイルの読み込み
    dotenv.config();
  }

  /**
   * 設定を取得（遅延初期化）
   */
  getConfig(): IAppConfig {
    if (!this.config) {
      this.config = this.loadConfig();
      this.validateConfig(this.config);
    }
    return this.config;
  }

  /**
   * 設定の読み込み
   */
  private loadConfig(): IAppConfig {
    return {
      env: this.getEnv('NODE_ENV', 'development'),
      log: this.loadLogConfig(),
      googleApi: this.loadGoogleApiConfig(),
      server: this.loadServerConfig()
    };
  }

  /**
   * ログ設定の読み込み
   */
  private loadLogConfig(): ILogConfig {
    return {
      level: this.getLogLevel('LOG_LEVEL', LogLevel.INFO),
      useStderr: this.getEnvAsBool('LOG_USE_STDERR', true)
    };
  }

  /**
   * Google API設定の読み込み
   */
  private loadGoogleApiConfig(): IGoogleApiConfig {
    return {
      tokenPath: this.getEnv('TOKEN_PATH', path.resolve(__dirname, '../../token.json')),
      credentialsPath: this.getEnv('CREDENTIALS_PATH', path.resolve(__dirname, '../../credentials.json')),
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ]
    };
  }

  /**
   * サーバー設定の読み込み
   */
  private loadServerConfig(): IServerConfig {
    return {
      name: this.getEnv('SERVER_NAME', 'google-docs-mcp-server'),
      version: this.getEnv('SERVER_VERSION', '1.0.0')
    };
  }

  /**
   * 設定の検証
   */
  private validateConfig(config: IAppConfig): void {
    // Google API認証情報ファイルの存在確認
    if (!fs.existsSync(config.googleApi.credentialsPath)) {
      throw new AppError(
        `credentials.jsonファイルが見つかりません: ${config.googleApi.credentialsPath}`,
        'CONFIG_VALIDATION_ERROR',
        500
      );
    }

    // 必須設定値の確認
    if (!config.server.name || !config.server.version) {
      throw new AppError(
        'サーバー名またはバージョンが設定されていません',
        'CONFIG_VALIDATION_ERROR',
        500
      );
    }

    // ログレベルの妥当性確認
    if (config.log.level < LogLevel.ERROR || config.log.level > LogLevel.TRACE) {
      throw new AppError(
        `無効なログレベルです: ${config.log.level}`,
        'CONFIG_VALIDATION_ERROR',
        500
      );
    }
  }

  /**
   * 環境変数から文字列を取得
   */
  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * 環境変数から数値を取得
   */
  private getEnvAsInt(key: string, defaultValue: number): number {
    const val = process.env[key];
    if (!val) return defaultValue;
    
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      throw new AppError(
        `環境変数 ${key} は数値である必要があります: ${val}`,
        'CONFIG_VALIDATION_ERROR',
        500
      );
    }
    
    return parsed;
  }

  /**
   * 環境変数からブール値を取得
   */
  private getEnvAsBool(key: string, defaultValue: boolean): boolean {
    const val = process.env[key];
    if (!val) return defaultValue;
    
    switch (val.toLowerCase()) {
      case 'true':
      case '1':
      case 'yes':
        return true;
      case 'false':
      case '0':
      case 'no':
        return false;
      default:
        throw new AppError(
          `環境変数 ${key} はブール値である必要があります: ${val}`,
          'CONFIG_VALIDATION_ERROR',
          500
        );
    }
  }

  /**
   * 環境変数からログレベルを取得
   */
  private getLogLevel(key: string, defaultValue: LogLevel): LogLevel {
    const val = process.env[key]?.toUpperCase();
    if (!val) return defaultValue;
    
    switch (val) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default:
        throw new AppError(
          `無効なログレベルです: ${val}`,
          'CONFIG_VALIDATION_ERROR',
          500
        );
    }
  }

  /**
   * 設定情報の表示（センシティブ情報を除く）
   */
  getSafeConfigInfo(): object {
    const config = this.getConfig();
    return {
      env: config.env,
      log: {
        level: LogLevel[config.log.level],
        useStderr: config.log.useStderr
      },
      server: {
        name: config.server.name,
        version: config.server.version
      },
      googleApi: {
        credentialsPathExists: fs.existsSync(config.googleApi.credentialsPath),
        tokenPathExists: fs.existsSync(config.googleApi.tokenPath),
        scopes: config.googleApi.scopes
      }
    };
  }
}

// シングルトンインスタンス
const configManager = new ConfigManager();

/**
 * 設定を取得する関数（後方互換性のため）
 */
export function getConfig(): IAppConfig {
  return configManager.getConfig();
}

/**
 * 設定検証関数（後方互換性のため）
 */
export function validateConfig(): void {
  configManager.getConfig(); // 内部で検証が実行される
}

export default configManager;