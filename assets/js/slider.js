/* =========================================================
   FIXED & OPTIMIZED SLIDER.JS
   Memastikan semua foto & video Wadah Ibadah 100% tampil
   tanpa mengunduh puluhan MB sekaligus di awal.
========================================================= */
const sliderState = {};

// Cadangan (Fallback) jika sewaktu-waktu /api/media gangguan
const FALLBACK_MEDIA = {
    'IBADAH_RAYA_MINGGU': [
        'wadah_ibadah/IBADAH_RAYA_MINGGU/ibr-2.jpg',
        'wadah_ibadah/IBADAH_RAYA_MINGGU/ibr-3.mp4',
        'wadah_ibadah/IBADAH_RAYA_MINGGU/ibr-7.mp4'
    ],
    'IMPACT_KIDS': [
        'wadah_ibadah/IMPACT_KIDS/ik-2.mp4',
        'wadah_ibadah/IMPACT_KIDS/ik-7.mp4'
    ],
    'KOMSEL_SUKACITA': [
        'wadah_ibadah/KOMSEL_SUKACITA/ks-3.JPG',
        'wadah_ibadah/KOMSEL_SUKACITA/ks-5.jpg',
        'wadah_ibadah/KOMSEL_SUKACITA/ks-6.jpg',
        'wadah_ibadah/KOMSEL_SUKACITA/ks-4.mp4'
    ],
    'IMPACT_GENERATION': [
        'wadah_ibadah/IMPACT_GENERATION/ig-(2).jpeg',
        'wadah_ibadah/IMPACT_GENERATION/ig-(3).jpeg',
        'wadah_ibadah/IMPACT_GENERATION/ig-(4).jpeg',
        'wadah_ibadah/IMPACT_GENERATION/ig-(5).jpeg',
        'wadah_ibadah/IMPACT_GENERATION/ig-(7).jpeg'
    ]
};

// Mengekstrak daftar file dari format JSON apa pun yang dikirim /api/media
function ekstrakDaftarFile(data, wadahFolder) {
    let rawList = [];
    if (Array.isArray(data)) {
        rawList = data;
    } else if (data && typeof data === 'object') {
        rawList = data.files || data.media || data.data || data.items || data.result || [];
    }

    if (!Array.isArray(rawList) || rawList.length === 0) {
        return FALLBACK_MEDIA[wadahFolder] || [];
    }

    return rawList.map(item => {
        let path = typeof item === 'string' ? item : (item.url || item.path || item.src || item.name || '');
        path = path.trim();
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/') || path.startsWith('wadah_ibadah/')) {
            return path.replace(/^\//, '');
        }
        return `wadah_ibadah/${wadahFolder}/${path}`;
    }).filter(Boolean);
}

async function muatMediaWadah(wadahFolder, sliderId) {
    const container = document.getElementById(sliderId);
    if (!container) return;

    let fileList = [];
    try {
        const res = await fetch(`/api/media?wadah=${encodeURIComponent(wadahFolder)}`);
        const data = await res.json();
        fileList = ekstrakDaftarFile(data, wadahFolder);
    } catch (err) {
        fileList = FALLBACK_MEDIA[wadahFolder] || [];
    }

    if (fileList.length === 0) return;

    // Prioritaskan gambar di urutan pertama (slide 0) agar kartu langsung menampilkan foto tanpa sedot kuota video MP4
    fileList.sort((a, b) => {
        const aVid = /\.(mp4|webm|ogg)$/i.test(a) ? 1 : 0;
        const bVid = /\.(mp4|webm|ogg)$/i.test(b) ? 1 : 0;
        return aVid - bVid;
    });

    sliderState[sliderId] = { currentIndex: 0, total: fileList.length };
    container.innerHTML = '';

    fileList.forEach((rawUrl, idx) => {
        const safeUrl = encodeURI(rawUrl);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(rawUrl);
        const slideDiv = document.createElement('div');
        slideDiv.className = 'slide-item h-full w-full shrink-0 relative overflow-hidden bg-dark-900';

        if (isVideo) {
            if (idx === 0) {
                slideDiv.innerHTML = `
                    <video src="${safeUrl}" autoplay muted loop playsinline preload="metadata" class="w-full h-full object-cover">
                        <track kind="captions" src="data:text/vtt,WEBVTT" srclang="id" label="Indonesia" default>
                    </video>
                `;
            } else {
                slideDiv.innerHTML = `
                    <video data-src="${safeUrl}" muted loop playsinline preload="none" class="w-full h-full object-cover">
                        <track kind="captions" src="data:text/vtt,WEBVTT" srclang="id" label="Indonesia" default>
                    </video>
                `;
            }
        } else {
            if (idx === 0) {
                slideDiv.innerHTML = `<img src="${safeUrl}" alt="Kegiatan ${wadahFolder}" loading="lazy" decoding="async" class="w-full h-full object-cover">`;
            } else {
                slideDiv.innerHTML = `<img data-src="${safeUrl}" alt="Kegiatan ${wadahFolder}" loading="lazy" decoding="async" class="w-full h-full object-cover">`;
            }
        }
        container.appendChild(slideDiv);
    });
}

function aktifkanSlideMedia(sliderId, index) {
    const container = document.getElementById(sliderId);
    if (!container) return;
    const slides = container.querySelectorAll('.slide-item');

    slides.forEach((slide, idx) => {
        const img = slide.querySelector('img');
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

    aktifkanSlideMedia(sliderId, state.currentIndex);
};

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
        }, { rootMargin: '250px' });

        daftarSlider.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
    } else {
        daftarSlider.forEach(s => muatMediaWadah(s.folder, s.id));
    }
});
