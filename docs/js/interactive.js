// Interactive elements and demo functionality
class InteractiveElements {
    constructor() {
        this.init();
    }

    init() {
        this.initDemoVideo();
        this.initBrowserMockup();
        this.initThemePreview();
        this.initModeOptions();
        this.initDemoComments();
        this.initTimestampClicks();
        this.initInstallSteps();
        this.initSupportLinks();
        this.preloadAssets();
    }

    initDemoVideo() {
        const videoPlaceholder = document.querySelector('.video-placeholder');
        if (!videoPlaceholder) return;
        
        videoPlaceholder.addEventListener('click', () => {
            // Simulate video play with enhanced demo
            this.simulateVideoDemo(videoPlaceholder);
        });
    }

    simulateVideoDemo(placeholder) {
        const originalContent = placeholder.innerHTML;
        
        // Show playing state
        placeholder.innerHTML = `
            <div class="play-icon" style="color: #4d96ff;">⏸</div>
            <p style="color: #4d96ff;">Demo Playing...</p>
            <small>Showing toast notifications in action</small>
        `;
        
        // Simulate toast notifications
        this.showDemoToasts();
        
        // Reset after demo
        setTimeout(() => {
            placeholder.innerHTML = originalContent;
        }, 5000);
    }

    showDemoToasts() {
        const browserMockup = document.querySelector('.browser-mockup');
        if (!browserMockup) return;
        
        const demoToasts = [
            { time: '0:30', author: 'TechGuru', text: 'Great explanation here!' },
            { time: '1:15', author: 'CodeMaster', text: 'This solved my problem!' },
            { time: '2:45', author: 'DevFan', text: 'Thanks for the tutorial!' }
        ];
        
        demoToasts.forEach((toast, index) => {
            setTimeout(() => {
                this.createDemoToast(browserMockup, toast);
            }, (index + 1) * 1500);
        });
    }

    createDemoToast(container, toastData) {
        const existingToast = container.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-timestamp">${toastData.time}</span>
                <span class="toast-likes">❤ ${Math.floor(Math.random() * 50) + 10}</span>
            </div>
            <div class="toast-author">${toastData.author}</div>
            <div class="toast-content">${toastData.text}</div>
        `;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    initBrowserMockup() {
        const browserMockup = document.querySelector('.browser-mockup');
        if (!browserMockup) return;
        
        browserMockup.addEventListener('mouseenter', () => {
            const toast = browserMockup.querySelector('.toast-notification');
            if (toast && window.Animations) {
                const animations = new window.Animations();
                animations.animateToast(toast);
            }
        });
    }

    initThemePreview() {
        const themePreview = document.querySelectorAll('.theme-preview');
        
        themePreview.forEach(theme => {
            theme.addEventListener('click', () => {
                // Remove active class from all themes
                themePreview.forEach(t => t.classList.remove('active-theme'));
                // Add active class to clicked theme
                theme.classList.add('active-theme');
                
                // Show theme selection feedback
                this.showThemeSelectionFeedback(theme);
            });
        });
    }

    showThemeSelectionFeedback(theme) {
        const toastMini = theme.querySelector('.toast-mini');
        if (!toastMini) return;
        
        const originalText = toastMini.textContent;
        toastMini.textContent = 'Selected!';
        toastMini.style.background = '#4d96ff';
        
        setTimeout(() => {
            toastMini.textContent = originalText;
            toastMini.style.background = 'rgba(0, 0, 0, 0.8)';
        }, 1000);
    }

    initModeOptions() {
        const modeOptions = document.querySelectorAll('.mode-option');
        
        modeOptions.forEach(mode => {
            mode.addEventListener('click', () => {
                // Remove active class from all modes
                modeOptions.forEach(m => m.classList.remove('active-mode'));
                // Add active class to clicked mode
                mode.classList.add('active-mode');
                
                // Add visual feedback
                this.addClickFeedback(mode);
            });
        });
    }

    initDemoComments() {
        const demoComments = document.querySelectorAll('.demo-comment');
        
        demoComments.forEach(comment => {
            comment.addEventListener('click', () => {
                this.highlightComment(comment);
            });
        });
    }

    highlightComment(comment) {
        // Highlight the clicked comment
        comment.style.background = 'rgba(255, 255, 255, 0.2)';
        comment.style.transform = 'scale(1.02)';
        
        // Reset after animation
        setTimeout(() => {
            comment.style.background = 'rgba(255, 255, 255, 0.1)';
            comment.style.transform = 'scale(1)';
        }, 200);
    }

    initTimestampClicks() {
        const timestamps = document.querySelectorAll('.demo-timestamp, .timestamp');
        
        timestamps.forEach(timestamp => {
            timestamp.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulateTimestampSeek(timestamp);
            });
        });
    }

    simulateTimestampSeek(timestamp) {
        // Simulate seeking animation
        const originalText = timestamp.textContent;
        const originalStyles = {
            background: timestamp.style.background,
            color: timestamp.style.color,
            padding: timestamp.style.padding,
            borderRadius: timestamp.style.borderRadius
        };
        
        // Apply seeking styles
        timestamp.style.background = '#4d96ff';
        timestamp.style.color = 'white';
        timestamp.style.padding = '2px 6px';
        timestamp.style.borderRadius = '4px';
        timestamp.textContent = 'Seeking...';
        
        // Reset after animation
        setTimeout(() => {
            timestamp.textContent = originalText;
            Object.assign(timestamp.style, originalStyles);
        }, 1000);
    }

    initInstallSteps() {
        const installSteps = document.querySelectorAll('.install-step');
        
        installSteps.forEach((step, index) => {
            step.addEventListener('click', () => {
                this.animateStepCompletion(step, index);
            });
        });
    }

    animateStepCompletion(step, index) {
        const stepNumber = step.querySelector('.step-number');
        if (!stepNumber) return;
        
        const originalContent = stepNumber.innerHTML;
        const originalBackground = stepNumber.style.background;
        
        // Show completion
        stepNumber.innerHTML = '✓';
        stepNumber.style.background = '#6bcf7f';
        
        // Reset after delay
        setTimeout(() => {
            stepNumber.innerHTML = index + 1;
            stepNumber.style.background = originalBackground || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 2000);
    }

    initSupportLinks() {
        // Documentation link
        const docLinks = document.querySelectorAll('a[href="#"], .support-link');
        docLinks.forEach(link => {
            const text = link.textContent.toLowerCase();
            
            if (text.includes('doc') || text.includes('read docs')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer/blob/main/README.md';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else if (text.includes('bug') || text.includes('report bug')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer/issues';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else if (text.includes('feature') || text.includes('suggest feature')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer/issues/new?template=feature_request.md';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else if (text.includes('community') || text.includes('join community')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
        });

        // Footer links
        const footerLinks = document.querySelectorAll('.footer-section a');
        footerLinks.forEach(link => {
            const text = link.textContent.toLowerCase();
            
            if (text.includes('documentation')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer/blob/main/README.md';
                link.target = '_blank';
            } else if (text.includes('bug reports')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer/issues';
                link.target = '_blank';
            } else if (text.includes('github')) {
                link.href = 'https://github.com/chinmay-sawant/YoutubeCommentsViewer';
                link.target = '_blank';
            }
        });
    }

    addClickFeedback(element) {
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 100);
    }

    preloadAssets() {
        // Preload logo image
        const logoImg = new Image();
        logoImg.src = 'assets/logo.png';
        
        // Preload any other critical assets
        const criticalImages = [
            'assets/logo.png'
        ];
        
        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveElements;
} else {
    window.InteractiveElements = InteractiveElements;
}
