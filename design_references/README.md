# Obsidianize TUI Design References

## Overview

This directory contains five carefully crafted visual theme references for the Obsidianize TUI interface. Each theme maintains the core design elements (ASCII art, box borders, typography) while providing distinct color schemes and visual personalities.

## Purpose

These references serve as the **canonical visual specification** for implementation agents. When building the Web TUI and CLI interfaces, agents must refer to these documents to ensure consistent visual design across all themes.

## Core Design Elements (Preserved Across All Themes)

### ASCII Art
- **Font**: "ANSI Shadow" (figlet)
- **Text**: "OBSIDIANIZE"
- **Structure**: Centered within box border
- **Tagline**: "✨ Your Knowledge, Crystallized ✨"

### Typography
- **Primary Font Family**: 'JetBrains Mono', 'Fira Code', 'Courier New', 'Monaco', 'Menlo', monospace
- **Fallback Fonts**: Standard monospace system fonts
- **Line Height**: 1.2 for optimal readability
- **Font Size**: 14px base (scalable)

### Layout Structure
- **Border**: Unicode box-drawing characters (╔═══╗, ║, ╚═══╝)
- **Padding**: Consistent spacing within borders
- **Centering**: ASCII art centered horizontally
- **Responsive**: Adaptable to different terminal widths

### Mock Data Structure
Each theme includes examples of:
1. **Terminal Header**: Logo + tagline
2. **Command Prompt**: `obsidianize@web:~$ _`
3. **Processing Status**: Progress indicators and status messages
4. **Content Output**: Sample markdown structure and formatting
5. **Error Messages**: Error states with proper color coding

## Theme List

1. **[Purple Baseline](./theme-1-purple-baseline.md)** - Current implementation
2. **[Classic Green Terminal](./theme-2-classic-green.md)** - Retro VT100 style
3. **[Modern Dark](./theme-3-modern-dark.md)** - VS Code Dark+ inspired
4. **[High Contrast](./theme-4-high-contrast.md)** - Accessibility focused
5. **[Warm Terminal](./theme-5-warm-amber.md)** - Cozy amber/orange tones

## Implementation Guidelines

### CSS Custom Properties
Each theme uses CSS custom properties for easy switching:

```css
:root {
  --theme-bg-primary: #color;
  --theme-bg-secondary: #color;
  --theme-text-primary: #color;
  --theme-text-secondary: #color;
  --theme-accent-primary: #color;
  --theme-accent-secondary: #color;
  --theme-border: #color;
  --theme-ascii-art: #color;
  --theme-success: #color;
  --theme-warning: #color;
  --theme-error: #color;
}
```

### Theme Switching
Themes are switched by changing the CSS custom property values, ensuring consistent behavior across all interface elements.

### Accessibility
- All themes meet WCAG 2.1 AA contrast requirements
- High contrast theme exceeds AAA standards
- Color is never the only means of conveying information

## Usage for Implementation Agents

1. **Read the appropriate theme document** before implementing any visual components
2. **Use the exact color codes** provided in each theme specification
3. **Follow the mock data examples** for consistent formatting
4. **Preserve all ASCII art and box-drawing elements** exactly as specified
5. **Test with the provided sample content** to ensure proper rendering

## Last Updated

October 11, 2024 - Initial creation of design reference system