/* =========================================================
   SMART SLIDER.JS - FULL AUTO-DISCOVERY (1 s/d 10)
   Menampilkan semua foto & video (ibr, ik, ks, ig) secara utuh
   tanpa slide kosong & tetap hemat kuota di awal.
========================================================= */
const sliderState = {};

// Konfigurasi lengkap pola nama file di tiap folder Wadah Ibadah
const WADAH_CONFIG = {
    'IBADAH_RAYA_MINGGU': {
        id: 'slider-ibadah-raya',
        candidates: [
            'ibr-1.jpg', 'ibr-1.JPG', 'ibr-1.jpeg', 'ibr-1.webp', 'ibr-1.mp4',
            'ibr-2.jpg', 'ibr-2.JPG', 'ibr-2.jpeg', 'ibr-2.webp', 'ibr-2.mp4',
            'ibr-3.mp4', 'ibr-3.jpg', 'ibr-3.JPG',
            'ibr-4.jpg', 'ibr-4.JPG', 'ibr-4.mp4',
            'ibr-5.jpg', 'ibr-5.JPG', 'ibr-5.mp4',
            'ibr-6.jpg', 'ibr-6.JPG', 'ibr-6.mp4',
            'ibr-7.mp4', 'ibr-7.jpg', 'ibr-7.JPG',
            'ibr-8.jpg', 'ibr-8.mp4'
        ]
    },
    'IMPACT_KIDS': {
        id: 'slider-impact-kids',
        candidates: [
            'ik-1.jpg', 'ik-1.JPG', 'ik-1.jpeg', 'ik-1.webp', 'ik-1.mp4',
            'ik-2.mp4', 'ik-2.jpg', 'ik-2.JPG', 'ik-2.jpeg',
            'ik-3.jpg', 'ik-3.JPG', 'ik-3.jpeg', 'ik-3.mp4',
            'ik-4.jpg', 'ik-4.JPG', 'ik-4.jpeg', 'ik-4.mp4',
            'ik-5.jpg', 'ik-5.JPG', 'ik-5.jpeg', 'ik-5.mp4',
            'ik-6.jpg', 'ik-6.JPG', 'ik-6.jpeg', 'ik-6.mp4',
            'ik-7.mp4', 'ik-7.jpg', 'ik-7.JPG', 'ik-7.jpeg',
            'ik-8.jpg', 'ik-8.mp4'
        ]
    },
    'KOMSEL_SUKACITA': {
        id: 'slider-komsel-sukacita',
        candidates: [
            'ks-1.jpg', 'ks-1.JPG', 'ks-1.jpeg', 'ks-1.webp', 'ks-1.mp4',
            'ks-2.jpg', 'ks-2.JPG', 'ks-2.jpeg', 'ks-2.webp', 'ks-2.mp4',
            'ks-3.JPG', 'ks-3.jpg', 'ks-3.jpeg', 'ks-3.mp4',
            'ks-4.mp4', 'ks-4.jpg', 'ks-4.JPG',
            'ks-5.jpg', 'ks-5.JPG', 'ks-5.jpeg', 'ks-5.mp4',
            'ks-6.jpg', 'ks-6.JPG', 'ks-6.jpeg', 'ks-6.mp4',
            'ks-7.jpg', 'ks-7.JPG', 'ks-7.mp4'
        ]
    },
    'IMPACT_GENERATION': {
        id: 'slider-impact-generation',
        candidates: [
            'ig-1.jpg', 'ig-1.jpeg', 'ig-(1).jpeg', 'ig-(1).jpg', 'ig-1.mp4', 'ig-(1).mp4',
            'ig-(2).jpeg', 'ig-2.jpeg', 'ig-2.jpg', 'ig-(2).jpg', 'ig-2.mp4',
            'ig-(3).jpeg', 'ig-3.jpeg', 'ig-3.jpg', 'ig-(3).jpg', 'ig-3.mp4',
            'ig-(4).jpeg', 'ig-4.jpeg', 'ig-4.jpg', 'ig-(4).jpg', 'ig-4.mp4',
            'ig-(5).jpeg', 'ig-5.jpeg', 'ig-5.jpg', 'ig-(5).jpg', 'ig-5.mp4',
            'ig-(6).jpeg', 'ig-6.jpeg', 'ig-6.jpg', 'ig-(6).jpg', 'ig-6.mp4',
            'ig-(7).jpeg', 'ig-7.jpeg', 'ig-7.jpg', 'ig-(7).jpg', 'ig-7.mp4',
            'ig-(8).jpeg', 'ig-8.jpeg', 'ig-8.jpg'
        ]
    }
};

