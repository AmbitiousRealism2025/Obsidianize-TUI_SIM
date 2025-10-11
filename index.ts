import figlet from "figlet";

// Box drawing characters for styling - optimized for ASCII art width
// ASCII art is 76 chars wide, so border is 76 + 8 (4 chars padding each side) + 4 (border chars) = 88
const borderWidth = 88;
const topBorder = "╔" + "═".repeat(borderWidth - 2) + "╗";
const bottomBorder = "╚" + "═".repeat(borderWidth - 2) + "╝";
const sideBorder = "║";

export const app = {
  fetch(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);
    const isHtml = !url.searchParams.has("plain");

    // Generate ASCII art with a stylish font
    const asciiArt = figlet.textSync("OBSIDIANIZE", {
      font: "ANSI Shadow",
      horizontalLayout: "full",
      verticalLayout: "default",
    });

    // Center the ASCII art perfectly
    const lines = asciiArt.split("\n").filter(line => line.trim().length > 0);
    const innerWidth = borderWidth - 4; // Account for side borders (2 chars) and inner padding (2 chars)
    const asciiWidth = 76; // OBSIDIANIZE ASCII art is exactly 76 chars wide
    const leftPadding = Math.floor((innerWidth - asciiWidth) / 2);
    const rightPadding = innerWidth - asciiWidth - leftPadding;
    
    const centeredLines = lines.map((line) => {
      return `${sideBorder} ${" ".repeat(leftPadding)}${line}${" ".repeat(rightPadding)} ${sideBorder}`;
    });

    // Center the tagline relative to the ASCII art
    const tagline = "✨ Your Knowledge, Crystallized ✨";
    const taglinePadding = Math.floor((borderWidth - tagline.length) / 2);
    const centeredTagline = " ".repeat(taglinePadding) + tagline;
    
    // Build the complete styled output
    const plainOutput = [
      topBorder,
      `${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}`,
      ...centeredLines,
      `${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}`,
      bottomBorder,
      "",
      centeredTagline,
      "",
    ].join("\n");

    if (isHtml) {
      // HTML version with CSS styling for browsers
      const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OBSIDIANIZE</title>
  <style>
    body {
      background-color: #0f0f23;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
    }
    .container {
      text-align: center;
    }
    pre {
      display: inline-block;
      text-align: left;
      line-height: 1.2;
      font-size: 14px;
      margin: 0;
    }
    .border {
      color: #c084fc;
    }
    .ascii-art {
      color: #9b59d0;
      font-weight: bold;
    }
    .tagline {
      color: #d8b4fe;
      margin-top: 20px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <pre class="border">${topBorder}</pre>
    <pre class="border">${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}</pre>
${centeredLines.map(line => `    <pre><span class="border">${sideBorder}</span><span class="ascii-art">${line.slice(2, -2)}</span><span class="border">${sideBorder}</span></pre>`).join("\n")}
    <pre class="border">${sideBorder}${" ".repeat(borderWidth - 2)}${sideBorder}</pre>
    <pre class="border">${bottomBorder}</pre>
    <div class="tagline">${tagline}</div>
  </div>
</body>
</html>`;
      return new Response(htmlOutput, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(plainOutput, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};

if (import.meta.main) {
  const server = Bun.serve({
    ...app,
    port: 3000,
  });
  console.log(`Listening on http://localhost:${server.port} ...`);
}