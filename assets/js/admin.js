/* ===================================================
   FITUR ADMIN DASHBOARD (CUSTOM LOGIN & LOGIKA PENUH)
=================================================== */
const API_URL_NATAL = '/api/natal';
let adminDataCache = { Pagi: [], Sore: [] };
let currentAdminTab = 'Pagi';
let adminPasswordTemp = "";

document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById('inputPassAdmin');
    if (passInput) passInput.focus();
});

// Fitur Tampilkan / Sembunyikan Password
window.toggleLihatPass = function () {
    const input = document.getElementById('inputPassAdmin');
    const icon = document.getElementById('iconMataPass');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash text-xs text-blue-400';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye text-xs';
    }
};

// Proses Login dari Custom Login Card (Tanpa prompt browser)
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
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> <span>Memverifikasi...</span>`;

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
            errMsg.querySelector('span').innerText = "Akses Ditolak: Password salah!";
            errMsg.classList.remove('hidden');
            card.classList.add('shake');
            input.value = '';
            input.focus();
        }
    } catch (err) {
        errMsg.querySelector('span').innerText = "Gagal terhubung ke server.";
        errMsg.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Masuk ke Dashboard</span> <i class="fas fa-arrow-right text-[11px]"></i>`;
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

// Muat Ulang Data dari Database
window.loadAdminData = async function () {
    const icon = document.getElementById('iconSyncAdmin');
    const tbody = document.getElementById('tabelAdminBody');

    if (icon) icon.classList.add('fa-spin');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-blue-400 font-semibold text-xs uppercase tracking-wider"><i class="fas fa-circle-notch fa-spin mr-2"></i> Sinkronisasi Database...</td></tr>`;
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
        if (icon) icon.classList.remove('fa-spin');
    }
};

