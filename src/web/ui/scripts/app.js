/**
 * Obsidianize Web TUI - Main Application Script
 * Vanilla JavaScript implementation with terminal aesthetics
 */

import {
  saveApiKey,
  loadApiKey,
  clearApiKey,
  hasStoredApiKey,
  generateDevicePassphrase,
} from "../../security/encryption.js";

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  currentJobId: null,
  websocket: null,
  apiKey: null,
  isProcessing: false,
  outputContent: null,
  pollInterval: null,
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  form: null,
  urlInput: null,
  apiKeyInput: null,
  contentTypeInputs: null,
  submitButton: null,
  toggleApiKeyButton: null,
  statusIndicator: null,
  performanceInfo: null,
  progressSection: null,
  progressBar: null,
  progressPercentage: null,
  progressStatus: null,
  outputSection: null,
  frontmatterSection: null,
  frontmatterDisplay: null,
  markdownContent: null,
  downloadButton: null,
  errorSection: null,
  errorMessage: null,
  errorDetails: null,
  errorStack: null,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initialize() {
  // Get DOM elements
  elements.form = document.getElementById("obsidianize-form");
  elements.urlInput = document.getElementById("content-url");
  elements.apiKeyInput = document.getElementById("api-key");
  elements.contentTypeInputs = document.getElementsByName("content-type");
  elements.submitButton = document.getElementById("submit-button");
  elements.toggleApiKeyButton = document.getElementById("toggle-api-key");
  elements.statusIndicator = document.getElementById("status-indicator");
  elements.performanceInfo = document.getElementById("performance-info");
  elements.progressSection = document.getElementById("progress-section");
  elements.progressBar = document.getElementById("progress-bar");
  elements.progressPercentage = document.getElementById("progress-percentage");
  elements.progressStatus = document.getElementById("progress-status");
  elements.outputSection = document.getElementById("output-section");
  elements.frontmatterSection = document.getElementById("frontmatter-section");
  elements.frontmatterDisplay = document.getElementById("frontmatter-display");
  elements.markdownContent = document.getElementById("markdown-content");
  elements.downloadButton = document.getElementById("download-button");
  elements.errorSection = document.getElementById("error-section");
  elements.errorMessage = document.getElementById("error-message");
  elements.errorDetails = document.getElementById("error-details");
  elements.errorStack = document.getElementById("error-stack");

  // Load ASCII art header
  await loadAsciiHeader();

  // Initialize API key from storage
  await initializeApiKey();

  // Setup event listeners
  setupEventListeners();

  // Update status
  updateStatus("ready", "● READY");
  updatePerformanceInfo("⚡ Ready");

  console.log("Obsidianize Web TUI initialized");
}

// ============================================================================
// ASCII ART HEADER
// ============================================================================

async function loadAsciiHeader() {
  const asciiHeader = document.getElementById("ascii-header");
  if (!asciiHeader) return;

  const asciiArt = `
 ██████╗ ██████╗ ███████╗██╗██████╗ ██╗ █████╗ ███╗   ██╗██╗███████╗███████╗
██╔═══██╗██╔══██╗██╔════╝██║██╔══██╗██║██╔══██╗████╗  ██║██║╚══███╔╝██╔════╝
██║   ██║██████╔╝███████╗██║██║  ██║██║███████║██╔██╗ ██║██║  ███╔╝ █████╗
██║   ██║██╔══██╗╚════██║██║██║  ██║██║██╔══██║██║╚██╗██║██║ ███╔╝  ██╔══╝
╚██████╔╝██████╔╝███████║██║██████╔╝██║██║  ██║██║ ╚████║██║███████╗███████╗
 ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝╚══════╝

              Your Knowledge, Crystallized - AI-Powered Note Generation
  `;

  asciiHeader.textContent = asciiArt;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Form submission
  if (elements.form) {
    elements.form.addEventListener("submit", handleFormSubmit);
  }

  // Toggle API key visibility
  if (elements.toggleApiKeyButton) {
    elements.toggleApiKeyButton.addEventListener("click", toggleApiKeyVisibility);
  }

  // Download button
  if (elements.downloadButton) {
    elements.downloadButton.addEventListener("click", handleDownload);
  }

  // Auto-focus URL input
  if (elements.urlInput) {
    elements.urlInput.focus();
  }
}

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

async function initializeApiKey() {
  const passphrase = generateDevicePassphrase();

  if (hasStoredApiKey()) {
    try {
      const apiKey = await loadApiKey(passphrase);
      if (apiKey) {
        state.apiKey = apiKey;
        elements.apiKeyInput.value = apiKey;
        console.log("✓ API key loaded from secure storage");
        return true;
      }
    } catch (error) {
      console.error("Failed to load stored API key:", error);
      clearApiKey();
    }
  }

  return false;
}

