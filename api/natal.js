export default async function handler(req, res) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const RECAPTCHA_SECRET = "6Lc39yctAAAAAA7b0Gk7fi7KuNXzeyvZreE4dGQ9"; 
    // Target Hash Password Admin (SHA-256)
    const TARGET_HASH = "466a940303ae3d0f255e1e3a4f3df0c0a2c4401d1f77313232a92c9cbc1c5639"; 

    const supabaseHeaders = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };

    // Helper SHA-256 Hash di Node.js (Vercel)
    const crypto = require('crypto');
    function buatHash(teks) {
        return crypto.createHash('sha256').update(teks).digest('hex');
    }

    // Hitung Sisa Kuota (Dikurangi Aktual Batal)
    async function getSisaKuota(sesi) {
        const url = `${SUPABASE_URL}/rest/v1/pendaftar?select=jumlah,jml_batal&sesi=eq.${sesi}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const data = await response.json();
        const terpakai = data.reduce((acc, curr) => acc + (curr.jumlah - (curr.jml_batal || 0)), 0);
        return 275 - terpakai;
    }

    // Fetch Data Lengkap Sesi untuk Admin
    async function getAdminData(sesi) {
        const url = `${SUPABASE_URL}/rest/v1/pendaftar?select=*&sesi=eq.${sesi}&order=id.asc`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const data = await response.json();
        
        return data.map(r => ({
            row: r.id, // ID Supabase menggantikan nomor Baris Sheet
            nama: r.nama,
            wa: r.wa,
            jumlah: r.jumlah,
            anggota: r.anggota,
            noUrut: r.no_urut,
            kendaraan: r.kendaraan,
            hadir: r.hadir,
            kodeBooking: r.kode_booking,
            statusDetail: r.status_detail || "",
            jmlHadir: r.jml_hadir || 0,
            jmlBatal: r.jml_batal || 0
        }));
    }

    try {
        // ==========================================
        // ROUTING GET: Fetch Kuota & Data Admin
        // ==========================================
        if (req.method === 'GET') {
            const { action, pass } = req.query;

            // 1. Jika Admin Minta Data
            if (action === 'getAdminData') {
                const passwordMasuk = pass || "";
                if (buatHash(passwordMasuk) !== TARGET_HASH) {
                    return res.status(403).json({ status: "error", message: "Akses Ditolak! Password Salah." });
                }

                const [pagi, sore] = await Promise.all([
                    getAdminData('Pagi'),
                    getAdminData('Sore')
                ]);

                return res.status(200).json({ status: 'success', pagi, sore });
            }

            // 2. Default: Get Kuota Web
            const [sisaPagi, sisaSore] = await Promise.all([
                getSisaKuota('Pagi'),
                getSisaKuota('Sore')
            ]);
            return res.status(200).json({ status: 'success', sisaPagi, sisaSore });
        }

        // ==========================================
        // ROUTING POST: Web Registration & Admin Update
        // ==========================================
        if (req.method === 'POST') {
            let bodyData;
            if (typeof req.body === 'string') {
                bodyData = Object.fromEntries(new URLSearchParams(req.body));
            } else {
                bodyData = req.body;
            }

            const { action } = req.query.action ? req.query : bodyData;

            // 1. JIKA REQUEST DARI ADMIN (UPDATE KEHADIRAN/BATAL)
            if (action === 'markArrived' || bodyData.action === 'markArrived') {
                const id = bodyData.row;
                const updatePayload = {
                    hadir: parseInt(bodyData.jmlHadir) > 0,
                    status_detail: bodyData.statusDetail || "",
                    jml_hadir: parseInt(bodyData.jmlHadir) || 0,
                    jml_batal: parseInt(bodyData.jmlBatal) || 0
                };

                const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/pendaftar?id=eq.${id}`, {
                    method: 'PATCH',
                    headers: supabaseHeaders,
                    body: JSON.stringify(updatePayload)
                });

                if (!updateRes.ok) throw new Error("Gagal mengupdate status kehadiran.");
                return res.status(200).json({ status: 'success' });
            }

            // 2. JIKA REQUEST PENDAFTARAN WEB NATAL
            const { sesi, nama, wa, anggota, kendaraan, recaptchaToken } = bodyData;
            const jumlah = parseInt(bodyData.jumlah) || 1;

            if (jumlah < 1 || jumlah > 7) {
                return res.status(400).json({ status: "error", message: "Maksimal 7 orang." });
            }

            if (recaptchaToken) {
                const captchaVerify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `secret=${RECAPTCHA_SECRET}&response=${recaptchaToken}`
                });
                const captchaResult = await captchaVerify.json();
                if (!captchaResult.success || captchaResult.score < 0.5) {
                    return res.status(403).json({ status: "error", message: "Aktivitas Bot terdeteksi." });
                }
            }

            // Auto Recovery (Cek Duplikat WA)
            const dupRes = await fetch(`${SUPABASE_URL}/rest/v1/pendaftar?select=no_urut,kode_booking&wa=eq.${wa}&sesi=eq.${sesi}`, { headers: supabaseHeaders });
            const dupData = await dupRes.json();
            if (dupData && dupData.length > 0) {
                return res.status(200).json({
                    status: 'success',
                    noUrut: dupData[0].no_urut,
                    kodeBooking: dupData[0].kode_booking,
                    sisaPagi: await getSisaKuota('Pagi'),
                    sisaSore: await getSisaKuota('Sore')
                });
            }

            const sisaSekarang = await getSisaKuota(sesi);
            if (sisaSekarang < jumlah) {
                return res.status(400).json({ status: "error", message: `Maaf, Kuota tersisa ${sisaSekarang} kursi.` });
            }

            // Hitung Nomor Urut
            const urutRes = await fetch(`${SUPABASE_URL}/rest/v1/pendaftar?select=id&sesi=eq.${sesi}`, { headers: supabaseHeaders });
            const urutData = await urutRes.json();
            const noUrut = urutData.length + 1;
            const kodeBooking = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Insert Data Baru
            const insertPayload = {
                sesi, nama, wa, jumlah, anggota, kendaraan, no_urut: noUrut, kode_booking: kodeBooking, hadir: false
            };

            const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/pendaftar`, {
                method: 'POST',
                headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
                body: JSON.stringify(insertPayload)
            });

            if (!insertRes.ok) throw new Error("Gagal menyimpan ke Supabase.");

            return res.status(200).json({
                status: 'success',
                noUrut: noUrut,
                kodeBooking: kodeBooking,
                sisaPagi: await getSisaKuota('Pagi'),
                sisaSore: await getSisaKuota('Sore')
            });
        }

    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