// Cek apakah file benar-benar ada di server (menggunakan HEAD request ringan)
async function cekFileTersedia(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

// Ambil daftar file dari /api/media, atau scan otomatis kandidat file 1 s/d 8 jika API tidak mengembalikan semua file
async function dapatkanSemuaFileWadah(wadahFolder) {
    try {
        const res = await fetch(`/api/media?wadah=${encodeURIComponent(wadahFolder)}`);
        if (res.ok) {
            const data = await res.json();
            let rawList = Array.isArray(data) ? data : (data.files || data.media || data.data || []);
            if (Array.isArray(rawList) && rawList.length > 1) {
                return rawList.map(item => {
                    let path = typeof item === 'string' ? item : (item.url || item.path || item.src || item.name || '');
                    path = path.trim().replace(/^\//, '');
                    return path.startsWith('wadah_ibadah/') ? path : `wadah_ibadah/${wadahFolder}/${path}`;
                }).filter(Boolean);
            }
        }
    } catch (e) {
        // Lanjut ke pemindaian otomatis jika /api/media tidak ada atau gagal
    }

    const config = WADAH_CONFIG[wadahFolder];
    if (!config) return [];

    // Kelompokkan berdasarkan nomor urut (1, 2, 3, ... 8) agar tiap nomor diambil 1 file yang valid
    const grupNomor = {};
    config.candidates.forEach(fileName => {
        const match = fileName.match(/(\d+)/);
        const num = match ? match[1] : fileName;
        if (!grupNomor[num]) grupNomor[num] = [];
        grupNomor[num].push(`wadah_ibadah/${wadahFolder}/${fileName}`);
    });

    const nomorUrutKeys = Object.keys(grupNomor).sort((a, b) => Number(a) - Number(b));

    // Periksa setiap nomor secara paralel
    const hasilPerNomor = await Promise.all(
        nomorUrutKeys.map(async (num) => {
            const daftarUrl = grupNomor[num];
            for (const url of daftarUrl) {
                const ada = await cekFileTersedia(encodeURI(url));
                if (ada) return url;
            }
            return null;
        })
    );

    return hasilPerNomor.filter(Boolean);
}

async function muatMediaWadah(wadahFolder, sliderId) {
    const container = document.getElementById(sliderId);
    if (!container) return;

    const fileList = await dapatkanSemuaFileWadah(wadahFolder);
    if (!fileList || fileList.length === 0) return;

    sliderState[sliderId] = { currentIndex: 0 };
    container.innerHTML = '';

    fileList.forEach((rawUrl, idx) => {
        const safeUrl = encodeURI(rawUrl);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(rawUrl);
        const slideDiv = document.createElement('div');
        slideDiv.className = 'slide-item h-full w-full shrink-0 relative overflow-hidden bg-dark-900';
        slideDiv.style.flex = '0 0 100%';

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
                slideDiv.innerHTML = `<img src="${safeUrl}" alt="Kegiatan ${wadahFolder} ${idx + 1}" loading="lazy" decoding="async" class="w-full h-full object-cover">`;
            } else {
                slideDiv.innerHTML = `<img data-src="${safeUrl}" alt="Kegiatan ${wadahFolder} ${idx + 1}" loading="lazy" decoding="async" class="w-full h-full object-cover">`;
            }
        }

        // Jika ada file yang gagal dimuat, otomatis hapus slidenya agar tidak muncul layar hitam
        const mediaEl = slideDiv.querySelector('img, video');
        if (mediaEl) {
            mediaEl.addEventListener('error', () => {
                slideDiv.remove();
                perbaikiPosisiSlide(sliderId);
            });
        }

        container.appendChild(slideDiv);
    });
}

function perbaikiPosisiSlide(sliderId) {
    const container = document.getElementById(sliderId);
    const state = sliderState[sliderId];
    if (!container || !state) return;

    const total = container.querySelectorAll('.slide-item').length;
    if (total === 0) return;

    if (state.currentIndex >= total) {
        state.currentIndex = 0;
    }
    container.style.transform = `translateX(-${state.currentIndex * 100}%)`;
}

function aktifkanSlideMedia(sliderId, index) {
    const container = document.getElementById(sliderId);
    if (!container) return;
    const slides = container.querySelectorAll('.slide-item');
    if (slides.length === 0) return;

    // Muat juga slide berikutnya (prefetch) agar saat user klik panah lagi tidak ada jeda loading
    const nextIndex = (index + 1) % slides.length;

    slides.forEach((slide, idx) => {
        const img = slide.querySelector('img');
        const video = slide.querySelector('video');

        if (idx === index || idx === nextIndex) {
            if (img && img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        }

        if (idx === index) {
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
    const container = document.getElementById(sliderId);
    if (!container) return;

    const slides = container.querySelectorAll('.slide-item');
    const total = slides.length;
    if (total <= 1) return;

    if (!sliderState[sliderId]) {
        sliderState[sliderId] = { currentIndex: 0 };
    }

    const state = sliderState[sliderId];
    state.currentIndex = (state.currentIndex + direction + total) % total;
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
        }, { rootMargin: '300px' });

        daftarSlider.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
    } else {
        daftarSlider.forEach(s => muatMediaWadah(s.folder, s.id));
    }
});
