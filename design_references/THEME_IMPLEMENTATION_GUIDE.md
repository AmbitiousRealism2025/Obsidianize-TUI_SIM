# Theme Implementation Guide

## Overview

This guide provides developers with everything needed to implement the five Obsidianize TUI themes. It covers CSS variable naming conventions, theme switching mechanisms, implementation patterns, and testing procedures.

## Theme Architecture

### CSS Custom Properties System

All themes use CSS custom properties (CSS variables) for consistent theming. This allows for:
- Runtime theme switching without page reload
- Easy customization and maintenance
- Consistent color relationships across components
- Support for user preferences and system settings

### Naming Convention

```css
:root[data-theme="theme-name"] {
  /* Background hierarchy */
  --theme-bg-primary: #color;       /* Main background */
  --theme-bg-secondary: #color;     /* Secondary surfaces */
  --theme-bg-tertiary: #color;      /* Elevated surfaces */
  
  /* Text hierarchy */
  --theme-text-primary: #color;     /* Main text */
  --theme-text-secondary: #color;   /* Muted text */
  --theme-text-muted: #color;       /* Disabled/placeholder text */
  
  /* Accent colors */
  --theme-accent-primary: #color;   /* Primary actions, borders */
  --theme-accent-secondary: #color; /* Secondary accents */
  --theme-accent-tertiary: #color;  /* Tertiary accents */
  
  /* Semantic UI colors */
  --theme-border: #color;           /* Border color */
  --theme-ascii-art: #color;        /* ASCII art color */
  --theme-tagline: #color;          /* Tagline color */
  --theme-prompt: #color;           /* Command prompt color */
  --theme-cursor: #color;           /* Cursor color */
  
  /* Status colors */
  --theme-success: #color;          /* Success states */
  --theme-warning: #color;          /* Warning states */
  --theme-error: #color;            /* Error states */
  --theme-info: #color;             /* Info states */
  
  /* Interactive states */
  --theme-hover: #color;            /* Hover states */
  --theme-active: #color;           /* Active states */
  --theme-focus: #color;            /* Focus states */
  --theme-selection: rgba(r,g,b,a); /* Selection highlight */
}
```

## Available Themes

### 1. Purple Baseline (Default)
```css
:root[data-theme="purple-baseline"] {
  /* Implementation in theme-1-purple-baseline.md */
}
```

### 2. Classic Green Terminal
```css
:root[data-theme="classic-green"] {
  /* Implementation in theme-2-classic-green.md */
}
```

### 3. Modern Dark
```css
:root[data-theme="modern-dark"] {
  /* Implementation in theme-3-modern-dark.md */
}
```

### 4. High Contrast
```css
:root[data-theme="high-contrast"] {
  /* Implementation in theme-4-high-contrast.md */
}
```

### 5. Warm Amber
```css
:root[data-theme="warm-amber"] {
  /* Implementation in theme-5-warm-amber.md */
}
```

## Theme Switching Implementation

### JavaScript Theme Manager

```typescript
class ThemeManager {
  private currentTheme: string = 'purple-baseline';
  
  constructor() {
    this.initializeTheme();
    this.setupSystemPreferences();
  }
  
  private initializeTheme(): void {
    // Load saved theme or default
    const savedTheme = localStorage.getItem('obsidianize-theme');
    this.setTheme(savedTheme || 'purple-baseline');
  }
  
  public setTheme(themeName: string): void {
    const validThemes = [
      'purple-baseline',
      'classic-green',
      'modern-dark',
      'high-contrast',
      'warm-amber'
    ];
    
    if (!validThemes.includes(themeName)) {
      console.warn(`Invalid theme: ${themeName}. Using default.`);
      themeName = 'purple-baseline';
    }
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Save preference
    localStorage.setItem('obsidianize-theme', themeName);
    
    // Update state
    this.currentTheme = themeName;
    
    // Emit event for other components
    document.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: themeName }
    }));
  }
  
  public getCurrentTheme(): string {
    return this.currentTheme;
  }
  
  public getAvailableThemes(): Array<{name: string, displayName: string, description: string}> {
    return [
      {
        name: 'purple-baseline',
        displayName: 'Mystic Terminal',
        description: 'Sophisticated purple theme with modern aesthetics'
      },
      {
        name: 'classic-green',
        displayName: 'Retro Matrix',
        description: 'Classic green-on-black terminal experience'
      },
      {
        name: 'modern-dark',
        displayName: 'Digital Ocean',
        description: 'Contemporary blue theme inspired by modern IDEs'
      },
      {
        name: 'high-contrast',
        displayName: 'Crystal Clear',
        description: 'Maximum accessibility with ultra-high contrast'
      },
      {
        name: 'warm-amber',
        displayName: 'Golden Hour',
        description: 'Cozy amber theme perfect for evening sessions'
      }
    ];
  }
  
  private setupSystemPreferences(): void {
    // Respect system dark mode preference for initial load
    if (window.matchMedia && !localStorage.getItem('obsidianize-theme')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      if (prefersHighContrast) {
        this.setTheme('high-contrast');
      } else if (prefersDark) {
        this.setTheme('modern-dark');
      }
    }
    
    // Listen for system changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches && !localStorage.getItem('user-selected-theme')) {
        this.setTheme('high-contrast');
      }
    });
  }
}

// Global instance
const themeManager = new ThemeManager();
```

