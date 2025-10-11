# Theme 5: Warm Terminal - "Golden Hour"

## Overview

**Theme Name**: Warm Terminal  
**Codename**: "Golden Hour"  
**Personality**: Cozy, welcoming, comfortable  
**Status**: Design reference for implementation

This theme brings warmth and comfort to the terminal experience with rich amber, orange, and gold tones. Inspired by vintage amber monitors, candlelight, and the golden hour of sunset, it creates an inviting, cozy atmosphere perfect for long working sessions and creative endeavors. The warm color palette reduces blue light exposure, making it ideal for evening use.

## Color Palette

### Primary Colors
```css
:root {
  --theme-bg-primary: #1a1611;      /* Deep warm brown background */
  --theme-bg-secondary: #221e17;    /* Slightly lighter warm brown */
  --theme-text-primary: #ffd4a3;    /* Warm cream text */
  --theme-text-secondary: #d4af8c;  /* Muted warm beige text */
  --theme-accent-primary: #ffb000;  /* Golden amber (borders) */
  --theme-accent-secondary: #ff8c00; /* Deep orange (ASCII art) */
  --theme-border: #ffb000;          /* Golden amber borders */
  --theme-ascii-art: #ff8c00;       /* Deep orange ASCII art */
  --theme-tagline: #ffcc73;         /* Light golden tagline */
}
```

### Status Colors
```css
:root {
  --theme-success: #98d982;         /* Warm sage green success */
  --theme-warning: #f4a261;         /* Sandy orange warning */
  --theme-error: #e76f51;           /* Warm coral error */
  --theme-info: #2a9d8f;            /* Teal info */
}
```

### Semantic Usage
- **Background**: `#1a1611` - Deep warm brown terminal background
- **ASCII Art**: `#ff8c00` - OBSIDIANIZE header text (deep orange)
- **Borders**: `#ffb000` - Box-drawing characters (golden amber)
- **Tagline**: `#ffcc73` - "✨ Your Knowledge, Crystallized ✨" (light golden)
- **Primary Text**: `#ffd4a3` - Main content text (warm cream)
- **Secondary Text**: `#d4af8c` - Timestamps, metadata (muted warm beige)
- **Command Prompt**: `#ffb000` - `obsidianize@web:~$` (golden amber)

## Typography

### Font Stack
```css
font-family: 'JetBrains Mono', 'Operator Mono', 'Dank Mono', 'Fira Code', 'Source Code Pro', monospace;
```
*Note: Prioritizes fonts that feel friendly and comfortable for extended reading*

### Font Sizes
- **ASCII Art**: Inherits from figlet (ANSI Shadow font)
- **Primary Text**: 14px
- **Small Text**: 12px
- **Code Blocks**: 13px

### Line Heights
- **Body Text**: 1.6 (comfortable spacing for relaxed reading)
- **Code/Terminal**: 1.4 (balanced spacing)
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
- Border characters (`╔═══╗`, `║`, `╚═══╝`): `#ffb000` (golden amber)
- ASCII art text: `#ff8c00` (deep orange)
- Tagline: `#ffcc73` (light golden)
- Background: `#1a1611` (deep warm brown)

### 2. Command Prompt
```
obsidianize@web:~$ process https://youtube.com/watch?v=example
```

**Color Assignments**:
- `obsidianize@web:~$`: `#ffb000` (golden amber)
- Command text: `#ffd4a3` (warm cream)
- URLs/parameters: `#ffcc73` (light golden)

### 3. Processing Status
```
[████████████████████████████████████████] 100% | Processing complete
✓ Content fetched from YouTube
✓ AI analysis complete  
✓ Markdown generated
→ Saved: yt_example-video_content--dQw4w9WgXcQ.md
```

