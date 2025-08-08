// Modern Theme Utility for Santaniello Website
// Automatically applies modern color scheme to all pages

class ModernTheme {
    constructor() {
        this.init();
    }

    init() {
        // Apply modern theme on page load
        this.applyModernTheme();
        this.enhanceCards();
        this.enhanceButtons();
        this.enhanceHeaderFooter();
    }

    applyModernTheme() {
        // Update Tailwind configuration if not already done
        if (typeof tailwind !== 'undefined' && tailwind.config) {
            const currentConfig = tailwind.config.theme?.extend?.colors || {};
            
            // Check if modern colors are already applied
            if (!currentConfig['modern-dark']) {
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                'modern-dark': '#1a1a1a',
                                'modern-gray': '#374151',
                                'modern-light': '#6b7280',
                                'modern-accent': '#2d3748'
                            }
                        }
                    }
                };
            }
        }

        // Apply modern classes to existing elements
        this.updateExistingElements();
    }

    updateExistingElements() {
        // Update headers
        const headers = document.querySelectorAll('header');
        headers.forEach(header => {
            if (header.classList.contains('bg-funeral-dark')) {
                header.className = header.className
                    .replace('bg-funeral-dark', 'bg-gradient-to-r from-modern-dark to-modern-accent')
                    .replace('shadow-lg', 'shadow-2xl');
            }
        });

        // Update funeral-gold elements to modern equivalents
        const goldElements = document.querySelectorAll('[class*="funeral-gold"]');
        goldElements.forEach(element => {
            element.className = element.className
                .replace(/text-funeral-gold/g, 'text-gray-700')
                .replace(/bg-funeral-gold/g, 'bg-gradient-to-r from-gray-900 to-gray-800 text-white')
                .replace(/border-funeral-gold/g, 'border-gray-700')
                .replace(/hover:text-funeral-gold/g, 'hover:text-gray-900');
        });

        // Update funeral-blue elements
        const blueElements = document.querySelectorAll('[class*="funeral-blue"]');
        blueElements.forEach(element => {
            element.className = element.className
                .replace(/bg-funeral-blue/g, 'bg-gradient-to-br from-gray-800 to-gray-900')
                .replace(/text-funeral-blue/g, 'text-gray-800')
                .replace(/border-funeral-blue/g, 'border-gray-700')
                .replace(/hover:bg-funeral-blue/g, 'hover:bg-gray-800');
        });

        // Update funeral-dark elements
        const darkElements = document.querySelectorAll('[class*="funeral-dark"]');
        darkElements.forEach(element => {
            element.className = element.className
                .replace(/text-funeral-dark/g, 'text-gray-900')
                .replace(/bg-funeral-dark/g, 'bg-gradient-to-r from-modern-dark to-modern-accent');
        });
    }

    enhanceCards() {
        // Add modern card styling
        const cards = document.querySelectorAll('.necrologio-card, .product-card');
        cards.forEach(card => {
            // Add modern classes if not already present
            if (!card.classList.contains('shadow-2xl')) {
                card.classList.add('shadow-lg', 'hover:shadow-2xl', 'transition-all', 'duration-500', 'transform', 'hover:-translate-y-2');
                
                // Add gradient background
                card.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
            }
        });

        // Enhance other cards
        const genericCards = document.querySelectorAll('.bg-white:not(.necrologio-card):not(.product-card)');
        genericCards.forEach(card => {
            if (card.classList.contains('p-6') || card.classList.contains('p-8')) {
                card.classList.add('shadow-lg', 'hover:shadow-xl', 'transition-shadow', 'duration-300');
            }
        });
    }

    enhanceButtons() {
        // Enhance primary buttons
        const primaryButtons = document.querySelectorAll('.btn-primary, [class*="bg-funeral-gold"]');
        primaryButtons.forEach(button => {
            if (!button.classList.contains('bg-gradient-to-r')) {
                button.className = button.className
                    .replace(/bg-funeral-gold/g, 'bg-gradient-to-r from-gray-900 to-gray-800')
                    .replace(/text-funeral-dark/g, 'text-white')
                    .replace(/hover:bg-yellow-400/g, 'hover:from-gray-800 hover:to-gray-700');
                
                button.classList.add('transform', 'hover:scale-105', 'transition-all', 'duration-300', 'shadow-lg');
            }
        });

        // Enhance secondary buttons
        const secondaryButtons = document.querySelectorAll('.btn-secondary, [class*="border-funeral"]');
        secondaryButtons.forEach(button => {
            button.className = button.className
                .replace(/border-funeral-blue/g, 'border-gray-800')
                .replace(/text-funeral-blue/g, 'text-gray-800')
                .replace(/hover:bg-funeral-blue/g, 'hover:bg-gray-800');
        });
    }

    enhanceHeaderFooter() {
        // Enhance navigation links
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.classList.contains('hover:text-funeral-gold')) {
                link.className = link.className
                    .replace(/hover:text-funeral-gold/g, 'hover:text-gray-300');
            }
        });

        // Enhance footer
        const footer = document.querySelector('footer');
        if (footer && footer.classList.contains('bg-funeral-dark')) {
            footer.className = footer.className
                .replace('bg-funeral-dark', 'bg-gradient-to-b from-gray-900 to-black');
        }
    }

    // Utility method to update a specific element
    updateElement(element, oldClass, newClass) {
        if (element && element.classList.contains(oldClass)) {
            element.classList.remove(oldClass);
            element.classList.add(...newClass.split(' '));
        }
    }

    // Method to apply modern styling to dynamically created content
    applyToElement(element) {
        // Apply modern theme to a specific element and its children
        const funeralElements = element.querySelectorAll('[class*="funeral-"]');
        funeralElements.forEach(el => {
            el.className = el.className
                .replace(/bg-funeral-gold/g, 'bg-gradient-to-r from-gray-900 to-gray-800 text-white')
                .replace(/text-funeral-gold/g, 'text-gray-700')
                .replace(/bg-funeral-blue/g, 'bg-gradient-to-br from-gray-800 to-gray-900')
                .replace(/text-funeral-blue/g, 'text-gray-800')  
                .replace(/text-funeral-dark/g, 'text-gray-900')
                .replace(/hover:text-funeral-gold/g, 'hover:text-gray-700')
                .replace(/hover:bg-funeral-gold/g, 'hover:bg-gray-700');
        });
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.modernTheme = new ModernTheme();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernTheme;
}