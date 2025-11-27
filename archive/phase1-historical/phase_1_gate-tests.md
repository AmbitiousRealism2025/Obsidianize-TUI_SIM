# Phase 1 Gate Tests: Core Infrastructure & AI Engine

**Objective**: To verify the successful implementation of all Phase 1 deliverables by Agents A, B, C, and D. These tests must be executed by the "Jules Agent - Test Runner" to determine if the project is ready to proceed to Phase 2.

**Gate Criteria**:
- ✅ Core modules test coverage ≥85%
- ✅ All TypeScript compiles without errors
- ✅ API integration works with mocked responses
- ✅ Performance targets met (startup <100ms, memory <100MB)
- ✅ No memory leaks detected

---

## 🧪 Overall Project Health Checks

These tests validate the project's foundation and must be run first.

### 1. TypeScript Compilation
**Purpose**: Ensure all code is type-safe and compiles without errors.
**Execution**:
1.  Navigate to the project root directory.
2.  Run the command: `bun run tsc --noEmit`
**Expected Result**: The command completes with exit code 0 and prints no errors to the console.

### 2. Dependency Installation
**Purpose**: Verify that all project dependencies can be installed correctly using the Bun runtime.
**Execution**:
1.  Delete the `node_modules` directory and `bun.lockb` file if they exist.
2.  Run the command: `bun install`
**Expected Result**: The command completes successfully without any dependency resolution errors.

### 3. Code Linting and Formatting
**Purpose**: Ensure code adheres to project style guides.
**Execution**:
1. Run the linting and formatting commands defined in `package.json` (e.g., `bun run lint`, `bun run format:check`).
**Expected Result**: The commands complete without reporting any errors.

---

## 🤖 Agent A: Environment & Build Setup

**Focus**: Validating the project's infrastructure, environment configuration, and build process.

### Test A.1: Environment Variable Validation
**Purpose**: Ensure the environment validation script correctly protects against missing configuration.
**Execution**:
1.  Rename the `.env` file to `.env.bak`.
2.  Run the application's entry point (e.g., `bun start` or `bun dev`).
3.  **Expected Result**: The application should fail to start and log a clear error message stating that `GEMINI_API_KEY` is missing.
4.  Restore the `.env` file.
5.  Set `NODE_ENV` to `production` in the `.env` file and start the application.
6.  **Expected Result**: The application should start in production mode (verify through startup logs).

### Test A.2: Production Build
**Purpose**: Verify that the production build process works and creates an optimized bundle.
**Execution**:
1.  Run the command: `bun run build`.
2.  **Expected Result**: The command should complete successfully. A `dist/` (or similar) directory should be created.
3.  Check the size of the main output bundle in the build directory.
4.  **Expected Result**: The bundle size must be less than 5MB.

### Test A.3: Development Server Performance
**Purpose**: Ensure the development server meets the sub-100ms startup requirement.
**Execution**:
1.  Run a script that measures the time taken for the `bun dev` command to start the server and be ready for requests.
2.  **Expected Result**: The measured startup time should be less than 100ms.

---

## 🤖 Agent B: Gemini AI Integration

**Focus**: Validating the AI client, content processing pipeline, and output quality. **All tests must use a mocked Gemini API.**

### Test B.1: Gemini Client Unit Tests
**Purpose**: Verify the reliability and error handling of the Gemini API client.
**Test Suite**: `src/core/ai/gemini-client.test.ts`
**Scenarios**:
- **Initialization**: Test that the client initializes correctly using the API key from `.env`.
- **Successful Request**: Mock a successful API response and verify the client returns the expected data.
- **Retry Logic**: Mock a sequence of transient API errors followed by a success. Verify that the client retries with exponential backoff and eventually succeeds.
- **Rate Limiting**: Mock a rate limit error from the API. Verify the client handles it gracefully (e.g., logs a warning, stops retrying).
- **Authentication Error**: Mock an invalid API key error. Verify the client fails immediately with a clear error message.

### Test B.2: Content Analyzer Integration Tests
**Purpose**: Ensure the correct analysis pipeline is used for different content types.
**Test Suite**: `src/core/ai/content-analyzer.test.ts`
**Scenarios**:
- **URL Type Detection**:
  - For each supported source (`youtube.com`, `medium.com`, etc.), provide a sample URL.
  - Verify the `auto-detect` function correctly identifies the content type.
- **Pipeline Routing**:
  - For each content type, call the main processing function.
  - Verify that the correct underlying processor (e.g., `processYouTubeVideo`) is called with the correct arguments. Use spies or mocks to confirm.

