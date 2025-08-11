import { IToolRegistry, IMcpTool, IServiceContainer } from '../core/interfaces.js';
import { createLogger } from '../utils/logger.js';
import { 
  ReadDocumentTool, 
  CreateDocumentTool, 
  UpdateDocumentTool, 
  SearchDocumentsTool 
} from './tools/index.js';

/**
 * MCPツールレジストリ
 * ツールの登録と管理を行うクラス
 */
export class ToolRegistry implements IToolRegistry {
  private readonly tools: Map<string, IMcpTool> = new Map();
  private readonly logger = createLogger('ToolRegistry');

  constructor(private readonly serviceContainer: IServiceContainer) {}

  /**
   * ツールを登録
   */
  registerTool(tool: IMcpTool): void {
    this.tools.set(tool.name, tool);
    this.logger.debug(`ツールを登録しました: ${tool.name}`);
  }

  /**
   * 全ツールを取得
   */
  getTools(): IMcpTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 名前でツールを取得
   */
  getTool(name: string): IMcpTool | undefined {
    return this.tools.get(name);
  }

  /**
   * デフォルトツールを自動登録
   */
  registerDefaultTools(): void {
    this.logger.info('デフォルトツールを登録しています...');

    // 各ツールを登録
    this.registerTool(new ReadDocumentTool(this.serviceContainer));
    this.registerTool(new CreateDocumentTool(this.serviceContainer));
    this.registerTool(new UpdateDocumentTool(this.serviceContainer));
    this.registerTool(new SearchDocumentsTool(this.serviceContainer));

    this.logger.info(`デフォルトツールの登録が完了しました: ${this.tools.size}個のツール`);
  }

  /**
   * 登録済みツール数を取得
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * 登録済みツール名一覧を取得
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}