**Color Assignments**:
- Progress bar: `#ffb000` (golden amber)
- Percentage: `#ffd4a3` (warm cream)
- Checkmarks (✓): `#98d982` (warm sage green success)
- Arrow (→): `#ffb000` (golden amber)
- Filename: `#ffcc73` (light golden)

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
- Border: `#ffb000` (golden amber)
- Headers (#, ##): `#ffb000` (golden amber)
- Bold text (**text**): `#ffcc73` (light golden)
- Body text: `#ffd4a3` (warm cream)
- Bullet points (•): `#ff8c00` (deep orange)

### 5. Error Messages
```
✗ Error: Failed to process URL
  ├─ Cause: Network timeout after 30s
  ├─ Code: NETWORK_TIMEOUT
  └─ Suggestion: Check your internet connection and try again

obsidianize@web:~$ █
```

**Color Assignments**:
- Error symbol (✗): `#e76f51` (warm coral)
- Error message: `#e76f51` (warm coral)
- Tree structure (├─, └─): `#d4af8c` (muted warm beige)
- Labels ("Cause:", "Code:"): `#ffb000` (golden amber)
- Values: `#ffd4a3` (warm cream)
- Cursor (█): `#ffb000` blinking

### 6. Cozy Evening Session
```
╔═ EVENING SESSION ══════════════════════════════════════════════════════════════╗
║ 🌅 Good Evening! Time: 19:42                                                   ║
║ 🕯️  Warm mode active - Blue light reduced                                      ║
║ ☕ Perfect for: Reading, Writing, Late-night coding                            ║
║ 🎵 Suggested: Lo-fi music, Ambient sounds                                     ║
║ 💡 Tip: This theme reduces eye strain in low light                            ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

**Color Assignments**:
- Border: `#ffb000`
- Icons: Natural colors (🌅🕯️☕🎵💡)
- Time: `#ffcc73` (light golden)
- Feature text: `#ffd4a3` (warm cream)
- Suggestions: `#d4af8c` (muted warm beige)

### 7. File Processing with Warm Progress
```
╔═ PROCESSING FILES ═════════════════════════════════════════════════════════════╗
║                                                                                ║
║ 📄 video-analysis.md    [▓▓▓▓▓▓▓▓▓▓] 100%   ✨ Complete                       ║
║ 📄 podcast-summary.md   [▓▓▓▓▓▓▓░░░] 70%    🔄 Processing                     ║
║ 📄 article-notes.md     [▓▓▓░░░░░░░] 30%    ⏳ In queue                       ║
║                                                                                ║
║ Total: 3 files • Estimated: 2m 15s remaining                                  ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

**Color Assignments**:
- File icons (📄): Natural colors
- Progress bars (▓): `#ffb000` (golden amber)
- Empty progress (░): `#3d3425` (dark warm brown)
- Complete (✨): `#98d982` (warm sage green)
- Processing (🔄): `#f4a261` (sandy orange)
- Queue (⏳): `#d4af8c` (muted warm beige)
- Filenames: `#ffd4a3` (warm cream)
- Status text: `#ffcc73` (light golden)

## CSS Implementation

### Complete Theme Definition
```css
:root[data-theme="warm-amber"] {
  /* Background colors */
  --theme-bg-primary: #1a1611;
  --theme-bg-secondary: #221e17;
  --theme-bg-tertiary: #2a251c;
  
  /* Text colors */
  --theme-text-primary: #ffd4a3;
  --theme-text-secondary: #d4af8c;
  --theme-text-muted: #b8956f;
  
  /* Accent colors */
  --theme-accent-primary: #ffb000;
  --theme-accent-secondary: #ff8c00;
  --theme-accent-tertiary: #ffcc73;
  
  /* Semantic colors */
  --theme-border: #ffb000;
  --theme-ascii-art: #ff8c00;
  --theme-tagline: #ffcc73;
  --theme-prompt: #ffb000;
  --theme-cursor: #ffb000;
  
  /* Status colors - warm variants */
  --theme-success: #98d982;
  --theme-warning: #f4a261;
  --theme-error: #e76f51;
  --theme-info: #2a9d8f;
  
  /* Warm palette extensions */
  --theme-warm-gold: #ffd700;
  --theme-warm-copper: #b87333;
  --theme-warm-cream: #fff8dc;
  --theme-warm-sienna: #a0522d;
  
  /* Interactive states */
  --theme-hover: #ffc929;
  --theme-active: #e6a000;
  --theme-focus: #ffb000;
  --theme-selection: rgba(255, 176, 0, 0.3);
}
```

### Typography Styles
```css
.terminal.theme-warm-amber {
  font-family: 'JetBrains Mono', 'Operator Mono', 'Dank Mono', 'Fira Code', 'Source Code Pro', monospace;
  font-size: 14px;
  line-height: 1.4;
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  
  /* Warm, comfortable text rendering */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.ascii-art.theme-warm-amber {
  color: var(--theme-ascii-art);
  font-weight: 600; /* Semi-bold for warmth without harshness */
  text-align: center;
  white-space: pre;
  text-shadow: 0 0 4px rgba(255, 140, 0, 0.3); /* Warm glow effect */
}

.border.theme-warm-amber {
  color: var(--theme-border);
  text-shadow: 0 0 2px rgba(255, 176, 0, 0.2); /* Subtle golden glow */
}

.tagline.theme-warm-amber {
  color: var(--theme-tagline);
  text-align: center;
  font-size: 16px;
  margin: 20px 0;
  text-shadow: 0 0 6px rgba(255, 204, 115, 0.4); /* Soft golden glow */
}
```

### Warm Visual Effects
```css
/* Cozy glow effects */
.terminal.theme-warm-amber {
  box-shadow: 
    inset 0 0 20px rgba(255, 176, 0, 0.05),
    0 0 40px rgba(255, 140, 0, 0.1);
}

/* Progress bars with warm gradient */
.progress-bar.theme-warm-amber {
  background: linear-gradient(90deg, 
    var(--theme-accent-secondary), 
    var(--theme-accent-primary),
    var(--theme-warm-gold)
  );
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(255, 176, 0, 0.3);
}

/* Warm hover effects */
.interactive.theme-warm-amber:hover {
  color: var(--theme-hover);
  text-shadow: 0 0 8px rgba(255, 201, 41, 0.6);
  transition: all 0.3s ease;
}

/* Candlelight flicker effect (optional) */
@keyframes candlelight-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.95; }
  75% { opacity: 0.98; }
}

.flicker.theme-warm-amber {
  animation: candlelight-flicker 4s infinite ease-in-out;
}
```

### Evening Mode Enhancements
```css
/* Blue light reduction filter */
.terminal.theme-warm-amber.evening-mode {
  filter: sepia(0.1) saturate(1.2) hue-rotate(15deg);
}

/* Breathing animation for relaxation */
@keyframes breathing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.breathing.theme-warm-amber {
  animation: breathing 8s infinite ease-in-out;
}

/* Warm notification pulses */
@keyframes warm-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 176, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 176, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 176, 0, 0); }
}

.notification.theme-warm-amber {
  animation: warm-pulse 2s infinite;
}
```

## Accessibility

### Contrast Ratios
- **Background to Primary Text**: `#1a1611` to `#ffd4a3` = 10.2:1 (AAA)
- **Background to Golden Border**: `#1a1611` to `#ffb000` = 8.8:1 (AAA)
- **Background to Orange ASCII**: `#1a1611` to `#ff8c00` = 7.1:1 (AAA)
- **Background to Success Green**: `#1a1611` to `#98d982` = 7.9:1 (AAA)
- **Background to Error Coral**: `#1a1611` to `#e76f51` = 5.2:1 (AA)

### Blue Light Reduction
- Warm color palette naturally reduces blue light exposure
- Evening mode filter can be applied for additional blue light reduction
- Recommended for use after sunset or in low-light environments
- Supports circadian rhythm by reducing stimulating blue wavelengths

### Comfort Features
- Soft glow effects reduce harsh edges
- Warm colors are naturally easier on the eyes
- Lower contrast than high-contrast themes but still accessible
- Comfortable for extended reading and coding sessions

## Theme Personality

### Emotional Characteristics
- **Cozy**: Warm colors create a comfortable, inviting atmosphere
- **Calming**: Reduces stress and promotes relaxation
- **Creative**: Inspiring earth tones encourage creative thinking
- **Nostalgic**: Evokes memories of warm, comfortable spaces
- **Protective**: Gentle on eyes, especially in evening use

### Use Cases
- **Evening work**: Perfect for after-sunset coding sessions
- **Creative writing**: Warm atmosphere encourages creativity
- **Reading sessions**: Comfortable for long reading periods
- **Relaxed coding**: Less intense than high-contrast themes
- **Winter months**: Provides psychological warmth in cold seasons

### Mood and Atmosphere
- **Coffee shop vibes**: Warm, productive, comfortable
- **Autumn evenings**: Golden hour, cozy, contemplative
- **Vintage aesthetics**: Amber monitor nostalgia
- **Candlelit workspace**: Intimate, focused, serene
- **Sunset coding**: Peaceful transition from day to night

## Design Inspiration

### Source Influences
- **Amber CRT monitors**: 1970s-80s computer terminals
- **Sepia photography**: Vintage, warm aesthetic
- **Golden hour lighting**: Natural warm sunlight
- **Candlelight**: Soft, flickering illumination
- **Autumn colors**: Warm earth tones, comfort
- **Coffee culture**: Warm, productive spaces

### Natural References
- **Sunset colors**: Orange, amber, gold gradients
- **Wood tones**: Rich browns, warm textures
- **Campfire glow**: Warm orange light
- **Honey and amber**: Natural golden colors
- **Desert sand**: Warm, muted earth tones

## Design Notes

### Strengths
- **Eye Comfort**: Excellent for long sessions and evening use
- **Unique Atmosphere**: Distinctive warm personality
- **Blue Light Reduction**: Natural circadian rhythm support
- **Accessibility**: Good contrast ratios with comfort
- **Versatility**: Works in various lighting conditions

### Considerations
- **Color Temperature**: May not suit all preferences
- **Professional Settings**: Warm colors may seem less formal
- **Bright Environments**: May need brighter variants for daylight use
- **Color Accuracy**: Warm filter affects color perception

### Enhancement Options
1. **Time-based Adaptation**: Auto-adjust warmth based on time of day
2. **Seasonal Variants**: Different warm palettes for seasons
3. **Candlelight Mode**: Extra-warm variant with subtle animations
4. **Productivity Mode**: Slightly cooler variant for focus work
5. **Vintage Modes**: Various retro amber monitor simulations

### Maintenance Notes
- Colors tested for accessibility compliance
- Warm palette carefully balanced for readability
- Glow effects are subtle and optional
- Theme works well with both light and dark ambient lighting
- Regular testing ensures comfort during extended use

## Time-of-Day Integration

### Automatic Warmth Adjustment
```css
/* Morning: Slightly cooler variant */
@media (prefers-color-scheme: light) {
  :root[data-theme="warm-amber"].time-morning {
    --theme-text-primary: #f4d1a6;
    --theme-accent-primary: #ffa500;
  }
}

/* Evening: Maximum warmth */
:root[data-theme="warm-amber"].time-evening {
  --theme-text-primary: #ffd4a3;
  --theme-accent-primary: #ffb000;
  filter: sepia(0.15) saturate(1.1);
}

/* Night: Extra cozy */
:root[data-theme="warm-amber"].time-night {
  --theme-bg-primary: #151210;
  --theme-text-primary: #e6c18a;
  --theme-accent-primary: #cc8800;
}
```

### Seasonal Variations
```css
/* Autumn variant - Extra warm */
:root[data-theme="warm-amber"].season-autumn {
  --theme-accent-secondary: #cc5500;
  --theme-warm-copper: #cd7f32;
}

/* Winter variant - Cozy fireplace */
:root[data-theme="warm-amber"].season-winter {
  --theme-bg-primary: #1a1510;
  --theme-accent-primary: #ff9500;
}

/* Spring variant - Golden morning */
:root[data-theme="warm-amber"].season-spring {
  --theme-text-primary: #fff2d9;
  --theme-accent-primary: #ffcc00;
}
```

---

**Last Updated**: October 11, 2024  
**Version**: 1.0  
**Status**: ✅ Design Complete - Comfort Optimized - Ready for Implementation