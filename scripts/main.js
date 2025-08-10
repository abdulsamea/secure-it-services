// Main JavaScript for Secure I.T. Services Website
// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

function initializeWebsite() {
    // Initialize all components
    initializeHeader();
    initializeMobileMenu();
    initializeScrollAnimations();
    initialize3DAnimations();
    initializeTestimonialSlider();
    initializeFAQAccordion();
    initializeGalleryLightbox();
    initializeContactForm();
    initializeWhatsAppIntegration();
    initializeSmoothScrolling();
    initializePerformanceOptimizations();
}

// Header functionality
function initializeHeader() {
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    let lastScrollTop = 0;
    
    // Handle scroll effects
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class for blur effect
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide/show header on scroll direction change
        if (currentScroll > lastScrollTop && currentScroll > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });
    
    // Active nav link highlighting
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    mobileMenuToggle.addEventListener('click', function() {
        this.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking nav links
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            mobileMenuToggle.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
        }
    });
}

// GSAP scroll animations
function initializeScrollAnimations() {
    // Only proceed if GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.log('GSAP not loaded, using fallback animations');
        initializeFallbackAnimations();
        return;
    }
    
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero animations
    gsap.timeline()
        .from('.hero-title-main', { duration: 1, y: 50, opacity: 0, ease: 'power3.out' })
        .from('.hero-title-sub', { duration: 0.8, y: 30, opacity: 0, ease: 'power3.out' }, '-=0.6')
        .from('.hero-description', { duration: 0.8, y: 30, opacity: 0, ease: 'power3.out' }, '-=0.4')
        .from('.hero-actions .btn', { duration: 0.6, y: 20, opacity: 0, stagger: 0.2, ease: 'power3.out' }, '-=0.4')
        .from('.trust-item', { duration: 0.6, y: 20, opacity: 0, stagger: 0.1, ease: 'power3.out' }, '-=0.2');
    
    // Section animations
    gsap.utils.toArray('.section').forEach(section => {
        gsap.fromTo(section.querySelector('.section-header'), 
            { y: 50, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                duration: 1, 
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                    end: 'bottom 20%'
                }
            }
        );
    });
    
    // Feature cards animation
    gsap.utils.toArray('.feature-card').forEach((card, index) => {
        gsap.fromTo(card,
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                delay: index * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%'
                }
            }
        );
    });
    
    // Service cards animation
    gsap.utils.toArray('.service-card').forEach((card, index) => {
        gsap.fromTo(card,
            { y: 60, opacity: 0, rotationY: 15 },
            {
                y: 0,
                opacity: 1,
                rotationY: 0,
                duration: 0.8,
                delay: index * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%'
                }
            }
        );
    });
    
    // Gallery items animation
    gsap.utils.toArray('.gallery-item').forEach((item, index) => {
        gsap.fromTo(item,
            { scale: 0.8, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 90%'
                }
            }
        );
    });
    
    // FAQ items animation
    gsap.utils.toArray('.faq-item').forEach((item, index) => {
        gsap.fromTo(item,
            { x: -50, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%'
                }
            }
        );
    });
    
    // Stats counter animation
    // gsap.utils.toArray('.stat-number').forEach(stat => {
    //     const endValue = stat.textContent.replace(/\D/g, '') || 100;
    //     const suffix = stat.textContent.replace(/\d/g, '');
        
    //     gsap.fromTo(stat, 
    //         { textContent: 0 },
    //         {
    //             textContent: endValue,
    //             duration: 2,
    //             ease: 'power2.out',
    //             snap: { textContent: 1 },
    //             scrollTrigger: {
    //                 trigger: stat,
    //                 start: 'top 80%'
    //             },
    //             onUpdate: function() {
    //                 stat.textContent = Math.ceil(stat.textContent) + suffix;
    //             }
    //         }
    //     );
    // });
}

