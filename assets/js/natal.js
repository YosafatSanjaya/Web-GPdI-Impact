/* ===================================================
   FITUR NATAL (LIVE COUNT, DINAMIS FORM & E-TICKET)
=================================================== */
const API_URL_NATAL = '/api/natal';

document.addEventListener("DOMContentLoaded", () => {
    initNatalFeature();
});

async function fetchKuotaAwal() {
    try {
        const res = await fetch(API_URL_NATAL + '?action=getKuota');
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('kuotaPagiLuar').innerText = data.sisaPagi;
            document.getElementById('kuotaSoreLuar').innerText = data.sisaSore;
        } else {
            document.getElementById('kuotaPagiLuar').innerText = "Load..";
            document.getElementById('kuotaSoreLuar').innerText = "Load..";
        }
    } catch (e) {
        document.getElementById('kuotaPagiLuar').innerText = "--";
        document.getElementById('kuotaSoreLuar').innerText = "--";
        console.warn("Backend Get Kuota Belum Tersedia atau Error Jaringan.");
    }
}

function initNatalFeature() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0 = Jan, 8 = Sep, 9 = Okt

    const btnDaftar = document.getElementById('btnBukaFormNatal');
    if (!btnDaftar) return;

    document.getElementById('nav-natal-desktop').classList.remove('hidden');
    document.getElementById('nav-natal-mobile').classList.remove('hidden');
    document.getElementById('daftar-natal-section').classList.remove('hidden');

    if (currentMonth >= 9) { // beta 1
        btnDaftar.disabled = false;
        btnDaftar.innerHTML = '<i class="fas fa-calendar-check mr-2"></i> DAFTAR SEKARANG';
        btnDaftar.className = "w-full sm:w-auto bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 px-10 py-4 rounded-xl text-lg font-black shadow-red-500/30 transform transition duration-300 text-white";

        fetchKuotaAwal();
    
    } else {
        btnDaftar.disabled = true;
        btnDaftar.innerHTML = '<i class="fas fa-lock mr-2"></i> DIBUKA 1 OKTOBER';
        btnDaftar.className = "w-full sm:w-auto bg-dark-800 border border-white/20 px-10 py-4 rounded-xl text-lg font-black text-gray-500 cursor-not-allowed shadow-none transition-all";
        btnDaftar.onclick = null;

        document.getElementById('kuotaPagiLuar').innerText = "230";
        document.getElementById('kuotaSoreLuar').innerText = "230";
    }
}

function renderFormAnggota() {
    let jumlah = parseInt(document.getElementById('inputJumlahNatal').value) || 1;
    
    // Kunci maksimal 7 agar tidak bisa diakali via inspect element
    if (jumlah > 7) {
        jumlah = 7;
        document.getElementById('inputJumlahNatal').value = 7;
    }

    const container = document.getElementById('containerAnggotaNatal');
    container.innerHTML = '';

    if (jumlah > 1) {
        container.innerHTML += `<label class="block text-gray-300 text-sm font-semibold mb-2">Nama Anggota Tambahan *</label>`;
        for (let i = 1; i < jumlah; i++) {
            // Label i + 1 agar dimulai dari Anggota 2, 3, dst. Ditambah pattern anti-angka.
            container.innerHTML += `<input type="text" class="input-anggota-extra w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 mb-2" maxlength="50" pattern="[a-zA-Z\\s]+" title="Hanya huruf dan spasi" placeholder="Nama Anggota ${i + 1}" required>`;
        }
    }
}

window.bukaFormNatal = function () {
    const errorMsg = document.getElementById('errorMsg');
    const modalNatal = document.getElementById('modalNatal');
    const boxNatal = document.getElementById('boxNatal');

    errorMsg.classList.add('hidden');
    modalNatal.classList.remove('hidden');
    setTimeout(() => { modalNatal.classList.remove('opacity-0'); boxNatal.classList.remove('scale-95'); boxNatal.classList.add('scale-100'); }, 10);
}

