# コーディング規約とスタイル

## TypeScript規約

### 命名規則
- **クラス**: PascalCase (例: `ServiceContainer`, `GoogleDocsMcpServer`)
- **インターフェース**: I + PascalCase (例: `IAppConfig`, `IMcpTool`)
- **関数**: camelCase (例: `getConfig`, `createLogger`)
- **定数**: UPPER_SNAKE_CASE (例: `DEFAULT_CONFIG`)
- **ファイル**: camelCase.ts (例: `authService.ts`)

### 型安全性
- 全関数に型注釈を必須
- strictモード有効 (`tsconfig.json`)
- 戻り値型の明示 (`Promise<string>`, `void` など)
- インターフェースによる契約定義

### インポート規則
- ESM形式 (`.js`拡張子必須)
- 相対パス: `'../../core/interfaces.js'`
- 絶対パッケージ: `'googleapis'`

## コードスタイル

### クラス設計
```typescript
export abstract class BaseMcpTool implements IMcpTool {
  protected readonly logger: Logger;
  
  constructor(
    protected readonly toolName: string,
    serviceContainer: IServiceContainer
  ) {
    // 初期化処理
  }
  
  abstract get schema(): any;
  protected abstract executeInternal(args: any): Promise<McpToolResponse>;
}
```

### エラーハンドリング
- `AppError` クラスを使用
- try-catch でラップ
- ログ出力必須
- 適切なエラーメッセージ

### ログ出力
```typescript
// モジュール別ロガー作成
const logger = createLogger('ModuleName');

// レベル別出力
logger.info('情報メッセージ');
logger.debug('デバッグ情報:', data);
logger.error('エラー:', error);
```

## ドキュメント規約

### JSDoc形式
```typescript
/**
 * メソッドの説明
 * @param arg1 引数1の説明
 * @param arg2 引数2の説明
 * @returns 戻り値の説明
 */
```

### コメント
- 処理の目的と意図を説明
- 複雑なロジックには詳細コメント
- 日本語でのコメント可