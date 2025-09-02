// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    const app = new App();
});

class App {
    constructor() {
        this.themeManager = null;
        this.navigation = null;
        this.carousel = null;
        this.animations = null;
        this.interactive = null;
        
        this.init();
    }

    init() {
        try {
            // Initialize theme manager first (affects all other components)
            this.themeManager = new ThemeManager();
            
            // Initialize navigation
            this.navigation = new Navigation();
            
            // Initialize carousel
            this.carousel = new Carousel();
            
            // Initialize animations
            this.animations = new Animations();
            
            // Initialize interactive elements
            this.interactive = new InteractiveElements();
            
            // Bind global events
            this.bindGlobalEvents();
            
            console.log('YouTube Comment Viewer website initialized successfully');
        } catch (error) {
            console.warn('Non-critical initialization error:', error);
            // Continue execution - don't let minor errors break the site
        }
    }

    bindGlobalEvents() {
        // Handle errors gracefully
        window.addEventListener('error', (e) => {
            console.warn('Non-critical error caught:', e.error);
            // Don't let minor errors break the experience
        });

        // Handle theme changes
        document.addEventListener('themeChanged', (e) => {
            if (this.navigation) {
                this.navigation.updateTheme(e.detail.isDarkMode);
            }
        });

        // Performance optimization for scroll
        let ticking = false;
        const optimizedScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Trigger any scroll-dependent updates
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizedScroll, { passive: true });

        // Handle resize events
        const handleResize = this.debounce(() => {
            // Handle responsive updates
            this.handleResize();
        }, 250);

        window.addEventListener('resize', handleResize);

        // Handle visibility change (for performance)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause animations when tab is not visible
                if (this.carousel) {
                    this.carousel.setAutoPlay(false);
                }
            } else {
                // Resume animations when tab becomes visible
                if (this.carousel) {
                    this.carousel.setAutoPlay(true);
                }
            }
        });
    }

    handleResize() {
        // Handle responsive updates
        if (window.innerWidth <= 768) {
            // Mobile-specific adjustments
            this.optimizeForMobile();
        } else {
            // Desktop-specific adjustments
            this.optimizeForDesktop();
        }
    }

    optimizeForMobile() {
        // Reduce animations for better mobile performance
        const animatedElements = document.querySelectorAll('[style*="animation"]');
        animatedElements.forEach(el => {
            if (el.style.animationDuration) {
                el.style.animationDuration = '0.3s';
            }
        });
    }

    optimizeForDesktop() {
        // Restore full animations for desktop
        const animatedElements = document.querySelectorAll('[style*="animation"]');
        animatedElements.forEach(el => {
            if (el.style.animationDuration) {
                el.style.animationDuration = '';
            }
        });
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public API methods
    getTheme() {
        return this.themeManager ? this.themeManager.getTheme() : 'dark';
    }

    setTheme(theme) {
        if (this.themeManager) {
            this.themeManager.setTheme(theme === 'dark');
        }
    }

    getCurrentSlide() {
        return this.carousel ? this.carousel.getCurrentSlide() : 0;
    }

    goToSlide(index) {
        if (this.carousel) {
            this.carousel.goToSlide(index);
        }
    }
}

// Global error handling
window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled promise rejection:', event.reason);
    // Don't prevent default - let it fail gracefully
});

// Export App class for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.App = App;
}
