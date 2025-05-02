import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { LogLevel } from '../utils/logger.js';

// ESモジュール環境での__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルの読み込み
dotenv.config();

/**
 * ログ設定インターフェース
 */
interface LogConfig {
  level: LogLevel;
  useStderr: boolean;
}

/**
 * Google API設定インターフェース
 */
interface GoogleApiConfig {
  tokenPath: string;
  credentialsPath: string;
  scopes: string[];
}

/**
 * サーバー設定インターフェース
 */
interface ServerConfig {
  name: string;
  version: string;
}

/**
 * アプリケーション設定インターフェース
 */
export interface AppConfig {
  env: string;
  log: LogConfig;
  googleApi: GoogleApiConfig;
  server: ServerConfig;
}

// 環境変数から値を取得する関数
function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// 環境変数から数値を取得する関数
function getEnvAsInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : defaultValue;
}

// 環境変数からブール値を取得する関数
function getEnvAsBool(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return defaultValue;
}

// 環境変数からログレベルを取得する関数
function getLogLevel(key: string, defaultValue: LogLevel): LogLevel {
  const val = process.env[key]?.toUpperCase();
  switch (val) {
    case 'ERROR': return LogLevel.ERROR;
    case 'WARN': return LogLevel.WARN;
    case 'INFO': return LogLevel.INFO;
    case 'DEBUG': return LogLevel.DEBUG;
    case 'TRACE': return LogLevel.TRACE;
    default: return defaultValue;
  }
}

// 設定オブジェクトの作成
const config: AppConfig = {
  env: getEnv('NODE_ENV', 'development'),
  
  log: {
    level: getLogLevel('LOG_LEVEL', LogLevel.INFO),
    useStderr: getEnvAsBool('LOG_USE_STDERR', true)
  },
  
  googleApi: {
    tokenPath: getEnv('TOKEN_PATH', path.resolve(__dirname, '../../token.json')),
    credentialsPath: getEnv('CREDENTIALS_PATH', path.resolve(__dirname, '../../credentials.json')),
    scopes: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive'
    ]
  },
  
  server: {
    name: getEnv('SERVER_NAME', 'google-docs-mcp-server'),
    version: getEnv('SERVER_VERSION', '1.0.0')
  }
};

// トークンパスとクレデンシャルパスの検証
export function validateConfig(): void {
  // クレデンシャルファイルの存在確認
  if (!fs.existsSync(config.googleApi.credentialsPath)) {
    throw new Error(`credentials.jsonファイルが見つかりません: ${config.googleApi.credentialsPath}`);
  }
}

export default config; 