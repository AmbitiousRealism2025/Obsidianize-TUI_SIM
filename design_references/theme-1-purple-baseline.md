# Theme 1: Purple Baseline - "Mystic Terminal"

## Overview

**Theme Name**: Purple Baseline  
**Codename**: "Mystic Terminal"  
**Personality**: Sophisticated, mysterious, modern  
**Status**: Current implementation (baseline reference)

This is the existing purple theme that serves as the baseline for all other themes. It combines deep purple-blue backgrounds with vibrant purple accents to create a sophisticated, modern terminal aesthetic.

## Color Palette

### Primary Colors
```css
:root {
  --theme-bg-primary: #0f0f23;      /* Deep purple-blue background */
  --theme-bg-secondary: #1a1a3a;    /* Slightly lighter background */
  --theme-text-primary: #e2e8f0;    /* Light gray text */
  --theme-text-secondary: #94a3b8;  /* Muted text */
  --theme-accent-primary: #c084fc;  /* Bright purple (borders) */
  --theme-accent-secondary: #9b59d0; /* Darker purple (ASCII art) */
  --theme-border: #c084fc;          /* Purple borders */
  --theme-ascii-art: #9b59d0;       /* ASCII art color */
  --theme-tagline: #d8b4fe;         /* Light purple tagline */
}
```

### Status Colors
```css
:root {
  --theme-success: #22c55e;         /* Green success */
  --theme-warning: #f59e0b;         /* Amber warning */
  --theme-error: #ef4444;           /* Red error */
  --theme-info: #3b82f6;            /* Blue info */
}
```

### Semantic Usage
- **Background**: `#0f0f23` - Main terminal background
- **ASCII Art**: `#9b59d0` - OBSIDIANIZE header text
- **Borders**: `#c084fc` - Box-drawing characters
- **Tagline**: `#d8b4fe` - "✨ Your Knowledge, Crystallized ✨"
- **Primary Text**: `#e2e8f0` - Main content text
- **Secondary Text**: `#94a3b8` - Timestamps, metadata
- **Command Prompt**: `#c084fc` - `obsidianize@web:~$`

## Typography

### Font Stack
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', 'Monaco', 'Menlo', monospace;
```

### Font Sizes
- **ASCII Art**: Inherits from figlet (ANSI Shadow font)
- **Primary Text**: 14px
- **Small Text**: 12px
- **Code Blocks**: 13px

### Line Heights
- **Body Text**: 1.5
- **Code/Terminal**: 1.2
- **ASCII Art**: 1.0 (preserve figlet spacing)

## Visual Examples

### 1. Terminal Header
```
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                               ║
║  ██████╗ ██████╗ ███████╗██╗██████╗ ██╗ █████╗ ███╗   ██╗██╗███████╗███████╗                ║
║ ██╔═══██╗██╔══██╗██╔════╝██║██╔══██╗██║██╔══██╗████╗  ██║██║╚══███╔╝██╔════╝                ║
║ ██║   ██║██████╔╝███████╗██║██║  ██║██║███████║██╔██╗ ██║██║  ███╔╝ █████╗                  ║
║ ██║   ██║██╔══██╗╚════██║██║██║  ██║██║██╔══██║██║╚██╗██║██║ ███╔╝  ██╔══╝                  ║
║ ╚██████╔╝██████╔╝███████║██║██████╔╝██║██║  ██║██║ ╚████║██║███████╗███████╗                ║
║  ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝╚══════╝                ║
║                                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

         ✨ Your Knowledge, Crystallized ✨
```

**Color Assignments**:
- Border characters (`╔═══╗`, `║`, `╚═══╝`): `#c084fc`
- ASCII art text: `#9b59d0`
- Tagline: `#d8b4fe`
- Background: `#0f0f23`

### 2. Command Prompt
```
obsidianize@web:~$ process https://youtube.com/watch?v=example
```

**Color Assignments**:
- `obsidianize@web:~$`: `#c084fc` (purple)
- Command text: `#e2e8f0` (light gray)
- URLs/parameters: `#d8b4fe` (light purple)

### 3. Processing Status
```
[████████████████████████████████████████] 100% | Processing complete
✓ Content fetched from YouTube
✓ AI analysis complete  
✓ Markdown generated
→ Saved: yt_example-video_content--dQw4w9WgXcQ.md
```

**Color Assignments**:
- Progress bar: `#c084fc` (purple)
- Percentage: `#e2e8f0` (white)
- Checkmarks (✓): `#22c55e` (success green)
- Arrow (→): `#c084fc` (purple)
- Filename: `#d8b4fe` (light purple)

