// Theme Switcher for Obsidianize TUI Mockups
class ThemeSwitcher {
    constructor() {
        this.themes = [
            {
                name: 'purple-baseline',
                displayName: 'Mystic Terminal',
                codename: 'Purple Baseline',
                description: 'Sophisticated purple theme with modern aesthetics',
                file: 'purple-baseline.html'
            },
            {
                name: 'classic-green',
                displayName: 'Retro Matrix',
                codename: 'Classic Green Terminal',
                description: 'Classic green-on-black terminal experience',
                file: 'classic-green.html'
            },
            {
                name: 'modern-dark',
                displayName: 'Digital Ocean',
                codename: 'Modern Dark',
                description: 'Contemporary blue theme inspired by modern IDEs',
                file: 'modern-dark.html'
            },
            {
                name: 'high-contrast',
                displayName: 'Crystal Clear',
                codename: 'High Contrast',
                description: 'Maximum accessibility with ultra-high contrast',
                file: 'high-contrast.html'
            },
            {
                name: 'warm-amber',
                displayName: 'Golden Hour',
                codename: 'Warm Terminal',
                description: 'Cozy amber theme perfect for evening sessions',
                file: 'warm-amber.html'
            }
        ];
        
        this.currentTheme = 'purple-baseline';
        this.init();
    }
    
    init() {
        this.createThemeSwitcher();
        this.loadSavedTheme();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
    }
    
    createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-switcher__toggle" aria-expanded="false" aria-haspopup="listbox">
                <span class="theme-icon">🎨</span>
                <span class="theme-name">${this.getCurrentTheme().displayName}</span>
                <span class="theme-arrow">▼</span>
            </button>
            <div class="theme-switcher__dropdown" role="listbox" aria-label="Theme Selection">
                ${this.themes.map(theme => `
                    <button 
                        class="theme-option ${theme.name === this.currentTheme ? 'theme-option--active' : ''}"
                        data-theme="${theme.name}"
                        role="option"
                        aria-selected="${theme.name === this.currentTheme}"
                    >
                        <div class="theme-option__header">
                            <span class="theme-option__name">${theme.displayName}</span>
                            <span class="theme-option__codename">${theme.codename}</span>
                        </div>
                        <div class="theme-option__description">${theme.description}</div>
                        <div class="theme-option__colors">
                            <div class="color-preview color-preview--bg"></div>
                            <div class="color-preview color-preview--text"></div>
                            <div class="color-preview color-preview--accent"></div>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(switcher);
    }
    
    setupEventListeners() {
        const toggle = document.querySelector('.theme-switcher__toggle');
        const dropdown = document.querySelector('.theme-switcher__dropdown');
        const options = document.querySelectorAll('.theme-option');
        
        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isOpen);
            dropdown.classList.toggle('theme-switcher__dropdown--open');
            
            if (!isOpen) {
                // Focus first option when opening
                options[0].focus();
            }
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.switchTheme(theme);
                this.closeDropdown();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.theme-switcher')) {
                this.closeDropdown();
            }
        });
        
        // Close dropdown on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
                toggle.focus();
            }
        });
    }
    
    setupKeyboardNavigation() {
        const dropdown = document.querySelector('.theme-switcher__dropdown');
        
        dropdown.addEventListener('keydown', (e) => {
            const options = [...dropdown.querySelectorAll('.theme-option')];
            const currentIndex = options.indexOf(e.target);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % options.length;
                    options[nextIndex].focus();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + options.length) % options.length;
                    options[prevIndex].focus();
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    e.target.click();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    options[0].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    options[options.length - 1].focus();
                    break;
            }
        });
    }
    
    switchTheme(themeName) {
        this.currentTheme = themeName;
        
        // Update data attribute
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Update active state
        document.querySelectorAll('.theme-option').forEach(option => {
            const isActive = option.dataset.theme === themeName;
            option.classList.toggle('theme-option--active', isActive);
            option.setAttribute('aria-selected', isActive);
        });
        
        // Update toggle text
        const currentTheme = this.getCurrentTheme();
        document.querySelector('.theme-name').textContent = currentTheme.displayName;
        
        // Save preference
        localStorage.setItem('obsidianize-theme-mockup', themeName);
        
        // Announce change to screen readers
        this.announceThemeChange(currentTheme);
        
        // Emit custom event
        document.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: themeName, themeData: currentTheme }
        }));
    }
    
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('obsidianize-theme-mockup');
        if (savedTheme && this.themes.find(t => t.name === savedTheme)) {
            this.switchTheme(savedTheme);
        }
    }
    
    getCurrentTheme() {
        return this.themes.find(t => t.name === this.currentTheme) || this.themes[0];
    }
    
    closeDropdown() {
        const toggle = document.querySelector('.theme-switcher__toggle');
        const dropdown = document.querySelector('.theme-switcher__dropdown');
        
        toggle.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove('theme-switcher__dropdown--open');
    }
    
    announceThemeChange(theme) {
        // Create or update announcement for screen readers
        let announcer = document.getElementById('theme-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'theme-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.overflow = 'hidden';
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = `Theme switched to ${theme.displayName}. ${theme.description}`;
    }
}

// Initialize theme switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});

// Add theme navigation shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + T to open theme switcher
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        const toggle = document.querySelector('.theme-switcher__toggle');
        if (toggle) {
            toggle.click();
        }
    }
});