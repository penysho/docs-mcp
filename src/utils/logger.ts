import * as util from 'util';

/**
 * ログレベルの定義
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

/**
 * ロガー設定インターフェース
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  useStderr?: boolean;
}

/**
 * デフォルトのロガー設定
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  prefix: '',
  useStderr: true
};

/**
 * ロガークラス
 * アプリケーション全体で一貫したログ出力を提供するユーティリティ
 */
export class Logger {
  private config: LoggerConfig;

  /**
   * ロガーのコンストラクタ
   * @param config ロガー設定
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * ログレベルを設定
   * @param level 新しいログレベル
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * プレフィックスを設定
   * @param prefix 新しいプレフィックス
   */
  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  /**
   * エラーログを出力
   * @param message メッセージまたはメッセージテンプレート
   * @param params テンプレートのパラメータ（可変長引数）
   */
  error(message: string | Error, ...params: any[]): void {
    if (this.config.level >= LogLevel.ERROR) {
      this.write(this.formatLogLevel('ERROR'), message, params);
    }
  }

  /**
   * 警告ログを出力
   * @param message メッセージまたはメッセージテンプレート
   * @param params テンプレートのパラメータ（可変長引数）
   */
  warn(message: string | Error, ...params: any[]): void {
    if (this.config.level >= LogLevel.WARN) {
      this.write(this.formatLogLevel('WARN'), message, params);
    }
  }

  /**
   * 情報ログを出力
   * @param message メッセージまたはメッセージテンプレート
   * @param params テンプレートのパラメータ（可変長引数）
   */
  info(message: string, ...params: any[]): void {
    if (this.config.level >= LogLevel.INFO) {
      this.write(this.formatLogLevel('INFO'), message, params);
    }
  }

  /**
   * デバッグログを出力
   * @param message メッセージまたはメッセージテンプレート
   * @param params テンプレートのパラメータ（可変長引数）
   */
  debug(message: string, ...params: any[]): void {
    if (this.config.level >= LogLevel.DEBUG) {
      this.write(this.formatLogLevel('DEBUG'), message, params);
    }
  }

  /**
   * トレースログを出力
   * @param message メッセージまたはメッセージテンプレート
   * @param params テンプレートのパラメータ（可変長引数）
   */
  trace(message: string, ...params: any[]): void {
    if (this.config.level >= LogLevel.TRACE) {
      this.write(this.formatLogLevel('TRACE'), message, params);
    }
  }

  /**
   * ログを書き込む内部メソッド
   * @param levelStr ログレベル文字列
   * @param message メッセージまたはメッセージテンプレート
   * @param params テンプレートのパラメータ
   */
  private write(levelStr: string, message: string | Error, params: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : '';
    
    let formattedMessage: string;
    if (message instanceof Error) {
      formattedMessage = `${message.message}\n${message.stack}`;
    } else if (params.length > 0) {
      formattedMessage = util.format(message, ...params);
    } else {
      formattedMessage = message;
    }

    const logOutput = `${timestamp} ${levelStr} ${prefix}${formattedMessage}\n`;
    
    if (this.config.useStderr) {
      process.stderr.write(logOutput);
    } else {
      process.stdout.write(logOutput);
    }
  }

  /**
   * ログレベルの書式設定
   * @param level ログレベル文字列
   * @returns 書式設定されたログレベル
   */
  private formatLogLevel(level: string): string {
    return `[${level.padEnd(5)}]`;
  }
}

/**
 * デフォルトのロガーインスタンス
 */
export const defaultLogger = new Logger();

/**
 * 特定のモジュール用のロガーを作成するファクトリ関数
 * @param module モジュール名
 * @param config ロガー設定（オプション）
 * @returns 新しいロガーインスタンス
 */
export function createLogger(module: string, config: Partial<LoggerConfig> = {}): Logger {
  return new Logger({
    ...config,
    prefix: module
  });
} 