// Fallback animations for when GSAP is not available
function initializeFallbackAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    // Add basic CSS animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            animation: fadeInUp 0.8s ease forwards;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Observe elements
    const animatedElements = document.querySelectorAll('.feature-card, .service-card, .gallery-item, .faq-item');
    animatedElements.forEach(el => observer.observe(el));
}

// 3D animations for hero section
function initialize3DAnimations() {
    const devices = document.querySelectorAll('.floating-device');
    
    // Add mouse interaction
    document.addEventListener('mousemove', function(e) {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        
        devices.forEach((device, index) => {
            const speed = (index + 1) * 0.02;
            const x = mouseX * 20 * speed;
            const y = mouseY * 20 * speed;
            
            device.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
    
    // Add parallax scrolling effect
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.3;
        
        devices.forEach((device, index) => {
            const speed = (index + 1) * 0.1;
            device.style.transform = `translateY(${parallax * speed}px)`;
        });
    });
}

// Testimonial slider functionality
function initializeTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    const dotsContainer = document.getElementById('testimonialsDots');
    let currentTestimonial = 0;
    
    // Create dots
    testimonials.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToTestimonial(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.dot');
    
    function goToTestimonial(index) {
        testimonials[currentTestimonial].classList.remove('active');
        dots[currentTestimonial].classList.remove('active');
        
        currentTestimonial = index;
        
        testimonials[currentTestimonial].classList.add('active');
        dots[currentTestimonial].classList.add('active');
    }
    
    function nextTestimonial() {
        const next = (currentTestimonial + 1) % testimonials.length;
        goToTestimonial(next);
    }
    
    function prevTestimonial() {
        const prev = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
        goToTestimonial(prev);
    }
    
    prevBtn.addEventListener('click', prevTestimonial);
    nextBtn.addEventListener('click', nextTestimonial);
    
    // Auto-advance testimonials
    setInterval(nextTestimonial, 5000);
}

// FAQ accordion functionality
function initializeFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current FAQ
            if (isActive) {
                item.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

// Gallery lightbox functionality
function initializeGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    
    let currentImageIndex = 0;
    const images = Array.from(galleryItems);
    
    function openLightbox(index) {
        currentImageIndex = index;
        lightboxImage.src = images[index].src;
        lightboxImage.alt = images[index].alt;
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        lightboxImage.src = images[currentImageIndex].src;
        lightboxImage.alt = images[currentImageIndex].alt;
    }
    
    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        lightboxImage.src = images[currentImageIndex].src;
        lightboxImage.alt = images[currentImageIndex].alt;
    }
    
    // Event listeners
    galleryItems.forEach((img, index) => {
        img.addEventListener('click', () => openLightbox(index));
    });
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    
    // Close lightbox when clicking outside image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('show')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    });
}

// Contact form functionality
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Form validation patterns
    const patterns = {
        fullName: /^[a-zA-Z\s]{2,50}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^(\+91|0)?[6-9]\d{9}$/
    };
    
    // Validation functions
    function validateField(field, value) {
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}Error`);
        let isValid = true;
        let errorMessage = '';
        
        // Clear previous errors
        // errorElement.classList.remove('show');
        field.classList.remove('error');
        
        // Required field check
        if (field.hasAttribute('required') && (!value || value.trim() === '')) {
            isValid = false;
            errorMessage = `${field.previousElementSibling.textContent.replace('*', '').trim()} is required`;
        }
        // Pattern validation
        else if (value && patterns[fieldName] && !patterns[fieldName].test(value)) {
            isValid = false;
            switch(fieldName) {
                case 'fullName':
                    errorMessage = 'Please enter a valid name (2-50 characters, letters only)';
                    break;
                case 'email':
                    errorMessage = 'Please enter a valid email address';
                    break;
                case 'phone':
                    errorMessage = 'Please enter a valid Indian phone number';
                    break;
            }
        }
        
        // Show error if validation failed
        if (!isValid) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
            field.classList.add('error');
        }
        
        return isValid;
    }
    
    // Real-time validation
    const formFields = form.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this, this.value);
        });
        
        field.addEventListener('input', function() {
            // Clear error on input
            const errorElement = document.getElementById(`${this.name}Error`);
            if (errorElement.classList.contains('show')) {
                errorElement.classList.remove('show');
                this.classList.remove('error');
            }
        });
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        let isFormValid = true;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate each field
        formFields.forEach(field => {
            if (field.type === 'checkbox') {
                if (field.hasAttribute('required') && !field.checked) {
                    const errorElement = document.getElementById(`${field.name}Error`);
                    errorElement.textContent = 'You must agree to be contacted';
                    errorElement.classList.add('show');
                    field.classList.add('error');
                    isFormValid = false;
                }
            } else {
                if (!validateField(field, field.value)) {
                    isFormValid = false;
                }
            }
        });
        
        if (!isFormValid) {
            // Scroll to first error
            const firstError = form.querySelector('.form-error.show');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        
        try {
            // Submit form data
            const response = await fetch('https://formspree.io/f/xldlawbw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Show success modal
                showSuccessModal(data);
                form.reset();
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Sorry, there was an error sending your message. Please try again or contact us directly.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
}

// Success modal functionality
function showSuccessModal(formData) {
    const modal = document.getElementById('successModal');
    const closeBtn = document.getElementById('modalClose');
    const okBtn = document.getElementById('modalOk');
    const whatsappBtn = document.getElementById('whatsappBtn');
    
    // Update WhatsApp button with form data
    const message = `Hi, I just submitted a contact form for ${formData.service}. My name is ${formData.fullName} and my phone number is ${formData.phone}.`;
    const whatsappUrl = `https://wa.me/919022283313?text=${encodeURIComponent(message)}`;
    whatsappBtn.href = whatsappUrl;
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Close modal handlers
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    closeBtn.addEventListener('click', closeModal);
    okBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}

