// YouTube Comment Tracker - Showcase Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initCarousel();
    initSmoothScroll();
    initAnimations();
    initInteractiveElements();
});

// Navigation functionality
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Carousel functionality
function initCarousel() {
    const slides = document.getElementById('carousel-slides');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (!slides || !indicators.length) return;
    
    let currentSlide = 0;
    const totalSlides = indicators.length;
    let autoPlay = true;
    let autoPlayInterval;
    
    // Update carousel position
    function updateCarousel() {
        const translateX = -currentSlide * 100;
        slides.style.transform = `translateX(${translateX}%)`;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
        
        // Update slide active state for animations
        const allSlides = slides.querySelectorAll('.carousel-slide');
        allSlides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
    }
    
    // Go to specific slide
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateCarousel();
    }
    
    // Next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }
    
    // Previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }
    
    // Event listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            resetAutoPlay();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            resetAutoPlay();
        });
    }
    
    // Indicator clicks
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function() {
            goToSlide(index);
            resetAutoPlay();
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            resetAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            resetAutoPlay();
        }
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    slides.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    slides.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            resetAutoPlay();
        }
    }
    
    // Auto-play functionality
    function startAutoPlay() {
        if (autoPlay) {
            autoPlayInterval = setInterval(nextSlide, 5000);
        }
    }
    
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        setTimeout(startAutoPlay, 3000); // Resume after 3 seconds
    }
    
    // Pause auto-play on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', function() {
            clearInterval(autoPlayInterval);
        });
        
        carouselContainer.addEventListener('mouseleave', function() {
            if (autoPlay) {
                startAutoPlay();
            }
        });
    }
    
    // Start auto-play
    startAutoPlay();
    
    // Initialize first slide
    updateCarousel();
}

// Smooth scroll functionality
function initSmoothScroll() {
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Animation on scroll
function initAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.install-step, .support-card, .demo-feature, .feature-content, .feature-visual'
    );
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
    
    // Counter animation for hero stats
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = counter.textContent;
            const isNumber = !isNaN(target);
            
            if (isNumber) {
                const targetNumber = parseInt(target);
                let current = 0;
                const increment = targetNumber / 20;
                
                const updateCounter = () => {
                    if (current < targetNumber) {
                        current += increment;
                        counter.textContent = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
            }
        });
    }
    
    // Trigger counter animation when hero section is visible
    const heroSection = document.getElementById('hero');
    if (heroSection) {
        const heroObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(animateCounters, 1000);
                    heroObserver.unobserve(entry.target);
                }
            });
        });
        
        heroObserver.observe(heroSection);
    }
}

// Interactive elements
function initInteractiveElements() {
    // Demo video placeholder interaction
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function() {
            // Simulate video play
            this.innerHTML = `
                <div class="play-icon" style="color: #4d96ff;">⏸</div>
                <p style="color: #4d96ff;">Demo Playing...</p>
                <small>This would show the actual demo video</small>
            `;
            
            // Reset after 3 seconds
            setTimeout(() => {
                this.innerHTML = `
                    <div class="play-icon">▶</div>
                    <p>Interactive Demo Video</p>
                    <small>Click to see the extension in action</small>
                `;
            }, 3000);
        });
    }
    
    // Browser mockup interaction
    const browserMockup = document.querySelector('.browser-mockup');
    if (browserMockup) {
        browserMockup.addEventListener('mouseenter', function() {
            const toast = this.querySelector('.toast-notification');
            if (toast) {
                toast.style.animation = 'slideIn 0.3s ease';
            }
        });
    }
    
    // Theme preview interactions
    const themePreview = document.querySelectorAll('.theme-preview');
    themePreview.forEach(theme => {
        theme.addEventListener('click', function() {
            // Remove active class from all themes
            themePreview.forEach(t => t.classList.remove('active-theme'));
            // Add active class to clicked theme
            this.classList.add('active-theme');
            
            // Show theme selection feedback
            const toastMini = this.querySelector('.toast-mini');
            if (toastMini) {
                const originalText = toastMini.textContent;
                toastMini.textContent = 'Selected!';
                toastMini.style.background = '#4d96ff';
                
                setTimeout(() => {
                    toastMini.textContent = originalText;
                    toastMini.style.background = 'rgba(0, 0, 0, 0.8)';
                }, 1000);
            }
        });
    });
    
    // Mode option interactions
    const modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(mode => {
        mode.addEventListener('click', function() {
            // Remove active class from all modes
            modeOptions.forEach(m => m.classList.remove('active-mode'));
            // Add active class to clicked mode
            this.classList.add('active-mode');
        });
    });
    
    // Demo comment interactions
    const demoComments = document.querySelectorAll('.demo-comment');
    demoComments.forEach(comment => {
        comment.addEventListener('click', function() {
            // Highlight the clicked comment
            this.style.background = 'rgba(255, 255, 255, 0.2)';
            this.style.transform = 'scale(1.02)';
            
            // Reset after animation
            setTimeout(() => {
                this.style.background = 'rgba(255, 255, 255, 0.1)';
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // Timestamp click simulation
    const timestamps = document.querySelectorAll('.demo-timestamp, .timestamp');
    timestamps.forEach(timestamp => {
        timestamp.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Simulate seeking animation
            this.style.background = '#4d96ff';
            this.style.color = 'white';
            this.style.padding = '2px 6px';
            this.style.borderRadius = '4px';
            
            // Show seeking feedback
            const originalText = this.textContent;
            this.textContent = 'Seeking...';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = 'transparent';
                this.style.color = '#4d96ff';
                this.style.padding = '0';
            }, 1000);
        });
    });
    
    // Install step interactions
    const installSteps = document.querySelectorAll('.install-step');
    installSteps.forEach((step, index) => {
        step.addEventListener('click', function() {
            // Add completion effect
            const stepNumber = this.querySelector('.step-number');
            stepNumber.innerHTML = '✓';
            stepNumber.style.background = '#6bcf7f';
            
            // Reset after 2 seconds
            setTimeout(() => {
                stepNumber.innerHTML = index + 1;
                stepNumber.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }, 2000);
        });
    });
    
    // Floating elements animation
    createFloatingElements();
}

// Create floating background elements
function createFloatingElements() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const colors = ['#667eea', '#764ba2', '#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff'];
    
    for (let i = 0; i < 6; i++) {
        const float = document.createElement('div');
        float.style.position = 'absolute';
        float.style.width = Math.random() * 100 + 50 + 'px';
        float.style.height = float.style.width;
        float.style.background = colors[i] + '20';
        float.style.borderRadius = '50%';
        float.style.left = Math.random() * 100 + '%';
        float.style.top = Math.random() * 100 + '%';
        float.style.zIndex = '1';
        float.style.animation = `float ${Math.random() * 10 + 10}s infinite ease-in-out`;
        
        hero.appendChild(float);
    }
}

// Utility functions
function debounce(func, wait) {
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

// Performance optimization
const handleScroll = debounce(function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero::before');
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
}, 10);

window.addEventListener('scroll', handleScroll);

// Error handling
window.addEventListener('error', function(e) {
    console.warn('Non-critical error caught:', e.error);
    // Don't let minor errors break the experience
});

// Preload critical assets
function preloadAssets() {
    const criticalImages = [
        // Add any critical image URLs here
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Initialize preloading
preloadAssets();

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavigation,
        initCarousel,
        initSmoothScroll,
        initAnimations,
        initInteractiveElements
    };
}
