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

window.renderAdminTable = function () {
    const tbody = document.getElementById('tabelAdminBody');
    const dataSesi = adminDataCache[currentAdminTab];
    const searchInput = document.getElementById('adminSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let totalDaftar = 0;
    let totalHadir = 0;

    dataSesi.forEach(item => {
        totalDaftar += Number(item.jumlah);
        if (item.hadir) totalHadir += Number(item.jumlah);
    });

    document.getElementById('adminTotalDaftar').innerHTML = `${totalDaftar} <span class="text-sm font-normal text-gray-500">Orang</span>`;
    document.getElementById('adminTotalHadir').innerHTML = `${totalHadir} <span class="text-sm font-normal text-gray-500">Orang</span>`;
    document.getElementById('adminBelumHadir').innerHTML = `${totalDaftar - totalHadir} <span class="text-sm font-normal text-gray-500">Orang</span>`;

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
            const rowClass = item.hadir ? "bg-green-900/10" : "hover:bg-white/5";
            const btnClass = item.hadir ? "bg-green-600 text-white" : "bg-dark-700 border border-white/20 text-gray-400 hover:border-gold-500";
            const btnText = item.hadir ? `<i class="fas fa-check-double"></i> Telah Masuk` : `Ceklis Hadir`;

            tbody.innerHTML += `
              <tr class="${rowClass} transition-colors">
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
                  <button onclick="tandaiKehadiran(this, ${item.row}, ${!item.hadir})" class="${btnClass} px-4 py-2 rounded-lg font-bold text-xs transition-all w-32 shadow-lg">
                    ${btnText}
                  </button>
                </td>
              </tr>
            `;
        });
    }
}

window.tandaiKehadiran = async function (btnElement, rowIndex, isHadir) {
    btnElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    btnElement.disabled = true;

    const formData = new FormData();
    formData.append('action', 'markArrived');
    formData.append('sesi', currentAdminTab);
    formData.append('row', rowIndex);
    formData.append('isHadir', isHadir);

    try {
        const res = await fetch(API_URL_NATAL, { method: 'POST', body: formData });
        const result = await res.json();

        if (result.status === 'success') {
            const index = adminDataCache[currentAdminTab].findIndex(x => x.row === rowIndex);
            if (index !== -1) adminDataCache[currentAdminTab][index].hadir = isHadir;
            renderAdminTable();
        } else {
            alert("Gagal mencatat. Coba lagi.");
            renderAdminTable();
        }
    } catch (e) {
        alert("Gangguan koneksi.");
        renderAdminTable();
    }
}