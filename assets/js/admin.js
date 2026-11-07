/* ===================================================
   FITUR ADMIN DASHBOARD (GOLD THEME, EYE SVG & FULL ROW CLICK)
=================================================== */
const API_URL_NATAL = '/api/natal';
let adminDataCache = { Pagi: [], Sore: [] };
let currentAdminTab = 'Pagi';
let adminPasswordTemp = "";

document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById('inputPassAdmin');
    if (passInput) passInput.focus();
    initLoginPanitiaSlider();
});

// Slideshow otomatis bergantian antara kedua foto panitia (SAK01542.jpg & teracot.jpg)
function initLoginPanitiaSlider() {
    const img1 = document.getElementById('bgPanitia1');
    const img2 = document.getElementById('bgPanitia2');
    const dot1 = document.getElementById('dotSlide1');
    const dot2 = document.getElementById('dotSlide2');
    if (!img1 || !img2) return;

    let showFirst = true;
    setInterval(() => {
        showFirst = !showFirst;
        if (showFirst) {
            img1.style.opacity = '0.75';
            img2.style.opacity = '0';
            if (dot1 && dot2) {
                dot1.className = 'w-5 h-1.5 rounded-full bg-amber-300 transition-all duration-300';
                dot2.className = 'w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300';
            }
        } else {
            img1.style.opacity = '0';
            img2.style.opacity = '0.75';
            if (dot1 && dot2) {
                dot2.className = 'w-5 h-1.5 rounded-full bg-amber-300 transition-all duration-300';
                dot1.className = 'w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300';
            }
        }
    }, 5000);
}

// Fitur Tampilkan / Sembunyikan Password Menggunakan Ikon Mata SVG
window.toggleLihatPass = function () {
    const input = document.getElementById('inputPassAdmin');
    const eyeOpen = document.getElementById('eyeIconOpen');
    const eyeClosed = document.getElementById('eyeIconClosed');
    if (!input || !eyeOpen || !eyeClosed) return;

    if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        input.type = 'password';
        eyeClosed.classList.add('hidden');
        eyeOpen.classList.remove('hidden');
    }
};

// Proses Login dari Custom Login Card
window.submitLoginAdmin = async function (e) {
    e.preventDefault();
    const input = document.getElementById('inputPassAdmin');
    const btn = document.getElementById('btnSubmitLogin');
    const errMsg = document.getElementById('loginErrorMsg');
    const card = document.getElementById('loginCard');

    const passVal = input.value.trim();
    if (!passVal) return;

    adminPasswordTemp = passVal;
    errMsg.classList.add('hidden');
    card.classList.remove('shake');
    btn.disabled = true;
    btn.innerText = 'Memverifikasi Akses...';

    try {
        const response = await fetch(API_URL_NATAL + '?action=getAdminData&pass=' + encodeURIComponent(adminPasswordTemp));
        const data = await response.json();

        if (data.status === 'success') {
            adminDataCache.Pagi = data.pagi || [];
            adminDataCache.Sore = data.sore || [];

            document.getElementById('admin-login-screen').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');

            renderAdminTable();
        } else {
            errMsg.innerText = "Akses Ditolak: Kata sandi tidak sesuai, tanya Ka Yos.";
            errMsg.classList.remove('hidden');
            card.classList.add('shake');
            input.value = '';
            input.focus();
        }
    } catch (err) {
        errMsg.innerText = "Gagal terhubung ke server.";
        errMsg.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Masuk ke Dashboard';
    }
};

// Kunci Kembali Portal Admin
window.keluarAdmin = function () {
    adminPasswordTemp = "";
    adminDataCache = { Pagi: [], Sore: [] };
    document.getElementById('admin-dashboard').classList.add('hidden');
    const loginScreen = document.getElementById('admin-login-screen');
    const input = document.getElementById('inputPassAdmin');
    loginScreen.classList.remove('hidden');
    if (input) {
        input.value = '';
        input.focus();
    }
};

// Reset Kotak Pencarian
window.resetPencarianAdmin = function () {
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
        searchInput.value = '';
        renderAdminTable();
        searchInput.focus();
    }
};

