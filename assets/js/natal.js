/* ===================================================
   FITUR NATAL (LIVE COUNT, DINAMIS FORM & E-TICKET)
   + HERO VIDEO LOADER & LAZY SCRIPT
=================================================== */
const API_URL_NATAL = '/api/natal';
const RECAPTCHA_SITE_KEY = '6Lc39yctAAAAAMFEJxjgh3GGOhxNRwpQSd3mSvpp';
let isRecaptchaLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
    initNatalFeature();
    initLazyHeroVideo();
});

// Memutar video Welcome Home dengan mulus setelah FCP/LCP utama selesai dirender
function initLazyHeroVideo() {
    const heroVid = document.getElementById('heroVideo');
    if (!heroVid) return;

    const loadAndPlay = () => {
        const targetSrc = heroVid.getAttribute('data-src') || 'wadah_ibadah/IBADAH_RAYA_MINGGU/ibr-3.mp4';
        if (!heroVid.getAttribute('src')) {
            heroVid.src = targetSrc;
            heroVid.load();
            heroVid.play().catch(() => {});
        }
    };

    if (document.readyState === 'complete') {
        setTimeout(loadAndPlay, 1200);
    } else {
        window.addEventListener('load', () => setTimeout(loadAndPlay, 1200));
    }
}

function ensureRecaptchaLoaded() {
    return new Promise((resolve, reject) => {
        if (window.grecaptcha && window.grecaptcha.execute) return resolve();
        if (isRecaptchaLoaded) {
            const checkInterval = setInterval(() => {
                if (window.grecaptcha && window.grecaptcha.execute) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            return;
        }
        isRecaptchaLoaded = true;
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Gagal memuat reCAPTCHA"));
        document.head.appendChild(script);
    });
}

function ensureHtml2CanvasLoaded() {
    return new Promise((resolve, reject) => {
        if (window.html2canvas) return resolve();
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Gagal memuat html2canvas"));
        document.head.appendChild(script);
    });
}

async function fetchKuotaAwal() {
    const elPagi = document.getElementById('kuotaPagiLuar');
    const elSore = document.getElementById('kuotaSoreLuar');
    if (!elPagi || !elSore) return;

    try {
        const res = await fetch(API_URL_NATAL + '?action=getKuota');
        const data = await res.json();
        if (data.status === 'success') {
            elPagi.innerText = Math.max(0, Number(data.sisaPagi) || 0);
            elSore.innerText = Math.max(0, Number(data.sisaSore) || 0);
        }
    } catch (e) {
        elPagi.innerText = "0";
        elSore.innerText = "0";
    }
}

function initNatalFeature() {
    const navDesktop = document.getElementById('nav-natal-desktop');
    const navMobile = document.getElementById('nav-natal-mobile');
    const sectionNatal = document.getElementById('daftar-natal-section');

    if (navDesktop) navDesktop.classList.remove('hidden');
    if (navMobile) navMobile.classList.remove('hidden');
    if (sectionNatal) sectionNatal.classList.remove('hidden');

    // Hanya panggil API kuota jika tombol pendaftaran online sedang aktif
    const btnDaftar = document.getElementById('btnBukaFormNatal');
    if (btnDaftar) {
        fetchKuotaAwal();
    }
}

function renderFormAnggota() {
    let jumlah = parseInt(document.getElementById('inputJumlahNatal').value) || 1;
    if (jumlah > 7) {
        jumlah = 7;
        document.getElementById('inputJumlahNatal').value = 7;
    }

    const container = document.getElementById('containerAnggotaNatal');
    container.innerHTML = '';

    if (jumlah > 1) {
        container.innerHTML += `<label class="block text-gray-300 text-sm font-semibold mb-2">Nama Anggota Tambahan *</label>`;
        for (let i = 1; i < jumlah; i++) {
            container.innerHTML += `<input type="text" aria-label="Nama Anggota ${i + 1}" class="input-anggota-extra w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 mb-2" maxlength="50" pattern="[a-zA-Z\\s]+" title="Hanya huruf dan spasi" placeholder="Nama Anggota ${i + 1}" required>`;
        }
    }
}

window.bukaFormNatal = function () {
    ensureRecaptchaLoaded().catch(() => {});
    const errorMsg = document.getElementById('errorMsg');
    const modalNatal = document.getElementById('modalNatal');
    const boxNatal = document.getElementById('boxNatal');

    errorMsg.classList.add('hidden');
    modalNatal.classList.remove('hidden');
    setTimeout(() => { modalNatal.classList.remove('opacity-0'); boxNatal.classList.remove('scale-95'); boxNatal.classList.add('scale-100'); }, 10);
};

window.bukaModalNatal = window.bukaFormNatal;

window.tutupFormNatal = function () {
    const modalNatal = document.getElementById('modalNatal');
    const boxNatal = document.getElementById('boxNatal');

    modalNatal.classList.add('opacity-0'); boxNatal.classList.remove('scale-100'); boxNatal.classList.add('scale-95');
    setTimeout(() => { modalNatal.classList.add('hidden'); document.getElementById('formNatal').reset(); document.getElementById('containerAnggotaNatal').innerHTML = ''; }, 300);
};

function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    let safeStr = str.trim();
    if (/^[=+\-@]/.test(safeStr)) {
        safeStr = "'" + safeStr;
    }
    return safeStr;
}

window.submitNatal = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitNatal');
    if (btn.disabled) return;

    const errorMsg = document.getElementById('errorMsg');
    const modalTiket = document.getElementById('modalTiket');
    errorMsg.classList.add('hidden');

    const sesi = document.getElementById('inputSesiNatal').value;
    const waRaw = document.getElementById('inputWANatal').value;
    const namaRaw = document.getElementById('inputNamaNatal').value;
    const jumlah = parseInt(document.getElementById('inputJumlahNatal').value);
    const anak = parseInt(document.getElementById('inputAnakNatal').value) || 0;

    const jenisKendaraan = document.getElementById('inputJenisKendaraan').value;
    const jmlKendaraan = document.getElementById('inputJmlKendaraan').value;
    let infoKendaraan = jenisKendaraan === 'Motor' ? `Motor (${jmlKendaraan})` : jenisKendaraan;

    let arrAnggota = [];
    document.querySelectorAll('.input-anggota-extra').forEach(inp => {
        if (inp.value.trim() !== '') arrAnggota.push(sanitizeInput(inp.value));
    });
    const stringAnggota = arrAnggota.length > 0 ? arrAnggota.join(', ') : '-';

    const safeNama = sanitizeInput(namaRaw);
    const safeWA = sanitizeInput(waRaw);

    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';
    btn.disabled = true;

    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');

    try {
        await ensureRecaptchaLoaded();
        grecaptcha.ready(function () {
            grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit_natal' }).then(async function (token) {
                const payload = new URLSearchParams();
                payload.append("sesi", sesi);
                payload.append("nama", safeNama);
                payload.append("wa", safeWA);
                payload.append("jumlah", jumlah);
                payload.append("anggota", stringAnggota);
                payload.append("kendaraan", infoKendaraan);
                payload.append("recaptchaToken", token);
                payload.append("anak", anak);

                try {
                    const response = await fetch(API_URL_NATAL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: payload
                    });

                    const result = await response.json();

                    if (result.status === 'success') {
                        const noUrutServer = result.noUrut || "999";
                        document.getElementById('tiketNoUrut').innerText = noUrutServer.toString().padStart(3, '0');
                        document.getElementById('tiketSesi').innerText = sesi === 'Pagi' ? "SESI I (09.30)" : "SESI II (16.00)";
                        document.getElementById('tiketNama').innerText = safeNama;
                        document.getElementById('tiketJumlah').innerText = jumlah + " Orang";
                        document.getElementById('tiketKendaraan').innerText = infoKendaraan;
                        document.getElementById('tiketAnggota').innerText = stringAnggota;
                        document.getElementById('tiketAnak').innerText = anak > 0 ? anak + " Orang" : "-";

                        tutupFormNatal();
                        setTimeout(() => {
                            modalTiket.classList.remove('hidden');
                            modalTiket.classList.add('flex');
                            setTimeout(() => { modalTiket.classList.remove('opacity-0'); }, 10);
                        }, 350);
                    } else {
                        errorMsg.innerText = result.message || "Gagal mendaftar. Kuota Ibadah sudah habis.";
                        errorMsg.classList.remove('hidden');
                    }
                } catch (err) {
                    errorMsg.innerText = "Terjadi kendala jaringan. Pastikan koneksi stabil.";
                    errorMsg.classList.remove('hidden');
                } finally {
                    btn.innerHTML = '<span>Ambil Tiket</span> <i class="fas fa-ticket-alt"></i>';
                    btn.disabled = false;
                    loadingOverlay.classList.add('hidden');
                    loadingOverlay.classList.remove('flex');
                }
            });
        });
    } catch (err) {
        errorMsg.innerText = "Gagal memuat sistem keamanan reCAPTCHA.";
        errorMsg.classList.remove('hidden');
        btn.innerHTML = '<span>Ambil Tiket</span> <i class="fas fa-ticket-alt"></i>';
        btn.disabled = false;
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }
};

window.tutupTiket = function () {
    const modalTiket = document.getElementById('modalTiket');
    modalTiket.classList.add('opacity-0');
    setTimeout(() => { modalTiket.classList.add('hidden'); modalTiket.classList.remove('flex'); }, 500);
};

window.downloadTiketAsImage = async function () {
    await ensureHtml2CanvasLoaded();
    const area = document.getElementById("areaPrintTiket");
    const scaleValue = window.innerWidth < 768 ? 1.5 : 2;

    const canvas = await html2canvas(area, {
        scale: scaleValue,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `Tiket_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.toggleKendaraan = function () {
    const jenis = document.getElementById('inputJenisKendaraan').value;
    const boxJml = document.getElementById('boxJumlahKendaraan');
    const inputJml = document.getElementById('inputJmlKendaraan');
    const labelJml = document.getElementById('labelJmlKendaraan');

    if (jenis === 'Motor') {
        boxJml.classList.remove('hidden');
        inputJml.required = true;
        labelJml.innerText = `Jumlah Motor yang dibawa *`;
    } else {
        boxJml.classList.add('hidden');
        inputJml.required = false;
        inputJml.value = "";
    }
};
