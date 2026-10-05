/* ===================================================
   FITUR ADMIN DASHBOARD (BUG FIXED & PREMIUM UI)
=================================================== */
const API_URL_NATAL = '/api/natal';
let adminDataCache = { Pagi: [], Sore: [] };
let currentAdminTab = 'Pagi';
let adminPasswordTemp = "";

document.addEventListener("DOMContentLoaded", () => {
    initAdminPortal();
});

async function initAdminPortal() {
    const adminDashboard = document.getElementById('admin-dashboard');
    const inputPassword = prompt("Akses Admin Terkunci. Masukkan Password:");

    if (!inputPassword) {
        window.location.href = "/index.html";
        return;
    }

    adminPasswordTemp = inputPassword;
    adminDashboard.classList.remove('hidden');
    loadAdminData();
}

window.loadAdminData = async function () {
    const icon = document.getElementById('iconSyncAdmin');
    const tbody = document.getElementById('tabelAdminBody');

    icon.classList.add('fa-spin');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-gold-500 font-bold tracking-widest text-xs uppercase"><i class="fas fa-circle-notch fa-spin mr-3 text-lg"></i> Sinkronisasi Database...</td></tr>`;
    }

    try {
        const response = await fetch(API_URL_NATAL + '?action=getAdminData&pass=' + encodeURIComponent(adminPasswordTemp));
        const data = await response.json();

        if (data.status === 'success') {
            adminDataCache.Pagi = data.pagi;
            adminDataCache.Sore = data.sore;
            renderAdminTable();
        } else {
            alert("Akses Ditolak Server: Password Salah!");
            window.location.href = "/index.html";
        }
    } catch (err) {
        alert("Gagal terhubung ke database Supabase.");
        window.location.href = "/index.html";
    } finally {
        icon.classList.remove('fa-spin');
    }
}

window.switchAdminTab = function (sesi) {
    currentAdminTab = sesi;
    const tabPagi = document.getElementById('tabAdminPagi');
    const tabSore = document.getElementById('tabAdminSore');
    const activeClass = "bg-gold-500 text-black px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all text-sm";
    const inactiveClass = "hover:bg-white/5 text-gray-400 px-8 py-2.5 rounded-xl font-bold transition-all text-sm";

    if (sesi === 'Pagi') {
        tabPagi.className = activeClass;
        tabSore.className = inactiveClass;
    } else {
        tabSore.className = activeClass;
        tabPagi.className = inactiveClass;
    }
    renderAdminTable();
}