// Muat Ulang Data dari Database
window.loadAdminData = async function () {
    const btnRefresh = document.getElementById('btnRefreshAdmin');
    const tbody = document.getElementById('tabelAdminBody');

    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.innerText = 'Sinkronisasi...';
    }
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-amber-400 font-bold text-xs uppercase tracking-widest">Sinkronisasi Database...</td></tr>`;
    }

    try {
        const response = await fetch(API_URL_NATAL + '?action=getAdminData&pass=' + encodeURIComponent(adminPasswordTemp));
        const data = await response.json();

        if (data.status === 'success') {
            adminDataCache.Pagi = data.pagi || [];
            adminDataCache.Sore = data.sore || [];
            renderAdminTable();
        } else {
            keluarAdmin();
        }
    } catch (err) {
        alert("Gagal terhubung ke database Supabase.");
    } finally {
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.innerText = 'Refresh Data';
        }
    }
};

window.switchAdminTab = function (sesi) {
    currentAdminTab = sesi;
    const tabPagi = document.getElementById('tabAdminPagi');
    const tabSore = document.getElementById('tabAdminSore');
    const activeClass = "gold-gradient-btn px-5 py-2.5 rounded-lg font-extrabold transition-all text-xs tracking-wide shadow";
    const inactiveClass = "hover:bg-slate-800/60 text-slate-400 px-5 py-2.5 rounded-lg font-bold transition-all text-xs tracking-wide";

    if (sesi === 'Pagi') {
        tabPagi.className = activeClass;
        tabSore.className = inactiveClass;
    } else {
        tabSore.className = activeClass;
        tabPagi.className = inactiveClass;
    }
    renderAdminTable();
};

