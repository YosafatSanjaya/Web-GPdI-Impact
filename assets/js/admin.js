/* ===================================================
   FITUR ADMIN DASHBOARD RUTING & LOGIKA
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

    const inputPassword = prompt("Akses Terkunci. Masukkan Password Admin:");

    if (!inputPassword) {
        window.location.href = "/index.html";
        return;
    }

    adminPasswordTemp = inputPassword;
    adminDashboard.classList.remove('hidden');
    document.body.classList.remove('bg-dark-900');
    document.body.classList.add('bg-black');

    loadAdminData();
}

window.loadAdminData = async function () {
    const icon = document.getElementById('iconSyncAdmin');
    const tbody = document.getElementById('tabelAdminBody');

    icon.classList.add('fa-spin');

    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500 font-bold"><i class="fas fa-spinner fa-spin mr-2"></i> Mengambil data dari server...</td></tr>`;
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
        alert("Gagal memuat data dari server.");
        window.location.href = "/index.html";
    } finally {
        icon.classList.remove('fa-spin');
    }
}

window.switchAdminTab = function (sesi) {
    currentAdminTab = sesi;
    const tabPagi = document.getElementById('tabAdminPagi');
    const tabSore = document.getElementById('tabAdminSore');

    if (sesi === 'Pagi') {
        tabPagi.className = "bg-gold-500 text-black px-6 py-2 rounded-xl font-bold transition-all";
        tabSore.className = "bg-dark-800 text-gray-400 border border-gold-500/30 px-6 py-2 rounded-xl font-bold transition-all";
    } else {
        tabSore.className = "bg-gold-500 text-black px-6 py-2 rounded-xl font-bold transition-all";
        tabPagi.className = "bg-dark-800 text-gray-400 border border-gold-500/30 px-6 py-2 rounded-xl font-bold transition-all";
    }
    renderAdminTable();
}

let currentRowKelola = null;
let currentSesiKelola = null;

window.renderAdminTable = function () {
    const tbody = document.getElementById('tabelAdminBody');
    const dataSesi = adminDataCache[currentAdminTab];
    const searchInput = document.getElementById('adminSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let totalDaftar = 0;
    let totalHadir = 0;
    let totalBatal = 0;

    // Kalkulasi Counter Baru
    dataSesi.forEach(item => {
        totalDaftar += Number(item.jumlah);
        totalHadir += Number(item.jmlHadir || 0);
        totalBatal += Number(item.jmlBatal || 0);
    });

    document.getElementById('adminTotalDaftar').innerHTML = `${totalDaftar} <span class="text-sm font-normal text-gray-500">Orang</span>`;
    document.getElementById('adminTotalHadir').innerHTML = `${totalHadir} <span class="text-sm font-normal text-gray-500">Orang</span>`;
    document.getElementById('adminTotalBatal').innerHTML = `${totalBatal} <span class="text-sm font-normal text-gray-500">Orang</span>`;
    document.getElementById('adminBelumHadir').innerHTML = `${totalDaftar - totalHadir - totalBatal} <span class="text-sm font-normal text-gray-500">Orang</span>`;

    const filteredData = dataSesi.filter(item => {
        const noUrutStr = String(item.noUrut).padStart(3, '0');
        const nama = (item.nama || '').toLowerCase();
        const anggota = (item.anggota || '').toLowerCase();
        return noUrutStr.includes(searchTerm) || nama.includes(searchTerm) || anggota.includes(searchTerm);
    });

    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500 font-bold">Data tidak ditemukan.</td></tr>`;
    } else {
        filteredData.forEach(item => {
            // Dinamika Tombol
            let btnClass = "bg-dark-700 border border-white/20 text-gray-400 hover:border-gold-500";
            let btnText = `Kelola Kehadiran`;

            if (item.jmlHadir > 0) {
                btnClass = "bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]";
                btnText = `<i class="fas fa-check-double"></i> Hadir (${item.jmlHadir})`;
            }
            if (item.jmlBatal === item.jumlah && item.jumlah > 0) {
                btnClass = "bg-red-900/40 text-red-400 border border-red-500/30";
                btnText = `<i class="fas fa-ban"></i> Batal Semua`;
            }

            tbody.innerHTML += `
              <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                <td class="p-4 text-center font-black text-gold-400 text-lg">${String(item.noUrut).padStart(3, '0')}</td>
                <td class="p-4">
                  <p class="font-bold text-white text-base">${item.nama}</p>
                  <p class="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title="${item.anggota}">Lainnya: ${item.anggota}</p>
                </td>
                <td class="p-4 text-center">
                  <span class="bg-dark-900 border border-white/10 px-3 py-1 rounded-lg text-white font-bold">${item.jumlah}</span>
                </td>
                <td class="p-4 font-medium text-gray-400">${item.kendaraan}</td>
                <td class="p-4 text-gray-400"><a href="https://wa.me/${item.wa}" target="_blank" class="hover:text-green-400"><i class="fab fa-whatsapp"></i> ${item.wa}</a></td>
                <td class="p-4 text-center">
                  <button onclick="bukaModalKelola(${item.row})" class="${btnClass} px-4 py-2 rounded-lg font-bold text-xs transition-all w-36 shadow-lg">
                    ${btnText}
                  </button>
                </td>
              </tr>
            `;
        });
    }
}

// BUKA MODAL DAN PECAH NAMA ANGGOTA
window.bukaModalKelola = function (rowIndex) {
    const item = adminDataCache[currentAdminTab].find(x => x.row === rowIndex);
    if (!item) return;

    currentRowKelola = item.row;
    currentSesiKelola = currentAdminTab;

    document.getElementById('kelolaTitle').innerText = `Kelola Urut #${String(item.noUrut).padStart(3, '0')}`;

    // Pecah nama pendaftar utama dan anggota
    let names = [{ type: 'Utama', name: item.nama }];
    if (item.anggota && item.anggota !== '-') {
        item.anggota.split(',').forEach(ang => {
            names.push({ type: 'Anggota', name: ang.trim() });
        });
    }

    let existingStatus = {};
    try { existingStatus = item.statusDetail ? JSON.parse(item.statusDetail) : {}; } catch (e) { }

    const list = document.getElementById('kelolaList');
    list.innerHTML = '';

    // Render Checklist per orang
    names.forEach((person, idx) => {
        const currentStatus = existingStatus[idx] || 'Belum';
        list.innerHTML += `
            <div class="bg-dark-800 p-4 rounded-xl border border-white/5 flex justify-between items-center gap-4">
                <div class="overflow-hidden">
                    <p class="text-[10px] text-gray-500 font-bold uppercase">${person.type}</p>
                    <p class="text-white font-bold truncate">${person.name}</p>
                </div>
                <select id="status_${idx}" class="bg-dark-900 border border-white/10 text-sm text-white rounded-lg px-2 py-2 focus:border-gold-500 outline-none">
                    <option value="Belum" ${currentStatus === 'Belum' ? 'selected' : ''}>Belum Datang</option>
                    <option value="Hadir" ${currentStatus === 'Hadir' ? 'selected' : ''}>✅ Hadir</option>
                    <option value="Batal" ${currentStatus === 'Batal' ? 'selected' : ''}>❌ Batal</option>
                </select>
            </div>
        `;
    });

    const modal = document.getElementById('modalKelola');
    const box = document.getElementById('boxKelola');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);
}

window.tutupModalKelola = function () {
    const modal = document.getElementById('modalKelola');
    const box = document.getElementById('boxKelola');
    modal.classList.add('opacity-0'); box.classList.remove('scale-100'); box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

// SIMPAN HASIL STATUS (HADIR/BATAL) KE SERVER
window.simpanKelola = async function () {
    const item = adminDataCache[currentSesiKelola].find(x => x.row === currentRowKelola);
    const btn = document.getElementById('btnSimpanKelola');
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Menyimpan...`;
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
        } else { alert("Gagal mencatat data."); }
    } catch (e) { alert("Gangguan koneksi."); }
    finally {
        btn.innerHTML = `Simpan Kehadiran`;
        btn.disabled = false;
    }
}
