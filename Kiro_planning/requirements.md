# Requirements Document

## Introduction

The Obsidian Converter is a comprehensive tool that transforms web content (YouTube videos, articles, papers, etc.) into standardized Markdown notes following the "Gemini Gem" format. The system fetches content from a URL, analyzes it, generates a structured Markdown document with precise metadata and tagging, and embeds it into a minimal HTML file with download functionality.

## Requirements

### Requirement 1

**User Story:** As a content researcher, I want to input a URL and receive a comprehensive Markdown note, so that I can quickly capture and organize web content in a standardized format.

#### Acceptance Criteria

1. WHEN a user provides a source_url THEN the system SHALL fetch and analyze the source content
2. WHEN the system processes the URL THEN it SHALL identify the source type (youtube, webpage, article, paper, talk)
3. WHEN content is fetched THEN the system SHALL extract core metadata including title, channel/site name, publication date, and duration (if applicable)
4. WHEN analysis is complete THEN the system SHALL generate a stable resource ID (rid) based on the source type

### Requirement 2

**User Story:** As a knowledge manager, I want consistent filename conventions across all converted content, so that I can easily organize and locate my notes.

#### Acceptance Criteria

1. WHEN generating a filename THEN the system SHALL use the format `<prefix>_<source-token>_<slug>--<rid>.md`
2. WHEN determining the prefix THEN the system SHALL map source types to exact prefixes (youtube→yt_, webpage/article→web_, podcast→pod_, paper→paper_, talk→talk_)
3. WHEN creating the source-token THEN the system SHALL convert channel/site names to lowercase, ASCII, kebab-case format
4. WHEN generating the slug THEN the system SHALL create an ASCII, kebab-case version of the title truncated to 80 characters
5. WHEN constructing filenames THEN the system SHALL NOT include any date information

### Requirement 3

**User Story:** As a metadata-conscious user, I want structured YAML frontmatter with standardized fields, so that my notes are machine-readable and searchable.

#### Acceptance Criteria

1. WHEN generating frontmatter THEN the system SHALL include all required underscored keys (schema, id, title, source_url, canonical_url, capture_date, source_type, channel_name, publication_date, language, duration, duration_seconds, tags, keywords, entities)
2. WHEN creating the id field THEN the system SHALL format it as `<prefix-without-underscore>:<rid>`
3. WHEN processing duration THEN the system SHALL format it in ISO 8601 format (PT<H>M<S>) and include duration_seconds as integer
4. WHEN setting canonical_url THEN the system SHALL provide a cleaned HTTPS version of the input URL
5. WHEN populating entities THEN the system SHALL categorize into people, orgs, and products arrays

### Requirement 4

**User Story:** As a content organizer, I want precise tagging following established conventions, so that my notes are properly categorized and discoverable.

#### Acceptance Criteria

1. WHEN tagging YouTube content THEN the system SHALL include source/youtube, channel/<token>, format/video-summary, domain/* tag, and topic/* tag
2. WHEN tagging web articles THEN the system SHALL include source/article or source/blog, channel/<token>, format/article-summary, domain/* tag, and topic/* tag
3. WHEN tagging research papers THEN the system SHALL include source/paper, channel/<token>, format/paper-summary, domain/* tag, and topic/* tag
4. WHEN applying tag normalization THEN the system SHALL convert known aliases to canonical forms
5. WHEN formatting tags THEN the system SHALL ensure kebab-case, ASCII format, and singular forms where possible
6. WHEN using namespaces THEN the system SHALL follow conventions (tool/* for products, concept/* for abstract ideas, topic/* for subject areas, company/* for companies)

### Requirement 5

**User Story:** As a content consumer, I want structured body content with consistent sections, so that I can quickly navigate and understand the key information.

#### Acceptance Criteria

1. WHEN generating body content THEN the system SHALL follow the canonical section order using ### headings
2. WHEN creating TL;DR THEN the system SHALL provide 4-8 bullet points with bold lead phrases
3. WHEN writing Executive Summary THEN the system SHALL provide 1-3 short paragraphs summarizing core points
4. WHEN listing Key Topics THEN the system SHALL provide a bulleted list of main themes
5. WHEN creating Timeline/Structure THEN the system SHALL use `[HH:MM:SS]: Description` format for videos and section-based outline for articles
6. WHEN including Quotes THEN the system SHALL provide 3-8 verbatim quotes with timestamps
7. WHEN building Glossary THEN the system SHALL define key terms in `**Term**: Definition` format
8. WHEN documenting Claims & Evidence THEN the system SHALL list factual claims with supporting evidence and timestamps
9. WHEN providing Actionable Insights THEN the system SHALL create a checklist of actionable takeaways
10. WHEN listing Open Questions THEN the system SHALL provide questions for further investigation

### Requirement 6

**User Story:** As an end user, I want a simple HTML interface to download the generated Markdown, so that I can easily save the content to my local system.

#### Acceptance Criteria

1. WHEN generating HTML output THEN the system SHALL create a single, self-contained HTML file
2. WHEN embedding content THEN the system SHALL store the final_markdown in a JavaScript variable
3. WHEN creating the interface THEN the system SHALL include only an h1 title and a single download button
4. WHEN styling the HTML THEN the system SHALL NOT include any CSS, styling, or visual elements
5. WHEN implementing download functionality THEN the system SHALL trigger file download with the correct filename on button click
6. WHEN outputting HTML THEN the system SHALL return complete HTML code from `<!DOCTYPE html>` to `</html>`

### Requirement 7

**User Story:** As a system user, I want flexible input options with sensible defaults, so that I can quickly process content without extensive configuration.

#### Acceptance Criteria

1. WHEN providing inputs THEN the system SHALL accept source_url as required parameter
2. WHEN capture_date is not provided THEN the system SHALL default to current date in YYYY-MM-DD format
3. WHEN source_type is not specified THEN the system SHALL automatically detect the type from the URL
4. WHEN processing different source types THEN the system SHALL use appropriate tools (YouTube API for videos, web scraping for articles)