### Theme Selector Component

```typescript
interface ThemeSelectorProps {
  onThemeChange?: (theme: string) => void;
}

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps): JSX.Element {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const themes = themeManager.getAvailableThemes();
  
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      setCurrentTheme(event.detail.theme);
      onThemeChange?.(event.detail.theme);
    };
    
    document.addEventListener('theme-changed', handleThemeChange);
    return () => document.removeEventListener('theme-changed', handleThemeChange);
  }, [onThemeChange]);
  
  const handleThemeSelect = (themeName: string) => {
    themeManager.setTheme(themeName);
    setIsOpen(false);
    localStorage.setItem('user-selected-theme', 'true'); // Mark as user selection
  };
  
  return (
    <div className="theme-selector">
      <button 
        className="theme-selector__toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
      >
        🎨 {themes.find(t => t.name === currentTheme)?.displayName || 'Theme'}
      </button>
      
      {isOpen && (
        <div className="theme-selector__dropdown">
          {themes.map(theme => (
            <button
              key={theme.name}
              className={`theme-selector__option ${
                theme.name === currentTheme ? 'theme-selector__option--active' : ''
              }`}
              onClick={() => handleThemeSelect(theme.name)}
            >
              <div className="theme-selector__name">{theme.displayName}</div>
              <div className="theme-selector__description">{theme.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Component Implementation Patterns

### Base Terminal Component

```css
.terminal {
  font-family: var(--theme-font-mono, 'JetBrains Mono', 'Fira Code', 'Courier New', monospace);
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  font-size: 14px;
  line-height: 1.4;
  
  /* Ensure proper text rendering */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### ASCII Art Component

```css
.ascii-art {
  color: var(--theme-ascii-art);
  font-weight: 600;
  text-align: center;
  white-space: pre;
  line-height: 1.0;
  
  /* Font-specific adjustments */
  font-family: var(--theme-font-mono, 'JetBrains Mono', 'Fira Code', 'Courier New', monospace);
}

/* Theme-specific font weight adjustments */
:root[data-theme="classic-green"] .ascii-art {
  font-weight: normal; /* Authentic terminal feel */
}

:root[data-theme="high-contrast"] .ascii-art {
  font-weight: 700; /* Maximum impact */
}
```

### Border Component

```css
.border {
  color: var(--theme-border);
  
  /* Optional glow effects for certain themes */
  text-shadow: var(--theme-border-glow, none);
}

/* Theme-specific enhancements */
:root[data-theme="classic-green"] .border {
  --theme-border-glow: 0 0 2px currentColor;
}

:root[data-theme="warm-amber"] .border {
  --theme-border-glow: 0 0 2px rgba(255, 176, 0, 0.2);
}
```

### Status Components

```css
.status {
  &--success { color: var(--theme-success); }
  &--warning { color: var(--theme-warning); }
  &--error { color: var(--theme-error); }
  &--info { color: var(--theme-info); }
}

/* Progress bars */
.progress-bar {
  background-color: var(--theme-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
  
  &__fill {
    background-color: var(--theme-accent-primary);
    height: 100%;
    transition: width 0.3s ease;
    
    /* Theme-specific enhancements */
    background: var(--theme-progress-bg, var(--theme-accent-primary));
  }
}

/* Theme-specific progress bar styles */
:root[data-theme="modern-dark"] {
  --theme-progress-bg: linear-gradient(90deg, var(--theme-accent-primary), var(--theme-accent-secondary));
}

:root[data-theme="warm-amber"] {
  --theme-progress-bg: linear-gradient(90deg, var(--theme-accent-secondary), var(--theme-accent-primary), var(--theme-warm-gold, #ffd700));
}
```

### Interactive Elements

```css
.interactive {
  color: var(--theme-text-primary);
  background-color: var(--theme-bg-secondary);
  border: 1px solid var(--theme-accent-primary);
  
  /* Transitions */
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--theme-hover);
    background-color: var(--theme-bg-tertiary);
    transform: var(--theme-hover-transform, none);
  }
  
  &:active {
    color: var(--theme-active);
    transform: var(--theme-active-transform, scale(0.98));
  }
  
  &:focus-visible {
    outline: 2px solid var(--theme-focus);
    outline-offset: 2px;
  }
}

/* High contrast theme enhancements */
:root[data-theme="high-contrast"] {
  --theme-hover-transform: scale(1.05);
  --theme-active-transform: scale(0.95);
}

/* High contrast focus indicators */
:root[data-theme="high-contrast"] .interactive:focus-visible {
  outline-width: 3px;
  outline-color: var(--theme-focus-outline, var(--theme-focus));
}
```

## Accessibility Implementation

### Required ARIA Labels

```html
<!-- Theme selector -->
<div role="group" aria-labelledby="theme-selector-label">
  <div id="theme-selector-label">Theme Selection</div>
  <button aria-expanded="false" aria-haspopup="listbox">Current Theme</button>
  <ul role="listbox" aria-labelledby="theme-selector-label">
    <li role="option" aria-selected="true">Theme Name</li>
  </ul>
</div>

<!-- Terminal interface -->
<main role="main" aria-label="Terminal Interface">
  <header role="banner" aria-label="Application Header">
    <pre aria-label="OBSIDIANIZE ASCII Logo">...</pre>
    <div aria-label="Application tagline">✨ Your Knowledge, Crystallized ✨</div>
  </header>
  
  <section role="log" aria-live="polite" aria-label="Processing Status">
    <!-- Status messages appear here -->
  </section>
  
  <div role="textbox" aria-label="Command Input">
    <span aria-label="Command prompt">obsidianize@web:~$</span>
    <input type="text" aria-describedby="command-help" />
  </div>
</main>
```

### Motion Preferences

```css
/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Disable theme-specific animations */
  .flicker,
  .breathing,
  .cursor-blink {
    animation: none !important;
  }
}

/* Enhanced animations for users who prefer motion */
@media (prefers-reduced-motion: no-preference) {
  .terminal {
    /* Enable smooth transitions */
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  .interactive {
    transition: all 0.2s ease;
  }
}
```

### High Contrast Preferences

```css
/* Respect system high contrast preferences */
@media (prefers-contrast: high) {
  :root:not([data-theme="high-contrast"]) {
    /* Automatically enhance contrast for all themes */
    --theme-text-primary: #ffffff;
    --theme-bg-primary: #000000;
    --theme-border: #ffffff;
  }
  
  /* Provide option to switch to high contrast theme */
  .theme-suggestion {
    display: block;
    background: var(--theme-warning);
    color: var(--theme-bg-primary);
    padding: 1rem;
    text-align: center;
  }
}

/* Hide suggestion when high contrast theme is active */
:root[data-theme="high-contrast"] .theme-suggestion {
  display: none;
}
```

## Testing Guide

### Visual Testing Checklist

#### For Each Theme:

1. **ASCII Art Rendering**
   - [ ] ASCII art displays correctly in all supported browsers
   - [ ] Box-drawing characters render properly
   - [ ] Centering and spacing are preserved
   - [ ] Color scheme is applied correctly

2. **Typography**
   - [ ] Font stack loads correctly with fallbacks
   - [ ] Text is readable at all zoom levels (100%, 150%, 200%)
   - [ ] Line heights provide comfortable reading
   - [ ] Font weights are appropriate for theme personality

3. **Color Contrast**
   - [ ] All text meets WCAG 2.1 AA standards (4.5:1 minimum)
   - [ ] High contrast theme meets AAA standards (7:1 minimum)
   - [ ] Status colors are distinguishable
   - [ ] Interactive elements have sufficient contrast

4. **Accessibility**
   - [ ] Keyboard navigation works throughout interface
   - [ ] Focus indicators are clearly visible
   - [ ] Screen reader announces theme changes
   - [ ] Color is not the only means of conveying information

5. **Theme Switching**
   - [ ] Themes switch instantly without page reload
   - [ ] User preference is preserved across sessions
   - [ ] System preferences are respected on first load
   - [ ] Theme selector is accessible via keyboard

### Automated Testing

```typescript
describe('Theme System', () => {
  test('should apply correct CSS variables for each theme', () => {
    const themes = ['purple-baseline', 'classic-green', 'modern-dark', 'high-contrast', 'warm-amber'];
    
    themes.forEach(theme => {
      document.documentElement.setAttribute('data-theme', theme);
      
      const styles = getComputedStyle(document.documentElement);
      const bgColor = styles.getPropertyValue('--theme-bg-primary');
      const textColor = styles.getPropertyValue('--theme-text-primary');
      
      expect(bgColor).toBeTruthy();
      expect(textColor).toBeTruthy();
      expect(bgColor).not.toBe(textColor); // Ensure contrast
    });
  });
  
  test('should persist theme selection', () => {
    themeManager.setTheme('classic-green');
    expect(localStorage.getItem('obsidianize-theme')).toBe('classic-green');
    
    // Simulate page reload
    const newManager = new ThemeManager();
    expect(newManager.getCurrentTheme()).toBe('classic-green');
  });
  
  test('should respect system preferences', () => {
    // Mock system preferences
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    localStorage.removeItem('obsidianize-theme'); // Clear saved preference
    const manager = new ThemeManager();
    expect(manager.getCurrentTheme()).toBe('high-contrast');
  });
});
```

### Contrast Testing

```typescript
function calculateContrastRatio(color1: string, color2: string): number {
  // Implementation would use actual color parsing and WCAG formula
  // This is a simplified version for demonstration
  
  const getLuminance = (color: string) => {
    // Convert hex to RGB and calculate relative luminance
    // WCAG 2.1 formula implementation
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('Contrast Compliance', () => {
  test('all themes meet WCAG AA standards', () => {
    const themes = themeManager.getAvailableThemes();
    
    themes.forEach(({ name }) => {
      document.documentElement.setAttribute('data-theme', name);
      const styles = getComputedStyle(document.documentElement);
      
      const bgColor = styles.getPropertyValue('--theme-bg-primary');
      const textColor = styles.getPropertyValue('--theme-text-primary');
      
      const ratio = calculateContrastRatio(bgColor, textColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG AA
      
      if (name === 'high-contrast') {
        expect(ratio).toBeGreaterThanOrEqual(7); // WCAG AAA
      }
    });
  });
});
```

## Build Integration

### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['postcss-preset-env', { stage: 1 }],
                  'autoprefixer',
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // CSS extraction and optimization
    new MiniCssExtractPlugin({
      filename: 'themes/[name].[contenthash].css',
    }),
  ],
};
```

### PostCSS Configuration

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    'postcss-preset-env',
    'autoprefixer',
    'postcss-custom-properties', // Fallback for older browsers
    'postcss-color-function', // Enhanced color manipulation
  ],
};
```

