declare module '@modelcontextprotocol/sdk' {
  export interface Context {
    log(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
  }

  export interface ToolSchema {
    type?: string;
    description?: string;
    required?: boolean;
    nullable?: boolean;
    properties?: Record<string, ToolSchema>;
    items?: ToolSchema;
  }

  export interface ToolOutput<T = any> {
    status: 'success' | 'error';
    result?: T;
    message?: string;
  }

  export interface Tool<I = any, O = any> {
    name: string;
    description: string;
    inputSchema: Record<string, ToolSchema>;
    outputSchema?: ToolSchema;
    execute(args: I, ctx: Context): Promise<ToolOutput<O>>;
  }

  export interface ServerOptions {
    name: string;
    version: string;
    summary?: string;
    description?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
  }

  export class Server {
    constructor(options: ServerOptions);
    registerTool<I = any, O = any>(tool: Tool<I, O>): void;
    listen(port: number, host: string, callback?: () => void): void;
  }

  export class MCPClient {
    constructor(options: { baseURL: string });
    getServerInfo(): Promise<{ tools: string[] }>;
    executeTool<T = any>(name: string, args: any): Promise<ToolOutput<T>>;
  }
} 