async function saveApiKeyToStorage(apiKey) {
  const passphrase = generateDevicePassphrase();
  try {
    await saveApiKey(apiKey, passphrase);
    state.apiKey = apiKey;
    console.log("✓ API key securely stored");
    return true;
  } catch (error) {
    console.error("Failed to store API key:", error);
    showError("Failed to store API key: " + error.message);
    return false;
  }
}

function toggleApiKeyVisibility() {
  const input = elements.apiKeyInput;
  const icon = elements.toggleApiKeyButton.querySelector(".visibility-icon");

  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "🙈";
  } else {
    input.type = "password";
    icon.textContent = "👁";
  }
}

// ============================================================================
// FORM HANDLING
// ============================================================================

async function handleFormSubmit(event) {
  event.preventDefault();

  // Get form values
  const url = elements.urlInput.value.trim();
  const apiKey = elements.apiKeyInput.value.trim();
  const contentType = getSelectedContentType();

  // Validate inputs
  if (!url) {
    showError("Please enter a content URL");
    return;
  }

  if (!apiKey) {
    showError("Please enter your Gemini API key");
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    showError("Invalid URL format. Please enter a valid URL.");
    return;
  }

  // Save API key for future use (device-encrypted)
  if (!state.apiKey || state.apiKey !== apiKey) {
    await saveApiKeyToStorage(apiKey);
  }

  // Start processing
  await processContent(url, apiKey, contentType);
}

function getSelectedContentType() {
  for (const input of elements.contentTypeInputs) {
    if (input.checked) {
      return input.value;
    }
  }
  return "youtube"; // default
}

// ============================================================================
// CONTENT PROCESSING
// ============================================================================

async function processContent(url, apiKey, contentType) {
  try {
    // Hide error and output sections
    hideError();
    hideOutput();

    // Show progress section
    showProgress();
    updateProgress(0, "Initializing...");
    setProcessingState(true);

    // Submit processing request
    const response = await fetch("/api/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        apiKey,
        options: {
          contentType,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Processing request failed");
    }

    const result = await response.json();
    state.currentJobId = result.jobId;

    console.log("Processing started:", result);
    updateProgress(5, "Processing started...");

    // Try WebSocket connection for real-time updates
    const wsSupported = await tryWebSocketConnection(result.jobId);

    // Fallback to polling if WebSocket fails
    if (!wsSupported) {
      console.log("Falling back to status polling");
      pollJobStatus(result.jobId);
    }
  } catch (error) {
    console.error("Processing error:", error);
    showError(error.message);
    setProcessingState(false);
  }
}

// ============================================================================
// WEBSOCKET COMMUNICATION
// ============================================================================

async function tryWebSocketConnection(jobId) {
  return new Promise((resolve) => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/progress/${jobId}`;

      const ws = new WebSocket(wsUrl);
      let connected = false;

      ws.onopen = () => {
        console.log("WebSocket connected");
        connected = true;
        state.websocket = ws;
        updateProgress(10, "Connected to processing stream");
        resolve(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (!connected) {
          resolve(false);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        state.websocket = null;
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!connected) {
          ws.close();
          resolve(false);
        }
      }, 5000);
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      resolve(false);
    }
  });
}

function handleWebSocketMessage(data) {
  console.log("WebSocket message:", data);

  if (data.type === "progress") {
    updateProgress(data.progress || 0, data.message || "Processing...");
  } else if (data.type === "complete") {
    handleProcessingComplete(data.result);
  } else if (data.type === "error") {
    showError(data.message || "Processing failed");
    setProcessingState(false);
  }
}

// ============================================================================
// STATUS POLLING
// ============================================================================

function pollJobStatus(jobId, interval = 2000) {
  // Clear any existing poll interval
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
  }

  state.pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/status/${jobId}`);

      if (!response.ok) {
        throw new Error("Status check failed");
      }

      const status = await response.json();
      console.log("Job status:", status);

      // Update progress
      updateProgress(status.progress || 0, status.message || "Processing...");

      // Check if complete
      if (status.status === "completed") {
        clearInterval(state.pollInterval);
        state.pollInterval = null;

        // Fetch the result
        const downloadUrl = `/api/download/${jobId}`;
        const resultResponse = await fetch(downloadUrl);
        const markdown = await resultResponse.text();

        handleProcessingComplete({
          markdown,
          metadata: status.metadata,
        });
      } else if (status.status === "failed") {
        clearInterval(state.pollInterval);
        state.pollInterval = null;
        showError(status.error || "Processing failed");
        setProcessingState(false);
      }
    } catch (error) {
      console.error("Status polling error:", error);
      clearInterval(state.pollInterval);
      state.pollInterval = null;
      showError("Failed to check processing status");
      setProcessingState(false);
    }
  }, interval);
}

// ============================================================================
// RESULT HANDLING
// ============================================================================

