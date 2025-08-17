# Design Document

## Overview

This design implements an intelligent document insertion system for the Google Docs MCP server. The system will analyze document structure and content to determine appropriate insertion points based on configurable strategies. The architecture follows a plugin-based approach for extensibility and maintains compatibility with the existing MCP tool framework.

## Architecture

### Core Components

1. **Document Analyzer**: Parses Google Docs structure and extracts semantic information
2. **Insertion Strategy Engine**: Manages and executes different insertion strategies
3. **Content Processor**: Handles content formatting and preparation for insertion
4. **Preview Generator**: Provides insertion preview functionality
5. **Enhanced Update Tool**: Extended MCP tool with intelligent insertion capabilities

### Plugin Architecture

The system uses a strategy pattern with pluggable insertion strategies:

```
IInsertionStrategy (interface)
├── HeadingBasedStrategy
├── SectionBasedStrategy
├── PatternBasedStrategy
└── FallbackStrategy
```

## Components and Interfaces

### Document Analysis Layer

```typescript
interface IDocumentAnalyzer {
  analyzeDocument(documentId: string): Promise<DocumentStructure>;
  findInsertionPoints(structure: DocumentStructure, strategy: IInsertionStrategy): Promise<InsertionPoint[]>;
}

interface DocumentStructure {
  elements: DocumentElement[];
  headings: HeadingElement[];
  sections: SectionElement[];
  totalLength: number;
}

interface DocumentElement {
  type: 'paragraph' | 'heading' | 'table' | 'list';
  content: string;
  startIndex: number;
  endIndex: number;
  level?: number; // for headings
  formatting?: FormattingInfo;
}

interface InsertionPoint {
  index: number;
  confidence: number;
  context: string;
  strategy: string;
  reasoning: string;
}
```

### Insertion Strategy Layer

```typescript
interface IInsertionStrategy {
  readonly name: string;
  readonly priority: number;
  findInsertionPoints(structure: DocumentStructure, config: StrategyConfig): Promise<InsertionPoint[]>;
  validateConfig(config: StrategyConfig): boolean;
}

interface StrategyConfig {
  [key: string]: any;
}

// Specific strategy configurations
interface HeadingStrategyConfig extends StrategyConfig {
  headingText?: string;
  headingLevel?: number;
  headingPattern?: string;
  position: 'before' | 'after' | 'under';
}

interface SectionStrategyConfig extends StrategyConfig {
  sectionName: string;
  position: 'beginning' | 'end';
}

interface PatternStrategyConfig extends StrategyConfig {
  pattern: string;
  position: 'before' | 'after';
  caseSensitive?: boolean;
}
```

### Enhanced MCP Tool

```typescript
interface IntelligentInsertionArgs {
  documentId: string;
  content: string;
  strategy: InsertionStrategyType;
  strategyConfig: StrategyConfig;
  preview?: boolean;
  fallbackBehavior?: 'end' | 'beginning' | 'error';
  preventDuplicates?: boolean;
}

type InsertionStrategyType = 'heading' | 'section' | 'pattern' | 'auto';
```

## Data Models

### Document Structure Model

The system will parse Google Docs API responses into a normalized structure:

```typescript
class DocumentStructure {
  elements: DocumentElement[];
  headings: HeadingElement[];
  sections: SectionElement[];
  totalLength: number;

  constructor(docsApiResponse: docs_v1.Schema$Document);

  findElementByIndex(index: number): DocumentElement | null;
  getHeadingsByLevel(level: number): HeadingElement[];
  getSectionByName(name: string): SectionElement | null;
}
```

### Insertion Result Model

```typescript
interface InsertionResult {
  success: boolean;
  insertionPoint: InsertionPoint;
  actualIndex: number;
  modifiedContent?: string;
  warnings: string[];
  errors: string[];
}

interface PreviewResult {
  proposedInsertionPoints: InsertionPoint[];
  selectedPoint: InsertionPoint;
  contextBefore: string;
  contextAfter: string;
  warnings: string[];
}
```

## Error Handling

### Error Types

1. **DocumentAnalysisError**: Issues parsing document structure
2. **StrategyConfigurationError**: Invalid strategy configuration
3. **InsertionTargetNotFoundError**: Specified insertion target doesn't exist
4. **DuplicateContentError**: Content would create duplicates
5. **FormattingError**: Issues with content formatting

### Fallback Behavior

```typescript
enum FallbackBehavior {
  END_OF_DOCUMENT = 'end',
  BEGINNING_OF_DOCUMENT = 'beginning',
  THROW_ERROR = 'error'
}
```

## Testing Strategy

### Unit Testing

1. **Document Analyzer Tests**
   - Parse various document structures
   - Handle malformed documents
   - Extract headings and sections correctly

2. **Strategy Tests**
   - Each strategy with valid/invalid configurations
   - Edge cases (missing targets, multiple matches)
   - Confidence scoring accuracy

3. **Integration Tests**
   - End-to-end insertion workflows
   - Preview functionality
   - Error handling scenarios

### Test Document Templates

Create standardized test documents with:
- Multiple heading levels
- Various section structures
- Different content types (tables, lists, paragraphs)
- Edge cases (empty sections, nested structures)

## Implementation Phases

### Phase 1: Core Infrastructure
- Document analyzer implementation
- Basic insertion strategy interface
- Enhanced MCP tool structure

### Phase 2: Basic Strategies
- Heading-based insertion strategy
- Pattern-based insertion strategy
- Fallback strategy

### Phase 3: Advanced Features
- Section-based insertion strategy
- Preview functionality
- Duplicate detection

### Phase 4: Polish and Optimization
- Performance optimization
- Enhanced error handling
- Comprehensive logging

## Configuration

### Strategy Configuration Examples

```typescript
// Heading-based insertion
const headingConfig: HeadingStrategyConfig = {
  headingText: "Conclusion",
  position: "before"
};

// Pattern-based insertion
const patternConfig: PatternStrategyConfig = {
  pattern: "References",
  position: "before",
  caseSensitive: false
};

// Section-based insertion
const sectionConfig: SectionStrategyConfig = {
  sectionName: "Implementation Details",
  position: "end"
};
```

### Tool Usage Examples

```typescript
// Preview insertion
await intelligentInsertTool.execute({
  documentId: "doc123",
  content: "New content to insert",
  strategy: "heading",
  strategyConfig: { headingText: "Summary", position: "after" },
  preview: true
});

// Actual insertion with fallback
await intelligentInsertTool.execute({
  documentId: "doc123",
  content: "New content to insert",
  strategy: "section",
  strategyConfig: { sectionName: "Results", position: "end" },
  fallbackBehavior: "end",
  preventDuplicates: true
});
```

## Performance Considerations

1. **Caching**: Cache document structure analysis for repeated operations
2. **Lazy Loading**: Load document content only when needed
3. **Batch Operations**: Support multiple insertions in a single API call
4. **Memory Management**: Efficient handling of large documents

## Security Considerations

1. **Input Validation**: Validate all strategy configurations and content
2. **Content Sanitization**: Ensure inserted content doesn't break document structure
3. **Access Control**: Maintain existing Google Docs API permissions
4. **Error Information**: Avoid exposing sensitive information in error messages