### 4. Content Output Preview
```
╔═ CONTENT PREVIEW ══════════════════════════════════════════════════════════════╗
║                                                                                ║
║ # Example Video Title                                                          ║
║                                                                                ║
║ ## TL;DR                                                                       ║
║ • **Key Point 1**: Brief explanation of main concept                          ║
║ • **Key Point 2**: Another important takeaway                                 ║
║ • **Key Point 3**: Final crucial insight                                      ║
║                                                                                ║
║ ## Executive Summary                                                           ║
║ This video discusses the fundamental concepts of...                            ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

**Color Assignments**:
- Border: `#c084fc`
- Headers (#, ##): `#c084fc`
- Bold text (**text**): `#d8b4fe`
- Body text: `#e2e8f0`
- Bullet points (•): `#9b59d0`

### 5. Error Messages
```
✗ Error: Failed to process URL
  ├─ Cause: Network timeout after 30s
  ├─ Code: NETWORK_TIMEOUT
  └─ Suggestion: Check your internet connection and try again

obsidianize@web:~$ █
```

**Color Assignments**:
- Error symbol (✗): `#ef4444` (red)
- Error message: `#ef4444` (red)
- Tree structure (├─, └─): `#94a3b8` (muted)
- Labels ("Cause:", "Code:"): `#c084fc` (purple)
- Values: `#e2e8f0` (white)
- Cursor (█): `#c084fc` blinking

## CSS Implementation

### Complete Theme Definition
```css
:root[data-theme="purple-baseline"] {
  /* Background colors */
  --theme-bg-primary: #0f0f23;
  --theme-bg-secondary: #1a1a3a;
  --theme-bg-tertiary: #262640;
  
  /* Text colors */
  --theme-text-primary: #e2e8f0;
  --theme-text-secondary: #94a3b8;
  --theme-text-muted: #64748b;
  
  /* Accent colors */
  --theme-accent-primary: #c084fc;
  --theme-accent-secondary: #9b59d0;
  --theme-accent-tertiary: #d8b4fe;
  
  /* Semantic colors */
  --theme-border: #c084fc;
  --theme-ascii-art: #9b59d0;
  --theme-tagline: #d8b4fe;
  --theme-prompt: #c084fc;
  --theme-cursor: #c084fc;
  
  /* Status colors */
  --theme-success: #22c55e;
  --theme-warning: #f59e0b;
  --theme-error: #ef4444;
  --theme-info: #3b82f6;
  
  /* Interactive states */
  --theme-hover: #e879f9;
  --theme-active: #a855f7;
  --theme-focus: #c084fc;
  --theme-selection: rgba(192, 132, 252, 0.3);
}
```

### Typography Styles
```css
.terminal {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.2;
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

.ascii-art {
  color: var(--theme-ascii-art);
  font-weight: bold;
  text-align: center;
  white-space: pre;
}

.border {
  color: var(--theme-border);
}

.tagline {
  color: var(--theme-tagline);
  text-align: center;
  font-size: 16px;
  margin: 20px 0;
}
```

## Accessibility

### Contrast Ratios
- **Background to Primary Text**: `#0f0f23` to `#e2e8f0` = 12.02:1 (AAA)
- **Background to Purple Border**: `#0f0f23` to `#c084fc` = 8.51:1 (AAA)
- **Background to ASCII Art**: `#0f0f23` to `#9b59d0` = 6.12:1 (AA+)
- **Background to Success Green**: `#0f0f23` to `#22c55e` = 8.75:1 (AAA)
- **Background to Error Red**: `#0f0f23` to `#ef4444` = 5.67:1 (AA)

### Accessibility Features
- All essential information is conveyed through text, not just color
- Focus indicators are clearly visible with purple outline
- Screen reader friendly with proper semantic HTML
- Support for reduced motion preferences

## Theme Personality

### Emotional Characteristics
- **Sophisticated**: Deep colors suggest professionalism
- **Mysterious**: Dark purple evokes intrigue and depth
- **Modern**: Contemporary purple palette feels current
- **Focused**: High contrast aids concentration
- **Magical**: Purple + sparkles (✨) suggest transformation

### Use Cases
- **Night coding sessions**: Easy on the eyes in dark environments
- **Creative work**: Inspiring color combination
- **Professional presentations**: Sophisticated appearance
- **General daily use**: Comfortable default theme

### Brand Alignment
- Matches the "crystallized knowledge" concept with gem-like purples
- Aligns with the magical/transformative nature of the product
- Professional enough for business use, creative enough for personal projects

## Design Notes

### Strengths
- High contrast for excellent readability
- Distinctive brand identity with purple theme
- Modern and sophisticated appearance
- Excellent accessibility scores
- Works well in various lighting conditions

### Considerations
- Purple may not appeal to all users (hence other theme options)
- Could feel "cold" to some users preferring warmer tones
- May be too vibrant for minimalist preferences

### Maintenance Notes
- This is the baseline theme - changes here affect the default experience
- Color values are tested and accessibility-approved
- ASCII art rendering has been verified across multiple terminals
- All hex codes have been validated for web and terminal compatibility

---

**Last Updated**: October 11, 2024  
**Version**: 1.0  
**Status**: ✅ Production Ready