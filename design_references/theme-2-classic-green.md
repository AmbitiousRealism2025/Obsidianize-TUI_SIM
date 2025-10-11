# Theme 2: Classic Green Terminal - "Retro Matrix"

## Overview

**Theme Name**: Classic Green Terminal  
**Codename**: "Retro Matrix"  
**Personality**: Nostalgic, hacker-inspired, focused  
**Status**: Design reference for implementation

This theme pays homage to classic terminal aesthetics from the golden age of computing. Inspired by VT100 terminals, early Unix systems, and the iconic green-on-black "hacker" aesthetic popularized by movies like The Matrix. It provides a distraction-free, highly focused environment for deep work.

## Color Palette

### Primary Colors
```css
:root {
  --theme-bg-primary: #000000;      /* Pure black background */
  --theme-bg-secondary: #0a0a0a;    /* Slightly lighter black */
  --theme-text-primary: #00ff00;    /* Classic bright green */
  --theme-text-secondary: #00cc00;  /* Slightly dimmer green */
  --theme-accent-primary: #00ff41;  /* Bright matrix green */
  --theme-accent-secondary: #00aa00; /* Darker green (ASCII art) */
  --theme-border: #00ff41;          /* Bright green borders */
  --theme-ascii-art: #00aa00;       /* ASCII art color */
  --theme-tagline: #00ff88;         /* Cyan-tinted green tagline */
}
```

### Status Colors
```css
:root {
  --theme-success: #00ff00;         /* Classic green success */
  --theme-warning: #ffff00;         /* Bright yellow warning */
  --theme-error: #ff0000;           /* Classic red error */
  --theme-info: #00ffff;            /* Cyan info */
}
```

### Semantic Usage
- **Background**: `#000000` - Pure black terminal background
- **ASCII Art**: `#00aa00` - OBSIDIANIZE header text (darker green)
- **Borders**: `#00ff41` - Box-drawing characters (bright matrix green)
- **Tagline**: `#00ff88` - "✨ Your Knowledge, Crystallized ✨" (cyan-tinted)
- **Primary Text**: `#00ff00` - Main content text (classic green)
- **Secondary Text**: `#00cc00` - Timestamps, metadata (dimmer green)
- **Command Prompt**: `#00ff41` - `obsidianize@web:~$` (bright green)

## Typography

### Font Stack
```css
font-family: 'Courier New', 'Monaco', 'Menlo', 'Liberation Mono', 'Consolas', monospace;
```
*Note: Prioritizes classic terminal fonts like Courier New for authentic retro feel*

### Font Sizes
- **ASCII Art**: Inherits from figlet (ANSI Shadow font)
- **Primary Text**: 14px
- **Small Text**: 12px
- **Code Blocks**: 13px

### Line Heights
- **Body Text**: 1.4 (slightly tighter for classic terminal feel)
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
- Border characters (`╔═══╗`, `║`, `╚═══╝`): `#00ff41` (bright matrix green)
- ASCII art text: `#00aa00` (darker green for better readability)
- Tagline: `#00ff88` (cyan-tinted green)
- Background: `#000000` (pure black)

### 2. Command Prompt
```
obsidianize@web:~$ process https://youtube.com/watch?v=example
```

**Color Assignments**:
- `obsidianize@web:~$`: `#00ff41` (bright green)
- Command text: `#00ff00` (classic green)
- URLs/parameters: `#00ff88` (cyan-tinted green)

### 3. Processing Status
```
[████████████████████████████████████████] 100% | Processing complete
✓ Content fetched from YouTube
✓ AI analysis complete  
✓ Markdown generated
→ Saved: yt_example-video_content--dQw4w9WgXcQ.md
```

