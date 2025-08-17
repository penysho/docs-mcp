# Project Structure

## Root Level
- **Configuration**: `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`
- **Environment**: `.env`, `credentials.json`, `token.json` (Google OAuth)
- **Build Output**: `dist/` (compiled TypeScript + copied auth files)

## Source Organization (`src/`)

### Entry Point
- `index.ts` - Main application entry point with initialization logic

### Core Architecture (`src/core/`)
- `container.ts` - ServiceContainer for dependency injection
- `interfaces.ts` - Central type definitions and interface exports
- `documentAnalysis.ts` - Document structure analysis and insertion logic
- `insertionStrategy.ts` - Base classes for content insertion strategies
- `previewGenerator.ts` - Content preview generation before insertion

### Insertion Strategies (`src/core/strategies/`)
- `HeadingBasedStrategy.ts` - Insert content based on document headings
- `PatternBasedStrategy.ts` - Insert content using regex patterns
- `FallbackStrategy.ts` - Default insertion behavior
- `registerStrategies.ts` - Strategy registration system
- `index.ts` - Strategy exports

### MCP Server (`src/mcp/`)
- `server.ts` - GoogleDocsMcpServer main class
- `registry.ts` - ToolRegistry for automatic tool discovery

### MCP Tools (`src/mcp/tools/`)
- `base.ts` - BaseMcpTool abstract class with common functionality
- `readDocument.ts` - Read Google Docs content
- `createDocument.ts` - Create new Google Docs
- `updateDocument.ts` - Update existing documents
- `searchDocuments.ts` - Search Google Docs
- `intelligentInsertion.ts` - Advanced content insertion with strategies

### Services (`src/services/`)
- `authService.ts` - Google OAuth2 authentication
- `googleDocsService.ts` - Google Docs/Drive API operations
- `types.ts` - Service-specific type definitions

### Configuration (`src/config/`)
- `index.ts` - Unified configuration management with environment variables

### Utilities (`src/utils/`)
- `logger.ts` - Structured logging with module-specific loggers
- `errors.ts` - Custom error types and error formatting

## Testing Structure
- **Unit Tests**: `__tests__/` folders alongside source files
- **Integration Tests**: Cross-component testing in `__tests__/` directories
- **Test Naming**: `*.test.ts` and `*.spec.ts` patterns

## Key Architectural Principles
- **Layered Architecture**: Clear separation between MCP, services, and core logic
- **Interface-Driven**: All major components implement interfaces for testability
- **Strategy Pattern**: Pluggable insertion strategies in `src/core/strategies/`
- **Dependency Injection**: ServiceContainer manages all service dependencies
- **Error Boundaries**: Consistent error handling across all layers
