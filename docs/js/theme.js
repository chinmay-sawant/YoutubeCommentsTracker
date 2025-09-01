// Theme management functionality
class ThemeManager {
    constructor() {
        // Check localStorage first, default to dark mode
        const saved = localStorage.getItem('theme-preference');
        this.isDarkMode = saved ? saved === 'dark' : true;
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.isDarkMode);
        
        // Bind theme toggle button
        this.bindThemeToggle();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme-preference')) {
                    this.setTheme(e.matches);
                }
            });
        }
    }

    bindThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        
        // Update initial icon
        this.updateToggleIcon(toggle);
        
        toggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add keyboard support
        toggle.setAttribute('tabindex', '0');
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    updateToggleIcon(toggle) {
        const icon = toggle.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = this.isDarkMode ? '☀️' : '🌙';
        }
        toggle.setAttribute('title', this.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }

    setTheme(isDark) {
        this.isDarkMode = isDark;
        
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Update toggle button icon
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            this.updateToggleIcon(toggle);
        }

        // Store preference
        localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
    }

    toggleTheme() {
        this.setTheme(!this.isDarkMode);
        
        // Add visual feedback
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                toggle.style.transform = 'scale(1)';
            }, 100);
        }
    }

    getTheme() {
        return this.isDarkMode ? 'dark' : 'light';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} else {
    window.ThemeManager = ThemeManager;
}
