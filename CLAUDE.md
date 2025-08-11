# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Docs MCP (Model Context Protocol) Server that provides an interface for AI systems to interact with Google Docs API. The server is written in TypeScript and implements the MCP specification to enable Google Docs operations through standard MCP tools.

## Development Commands

### Essential Commands
- `npm run build` - Compiles TypeScript to JavaScript, sets execute permissions, and copies credential files to dist/
- `npm run dev` - Runs the development server with ts-node for live TypeScript compilation
- `npm start` - Runs the built server from dist/index.js
- `npm run mcp` - Runs the server in debug mode with MCP debugging enabled
- `npm run lint` - Runs ESLint on TypeScript source files (Note: Currently no test framework is configured)

### Build Process
The build command performs several steps:
1. Compiles TypeScript (`tsc`)
2. Sets executable permissions on `dist/index.js` (`chmod 755`)
3. Copies `credentials.json` and `token.json` to the dist directory

## Architecture

### Core Components

**Entry Point (`src/index.ts`)**
- Simplified main function with dependency injection
- Creates ServiceContainer and GoogleDocsMcpServer instances
- Handles application lifecycle and error management
- Clean separation of concerns with only ~55 lines

**Core Infrastructure**
- `ServiceContainer` (`src/core/container.ts`) - Dependency injection container managing service lifecycles
- `interfaces.ts` (`src/core/interfaces.ts`) - Type definitions and contracts for all major components

**MCP Server Layer**
- `GoogleDocsMcpServer` (`src/mcp/server.ts`) - MCP server management and lifecycle
- `ToolRegistry` (`src/mcp/registry.ts`) - Automatic tool registration and management
- `BaseMcpTool` (`src/mcp/tools/base.ts`) - Abstract base class for all tools with common logic

**MCP Tools (`src/mcp/tools/`)**
- `ReadDocumentTool` - Handles Google Docs document reading
- `CreateDocumentTool` - Handles new document creation
- `UpdateDocumentTool` - Handles document content updates
- `SearchDocumentsTool` - Handles document search functionality
- Each tool extends `BaseMcpTool` for consistent behavior

**Services Layer**
- `AuthService` (`src/services/authService.ts`) - Google OAuth2 authentication
- `GoogleDocsService` (`src/services/googleDocsService.ts`) - Google Docs and Drive API operations
- Interface definitions in `src/services/types.ts` and `src/core/interfaces.ts`

**Configuration (`src/config/index.ts`)**
- Unified configuration management system with validation
- Environment variable handling with type safety
- Supports `.env` file loading and provides safe config display

**Utilities**
- `src/utils/logger.ts` - Custom logging system with configurable levels and stderr output
- `src/utils/errors.ts` - Hierarchical error system with specific error types

### Key Architectural Improvements

**Dependency Injection**
- ServiceContainer manages all service instances with singleton pattern
- Services are lazy-loaded and cached for performance
- Easy mocking for testing

**Tool Architecture**
- BaseToolクラスで共通ロジック (初期化・エラーハンドリング) を集約
- 各ツールは責任が明確で独立してテスト可能
- 新ツール追加は設定ベースで自動登録

**Error Handling**
- 統一されたエラーハンドリング戦略
- 適切なHTTPステータスコードとエラータイプ
- ログ出力の標準化

### Authentication Flow
1. ServiceContainer が初期化時に AuthService を作成
2. AuthService が既存の `token.json` をチェック
3. トークンが無い場合、OAuth フローを開始
4. 認証完了後、全てのAPI呼び出しで再利用

## Key Files and Configuration

### Required Files
- `credentials.json` - Google Cloud OAuth2 credentials (must be in project root)
- `token.json` - OAuth2 refresh token (created after first authentication)
- `.env` - Environment configuration (optional, has sensible defaults)

### TypeScript Configuration
- Target: ES2020
- Module: NodeNext (ESM modules)
- Strict mode enabled
- Output directory: `./dist`
- Source directory: `./src`

### MCP Client Configuration
The server can be configured in MCP clients like Cursor using:
```json
{
  "mcpServers": {
    "google-docs": {
      "command": "node",
      "args": ["/absolute/path/to/docs-mcp/dist/index.js"]
    }
  }
}
```

## Development Workflow

### Initial Setup
1. Run `npm install` to install dependencies
2. Set up Google Cloud project with Docs & Drive API enabled
3. Download OAuth2 credentials as `credentials.json`
4. Run `npm run dev` for first-time authentication
5. Follow the OAuth flow in the terminal

### Making Changes

**Adding New Tools:**
1. Create new tool class in `src/mcp/tools/` extending `BaseMcpTool`
2. Add to `ToolRegistry.registerDefaultTools()` method
3. Tool will be automatically registered and available

**Modifying Services:**
1. Update service interfaces in `src/core/interfaces.ts`
2. Implement changes in respective service classes
3. ServiceContainer will handle dependency injection automatically

**Configuration Changes:**
1. Update `src/config/index.ts` for new settings
2. Add environment variables to `.env` or system environment
3. Configuration validation runs automatically on startup

### Development Commands
1. `npm run dev` - Development with hot reloading
2. `npm run build` - Production build and validation
3. `npm start` - Run the built production version

### Error Handling
The codebase uses a hierarchical error system:
- `AppError` - Base error class
- `AuthError` - Google authentication failures
- `DocumentError` - Google Docs operation failures
- `NotFoundError` - Resource not found errors
- `ApiError` - General API failures
- `ValidationError` - Input validation errors

### Logging
- Uses custom logger with stderr output (MCP requirement)
- Configurable log levels: ERROR, WARN, INFO, DEBUG, TRACE
- Module-specific loggers with prefixes for better debugging