window.renderAdminTable = function () {
    const tbody = document.getElementById('tabelAdminBody');
    const dataSesi = adminDataCache[currentAdminTab] || [];
    const searchInput = document.getElementById('adminSearchInput');
    const btnClear = document.getElementById('btnClearSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    if (btnClear) {
        if (searchTerm.length > 0) btnClear.classList.remove('hidden');
        else btnClear.classList.add('hidden');
    }

    let totalDaftar = 0;
    let totalHadir = 0;
    let totalBatal = 0;

    dataSesi.forEach(item => {
        totalDaftar += Number(item.jumlah) || 0;
        totalHadir += Number(item.jmlHadir || 0);
        totalBatal += Number(item.jmlBatal || 0);
    });

    document.getElementById('adminTotalDaftar').innerHTML = `${totalDaftar} <span class="text-xs font-medium text-slate-400">Dewasa</span>`;
    document.getElementById('adminTotalHadir').innerHTML = `${totalHadir} <span class="text-xs font-medium text-slate-400">Hadir</span>`;
    document.getElementById('adminTotalBatal').innerHTML = `${totalBatal} <span class="text-xs font-medium text-slate-400">Batal</span>`;
    document.getElementById('adminBelumHadir').innerHTML = `${Math.max(0, totalDaftar - totalHadir - totalBatal)} <span class="text-xs font-medium text-slate-400">Sisa</span>`;

    const filteredData = dataSesi.filter(item => {
        const noUrutStr = String(item.noUrut).padStart(3, '0');
        const nama = (item.nama || '').toLowerCase();
        const anggota = (item.anggota || '').toLowerCase();
        return noUrutStr.includes(searchTerm) || nama.includes(searchTerm) || anggota.includes(searchTerm);
    });

    renderStatistik(filteredData);

    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-500 text-xs font-medium">Tidak ada data yang sesuai dengan pencarian.</td></tr>`;
    } else {
        filteredData.forEach(item => {
            let btnClass = "bg-slate-800/90 group-hover:bg-amber-500 text-slate-200 group-hover:text-black border border-slate-700 group-hover:border-amber-400";
            let btnText = `Check-In`;
            let rowAccent = "border-l-4 border-l-transparent";
            let mobileStatusDot = `<span class="inline-block w-2 h-2 rounded-full bg-slate-600" title="Belum Hadir"></span>`;

            if (item.jmlHadir > 0) {
                btnClass = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
                btnText = `Hadir (${item.jmlHadir}/${item.jumlah})`;
                rowAccent = "border-l-4 border-l-emerald-500 bg-emerald-950/10";
                mobileStatusDot = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Sudah Hadir"></span>`;
            }
            if (item.jmlBatal === item.jumlah && item.jumlah > 0) {
                btnClass = "bg-red-500/15 text-red-400 border border-red-500/30";
                btnText = `Batal`;
                rowAccent = "border-l-4 border-l-red-500 bg-red-950/10 opacity-75";
                mobileStatusDot = `<span class="inline-block w-2 h-2 rounded-full bg-red-400" title="Batal"></span>`;
            }

            let waBersih = String(item.wa || '').replace(/\D/g, '');
            if (waBersih.startsWith('0')) {
                waBersih = '62' + waBersih.substring(1);
            } else if (waBersih.startsWith('8')) {
                waBersih = '62' + waBersih;
            }

            const hasValidWA = waBersih.length >= 9;

            // SELURUH BARIS <tr> BISA DIKLIK LANGSUNG DARI NOMOR URUT / NAMA DI HP
            tbody.innerHTML += `
              <tr onclick="bukaModalKelola(${item.row})" class="row-interactive group hover:bg-slate-800/50 ${rowAccent}">
                <td class="py-4 px-4 text-center">
                  <div class="inline-flex items-center justify-center gap-1.5 bg-navy-950 border border-slate-800 group-hover:border-amber-500/50 px-2.5 py-1.5 rounded-lg">
                    ${mobileStatusDot}
                    <span class="font-extrabold text-amber-400 text-sm tracking-tight">#${String(item.noUrut).padStart(3, '0')}</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-bold text-white group-hover:text-amber-300 transition-colors text-sm">
                      ${item.nama.replace(/\[MANUAL FOH\]|\[EDIT.*?\]/g, '').trim()}
                    </p>
                    ${item.nama.includes('[MANUAL FOH]')
                      ? `<span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Manual FOH</span>`
                      : ''}
                    ${item.nama.includes('[EDIT')
                      ? `<span class="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Revisi Data</span>`
                      : ''}
                  </div>
                  <p class="text-xs text-slate-400 mt-1 max-w-[240px] sm:max-w-[320px] truncate" title="${item.anggota}">
                    ${item.anggota && item.anggota !== '-' ? `+ ${item.anggota}` : 'Pendaftar Tunggal'}
                  </p>
                </td>
                <td class="py-4 px-4 text-center">
                  <span class="bg-navy-950 border border-slate-800 px-3 py-1 rounded-md text-white font-bold text-xs">${item.jumlah} Dewasa</span>
                  ${item.anak > 0 ? `<p class="text-[10px] text-slate-400 mt-1.5 font-semibold">Anak: <span class="text-amber-400 font-bold">${item.anak}</span></p>` : ''}
                </td>
                <td class="py-4 px-4 font-semibold text-slate-300 text-xs">${item.kendaraan}</td>
                <td class="py-4 px-4 text-slate-300 text-xs">
                  ${hasValidWA
                    ? `<a href="https://wa.me/${waBersih}" target="_blank" onclick="event.stopPropagation()" class="hover:text-emerald-400 underline decoration-slate-700 hover:decoration-emerald-400 underline-offset-4 transition-colors font-medium">
                         ${item.wa}
                       </a>`
                    : `<span class="text-slate-600">-</span>`}
                </td>
                <td class="py-4 px-4 text-center">
                  <button type="button" onclick="event.stopPropagation(); bukaModalKelola(${item.row})" class="${btnClass} px-4 py-2 rounded-lg font-bold text-xs transition-all w-32">
                    ${btnText}
                  </button>
                </td>
              </tr>
            `;
        });
    }
};

// RENDER ANALITIK (4 KARTU TANPA CLIP ART / EMOTIKON)
function renderStatistik(data) {
    let totalAnak = 0, mobil = 0, motor = 0, umum = 0;

    (data || []).forEach(item => {
        totalAnak += parseInt(item.anak) || 0;
        let ken = String(item.kendaraan || "").toLowerCase();
        if (ken.includes("mobil")) mobil++;
        else if (ken.includes("umum")) umum++;
        else if (ken.includes("motor")) {
            let match = ken.match(/\((\d+)\)/);
            motor += (match && match[1]) ? parseInt(match[1]) : 1;
        }
    });

    const statsContainer = document.getElementById('adminStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="bg-navy-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Anak (≤12 Thn)</span>
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                </div>
                <h3 class="text-2xl font-extrabold text-white leading-none">${totalAnak}</h3>
            </div>
            <div class="bg-navy-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Unit Mobil</span>
                    <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                </div>
                <h3 class="text-2xl font-extrabold text-white leading-none">${mobil}</h3>
            </div>
            <div class="bg-navy-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Unit Motor</span>
                    <span class="w-2 h-2 rounded-full bg-orange-400"></span>
                </div>
                <h3 class="text-2xl font-extrabold text-white leading-none">${motor}</h3>
            </div>
            <div class="bg-navy-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Kendaraan Umum</span>
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <h3 class="text-2xl font-extrabold text-white leading-none">${umum}</h3>
            </div>
        `;
    }
}

