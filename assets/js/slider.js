/* =========================================================
   OPTIMIZED SLIDER.JS - ON-DEMAND LAZY MEDIA LOADING
   Menghentikan download paksa 50 MB video & foto di awal
========================================================= */
const sliderState = {};

async function muatMediaWadah(wadahFolder, sliderId) {
    const container = document.getElementById(sliderId);
    if (!container) return;

    try {
        const res = await fetch(`/api/media?wadah=${wadahFolder}`);
        const data = await res.json();
        if (!data.files || data.files.length === 0) return;

        sliderState[sliderId] = { currentIndex: 0, total: data.files.length };
        container.innerHTML = '';

        data.files.forEach((fileUrl, idx) => {
            const isVideo = /\.(mp4|webm|ogg)$/i.test(fileUrl);
            const slideDiv = document.createElement('div');
            slideDiv.className = 'slide-item h-full w-full shrink-0 relative overflow-hidden bg-dark-900';

            if (isVideo) {
                // Video TIDAK diunduh di awal (menggunakan data-src & preload="none")
                slideDiv.innerHTML = `
                    <video muted loop playsinline preload="none" data-src="${fileUrl}" class="w-full h-full object-cover">
                        <track kind="captions" src="data:text/vtt,WEBVTT" srclang="id" label="Indonesia">
                    </video>
                `;
            } else {
                // Hanya slide pertama (idx === 0) yang langsung dipasang src-nya dengan lazy load.
                // Slide sisanya disimpan di data-src agar tidak menyedot kuota 4G di awal!
                if (idx === 0) {
                    slideDiv.innerHTML = `<img src="${fileUrl}" alt="Kegiatan ${wadahFolder}" loading="lazy" decoding="async" class="w-full h-full object-cover">`;
                } else {
                    slideDiv.innerHTML = `<img data-src="${fileUrl}" alt="Kegiatan ${wadahFolder}" loading="lazy" decoding="async" class="w-full h-full object-cover">`;
                }
            }
            container.appendChild(slideDiv);
        });
    } catch (err) {
        console.error(`Gagal memuat slider ${sliderId}:`, err);
    }
}

// Fungsi mengaktifkan media (foto/video) HANYA saat slide digeser
function aktifkanSlideMedia(sliderId, index) {
    const container = document.getElementById(sliderId);
    if (!container) return;
    const slides = container.querySelectorAll('.slide-item');

    slides.forEach((slide, idx) => {
        const img = slide.querySelector('img[data-src]');
        const video = slide.querySelector('video');

        if (idx === index) {
            if (img && img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            if (video) {
                if (video.dataset.src) {
                    video.src = video.dataset.src;
                    video.removeAttribute('data-src');
                    video.load();
                }
                video.play().catch(() => {});
            }
        } else if (video && !video.paused) {
            video.pause();
        }
    });
}

window.geserSlide = function (sliderId, direction) {
    const state = sliderState[sliderId];
    const container = document.getElementById(sliderId);
    if (!state || !container || state.total <= 1) return;

    state.currentIndex = (state.currentIndex + direction + state.total) % state.total;
    container.style.transform = `translateX(-${state.currentIndex * 100}%)`;

    // Muat foto/video pada slide yang baru dibuka
    aktifkanSlideMedia(sliderId, state.currentIndex);
};

// Jalankan pemuatan daftar media HANYA saat user men-scroll mendekati area Wadah Ibadah
document.addEventListener('DOMContentLoaded', () => {
    const daftarSlider = [
        { folder: 'IBADAH_RAYA_MINGGU', id: 'slider-ibadah-raya' },
        { folder: 'IMPACT_KIDS', id: 'slider-impact-kids' },
        { folder: 'KOMSEL_SUKACITA', id: 'slider-komsel-sukacita' },
        { folder: 'IMPACT_GENERATION', id: 'slider-impact-generation' }
    ];

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const item = daftarSlider.find(s => s.id === entry.target.id);
                    if (item) muatMediaWadah(item.folder, item.id);
                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: '200px' });

        daftarSlider.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
    } else {
        daftarSlider.forEach(s => muatMediaWadah(s.folder, s.id));
    }
});