window.switchAdminTab = function (sesi) {
    currentAdminTab = sesi;
    const tabPagi = document.getElementById('tabAdminPagi');
    const tabSore = document.getElementById('tabAdminSore');
    const activeClass = "bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-xs";
    const inactiveClass = "hover:bg-slate-800/60 text-slate-400 px-5 py-2 rounded-lg font-semibold transition-colors text-xs";

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
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let totalDaftar = 0;
    let totalHadir = 0;
    let totalBatal = 0;

    dataSesi.forEach(item => {
        totalDaftar += Number(item.jumlah) || 0;
        totalHadir += Number(item.jmlHadir || 0);
        totalBatal += Number(item.jmlBatal || 0);
    });

    document.getElementById('adminTotalDaftar').innerHTML = `${totalDaftar} <span class="text-xs font-normal text-slate-400">Dewasa</span>`;
    document.getElementById('adminTotalHadir').innerHTML = `${totalHadir} <span class="text-xs font-normal text-slate-400">Hadir</span>`;
    document.getElementById('adminTotalBatal').innerHTML = `${totalBatal} <span class="text-xs font-normal text-slate-400">Batal</span>`;
    document.getElementById('adminBelumHadir').innerHTML = `${Math.max(0, totalDaftar - totalHadir - totalBatal)} <span class="text-xs font-normal text-slate-400">Sisa</span>`;

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
            let btnClass = "bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500";
            let btnText = `Check-In`;

            if (item.jmlHadir > 0) {
                btnClass = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25";
                btnText = `<i class="fas fa-check-circle mr-1"></i> Hadir (${item.jmlHadir})`;
            }
            if (item.jmlBatal === item.jumlah && item.jumlah > 0) {
                btnClass = "bg-red-500/15 text-red-400 border border-red-500/30";
                btnText = `<i class="fas fa-ban mr-1"></i> Batal`;
            }

            let waBersih = String(item.wa || '').replace(/\D/g, '');
            if (waBersih.startsWith('0')) {
                waBersih = '62' + waBersih.substring(1);
            } else if (waBersih.startsWith('8')) {
                waBersih = '62' + waBersih;
            }

            const hasValidWA = waBersih.length >= 9;

            tbody.innerHTML += `
              <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3.5 px-4 text-center font-bold text-blue-400 text-base">#${String(item.noUrut).padStart(3, '0')}</td>
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-semibold text-white text-sm">
                      ${item.nama.replace(/\[MANUAL FOH\]|\[EDIT.*?\]/g, '').trim()}
                    </p>
                    ${item.nama.includes('[MANUAL FOH]')
                      ? `<span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">Manual FOH</span>`
                      : ''}
                    ${item.nama.includes('[EDIT')
                      ? `<span class="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">Revisi Data</span>`
                      : ''}
                  </div>
                  <p class="text-xs text-slate-400 mt-1 max-w-[260px] truncate" title="${item.anggota}">+ ${item.anggota}</p>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span class="bg-navy-950 border border-slate-800 px-3 py-1 rounded-md text-white font-semibold text-xs">${item.jumlah} Dewasa</span>
                  ${item.anak > 0 ? `<p class="text-[10px] text-slate-400 mt-1.5 font-medium">Anak: <span class="text-blue-400 font-semibold">${item.anak}</span></p>` : ''}
                </td>
                <td class="py-3.5 px-4 font-medium text-slate-300 text-xs">${item.kendaraan}</td>
                <td class="py-3.5 px-4 text-slate-300 text-xs">
                  ${hasValidWA
                    ? `<a href="https://wa.me/${waBersih}" target="_blank" class="hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors">
                         <i class="fab fa-whatsapp text-emerald-500 text-sm"></i> ${item.wa}
                       </a>`
                    : `<span class="text-slate-500">-</span>`}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <button onclick="bukaModalKelola(${item.row})" class="${btnClass} px-4 py-2 rounded-lg font-semibold text-xs transition-colors w-28">
                    ${btnText}
                  </button>
                </td>
              </tr>
            `;
        });
    }
};

// RENDER ANALITIK (4 KARTU: ANAK, MOBIL, MOTOR, UMUM)
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
            <div class="bg-navy-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-base border border-blue-500/20 shrink-0"><i class="fas fa-child"></i></div>
                <div>
                    <p class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Anak (≤12)</p>
                    <h3 class="text-xl font-bold text-white leading-tight mt-0.5">${totalAnak}</h3>
                </div>
            </div>
            <div class="bg-navy-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-base border border-indigo-500/20 shrink-0"><i class="fas fa-car"></i></div>
                <div>
                    <p class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Mobil</p>
                    <h3 class="text-xl font-bold text-white leading-tight mt-0.5">${mobil}</h3>
                </div>
            </div>
            <div class="bg-navy-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-base border border-amber-500/20 shrink-0"><i class="fas fa-motorcycle"></i></div>
                <div>
                    <p class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Motor</p>
                    <h3 class="text-xl font-bold text-white leading-tight mt-0.5">${motor}</h3>
                </div>
            </div>
            <div class="bg-navy-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-base border border-emerald-500/20 shrink-0"><i class="fas fa-bus"></i></div>
                <div>
                    <p class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Umum</p>
                    <h3 class="text-xl font-bold text-white leading-tight mt-0.5">${umum}</h3>
                </div>
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

    document.getElementById('kelolaTitle').innerText = `Tiket #${String(item.noUrut).padStart(3, '0')}`;

    let names = [{ type: 'Pendaftar Utama', name: item.nama.replace(/\[MANUAL FOH\]|\[EDIT.*?\]/g, '').trim() }];
    if (item.anggota && item.anggota !== '-') {
        item.anggota.split(',').forEach(ang => {
            names.push({ type: 'Anggota', name: ang.trim() });
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
                    <p class="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">${person.type}</p>
                    <p class="text-white font-semibold text-sm truncate mt-0.5">${person.name}</p>
                </div>
                <select id="status_${idx}" class="bg-navy-900 border border-slate-700 text-xs font-semibold text-white rounded-lg px-3 py-2 focus:border-blue-500 outline-none cursor-pointer">
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
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-1"></i> Menyimpan...`;
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
        btn.innerHTML = `Simpan Data Kehadiran`;
        btn.disabled = false;
    }
};
