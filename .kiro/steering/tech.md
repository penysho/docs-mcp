# Technology Stack

## Runtime & Language
- **Node.js**: v14+ (ES2020 target, ESM modules)
- **TypeScript**: v5.8.3 with strict mode enabled
- **Module System**: ES Modules (NodeNext resolution)

## Core Dependencies
- **MCP SDK**: @modelcontextprotocol/sdk v1.10.2
- **Google APIs**: googleapis v148.0.0, @google-cloud/local-auth v3.0.1
- **Validation**: zod v3.24.3 for type-safe configuration
- **Environment**: dotenv v16.5.0 for configuration management

## Development Tools
- **Testing**: Vitest v3.2.4 with Node environment
- **Code Quality**: Biome v2.2.0 (formatting, linting, import organization)
- **Build**: TypeScript compiler with declaration generation

## Common Commands

### Development
```bash
# Development server with hot reload
npm run dev

# Development with MCP debug logging
npm run mcp

# Run tests
npm test

# Watch mode testing
npm test:watch
```

### Build & Production
```bash
# Build for production
npm run build

# Run production build
npm start
```

### Code Quality
```bash
# Format and lint code
npm run biome

# Lint only
npm run lint
```

## Build Process
1. TypeScript compilation to `dist/`
2. Set executable permissions on `dist/index.js`
3. Copy authentication files (`credentials.json`, `token.json`) to `dist/`

## Architecture Patterns
- **Dependency Injection**: ServiceContainer manages service lifecycle
- **Strategy Pattern**: Pluggable insertion strategies for document analysis
- **Error Boundaries**: Hierarchical error handling with custom AppError types
- **Tool Registry**: Automatic MCP tool registration and discovery