## Performance Considerations

### CSS Custom Property Fallbacks

```css
/* Provide fallbacks for older browsers */
.terminal {
  background-color: #0f0f23; /* Fallback */
  background-color: var(--theme-bg-primary);
  
  color: #e2e8f0; /* Fallback */
  color: var(--theme-text-primary);
}
```

### Theme Bundle Optimization

```css
/* Base theme variables (always loaded) */
:root {
  --theme-font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  --theme-border-radius: 4px;
  --theme-transition: 0.2s ease;
}

/* Theme-specific variables (loaded on demand) */
@import url('./themes/purple-baseline.css');
@import url('./themes/classic-green.css');
@import url('./themes/modern-dark.css');
@import url('./themes/high-contrast.css');
@import url('./themes/warm-amber.css');
```

## Browser Compatibility

### Supported Browsers
- **Chrome**: 49+ (CSS Custom Properties support)
- **Firefox**: 31+ 
- **Safari**: 9.1+
- **Edge**: 16+

### Polyfills
```html
<!-- For older browsers -->
<script src="https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2"></script>
<script>
  cssVars({
    // Polyfill options
    include: 'style,link[rel="stylesheet"]',
    onlyLegacy: true,
  });
</script>
```

---

**Last Updated**: October 11, 2024  
**Version**: 1.0  
**Status**: ✅ Implementation Ready - All Themes Documented