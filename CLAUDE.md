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
- Main MCP server initialization
- Registers 4 MCP tools: `read_google_document`, `create_google_document`, `update_google_document`, `search_google_documents`
- Handles service initialization with lazy loading (services initialize on first tool use if not already initialized)
- Uses stdio transport for MCP communication

**Services Layer**
- `AuthService` (`src/services/authService.ts`) - Manages Google OAuth2 authentication using Google Auth Library
- `GoogleDocsService` (`src/services/googleDocsService.ts`) - Handles all Google Docs and Drive API operations
- Interface definitions in `src/services/types.ts`

**Configuration (`src/config/appConfig.ts`)**
- Centralized configuration using environment variables and defaults
- Supports `.env` file loading via dotenv
- Validates Google API credentials file existence

**Utilities**
- `src/utils/logger.ts` - Custom logging system with configurable levels and stderr output (required for MCP)
- `src/utils/errors.ts` - Custom error hierarchy with specific error types for different failure scenarios

### Authentication Flow
1. Checks for existing `token.json` (OAuth refresh token)
2. If not found, prompts user with Google OAuth URL
3. User manually enters authorization code
4. Token is saved for future use
5. All subsequent API calls use the stored token

### MCP Tools Architecture
Each tool follows this pattern:
1. Check if services are initialized, initialize if needed
2. Call appropriate service method
3. Handle errors with specific error types
4. Return MCP-compliant response format

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
1. Edit TypeScript source files in `src/`
2. Use `npm run dev` for development with hot reloading
3. Run `npm run build` before production deployment
4. Test with MCP clients after building

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