function handleProcessingComplete(result) {
  console.log("Processing complete:", result);

  // Store result
  state.outputContent = result;

  // Update progress to 100%
  updateProgress(100, "Complete!");

  // Hide progress, show output
  setTimeout(() => {
    hideProgress();
    displayResult(result);
    setProcessingState(false);
    updateStatus("ready", "● READY");

    // Update performance info
    if (result.metadata && result.metadata.duration) {
      const duration = Math.round(result.metadata.duration / 1000);
      updatePerformanceInfo(`⚡ Processed in ${duration}s`);
    }
  }, 500);
}

function displayResult(result) {
  const markdown = result.markdown || result.content || "";

  // Parse frontmatter if present
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (frontmatterMatch) {
    // Show frontmatter
    const frontmatter = frontmatterMatch[1];
    const content = frontmatterMatch[2];

    elements.frontmatterDisplay.textContent = frontmatter;
    elements.frontmatterSection.style.display = "block";

    // Render markdown content
    renderMarkdown(content);
  } else {
    // No frontmatter, just render all content
    elements.frontmatterSection.style.display = "none";
    renderMarkdown(markdown);
  }

  // Show output section
  showOutput();
}

function renderMarkdown(markdown) {
  // Use marked.js if available, otherwise basic rendering
  if (typeof marked !== "undefined") {
    elements.markdownContent.innerHTML = marked.parse(markdown);
  } else {
    // Basic markdown rendering
    let html = escapeHtml(markdown);

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || "plaintext";
      return `<pre><code class="language-${language}">${code}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Lists
    html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*<\/li>)/gim, "<ul>$1</ul>");

    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = "<p>" + html + "</p>";

    elements.markdownContent.innerHTML = html;
  }

  // Syntax highlighting if available
  if (typeof hljs !== "undefined") {
    elements.markdownContent.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// DOWNLOAD HANDLING
// ============================================================================

async function handleDownload() {
  if (!state.currentJobId) {
    showError("No content available to download");
    return;
  }

  try {
    const response = await fetch(`/api/download/${state.currentJobId}`);

    if (!response.ok) {
      throw new Error("Download failed");
    }

    // Get filename from Content-Disposition header or generate one
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "obsidianize-note.md";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log("Download started:", filename);
  } catch (error) {
    console.error("Download error:", error);
    showError("Failed to download: " + error.message);
  }
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

function setProcessingState(processing) {
  state.isProcessing = processing;

  if (elements.submitButton) {
    elements.submitButton.disabled = processing;
    const buttonText = elements.submitButton.querySelector(".button-text");
    if (buttonText) {
      buttonText.textContent = processing
        ? "⌛ PROCESSING..."
        : "▶ CRYSTALLIZE KNOWLEDGE";
    }
  }

  if (elements.urlInput) {
    elements.urlInput.disabled = processing;
  }

  if (elements.apiKeyInput) {
    elements.apiKeyInput.disabled = processing;
  }

  for (const input of elements.contentTypeInputs) {
    input.disabled = processing;
  }

  updateStatus(processing ? "processing" : "ready", processing ? "● PROCESSING" : "● READY");
}

function updateStatus(status, text) {
  if (elements.statusIndicator) {
    elements.statusIndicator.textContent = text;
    elements.statusIndicator.className = `terminal-status status-${status}`;
  }
}

function updatePerformanceInfo(text) {
  if (elements.performanceInfo) {
    elements.performanceInfo.textContent = text;
  }
}

// ============================================================================
// PROGRESS DISPLAY
// ============================================================================

function showProgress() {
  if (elements.progressSection) {
    elements.progressSection.style.display = "block";
  }
}

function hideProgress() {
  if (elements.progressSection) {
    elements.progressSection.style.display = "none";
  }
}

function updateProgress(percent, message) {
  if (elements.progressBar) {
    elements.progressBar.style.width = `${percent}%`;
  }

  if (elements.progressPercentage) {
    elements.progressPercentage.textContent = `${Math.round(percent)}%`;
  }

  if (elements.progressStatus) {
    elements.progressStatus.textContent = message;
  }
}

// ============================================================================
// OUTPUT DISPLAY
// ============================================================================

function showOutput() {
  if (elements.outputSection) {
    elements.outputSection.style.display = "block";
  }
}

function hideOutput() {
  if (elements.outputSection) {
    elements.outputSection.style.display = "none";
  }
}

// ============================================================================
// ERROR DISPLAY
// ============================================================================

function showError(message, details = null) {
  if (elements.errorMessage) {
    elements.errorMessage.textContent = message;
  }

  if (details && elements.errorStack) {
    elements.errorStack.textContent = details;
    elements.errorDetails.style.display = "block";
  } else if (elements.errorDetails) {
    elements.errorDetails.style.display = "none";
  }

  if (elements.errorSection) {
    elements.errorSection.style.display = "block";
  }

  updateStatus("error", "● ERROR");
}

function hideError() {
  if (elements.errorSection) {
    elements.errorSection.style.display = "none";
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

window.addEventListener("beforeunload", () => {
  // Close WebSocket if open
  if (state.websocket) {
    state.websocket.close();
  }

  // Clear polling interval
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
  }
});

// ============================================================================
// START APPLICATION
// ============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
