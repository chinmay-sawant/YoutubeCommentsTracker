// Animation and scroll effects
class Animations {
    constructor() {
        this.init();
    }

    init() {
        this.initScrollAnimations();
        this.initCounterAnimations();
        this.createFloatingElements();
        this.initParallaxEffects();
    }

    initScrollAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
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
    }

    initCounterAnimations() {
        // Counter animation for hero stats
        const animateCounters = () => {
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
        };
        
        // Trigger counter animation when hero section is visible
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            const heroObserver = new IntersectionObserver((entries) => {
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

    createFloatingElements() {
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
            float.style.pointerEvents = 'none'; // Don't interfere with clicks
            
            hero.appendChild(float);
        }
    }

    initParallaxEffects() {
        // Debounced scroll handler for performance
        const handleScroll = this.debounce(() => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero::before');
            
            parallaxElements.forEach(element => {
                if (element) {
                    element.style.transform = `translateY(${scrolled * 0.5}px)`;
                }
            });
        }, 10);

        window.addEventListener('scroll', handleScroll);
    }

    // Toast animation for demo
    animateToast(toastElement) {
        if (!toastElement) return;
        
        // Show toast
        toastElement.classList.remove('hide');
        toastElement.classList.add('show');
        
        // Hide after delay
        setTimeout(() => {
            toastElement.classList.remove('show');
            toastElement.classList.add('hide');
        }, 3000);
    }

    // Utility function for debouncing
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

    // Animate element with custom animation
    animateElement(element, animation = 'fadeInUp', duration = 600) {
        if (!element) return;
        
        element.style.animation = `${animation} ${duration}ms ease forwards`;
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    // Stagger animations for multiple elements
    staggerAnimations(elements, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.animateElement(element);
            }, index * delay);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Animations;
} else {
    window.Animations = Animations;
}