window.renderAdminTable = function () {
    const tbody = document.getElementById('tabelAdminBody');
    const dataSesi = adminDataCache[currentAdminTab];
    const searchInput = document.getElementById('adminSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let totalDaftar = 0;
    let totalHadir = 0;
    let totalBatal = 0;

    dataSesi.forEach(item => {
        totalDaftar += Number(item.jumlah);
        totalHadir += Number(item.jmlHadir || 0);
        totalBatal += Number(item.jmlBatal || 0);
    });

    document.getElementById('adminTotalDaftar').innerHTML = `${totalDaftar} <span class="text-sm font-normal text-gray-500">Tiket</span>`;
    document.getElementById('adminTotalHadir').innerHTML = `${totalHadir} <span class="text-sm font-normal text-gray-500">Hadir</span>`;
    document.getElementById('adminTotalBatal').innerHTML = `${totalBatal} <span class="text-sm font-normal text-gray-500">Batal</span>`;
    document.getElementById('adminBelumHadir').innerHTML = `${totalDaftar - totalHadir - totalBatal} <span class="text-sm font-normal text-gray-500">Sisa</span>`;

    const filteredData = dataSesi.filter(item => {
        const noUrutStr = String(item.noUrut).padStart(3, '0');
        const nama = (item.nama || '').toLowerCase();
        const anggota = (item.anggota || '').toLowerCase();
        return noUrutStr.includes(searchTerm) || nama.includes(searchTerm) || anggota.includes(searchTerm);
    });

    // PANGGIL RENDER STATISTIK DI SINI (BUKAN DI LUAR FUNGSI)
    renderStatistik(filteredData);

    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-gray-500 font-medium">Tidak ada data yang sesuai pencarian.</td></tr>`;
    } else {
        filteredData.forEach(item => {
            let btnClass = "bg-white/5 hover:bg-gold-500/20 text-gray-300 hover:text-gold-400 border border-white/10 hover:border-gold-500/50";
            let btnText = `Check-In`;

            if (item.jmlHadir > 0) {
                btnClass = "bg-green-500/10 text-green-400 border border-green-500/30";
                btnText = `<i class="fas fa-check-circle"></i> Hadir (${item.jmlHadir})`;
            }
            if (item.jmlBatal === item.jumlah && item.jumlah > 0) {
                btnClass = "bg-red-500/10 text-red-400 border border-red-500/30";
                btnText = `<i class="fas fa-ban"></i> Batal`;
            }

            let waBersih = String(item.wa).replace(/\D/g, ''); 
            if (waBersih.startsWith('0')) {
                waBersih = '62' + waBersih.substring(1); 
            } else if (waBersih.startsWith('8')) {
                waBersih = '62' + waBersih; 
            }

            tbody.innerHTML += `
              <tr class="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                <td class="py-4 px-5 text-center font-black text-gold-500 text-lg">${String(item.noUrut).padStart(3, '0')}</td>
                <td class="py-4 px-5">
                  <p class="font-bold text-white text-base">${item.nama}</p>
                  <p class="text-[11px] text-gray-500 mt-1 max-w-[200px] truncate" title="${item.anggota}">+ ${item.anggota}</p>
                </td>
                <td class="py-4 px-5 text-center">
                  <span class="bg-dark-900 border border-white/10 px-4 py-1.5 rounded-lg text-white font-black text-sm">${item.jumlah}</span>
                  ${item.anak > 0 ? `<p class="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Anak: <span class="text-white bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">${item.anak}</span></p>` : ''}
                </td>
                <td class="py-4 px-5 font-medium text-gray-400 text-sm">${item.kendaraan}</td>
                <td class="py-4 px-5 text-gray-400 text-sm">
                  <a href="https://wa.me/${waBersih}" target="_blank" class="hover:text-green-400 flex items-center gap-2 transition-colors">
                    <i class="fab fa-whatsapp text-green-500"></i> ${item.wa}
                  </a>
                </td>
                <td class="py-4 px-5 text-center">
                  <button onclick="bukaModalKelola(${item.row})" class="${btnClass} px-5 py-2.5 rounded-xl font-bold text-xs transition-all w-32 shadow-sm">
                    ${btnText}
                  </button>
                </td>
              </tr>
            `;
        });
    }
}

// RENDER ANALITIK
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
    if(statsContainer) {
        statsContainer.innerHTML = `
            <div class="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl border border-blue-500/20 shrink-0"><i class="fas fa-child"></i></div>
                <div>
                    <p class="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total Anak (≤ 12)</p>
                    <h3 class="text-2xl font-black text-white leading-none">${totalAnak}</h3>
                </div>
            </div>
            <div class="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl border border-indigo-500/20 shrink-0"><i class="fas fa-car"></i></div>
                <div>
                    <p class="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total Mobil</p>
                    <h3 class="text-2xl font-black text-white leading-none">${mobil}</h3>
                </div>
            </div>
            <div class="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl border border-orange-500/20 shrink-0"><i class="fas fa-motorcycle"></i></div>
                <div>
                    <p class="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total Motor</p>
                    <h3 class="text-2xl font-black text-white leading-none">${motor}</h3>
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

    let names = [{ type: 'Pendaftar Utama', name: item.nama }];
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
            <div class="bg-black/50 p-4 rounded-xl border border-white/5 flex justify-between items-center gap-4 hover:border-gold-500/30 transition-colors">
                <div class="overflow-hidden">
                    <p class="text-[9px] text-gold-500 font-bold uppercase tracking-widest">${person.type}</p>
                    <p class="text-white font-bold truncate mt-0.5">${person.name}</p>
                </div>
                <select id="status_${idx}" class="bg-dark-900 border border-white/10 text-xs font-bold text-white rounded-lg px-3 py-2.5 focus:border-gold-500 outline-none cursor-pointer">
                    <option value="Belum" ${currentStatus === 'Belum' ? 'selected' : ''}>⏳ Belum</option>
                    <option value="Hadir" ${currentStatus === 'Hadir' ? 'selected' : ''}>✅ Hadir</option>
                    <option value="Batal" ${currentStatus === 'Batal' ? 'selected' : ''}>❌ Batal</option>
                </select>
            </div>
        `;
    });

    const modal = document.getElementById('modalKelola');
    const box = document.getElementById('boxKelola');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);
}

window.tutupModalKelola = function () {
    const modal = document.getElementById('modalKelola');
    const box = document.getElementById('boxKelola');
    modal.classList.add('opacity-0'); box.classList.remove('scale-100'); box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
}

window.simpanKelola = async function () {
    const item = adminDataCache[currentSesiKelola].find(x => x.row === currentRowKelola);
    const btn = document.getElementById('btnSimpanKelola');
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Menyimpan...`;
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
        } else { alert("Gagal mencatat data ke database."); }
    } catch (e) { alert("Gangguan koneksi internet."); }
    finally {
        btn.innerHTML = `Simpan Data Kehadiran`;
        btn.disabled = false;
    }
}
