// Preloader & Skeleton Handling
window.addEventListener('load', () => {
    // This runs when EVERYTHING (images, scripts) is loaded
    // We can use this as a fallback if skeleton loading is too fast
    // Mobile Menu logic moved to DOMContentLoaded for faster interaction

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

        // Create Dots (pointer-friendly, larger hit area)
        const supportPointer = 'PointerEvent' in window;
        originalSlides.forEach((_, index) => {
            const hit = document.createElement('button');
            hit.classList.add('dot-hit');
            hit.type = 'button';
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            hit.appendChild(dot);
            const activateDot = (e) => {
                if (!e) return;
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
                if (typeof e.preventDefault === 'function') e.preventDefault();
                if (isTransitioning) return;
                currentIndex = index + cloneCount;
                updateSlider(true);
                resetAutoPlay();
            };
            if (supportPointer) {
                hit.addEventListener('pointerup', activateDot);
            } else {
                hit.addEventListener('click', activateDot);
            }
            dotsContainer.appendChild(hit);
        });

        const updateDots = () => {
            const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
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

        let unlockTimer;
        const updateSlider = (smooth = true) => {
            const totalItemWidth = getSlideWidth();
            if (smooth) {
                sliderTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
                isTransitioning = true;
                if (unlockTimer) clearTimeout(unlockTimer);
                unlockTimer = setTimeout(() => { isTransitioning = false; }, 550);
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
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
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

        // Touch Swipe (Mobile/Tablet)
        let startX = 0;
        let dragging = false;
        let dragDelta = 0;
        const onStart = (x) => {
            dragging = true;
            startX = x;
            sliderTrack.style.transition = 'none';
            stopAutoPlay();
        };
        let rafPending = false;
        let lastX = 0;
        let dragStep = 0;
        const onMove = (x) => {
            if (!dragging) return;
            lastX = x;
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                const totalItemWidth = dragStep || getSlideWidth();
                let offset = 0;
                if (window.innerWidth <= 1024) {
                    const cardWidth = allSlides[0].offsetWidth;
                    const wrapperWidth = sliderTrack.parentElement.offsetWidth;
                    offset = (wrapperWidth - cardWidth) / 2 - 10;
                }
                dragDelta = lastX - startX;
                sliderTrack.style.transform = `translateX(${-(currentIndex * totalItemWidth) + offset + dragDelta}px)`;
                rafPending = false;
            });
        };
        const onEnd = () => {
            if (!dragging) return;
            dragging = false;
            const totalItemWidth = dragStep || getSlideWidth();
            const threshold = Math.max(50, totalItemWidth * 0.15);
            if (dragDelta > threshold) {
                prevSlide();
            } else if (dragDelta < -threshold) {
                nextSlide();
            } else {
                updateSlider(true);
            }
            dragDelta = 0;
            dragStep = 0;
            startAutoPlay();
        };
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
        const allowSwipe = isTouchDevice; // enable swipe on touch devices
        if (allowSwipe && sliderContainer) {
            sliderContainer.addEventListener('touchstart', (e) => { onStart(e.touches[0].clientX); dragStep = getSlideWidth(); }, { passive: true });
            sliderContainer.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
            sliderContainer.addEventListener('touchend', onEnd, { passive: true });
            sliderContainer.addEventListener('touchcancel', onEnd, { passive: true });
            sliderContainer.addEventListener('mouseleave', () => { if (dragging) onEnd(); });
        }

        let resizeTimeout = null;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => updateSlider(false), 120);
        }, { passive: true });

        const journeySection = document.querySelector('#journey');
        if (journeySection && 'IntersectionObserver' in window) {
            const visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
                        startAutoPlay();
                    } else {
                        stopAutoPlay();
                    }
                });
            }, { threshold: [0, 0.2, 0.5] });
            visibilityObserver.observe(journeySection);
        } else {
            startAutoPlay();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a, .mobile-menu-footer a');

    if (hamburger && mobileMenu && closeMenu) {
        // Open Menu
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.classList.add('menu-open');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });

        // Close Menu
        const closeMobileMenu = () => {
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
        };

        closeMenu.addEventListener('click', closeMobileMenu);

        // Close when clicking links
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close when clicking outside (optional, but good UX)
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                closeMobileMenu();
            }
        });
    }

    // 1. Handle Skeleton Loading for Images
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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const navbar = document.querySelector('.navbar');
            const offset = navbar ? navbar.offsetHeight + 10 : 0;
            const rect = target.getBoundingClientRect();
            const targetY = rect.top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });

            const overlay = document.querySelector('.mobile-menu-overlay');
            if (overlay && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // 3D Tilt Effect for Cards (desktop / fine pointer only)
    const tiltElements = document.querySelectorAll('.service-item, .quote-card, .mv-card');
    const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!isCoarsePointer) {
        tiltElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;
                
                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                el.style.transition = 'transform 0.1s ease';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                el.style.transition = 'transform 0.5s ease';
            });
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    const dateInputHidden = document.querySelector('.date-input-hidden');
    const dateDisplay = document.querySelector('.date-display');
    if (dateInputHidden && dateDisplay) {
        const dateWrapper = dateDisplay.closest('.input-wrapper');
        const openPicker = () => {
            if (typeof dateInputHidden.showPicker === 'function') {
                try {
                    dateInputHidden.showPicker();
                    return;
                } catch (e) {
                    // fall through to mobile-friendly fallback
                }
            }
            const prevOpacity = dateInputHidden.style.opacity;
            const prevPointer = dateInputHidden.style.pointerEvents;
            dateInputHidden.style.pointerEvents = 'auto';
            dateInputHidden.style.opacity = '0.01';
            dateInputHidden.focus();
            dateInputHidden.click();
            setTimeout(() => {
                dateInputHidden.style.pointerEvents = prevPointer || 'none';
                dateInputHidden.style.opacity = prevOpacity || '0';
            }, 500);
        };

        if (dateWrapper) {
            dateWrapper.addEventListener('click', (e) => {
                if (e.target !== dateDisplay) {
                    openPicker();
                }
            });
        }

        const formatDateDisplay = (val) => {
            const digits = val.replace(/\D/g, '').slice(0, 8);
            if (digits.length <= 2) return digits;
            if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        };

        dateDisplay.addEventListener('input', () => {
            const formatted = formatDateDisplay(dateDisplay.value);
            dateDisplay.value = formatted;
        });

        const normalizeAndPad = () => {
            const digits = dateDisplay.value.replace(/\D/g, '');
            if (digits.length < 6) return; // need at least DDMMYY
            let d = digits.slice(0, 2);
            let m = digits.slice(2, 4);
            let y = digits.slice(4);
            if (y.length === 2) y = '20' + y;
            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            y = y.padStart(4, '0');
            const padded = `${d}/${m}/${y}`;
            dateDisplay.value = padded;
        };

        dateInputHidden.addEventListener('change', () => {
            if (!dateInputHidden.value) {
                dateDisplay.value = '';
                return;
            }
            const parts = dateInputHidden.value.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                dateDisplay.value = `${day}/${month}/${year}`;
            }
        });

        const syncFromDisplay = () => {
            const value = dateDisplay.value.trim().replace(/-/g, '/');
            if (!value) {
                dateInputHidden.value = '';
                return;
            }
            const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
            if (!match) return;
            let [, d, m, y] = match;
            if (y.length === 2) y = '20' + y;
            const day = d.padStart(2, '0');
            const month = m.padStart(2, '0');
            const iso = `${y}-${month}-${day}`;
            const testDate = new Date(iso);
            if (!isNaN(testDate.getTime())) {
                dateInputHidden.value = iso;
            }
        };

        dateDisplay.addEventListener('blur', syncFromDisplay);
        dateDisplay.addEventListener('blur', normalizeAndPad);
        dateDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                syncFromDisplay();
                normalizeAndPad();
                dateDisplay.blur();
            }
        });
    }

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

    // Parallax Effect (desktop only, respect reduced motion)
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parallaxOnCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    
    if (parallaxElements.length > 0 && !prefersReducedMotion && !parallaxOnCoarsePointer) {
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

window.addEventListener('load', () => {
    const tContainer = document.querySelector('#testimonials .slider-container');
    const tWrapper = document.querySelector('#testimonials .slider-wrapper');
    const tTrack = document.querySelector('#testimonials .slider-track');
    const tSlides = document.querySelectorAll('#testimonials .testimonial-card');
    const tPrev = document.querySelector('#testimonials .prev-btn');
    const tNext = document.querySelector('#testimonials .next-btn');
    const tDotsContainer = document.querySelector('#testimonials .slider-dots');
    if (tTrack && tSlides.length > 0) {
        const slidesCount = tSlides.length;
        const cloneCount = 2;
        
        // Clone for all devices to support infinite loop
        for (let i = slidesCount - cloneCount; i < slidesCount; i++) {
            const clone = tSlides[i].cloneNode(true);
            clone.classList.add('clone');
            tTrack.insertBefore(clone, tTrack.firstChild);
        }
        for (let i = 0; i < cloneCount; i++) {
            const clone = tSlides[i].cloneNode(true);
            clone.classList.add('clone');
            tTrack.appendChild(clone);
        }
        
        const allSlides = document.querySelectorAll('#testimonials .testimonial-card');
        let currentIndex = cloneCount;
        let isTransitioning = false;
        const supportPointer = 'PointerEvent' in window;
        tSlides.forEach((_, index) => {
            const hit = document.createElement('button');
            hit.classList.add('dot-hit');
            hit.type = 'button';
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            hit.appendChild(dot);
            const activateDot = (e) => {
                if (!e) return;
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
                if (typeof e.preventDefault === 'function') e.preventDefault();
                
                if (window.innerWidth < 768) {
                    const cardWidth = tSlides[0].offsetWidth + 16; // 16px gap
                    // For mobile infinite loop, we target the clones offset
                    if (tWrapper) {
                        tWrapper.scrollTo({
                            left: (index + cloneCount) * cardWidth,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    // Desktop: transform
                    if (isTransitioning) return;
                    currentIndex = index + cloneCount;
                    updateSlider(true);
                }
            };
            if (supportPointer) {
                hit.addEventListener('pointerup', activateDot);
            } else {
                hit.addEventListener('click', activateDot);
            }
            if (tDotsContainer) tDotsContainer.appendChild(hit);
        });
        const updateDots = () => {
            if (!tDotsContainer) return;
            const dots = tDotsContainer.querySelectorAll('.dot');
            if (dots.length === 0) return;
            
            if (window.innerWidth < 768) {
                const scrollLeft = tWrapper ? tWrapper.scrollLeft : 0;
                const cardWidth = tSlides[0].offsetWidth + 16;
                // Calculate raw index from scroll position
                let rawIndex = Math.round(scrollLeft / cardWidth);
                
                // Convert raw index (including clones) to logical slide index
                // rawIndex = 0 or 1 -> clones of end
                // rawIndex = cloneCount -> first real slide
                let realIndex = rawIndex - cloneCount;
                
                if (realIndex < 0) realIndex = slidesCount + realIndex; // wrap around from start clones
                while (realIndex >= slidesCount) realIndex -= slidesCount; // wrap around from end clones
                
                dots.forEach((d, i) => {
                    if (i === realIndex) d.classList.add('active');
                    else d.classList.remove('active');
                });
            } else {
                // Desktop logic (transform-based)
                dots.forEach(d => d.classList.remove('active'));
                let realIndex = currentIndex - cloneCount;
                if (realIndex < 0) realIndex = slidesCount - 1;
                while (realIndex >= slidesCount) realIndex -= slidesCount;
                if (dots[realIndex]) dots[realIndex].classList.add('active');
            }
        };

        // Add scroll listener for mobile dots sync and infinite loop
        if (tWrapper) {
            tWrapper.addEventListener('scroll', () => {
                if (window.innerWidth < 768) {
                    const scrollLeft = tWrapper.scrollLeft;
                    const cardWidth = tSlides[0].offsetWidth + 16;
                    
                    // Update dots
                    let rawIndex = Math.round(scrollLeft / cardWidth);
                    let realIndex = rawIndex - cloneCount;
                    if (realIndex < 0) realIndex = slidesCount + realIndex;
                    while (realIndex >= slidesCount) realIndex -= slidesCount;
                    
                    const dots = tDotsContainer ? tDotsContainer.querySelectorAll('.dot') : [];
                    dots.forEach((d, i) => {
                         if (i === realIndex) d.classList.add('active');
                         else d.classList.remove('active');
                    });

                    // Infinite loop check
                    // If scrolled to near start (first clone set)
                    if (scrollLeft < cardWidth * 0.5) {
                        // Jump to end real set
                        tWrapper.style.scrollBehavior = 'auto';
                        tWrapper.scrollLeft = scrollLeft + (slidesCount * cardWidth);
                        tWrapper.style.scrollBehavior = 'smooth';
                    }
                    // If scrolled to near end (last clone set)
                    else if (scrollLeft > (slidesCount + cloneCount + 0.5) * cardWidth) {
                        // Jump to start real set
                        tWrapper.style.scrollBehavior = 'auto';
                        tWrapper.scrollLeft = scrollLeft - (slidesCount * cardWidth);
                        tWrapper.style.scrollBehavior = 'smooth';
                    }
                }
            }, { passive: true });
            
            // Initial scroll position for mobile (start at first real slide)
            if (window.innerWidth < 768) {
                // Wait for layout
                requestAnimationFrame(() => {
                    const cardWidth = tSlides[0].offsetWidth + 16;
                    tWrapper.scrollLeft = cloneCount * cardWidth;
                });
            }
        }
        const getSlideWidth = () => {
            const trackStyles = window.getComputedStyle(tTrack);
            const gap = parseInt(trackStyles.gap) || 30;
            const w = window.innerWidth;
            
            // On mobile, let CSS handle sizing (flex: 0 0 85vw)
            // We only need to return the width for scroll calculations
            if (w < 768) {
                allSlides.forEach(slide => {
                    slide.style.flexBasis = ''; // Clear inline style so CSS takes over
                });
                // Measure the first slide (which should be sized by CSS)
                // Note: tSlides[0] might be a clone or original, but they share the class
                return tSlides[0].offsetWidth + gap;
            }

            let visibleCount = 3;
            if (w < 1024 && w >= 768) {
                visibleCount = 2;
            } 
            
            const parent = tTrack.parentElement;
            const parentStyles = window.getComputedStyle(parent);
            const padL = parseInt(parentStyles.paddingLeft) || 0;
            const padR = parseInt(parentStyles.paddingRight) || 0;
            const wrapperWidth = parent.offsetWidth;
            const contentWidth = wrapperWidth - padL - padR;
            let cardWidth = (contentWidth - gap * (visibleCount - 1)) / visibleCount;
            
            allSlides.forEach(slide => {
                slide.style.flexBasis = `${cardWidth}px`;
            });
            return cardWidth + gap;
        };
        let unlockTimer = null;
        const updateSlider = (smooth = true) => {
            if (window.innerWidth < 768) return; // we rely on native scroll-snap instead of transforms
            const totalItemWidth = getSlideWidth();
            if (smooth) {
                tTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
                isTransitioning = true;
                if (unlockTimer) clearTimeout(unlockTimer);
                unlockTimer = setTimeout(() => { isTransitioning = false; }, 550);
            } else {
                tTrack.style.transition = 'none';
                isTransitioning = false;
            }
            let offset = 0;
            const singleVisible = window.innerWidth < 768;
            if (singleVisible) {
                const cardWidth = allSlides[0].offsetWidth;
                const parent = tTrack.parentElement;
                const parentStyles = window.getComputedStyle(parent);
                const padL = parseInt(parentStyles.paddingLeft) || 0;
                const padR = parseInt(parentStyles.paddingRight) || 0;
                const wrapperWidth = parent.offsetWidth;
                const contentWidth = wrapperWidth - padL - padR;
                offset = Math.round((contentWidth - cardWidth) / 2) - padL;
            }
            tTrack.style.transform = `translateX(${-(currentIndex * totalItemWidth) + offset}px)`;
            updateDots();
        };
        if (window.innerWidth >= 768) updateSlider(false);

        let tAutoPlayInterval = null;
        const tStartAutoPlay = () => {
            if (tAutoPlayInterval) return;
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            tAutoPlayInterval = setInterval(() => {
                if (document.visibilityState !== 'visible') return;
                if (isTransitioning) return;
                currentIndex++;
                updateSlider(true);
            }, 6000);
        };
        const tStopAutoPlay = () => {
            if (!tAutoPlayInterval) return;
            clearInterval(tAutoPlayInterval);
            tAutoPlayInterval = null;
        };

        const nextSlide = () => {
            if (isTransitioning) return;
            currentIndex++;
            updateSlider(true);
        };
        const prevSlide = () => {
            if (isTransitioning) return;
            currentIndex--;
            updateSlider(true);
        };
        tTrack.addEventListener('transitionend', () => {
            isTransitioning = false;
            if (currentIndex >= slidesCount + cloneCount) {
                currentIndex = cloneCount;
                updateSlider(false);
            } else if (currentIndex < cloneCount) {
                currentIndex = slidesCount + cloneCount - 1;
                updateSlider(false);
            }
        });
        if (tNext) tNext.addEventListener('click', () => {
            nextSlide();
            tStopAutoPlay();
            tStartAutoPlay();
        });
        if (tPrev) tPrev.addEventListener('click', () => {
            prevSlide();
            tStopAutoPlay();
            tStartAutoPlay();
        });
        let startX = 0;
        let dragging = false;
        let dragDelta = 0;
        let startScroll = 0;
        const onStart = (x) => {
            dragging = true;
            startX = x;
            startScroll = tWrapper ? tWrapper.scrollLeft : 0;
            if (!isMobile) tTrack.style.transition = 'none';
        };
        let rafPending = false;
        let lastX = 0;
        let dragStep = 0;
        const onMove = (x) => {
            if (!dragging) return;
            lastX = x;
            dragDelta = lastX - startX;
            if (isMobile && tWrapper) {
                tWrapper.scrollLeft = startScroll - dragDelta;
                return;
            }
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                const totalItemWidth = dragStep || getSlideWidth();
                let offset = 0;
                const w = window.innerWidth;
                const singleVisible = w < 768;
                if (singleVisible) {
                    const cardWidth = allSlides[0].offsetWidth;
                    const parent = tTrack.parentElement;
                    const parentStyles = window.getComputedStyle(parent);
                    const padL = parseInt(parentStyles.paddingLeft) || 0;
                    const padR = parseInt(parentStyles.paddingRight) || 0;
                    const wrapperWidth = parent.offsetWidth;
                    const contentWidth = wrapperWidth - padL - padR;
                    offset = Math.round((contentWidth - cardWidth) / 2) - padL;
                }
                tTrack.style.transform = `translateX(${-(currentIndex * totalItemWidth) + offset + dragDelta}px)`;
                rafPending = false;
            });
        };
        const onEnd = () => {
            if (!dragging) return;
            dragging = false;
            const totalItemWidth = dragStep || getSlideWidth();
            const threshold = Math.max(50, totalItemWidth * 0.15);
            if (dragDelta > threshold) {
                if (isMobile && tWrapper) {
                    tWrapper.scrollBy({ left: -totalItemWidth, behavior: 'smooth' });
                } else {
                    prevSlide();
                }
            } else if (dragDelta < -threshold) {
                if (isMobile && tWrapper) {
                    tWrapper.scrollBy({ left: totalItemWidth, behavior: 'smooth' });
                } else {
                    nextSlide();
                }
            } else {
                if (!isMobile) updateSlider(true);
                // on mobile, let scroll-snap settle naturally
            }
            dragDelta = 0;
            dragStep = 0;
            tStopAutoPlay();
            tStartAutoPlay();
        };
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
        const allowSwipe = isTouchDevice;
        if (allowSwipe) {
            // On mobile, we bind to tContainer but let native scroll happen
            // On desktop/touch, we might need custom logic if not using overflow:auto
            // But here we set overflow:auto for mobile in CSS.
            
            const swipeTarget = tContainer; 
            
            swipeTarget.addEventListener('touchstart', (e) => {
                tStopAutoPlay();
                if (window.innerWidth < 768) return; // Native scroll on mobile
                onStart(e.touches[0].clientX);
                dragStep = getSlideWidth();
            }, { passive: true });
            
            swipeTarget.addEventListener('touchmove', (e) => {
                if (window.innerWidth < 768) return;
                onMove(e.touches[0].clientX);
            }, { passive: true });
            
            swipeTarget.addEventListener('touchend', (e) => {
                if (window.innerWidth < 768) {
                    tStopAutoPlay();
                    tStartAutoPlay();
                    return;
                }
                onEnd();
            }, { passive: true });
            
            swipeTarget.addEventListener('touchcancel', (e) => {
                if (window.innerWidth < 768) return;
                onEnd();
            }, { passive: true });
            
            // Prevent accidental drag with mouse on touch devices
            swipeTarget.addEventListener('mouseleave', () => { if (dragging) onEnd(); });
        }
        let resizeTimeout = null;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => updateSlider(false), 120);
        }, { passive: true });

        const testimonialsSection = document.querySelector('#testimonials');
        if (testimonialsSection && 'IntersectionObserver' in window) {
            const tVisibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
                        tStartAutoPlay();
                    } else {
                        tStopAutoPlay();
                    }
                });
            }, { threshold: [0, 0.2, 0.5] });
            tVisibilityObserver.observe(testimonialsSection);
        } else {
            tStartAutoPlay();
        }
    }
});
