/* ===================================================
   1. UI INTERACTION (Mobile Menu & Scroll Animation)
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });
    }

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('flex');
        });
    });

    initScrollAnimations();
    initScrollSpy();
});

function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    reveals.forEach(reveal => observer.observe(reveal));
}

function initScrollSpy() {
    const desktopNavItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-link');

    const targetIds = Array.from(desktopNavItems)
        .map(link => link.getAttribute('href'))
        .filter(href => href && href.startsWith('#'))
        .map(href => href.substring(1));

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20;

        if (isAtBottom) {
            currentSectionId = 'lokasi-gereja';
        } else {
            for (let i = targetIds.length - 1; i >= 0; i--) {
                const section = document.getElementById(targetIds[i]);
                if (section && section.offsetParent !== null) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= 300) {
                        currentSectionId = targetIds[i];
                        break;
                    }
                }
            }
        }

        if (window.scrollY < 50) currentSectionId = '';

        desktopNavItems.forEach(link => {
            if (!link.getAttribute('href').startsWith('#')) return;
            const span = link.querySelector('.underline-span');

            if (currentSectionId && link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('text-gold-400', 'font-bold');
                link.classList.remove('text-gray-300');
                if (span) span.classList.add('w-full');
            } else {
                link.classList.remove('text-gold-400', 'font-bold');
                link.classList.add('text-gray-300');
                if (span) span.classList.remove('w-full');
            }
        });

        mobileNavItems.forEach(link => {
            if (!link.getAttribute('href').startsWith('#')) return;

            if (currentSectionId && link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('text-gold-400', 'font-bold');
                link.classList.remove('text-gray-300', 'font-semibold');
            } else {
                link.classList.remove('text-gold-400', 'font-bold');
                link.classList.add('text-gray-300', 'font-semibold');
            }
        });
    });
}