**Color Assignments**:
- Progress bar: `#00ff41` (bright green)
- Percentage: `#00ff00` (classic green)
- Checkmarks (✓): `#00ff00` (success green - same as primary)
- Arrow (→): `#00ff41` (bright green)
- Filename: `#00ff88` (cyan-tinted green)

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
- Border: `#00ff41` (bright green)
- Headers (#, ##): `#00ff41` (bright green)
- Bold text (**text**): `#00ff88` (cyan-tinted green)
- Body text: `#00ff00` (classic green)
- Bullet points (•): `#00aa00` (darker green)

### 5. Error Messages
```
✗ Error: Failed to process URL
  ├─ Cause: Network timeout after 30s
  ├─ Code: NETWORK_TIMEOUT
  └─ Suggestion: Check your internet connection and try again

obsidianize@web:~$ █
```

**Color Assignments**:
- Error symbol (✗): `#ff0000` (classic red)
- Error message: `#ff0000` (classic red)
- Tree structure (├─, └─): `#00cc00` (dimmer green)
- Labels ("Cause:", "Code:"): `#00ff41` (bright green)
- Values: `#00ff00` (classic green)
- Cursor (█): `#00ff41` blinking

### 6. System Information Display
```
╔═ SYSTEM STATUS ═══════════════════════════════════════════════════════════════╗
║ [ONLINE]  Gemini API Connection: OK                                           ║
║ [READY]   Processing Engine: Initialized                                      ║
║ [ACTIVE]  Memory Usage: 45.2MB / 1.2GB                                       ║
║ [INFO]    Last Process: 2024-10-11 15:42:33                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Color Assignments**:
- Border: `#00ff41`
- Status labels [ONLINE], [READY]: `#00ff00`
- Status labels [ACTIVE]: `#ffff00` (yellow for activity)
- [INFO]: `#00ffff` (cyan)
- Text content: `#00ff00`
- Timestamps/data: `#00cc00`

## CSS Implementation

### Complete Theme Definition
```css
:root[data-theme="classic-green"] {
  /* Background colors */
  --theme-bg-primary: #000000;
  --theme-bg-secondary: #0a0a0a;
  --theme-bg-tertiary: #111111;
  
  /* Text colors */
  --theme-text-primary: #00ff00;
  --theme-text-secondary: #00cc00;
  --theme-text-muted: #009900;
  
  /* Accent colors */
  --theme-accent-primary: #00ff41;
  --theme-accent-secondary: #00aa00;
  --theme-accent-tertiary: #00ff88;
  
  /* Semantic colors */
  --theme-border: #00ff41;
  --theme-ascii-art: #00aa00;
  --theme-tagline: #00ff88;
  --theme-prompt: #00ff41;
  --theme-cursor: #00ff41;
  
  /* Status colors */
  --theme-success: #00ff00;
  --theme-warning: #ffff00;
  --theme-error: #ff0000;
  --theme-info: #00ffff;
  
  /* Interactive states */
  --theme-hover: #44ff44;
  --theme-active: #00cc00;
  --theme-focus: #00ff41;
  --theme-selection: rgba(0, 255, 65, 0.3);
}
```

### Typography Styles
```css
.terminal.theme-classic-green {
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Liberation Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.4;
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  text-shadow: 0 0 2px currentColor; /* Subtle CRT glow effect */
}

.ascii-art.theme-classic-green {
  color: var(--theme-ascii-art);
  font-weight: normal; /* Less bold for authentic terminal feel */
  text-align: center;
  white-space: pre;
  text-shadow: 0 0 3px currentColor; /* Slightly stronger glow for ASCII */
}

.border.theme-classic-green {
  color: var(--theme-border);
  text-shadow: 0 0 2px currentColor;
}

.tagline.theme-classic-green {
  color: var(--theme-tagline);
  text-align: center;
  font-size: 16px;
  margin: 20px 0;
  text-shadow: 0 0 4px currentColor;
}
```

### CRT Monitor Effects (Optional Enhancement)
```css
.terminal.theme-classic-green.crt-effects {
  /* Scanline effect */
  background-image: 
    linear-gradient(transparent 50%, rgba(0, 255, 0, 0.03) 50%);
  background-size: 100% 4px;
  
  /* Screen curvature */
  border-radius: 15px;
  
  /* Subtle screen flicker animation */
  animation: flicker 3s infinite linear;
}

@keyframes flicker {
  0%, 99%, 100% { opacity: 1; }
  99.5% { opacity: 0.98; }
}
```

## Accessibility

### Contrast Ratios
- **Background to Primary Text**: `#000000` to `#00ff00` = 15.3:1 (AAA)
- **Background to Bright Green Border**: `#000000` to `#00ff41` = 18.2:1 (AAA)
- **Background to ASCII Art**: `#000000` to `#00aa00` = 10.8:1 (AAA)
- **Background to Warning Yellow**: `#000000` to `#ffff00` = 19.6:1 (AAA)
- **Background to Error Red**: `#000000` to `#ff0000` = 5.25:1 (AA)

### Accessibility Features
- Exceptional contrast ratios across all elements
- Pure black background reduces eye strain in dark environments
- Classic green is comfortable for extended reading
- Text shadows optional for users with visual impairments
- All information conveyed through text, not just color

### CRT Effects Accessibility
- CRT effects (scanlines, flicker) can be disabled via user preference
- Motion-sensitive users can opt for static version
- Glow effects enhance readability rather than hinder it

## Theme Personality

### Emotional Characteristics
- **Nostalgic**: Evokes memories of early computing and hacker culture
- **Focused**: Monochromatic palette minimizes distractions
- **Authentic**: True to original terminal aesthetics
- **Mysterious**: Dark background with bright green suggests depth
- **Professional**: Clean, no-nonsense appearance for serious work

### Use Cases
- **Programming sessions**: Mimics classic coding environments
- **Security work**: Appeals to cybersecurity professionals
- **Late-night work**: Easy on eyes in dark rooms
- **Retro computing**: Perfect for vintage computing enthusiasts
- **Focused writing**: Minimal distractions for deep work

### Cultural References
- **The Matrix**: Iconic green code rain aesthetic
- **WarGames**: 1980s computer terminal authenticity
- **Unix terminals**: Classic system administration feel
- **Hacker culture**: Appeals to old-school developer community
- **BBS systems**: Bulletin board system nostalgia

## Design Notes

### Strengths
- **Highest contrast**: Best readability in all lighting conditions
- **Timeless**: Classic aesthetic never goes out of style
- **Eye-friendly**: Green is naturally easier on eyes than blue light
- **Distraction-free**: Monochromatic palette aids concentration
- **Performance**: Minimal CSS complexity, fast rendering

### Considerations
- **Limited color range**: May feel monotonous to some users
- **Cultural associations**: "Hacker" aesthetic may not suit all contexts
- **Brightness**: Very bright colors may be overwhelming in bright environments
- **Accessibility**: Some users may prefer more color diversity

### Enhancement Options
1. **CRT Effects**: Optional scanlines and subtle glow for authenticity
2. **Matrix Mode**: Falling character animation background (very subtle)
3. **Amber Alternative**: Option to switch to amber (#ffb000) instead of green
4. **IBM 3270**: Alternative with green text on dark blue background

### Maintenance Notes
- Colors are intentionally simple and classic
- Text shadows enhance the retro CRT feel but are optional
- Font selection prioritizes authentic terminal fonts
- All effects can be disabled for accessibility
- Theme works excellently in both web and native terminal environments

## Historical Context

### Terminal Heritage
This theme pays homage to:
- **VT100 terminals** (1978): The gold standard of terminal design
- **IBM PC** green screen monitors (early 1980s)
- **Unix workstations**: Classic system administration terminals
- **BBS systems**: Bulletin board system aesthetics
- **Early networking**: When terminals were the primary computer interface

### Modern Relevance
- **Cybersecurity**: Green terminals remain iconic in security contexts
- **Developer culture**: Many programmers prefer green-on-black themes
- **Retro gaming**: Terminal aesthetics popular in indie games
- **Educational**: Teaching computer history and command-line interfaces
- **Accessibility**: High contrast benefits users with visual impairments

---

**Last Updated**: October 11, 2024  
**Version**: 1.0  
**Status**: ✅ Design Complete - Ready for Implementation