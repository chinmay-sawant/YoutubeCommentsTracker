// Carousel functionality
class Carousel {
    constructor() {
        this.slides = document.getElementById('carousel-slides');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.currentSlide = 0;
        this.totalSlides = this.indicators.length;
        this.autoPlay = true;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000;
        
        if (this.slides && this.indicators.length) {
            this.init();
        }
    }

    init() {
        this.bindEvents();
        this.startAutoPlay();
        this.updateCarousel();
    }

    bindEvents() {
        // Button controls
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.nextSlide();
                this.resetAutoPlay();
            });
        }
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.prevSlide();
                this.resetAutoPlay();
            });
        }
        
        // Indicator clicks
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
                this.resetAutoPlay();
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
                this.resetAutoPlay();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
                this.resetAutoPlay();
            }
        });
        
        // Touch/swipe support
        this.initTouchSupport();
        
        // Pause auto-play on hover
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', () => {
                this.pauseAutoPlay();
            });
            
            carouselContainer.addEventListener('mouseleave', () => {
                if (this.autoPlay) {
                    this.startAutoPlay();
                }
            });
        }
    }

    updateCarousel() {
        if (!this.slides) return;
        
        const translateX = -this.currentSlide * 100;
        this.slides.style.transform = `translateX(${translateX}%)`;
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
        
        // Update slide active state for animations
        const allSlides = this.slides.querySelectorAll('.carousel-slide');
        allSlides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
    }

    goToSlide(slideIndex) {
        this.currentSlide = slideIndex;
        this.updateCarousel();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateCarousel();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateCarousel();
    }

    initTouchSupport() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.slides.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        this.slides.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
            this.resetAutoPlay();
        }
    }

    startAutoPlay() {
        if (this.autoPlay && !this.autoPlayInterval) {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, this.autoPlayDelay);
        }
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        this.pauseAutoPlay();
        // Resume after 3 seconds
        setTimeout(() => {
            this.startAutoPlay();
        }, 3000);
    }

    // Public methods for external control
    setAutoPlay(enabled) {
        this.autoPlay = enabled;
        if (enabled) {
            this.startAutoPlay();
        } else {
            this.pauseAutoPlay();
        }
    }

    getCurrentSlide() {
        return this.currentSlide;
    }

    getTotalSlides() {
        return this.totalSlides;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Carousel;
} else {
    window.Carousel = Carousel;
}