window.tutupFormNatal = function () {
    const modalNatal = document.getElementById('modalNatal');
    const boxNatal = document.getElementById('boxNatal');

    modalNatal.classList.add('opacity-0'); boxNatal.classList.remove('scale-100'); boxNatal.classList.add('scale-95');
    setTimeout(() => { modalNatal.classList.add('hidden'); document.getElementById('formNatal').reset(); document.getElementById('containerAnggotaNatal').innerHTML = ''; }, 300);
}

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

    const jenisKendaraan = document.getElementById('inputJenisKendaraan').value;
    const jmlKendaraan = document.getElementById('inputJmlKendaraan').value;
    let infoKendaraan = jenisKendaraan;

    if (jenisKendaraan === 'Motor') {
        infoKendaraan = `Motor (${jmlKendaraan})`;
    }

    let arrAnggota = [];
    document.querySelectorAll('.input-anggota-extra').forEach(inp => {
        if (inp.value.trim() !== '') arrAnggota.push(sanitizeInput(inp.value));
    });
    const stringAnggota = arrAnggota.length > 0 ? arrAnggota.join(', ') : '-';

    const safeNama = sanitizeInput(namaRaw);
    const safeWA = sanitizeInput(waRaw);

    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';
    btn.disabled = true;

    grecaptcha.ready(function () {
        grecaptcha.execute('6Lc39yctAAAAAMFEJxjgh3GGOhxNRwpQSd3mSvpp', { action: 'submit_natal' }).then(async function (token) {
            
            // UBAH 1: Ganti FormData menjadi URLSearchParams agar terbaca oleh Vercel
            const payload = new URLSearchParams();
            payload.append("sesi", sesi);
            payload.append("nama", safeNama);
            payload.append("wa", safeWA);
            payload.append("jumlah", jumlah);
            payload.append("anggota", stringAnggota);
            payload.append("kendaraan", infoKendaraan);
            payload.append("recaptchaToken", token);

            try {
                // UBAH 2: Tambahkan headers Content-Type yang spesifik
                const response = await fetch(API_URL_NATAL, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: payload 
                });
                
                const result = await response.json();

                if (result.status === 'success') {
                    const noUrutServer = result.noUrut || "999";
                    document.getElementById('tiketNoUrut').innerText = noUrutServer.toString().padStart(3, '0');
                    document.getElementById('tiketSesi').innerText = sesi === 'Pagi' ? "SESI I (12.30)" : "SESI II (16.30)";
                    document.getElementById('tiketNama').innerText = safeNama;
                    document.getElementById('tiketJumlah').innerText = jumlah + " Orang";
                    document.getElementById('tiketKendaraan').innerText = infoKendaraan;
                    document.getElementById('tiketAnggota').innerText = stringAnggota;

                    if (result.sisaPagi !== undefined) document.getElementById('kuotaPagiLuar').innerText = result.sisaPagi;
                    if (result.sisaSore !== undefined) document.getElementById('kuotaSoreLuar').innerText = result.sisaSore;

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
                console.error(err);
                errorMsg.innerText = "Terjadi kendala jaringan. Pastikan koneksi stabil.";
                errorMsg.classList.remove('hidden');
            } finally {
                btn.innerHTML = '<span>Ambil Tiket</span> <i class="fas fa-ticket-alt"></i>';
                btn.disabled = false;
            }
        }).catch(function (err) {
            errorMsg.innerText = "Gagal memverifikasi reCAPTCHA. Coba matikan AdBlock.";
            errorMsg.classList.remove('hidden');
            btn.innerHTML = '<span>Ambil Tiket</span> <i class="fas fa-ticket-alt"></i>';
            btn.disabled = false;
        });
    });

}

window.tutupTiket = function () {
    const modalTiket = document.getElementById('modalTiket');
    modalTiket.classList.add('opacity-0');
    setTimeout(() => { modalTiket.classList.add('hidden'); modalTiket.classList.remove('flex'); }, 500);
}

window.downloadTiketAsImage = async function () {
    const area = document.getElementById("areaPrintTiket");
    // Turunkan resolusi render untuk HP (scale 1.5) agar tidak lemot
    const scaleValue = window.innerWidth < 768 ? 1.5 : 2; 
    
    const canvas = await html2canvas(area, {
        scale: scaleValue,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false // Matikan log sistem untuk mempercepat render
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `Tiket_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

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
}
