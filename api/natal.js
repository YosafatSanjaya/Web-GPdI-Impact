export default async function handler(req, res) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const RECAPTCHA_SECRET = "6Lc39yctAAAAAA7b0Gk7fi7KuNXzeyvZreE4dGQ9"; // Secret Key Google kamu

    // Konfigurasi Header untuk API Supabase
    const supabaseHeaders = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };

    // Fungsi Kalkulasi Sisa Kuota (Otomatis potong yang batal)
    async function getSisaKuota(sesi) {
        const url = `${SUPABASE_URL}/rest/v1/pendaftar?select=jumlah,jml_batal&sesi=eq.${sesi}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const data = await response.json();
        const terpakai = data.reduce((acc, curr) => acc + (curr.jumlah - (curr.jml_batal || 0)), 0);
        return 275 - terpakai;
    }

    try {
        // ==========================================
        // ROUTING GET: Fetch Kuota Awal (Web Load)
        // ==========================================
        if (req.method === 'GET') {
            const [sisaPagi, sisaSore] = await Promise.all([
                getSisaKuota('Pagi'),
                getSisaKuota('Sore')
            ]);
            return res.status(200).json({ status: 'success', sisaPagi, sisaSore });
        }

        // ==========================================
        // ROUTING POST: Proses Pendaftaran Web
        // ==========================================
        if (req.method === 'POST') {
            // Parsing body dari URLSearchParams (Frontend)
            let bodyData;
            if (typeof req.body === 'string') {
                bodyData = Object.fromEntries(new URLSearchParams(req.body));
            } else {
                bodyData = req.body;
            }

            const { sesi, nama, wa, anggota, kendaraan, recaptchaToken } = bodyData;
            const jumlah = parseInt(bodyData.jumlah) || 1;

            // 1. Validasi Server Ketat
            if (jumlah < 1 || jumlah > 7) {
                return res.status(400).json({ status: "error", message: "Manipulasi terdeteksi: Maksimal 7 orang." });
            }
            if (!/^[A-Za-z\s]+$/.test(nama)) {
                return res.status(400).json({ status: "error", message: "Nama hanya boleh menggunakan huruf abjad." });
            }

            // 2. Verifikasi reCAPTCHA
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

            // 3. Auto-Recovery (Cek Duplikat WA)
            const dupUrl = `${SUPABASE_URL}/rest/v1/pendaftar?select=no_urut,kode_booking&wa=eq.${wa}&sesi=eq.${sesi}`;
            const dupRes = await fetch(dupUrl, { headers: supabaseHeaders });
            const dupData = await dupRes.json();
            
            // Jika WA sudah ada, langsung kirim tiket lama tanpa buat baru
            if (dupData && dupData.length > 0) {
                return res.status(200).json({
                    status: 'success',
                    noUrut: dupData[0].no_urut,
                    kodeBooking: dupData[0].kode_booking,
                    sisaPagi: await getSisaKuota('Pagi'),
                    sisaSore: await getSisaKuota('Sore')
                });
            }

            // 4. Cek Kuota & Generate Nomor Urut
            const sisaSekarang = await getSisaKuota(sesi);
            if (sisaSekarang < jumlah) {
                return res.status(400).json({ status: "error", message: `Maaf, Kuota tersisa ${sisaSekarang} kursi.` });
            }

            // Hitung total pendaftar di sesi tersebut untuk No Urut
            const urutUrl = `${SUPABASE_URL}/rest/v1/pendaftar?select=id&sesi=eq.${sesi}`;
            const urutRes = await fetch(urutUrl, { headers: supabaseHeaders });
            const urutData = await urutRes.json();
            const noUrut = urutData.length + 1;

            // Generate Kode Booking Random 6 Karakter
            const kodeBooking = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 5. Eksekusi Insert ke Supabase
            const insertPayload = {
                sesi, nama, wa, jumlah, anggota, kendaraan, no_urut: noUrut, kode_booking: kodeBooking, hadir: false
            };

            const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/pendaftar`, {
                method: 'POST',
                headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
                body: JSON.stringify(insertPayload)
            });

            if (!insertRes.ok) {
                throw new Error("Gagal menyimpan ke database.");
            }

            // 6. Kembalikan Respon Sukses ke Frontend (Sesuai format natal.js)
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
