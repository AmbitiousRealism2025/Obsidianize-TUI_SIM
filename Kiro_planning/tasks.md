# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure for types, fetchers, generators, and utilities
  - Define TypeScript interfaces for all major data structures and components
  - Set up configuration files and environment setup
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 2. Implement source detection and URL processing
  - [ ] 2.1 Create SourceDetector class with URL pattern matching
    - Implement regex patterns for YouTube, web articles, papers, and talks
    - Add URL validation and normalization methods
    - Create source type detection logic
    - _Requirements: 1.1, 1.2, 7.4_

  - [ ] 2.2 Implement URL canonicalization utilities
    - Create functions to clean and normalize URLs to HTTPS format
    - Handle URL redirects and canonical URL extraction
    - Add URL validation for security and format compliance
    - _Requirements: 3.4_

- [ ] 3. Build content fetching system
  - [ ] 3.1 Create base ContentFetcher interface and abstract class
    - Define common fetching methods and error handling patterns
    - Implement shared utilities for HTTP requests and response processing
    - Create base resource ID generation logic
    - _Requirements: 1.1, 1.4_

  - [ ] 3.2 Implement YouTubeFetcher for video content
    - Integrate with YouTube Data API v3 for metadata extraction
    - Implement transcript fetching and processing
    - Create YouTube-specific resource ID extraction (video ID)
    - Add duration parsing and formatting
    - _Requirements: 1.1, 1.3, 3.3_

  - [ ] 3.3 Implement WebScraper for article and webpage content
    - Create HTML parsing logic with content extraction algorithms
    - Implement metadata extraction from HTML meta tags and structured data
    - Generate deterministic hash-based resource IDs for web content
    - Add content cleaning and text extraction utilities
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 3.4 Write unit tests for content fetchers
    - Create mock API responses for YouTube fetcher testing
    - Test web scraper with various HTML structures
    - Validate resource ID generation consistency
    - _Requirements: 1.1, 1.4_

- [ ] 4. Develop metadata extraction and processing
  - [ ] 4.1 Create MetadataExtractor class
    - Implement core metadata extraction from raw content
    - Add entity extraction for people, organizations, and products
    - Create keyword extraction using NLP techniques
    - Build date parsing and validation utilities
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ] 4.2 Implement FilenameGenerator with standardized conventions
    - Create prefix mapping for different source types
    - Implement source token generation (kebab-case conversion)
    - Add slug generation with ASCII conversion and truncation
    - Build complete filename assembly logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.3 Write unit tests for metadata extraction
    - Test entity extraction accuracy with sample content
    - Validate filename generation with various inputs
    - Test date parsing and format validation
    - _Requirements: 2.1, 3.1_

- [ ] 5. Build tag generation and normalization system
  - [ ] 5.1 Create TagGenerator class with rule-based tagging
    - Implement required tag generation for each source type
    - Add topic and domain tag extraction from content
    - Create tag normalization and alias resolution
    - Build tag format validation (kebab-case, ASCII, singular)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 5.2 Implement tag registry and canonical mappings
    - Create tag alias dictionary for normalization
    - Add namespace validation (source/, domain/, topic/, concept/, tool/, company/)
    - Implement tag deduplication and sorting
    - Build tag validation utilities
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 5.3 Write unit tests for tag generation
    - Test required tag generation for all source types
    - Validate tag normalization rules and alias resolution
    - Test namespace compliance and format validation
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Implement content structuring engine
  - [ ] 6.1 Create ContentStructurer class for section generation
    - Implement TL;DR generation with bold lead phrases (4-8 points)
    - Add executive summary creation (1-3 paragraphs)
    - Create key topics extraction and formatting
    - Build timeline/structure generation for videos and articles
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.2 Implement quote and evidence extraction
    - Add verbatim quote extraction with timestamp linking
    - Create glossary generation with term definitions
    - Implement claims and evidence identification
    - Build actionable insights generation as checklist items
    - Add open questions generation for further investigation
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 6.3 Write unit tests for content structuring
    - Test section generation with various content types
    - Validate timeline extraction accuracy for videos
    - Test quote extraction and timestamp formatting
    - _Requirements: 5.1, 5.6, 5.8_

- [ ] 7. Build YAML frontmatter generation
  - [ ] 7.1 Create FrontmatterGenerator class
    - Implement YAML frontmatter assembly with all required fields
    - Add schema validation and ID formatting (prefix:rid)
    - Create duration formatting in ISO 8601 format
    - Build entity data structuring (people, orgs, products)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]* 7.2 Write unit tests for frontmatter generation
    - Test YAML format compliance and field validation
    - Validate ID formatting and schema adherence
    - Test duration formatting and entity structuring
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8. Implement markdown assembly and output generation
  - [ ] 8.1 Create MarkdownAssembler class
    - Combine YAML frontmatter with structured body content
    - Implement canonical section ordering with ### headings
    - Add markdown formatting utilities and validation
    - Create final markdown string assembly
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ] 8.2 Implement HTMLGenerator for download interface
    - Create minimal HTML template with embedded JavaScript
    - Implement file download functionality with correct filename
    - Add markdown content embedding in JavaScript variable
    - Build simple interface with h1 title and download button
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.3 Write unit tests for output generation
    - Test markdown assembly with complete content structures
    - Validate HTML generation and download functionality
    - Test JavaScript embedding and filename handling
    - _Requirements: 6.1, 6.6_

- [ ] 9. Create main application orchestrator
  - [ ] 9.1 Implement ObsidianConverter main class
    - Create main conversion pipeline orchestrating all components
    - Add input validation and parameter handling with defaults
    - Implement error handling and user feedback
    - Build complete URL-to-HTML conversion workflow
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4_

  - [ ] 9.2 Add CLI interface and configuration
    - Create command-line interface for standalone usage
    - Add configuration file support for API keys and settings
    - Implement logging and progress reporting
    - Build help documentation and usage examples
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10. Integration and end-to-end testing
  - [ ] 10.1 Create integration test suite
    - Test complete conversion pipeline with real URLs
    - Validate cross-source-type consistency
    - Test error handling with invalid and inaccessible URLs
    - Build performance benchmarks for large content processing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 4.1, 5.1, 6.1_

  - [ ]* 10.2 Add comprehensive error handling tests
    - Test network failure scenarios and retry mechanisms
    - Validate graceful degradation with missing metadata
    - Test API rate limiting and backoff strategies
    - _Requirements: 1.1, 7.4_