### Test B.3: Prompt Engineering & Output Validation
**Purpose**: Verify that the AI-generated output conforms to the "Gemini Gem" specification.
**Test Suite**: `src/core/ai/prompts.test.ts`
**Scenarios**:
- **Prompt Generation**: For each content type, verify that the prompt-building system generates a structured, spec-compliant prompt.
- **End-to-End Output**:
  - Provide a valid URL (e.g., for a YouTube video).
  - Use a fully mocked Gemini API that returns a pre-defined, structured text response.
  - Run the full analysis pipeline.
  - **Expected Result**: The final output must be a Markdown string that perfectly matches the "Gemini Gem" format. Validate the presence and correctness of all required YAML frontmatter fields and the canonical order of Markdown body sections.

---

## 🤖 Agent C: Data Models & Processing

**Focus**: Validating the TypeScript types, data validators, and content formatters.

### Test C.1: Data Model & Type Validation
**Purpose**: Ensure all data structures are strictly typed and validated.
**Test Suite**: `src/core/validators/zod-schemas.test.ts`
**Scenarios**:
- **URL Validation**: Test the URL Zod schema with valid URLs, invalid URLs, local IPs, and incomplete strings.
- **GeminiGem Schema**:
  - Test the `GeminiGem` Zod schema with a perfectly valid object. It must pass.
  - Test the schema with objects that have missing required fields (e.g., `title`, `source_url`). It must fail.
  - Test the schema with objects that have incorrectly typed fields (e.g., `duration_seconds` as a string). It must fail.

### Test C.2: Content Formatters Unit Tests
**Purpose**: Verify that formatters produce spec-compliant strings and filenames.
**Test Suite**: `src/core/formatters/formatters.test.ts`
**Scenarios**:
- **Filename Generation**:
  - For each content type prefix (`yt_`, `web_`, etc.), provide sample data.
  - Verify the generated filename matches the format: `<prefix>_<source-token>_<slug>--<rid>.md`.
  - Test edge cases like very long titles, titles with special characters, and missing authors/channels.
- **YAML Frontmatter Generation**: Provide a valid `GeminiGem` object and verify the generated YAML string is correctly formatted and contains all fields.
- **Tag Normalization**: Test the tag normalization function with various inputs to ensure it correctly creates lowercase, kebab-case tags.

---

## 🤖 Agent D: Storage & Performance

**Focus**: Validating the caching system, file operations, rate limiting, and performance metrics.

### Test D.1: Caching System Integration Tests
**Purpose**: Ensure the caching layer works correctly to reduce redundant AI processing.
**Test Suite**: `src/core/cache/cache.test.ts`
**Scenarios**:
- **Cache Miss & Write**:
  1. Clear the cache.
  2. Make a request for a new URL.
  3. Spy on the Gemini API client to confirm it was called.
  4. Verify the result is present in the cache (e.g., Bun's SQLite DB).
- **Cache Hit**:
  1. Make the exact same request again.
  2. Verify the result is returned correctly.
  3. Verify that the Gemini API client was **NOT** called this time.
- **Cache Invalidation**: Test that cache entries expire after the configured TTL.

### Test D.2: Atomic File Operations
**Purpose**: Ensure that file writes are safe and do not result in corrupted or partial files.
**Test Suite**: `src/core/storage/file-system.test.ts`
**Scenarios**:
- **Successful Write**: Verify a file is created with the correct content.
- **Atomic Write Simulation**:
  1. Mock the file system's `rename` operation to throw an error.
  2. Trigger a file save operation.
  3. Verify that the process does not leave a partial/temporary file in the final destination directory and that the original file (if one existed) remains untouched.

### Test D.3: Rate Limiter Unit Tests
**Purpose**: Verify the rate limiter correctly prevents API abuse.
**Test Suite**: `src/core/rate-limit/rate-limiter.test.ts`
**Scenarios**:
- **Allow Requests**: Make requests within the defined limit. All should succeed.
- **Block Requests**: Make a burst of requests exceeding the limit. Verify that subsequent requests are blocked.
- **Refill Over Time**: Wait for the "refill" period and make another request. It should now succeed.

### Test D.4: Memory Usage Benchmark
**Purpose**: Ensure the application's memory footprint stays below 100MB during typical processing.
**Execution**:
1.  Create a script that processes a batch of 10-20 different URLs.
2.  Inside the script, periodically log `process.memoryUsage().heapUsed`.
3.  **Expected Result**: The memory usage should not exceed 100MB at any point during the run.
4.  After the run, explicitly call the garbage collector (if possible in the test environment) and check the final memory usage to ensure there are no significant memory leaks.