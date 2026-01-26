// Preloader & Skeleton Handling
window.addEventListener('load', () => {
    // This runs when EVERYTHING (images, scripts) is loaded
    // We can use this as a fallback if skeleton loading is too fast
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

    if (hamburger && mobileMenuOverlay && closeMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        closeMenu.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close menu when a link is clicked
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Journey Slider Logic
    const sliderContainer = document.querySelector('.slider-container');
    const sliderTrack = document.querySelector('.slider-track');
    const originalSlides = document.querySelectorAll('.journey-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (sliderTrack && originalSlides.length > 0) {
        const slidesCount = originalSlides.length;
        const cloneCount = 2; // Clone 2 items at start and end
        
        // Clone for infinite loop
        // Prepend clones
        for (let i = slidesCount - cloneCount; i < slidesCount; i++) {
            const clone = originalSlides[i].cloneNode(true);
            clone.classList.add('clone');
            sliderTrack.insertBefore(clone, sliderTrack.firstChild);
        }
        
        // Append clones
        for (let i = 0; i < cloneCount; i++) {
            const clone = originalSlides[i].cloneNode(true);
            clone.classList.add('clone');
            sliderTrack.appendChild(clone);
        }

        const allSlides = document.querySelectorAll('.journey-card'); // Includes clones
        let currentIndex = cloneCount; // Start at first real slide
        let isTransitioning = false;
        let autoPlayInterval;

        // Create Dots
        originalSlides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                if (isTransitioning) return;
                currentIndex = index + cloneCount;
                updateSlider(true);
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        });

        const updateDots = () => {
            const dots = document.querySelectorAll('.dot');
            dots.forEach(d => d.classList.remove('active'));
            
            let realIndex = currentIndex - cloneCount;
            // Handle boundary cases for dots
            if (realIndex < 0) realIndex = slidesCount - 1;
            if (realIndex >= slidesCount) realIndex = 0;
            
            if (dots[realIndex]) dots[realIndex].classList.add('active');
        };

        const getSlideWidth = () => {
            const gap = parseInt(window.getComputedStyle(sliderTrack).gap) || 30;
            return allSlides[0].offsetWidth + gap;
        };

        const updateSlider = (smooth = true) => {
            const totalItemWidth = getSlideWidth();
            if (smooth) {
                sliderTrack.style.transition = 'transform 0.5s ease-out';
                isTransitioning = true;
            } else {
                sliderTrack.style.transition = 'none';
                isTransitioning = false;
            }

            let offset = 0;
            // Center active slide on mobile/tablet
            if (window.innerWidth <= 1024) {
                const cardWidth = allSlides[0].offsetWidth;
                const wrapperWidth = sliderTrack.parentElement.offsetWidth;
                // padding-left of slider-wrapper is 10px
                offset = (wrapperWidth - cardWidth) / 2 - 10;
            }

            sliderTrack.style.transform = `translateX(${-(currentIndex * totalItemWidth) + offset}px)`;
            updateDots();
        };

        // Initial Position (Instant)
        updateSlider(false);

        // Next Slide
        const nextSlide = () => {
            if (isTransitioning) return;
            currentIndex++;
            updateSlider(true);
        };

        // Prev Slide
        const prevSlide = () => {
            if (isTransitioning) return;
            currentIndex--;
            updateSlider(true);
        };

        // Transition End Reset
        sliderTrack.addEventListener('transitionend', () => {
            isTransitioning = false;
            
            // Check boundaries
            if (currentIndex >= slidesCount + cloneCount) {
                // We are at the appended clones, jump to start
                currentIndex = cloneCount;
                updateSlider(false);
            } else if (currentIndex < cloneCount) {
                // We are at the prepended clones, jump to end
                currentIndex = slidesCount + cloneCount - 1;
                updateSlider(false);
            }
        });

        // Auto Play
        const startAutoPlay = () => {
            stopAutoPlay();
            autoPlayInterval = setInterval(nextSlide, 3000);
        };

        const stopAutoPlay = () => {
            clearInterval(autoPlayInterval);
        };

        const resetAutoPlay = () => {
            stopAutoPlay();
            startAutoPlay();
        };

        // Event Listeners
        if (nextBtn) nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoPlay();
        });

        if (prevBtn) prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoPlay();
        });

        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopAutoPlay);
            sliderContainer.addEventListener('mouseleave', startAutoPlay);
        }

        window.addEventListener('resize', () => {
            // Recalculate position without animation
            updateSlider(false);
        });

        startAutoPlay();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.querySelector('.preloader');
    
    // 1. Handle Preloader
    if (preloader) {
        // Show preloader for at least 1.5 seconds for branding, then fade out
        // This allows the user to see the logo before seeing the skeletons
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1500);
    }

    // 2. Handle Skeleton Loading for Images
    const skeletonImages = document.querySelectorAll('.skeleton-image img');
    
    skeletonImages.forEach(img => {
        // If image is already loaded (cached)
        if (img.complete) {
            img.parentElement.classList.add('loaded');
        } else {
            // Wait for load
            img.onload = () => {
                img.parentElement.classList.add('loaded');
            };
            img.onerror = () => {
                // Even if error, remove skeleton so we don't have infinite load
                img.parentElement.classList.add('loaded');
            };
        }
    });

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3D Tilt Effect for Cards
    const tiltElements = document.querySelectorAll('.service-item, .quote-card, .mv-card');
    
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate rotation based on cursor position relative to center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            el.style.transition = 'transform 0.1s ease';
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            el.style.transition = 'transform 0.5s ease';
        });
    });

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // Filter Buttons Interaction
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Simple Form Submission Alert (for demo)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = 'Sending...';
            btn.style.opacity = '0.7';
            
            setTimeout(() => {
                alert('Thank you! Your request has been received. We will contact you shortly.');
                btn.innerText = originalText;
                btn.style.opacity = '1';
                form.reset();
            }, 1500);
        });
    });

    // Enhanced Intersection Observer for Scroll Reveals
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with reveal classes
    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-fade, .reveal-scale, .reveal-pop, .reveal-slide-left, .reveal-slide-right');
    revealElements.forEach(el => observer.observe(el));

    // Parallax Effect
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    
    if (parallaxElements.length > 0) {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.pageYOffset;
                    
                    parallaxElements.forEach(el => {
                        const container = el.parentElement;
                        const containerTop = container.offsetTop;
                        const containerHeight = container.offsetHeight;
                        const viewportHeight = window.innerHeight;
                        
                        // Only animate if the container is in the viewport
                        if (scrollY + viewportHeight > containerTop && scrollY < containerTop + containerHeight) {
                            // Calculate relative scroll position
                            // 0.4 speed factor means the background moves at 40% of scroll speed
                            const speed = 0.4;
                            const yPos = (scrollY - containerTop) * speed;
                            el.style.transform = `translateY(${yPos}px)`;
                        }
                    });
                    
                    ticking = false;
                });
                
                ticking = true;
            }
        });
    }
});