// WhatsApp integration
function initializeWhatsAppIntegration() {
    const whatsappFloat = document.getElementById('whatsappFloat');
    const serviceCards = document.querySelectorAll('.service-card .btn');
    
    // Show/hide WhatsApp button based on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            whatsappFloat.style.opacity = '1';
            whatsappFloat.style.visibility = 'visible';
        } else {
            whatsappFloat.style.opacity = '0';
            whatsappFloat.style.visibility = 'hidden';
        }
    });
    
    // Update service card buttons to include WhatsApp functionality
    serviceCards.forEach(btn => {
        const serviceCard = btn.closest('.service-card');
        const serviceName = serviceCard.querySelector('.service-title').textContent;
        
        btn.addEventListener('click', function(e) {
            if (e.ctrlKey || e.metaKey) {
                // If Ctrl/Cmd key is held, open WhatsApp directly
                e.preventDefault();
                const message = `Hi, I'm interested in ${serviceName}. Please provide more details.`;
                const whatsappUrl = `https://wa.me/919022283313?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }
            // Otherwise, scroll to contact form (default behavior)
        });
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Performance optimizations
function initializePerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Preload critical resources
    const preloadLinks = [
        { rel: 'preload', href: '/images/hero-bg.jpg', as: 'image' },
        { rel: 'preload', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style' }
    ];
    
    preloadLinks.forEach(link => {
        const linkElement = document.createElement('link');
        Object.assign(linkElement, link);
        document.head.appendChild(linkElement);
    });
    
    // Service Worker registration for offline functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered'))
                .catch(registrationError => console.log('SW registration failed'));
        });
    }
}

// Error handling and logging
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // In production, you might want to send errors to a logging service
});

// Add CSS for error styling
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .form-input.error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    }
    .whatsapp-float {
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(errorStyles);

// Export functions for potential external use
window.SecureITServices = {
    initializeWebsite,
    showSuccessModal,
    validateField: function(fieldName, value) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            return validateField(field, value);
        }
        return false;
    }
};