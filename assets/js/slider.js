/* ===================================================
   SLIDER LOGIC & API FETCH
=================================================== */
const sliderStates = {};

document.addEventListener("DOMContentLoaded", () => {
    fetchMedia('IBADAH_RAYA_MINGGU', 'slider-ibadah-raya');
    fetchMedia('IMPACT_KIDS', 'slider-impact-kids');
    fetchMedia('KOMSEL_SUKACITA', 'slider-komsel-sukacita');
    fetchMedia('IMPACT_GENERATION', 'slider-impact-generation');
});

async function fetchMedia(namaFolder, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    try {
        const response = await fetch(`/api/media?wadah=${namaFolder}`);
        const files = await response.json();

        if (files.length > 0) {
            let htmlContent = '';
            files.forEach(file => {
                const ext = file.split('.').pop().toLowerCase();
                const filePath = `wadah_ibadah/${namaFolder}/${file}`;

                if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                    htmlContent += `<div class="slide-item h-full w-full bg-cover bg-center shrink-0 transition-transform duration-1000 hover:scale-105" style="background-image: url('${filePath}');"></div>`;
                } else if (['mp4', 'webm'].includes(ext)) {
                    htmlContent += `<video src="${filePath}" class="slide-item h-full w-full object-cover shrink-0" playsinline muted></video>`;
                }
            });

            container.innerHTML = htmlContent;
            initSlider(elementId);
        } else {
            showPlaceholder(container, 'Belum ada media');
        }
    } catch (error) {
        console.error('Error fetching media:', error);
        showPlaceholder(container, 'Gagal memuat media');
    }
}

function showPlaceholder(container, message) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full h-full text-gray-500/50">
          <i class="fas fa-image text-3xl mb-2 opacity-50"></i>
          <span class="text-sm font-medium tracking-wide">${message}</span>
        </div>`;
}

function initSlider(sliderId) {
    const container = document.getElementById(sliderId);
    const slides = container.querySelectorAll('.slide-item');
    if (slides.length <= 1) return;

    sliderStates[sliderId] = { currentIndex: 0, slides: Array.from(slides), timeoutId: null };
    putarSlideAktif(sliderId);
}

function putarSlideAktif(sliderId) {
    const state = sliderStates[sliderId];
    if (!state) return;
    clearTimeout(state.timeoutId);
    const container = document.getElementById(sliderId);
    const currentSlide = state.slides[state.currentIndex];

    state.slides.forEach(slide => { if (slide.tagName.toLowerCase() === 'video') slide.pause(); });
    container.scrollTo({ left: currentSlide.offsetLeft, behavior: 'smooth' });

    if (currentSlide.tagName.toLowerCase() === 'video') {
        currentSlide.currentTime = 0;
        let playPromise = currentSlide.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => { state.timeoutId = setTimeout(() => geserSlide(sliderId, 1), 7000); });
        }
        currentSlide.onended = () => geserSlide(sliderId, 1);
    } else {
        state.timeoutId = setTimeout(() => geserSlide(sliderId, 1), 7000);
    }
}

window.geserSlide = function (sliderId, direction) {
    const state = sliderStates[sliderId];
    if (!state || state.slides.length <= 1) return;
    state.currentIndex = (state.currentIndex + direction + state.slides.length) % state.slides.length;
    putarSlideAktif(sliderId);
};