let currentRowKelola = null;
let currentSesiKelola = null;

window.bukaModalKelola = function (rowIndex) {
    const item = adminDataCache[currentAdminTab].find(x => x.row === rowIndex);
    if (!item) return;

    currentRowKelola = item.row;
    currentSesiKelola = currentAdminTab;

    document.getElementById('kelolaTitle').innerText = `Tiket #${String(item.noUrut).padStart(3, '0')} — ${item.nama.replace(/\[MANUAL FOH\]|\[EDIT.*?\]/g, '').trim()}`;

    let names = [{ type: 'Pendaftar Utama', name: item.nama.replace(/\[MANUAL FOH\]|\[EDIT.*?\]/g, '').trim() }];
    if (item.anggota && item.anggota !== '-') {
        item.anggota.split(',').forEach(ang => {
            names.push({ type: 'Anggota Rombongan', name: ang.trim() });
        });
    }

    let existingStatus = {};
    try { existingStatus = item.statusDetail ? JSON.parse(item.statusDetail) : {}; } catch (e) { }

    const list = document.getElementById('kelolaList');
    list.innerHTML = '';

    names.forEach((person, idx) => {
        const currentStatus = existingStatus[idx] || 'Belum';
        list.innerHTML += `
            <div class="bg-navy-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center gap-4">
                <div class="overflow-hidden">
                    <p class="text-[10px] text-amber-400 font-bold uppercase tracking-wider">${person.type}</p>
                    <p class="text-white font-bold text-sm truncate mt-0.5">${person.name}</p>
                </div>
                <select id="status_${idx}" class="status-select-item bg-navy-900 border border-slate-700 text-xs font-bold text-white rounded-lg px-3 py-2.5 focus:border-amber-500 outline-none cursor-pointer shrink-0">
                    <option value="Belum" ${currentStatus === 'Belum' ? 'selected' : ''}>Belum Hadir</option>
                    <option value="Hadir" ${currentStatus === 'Hadir' ? 'selected' : ''}>Hadir</option>
                    <option value="Batal" ${currentStatus === 'Batal' ? 'selected' : ''}>Batal</option>
                </select>
            </div>
        `;
    });

    const modal = document.getElementById('modalKelola');
    const box = document.getElementById('boxKelola');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);
};

// Fungsi Pintas Tandai Semua Anggota Hadir
window.setSemuaStatusKelola = function (statusValue) {
    document.querySelectorAll('#kelolaList .status-select-item').forEach(sel => {
        sel.value = statusValue;
    });
};

window.tutupModalKelola = function () {
    const modal = document.getElementById('modalKelola');
    const box = document.getElementById('boxKelola');
    modal.classList.add('opacity-0');
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200);
};

window.simpanKelola = async function () {
    const item = adminDataCache[currentSesiKelola].find(x => x.row === currentRowKelola);
    const btn = document.getElementById('btnSimpanKelola');
    btn.innerText = `Menyimpan...`;
    btn.disabled = true;

    let namesCount = 1 + (item.anggota && item.anggota !== '-' ? item.anggota.split(',').length : 0);
    let statusDetail = {};
    let jmlHadir = 0;
    let jmlBatal = 0;

    for (let i = 0; i < namesCount; i++) {
        let val = document.getElementById(`status_${i}`).value;
        statusDetail[i] = val;
        if (val === 'Hadir') jmlHadir++;
        if (val === 'Batal') jmlBatal++;
    }

    const formData = new URLSearchParams();
    formData.append('action', 'markArrived');
    formData.append('sesi', currentSesiKelola);
    formData.append('row', currentRowKelola);
    formData.append('statusDetail', JSON.stringify(statusDetail));
    formData.append('jmlHadir', jmlHadir);
    formData.append('jmlBatal', jmlBatal);

    try {
        const res = await fetch(API_URL_NATAL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        const result = await res.json();

        if (result.status === 'success') {
            item.statusDetail = JSON.stringify(statusDetail);
            item.jmlHadir = jmlHadir;
            item.jmlBatal = jmlBatal;
            renderAdminTable();
            tutupModalKelola();
        } else {
            alert("Gagal mencatat data ke database.");
        }
    } catch (e) {
        alert("Gangguan koneksi internet.");
    } finally {
        btn.innerText = `Simpan Kehadiran`;
        btn.disabled = false;
    }
};
