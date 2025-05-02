/**
 * アプリケーション基本エラークラス
 * アプリケーション内で使用する全てのカスタムエラーの基底クラス
 */
export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public isOperational: boolean;

  /**
   * コンストラクタ
   * @param message エラーメッセージ
   * @param code エラーコード
   * @param statusCode HTTPステータスコード
   * @param isOperational 運用上のエラーかどうか
   */
  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Errorオブジェクトのスタックトレースを適切に設定
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 認証エラークラス
 */
export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR', statusCode: number = 401) {
    super(message, code, statusCode);
  }
}

/**
 * API呼び出しエラークラス
 */
export class ApiError extends AppError {
  constructor(message: string, code: string = 'API_ERROR', statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * 無効な入力エラークラス
 */
export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR', statusCode: number = 400) {
    super(message, code, statusCode);
  }
}

/**
 * リソースが見つからないエラークラス
 */
export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'NOT_FOUND', statusCode: number = 404) {
    super(message, code, statusCode);
  }
}

/**
 * ドキュメント関連のエラークラス
 */
export class DocumentError extends AppError {
  constructor(message: string, code: string = 'DOCUMENT_ERROR', statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * エラーのユーティリティ関数
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * エラーメッセージとスタックトレースをフォーマットする
 * @param error エラーオブジェクト
 * @returns フォーマットされたエラー情報
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  return String(error);
} 