const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    // Ambil nama wadah dari request (contoh: ?wadah=impact_kids)
    const { wadah } = req.query;
    
    // Cari lokasi folder di server Vercel
    const folderPath = path.join(process.cwd(), 'wadah_ibadah', wadah);
    
    try {
        if (fs.existsSync(folderPath)) {
            // Baca semua file di dalam folder tersebut
            const files = fs.readdirSync(folderPath);
            
            // Filter supaya yang dikirim cuma gambar & video saja
            const mediaFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/i));
            
            res.status(200).json(mediaFiles);
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan saat membaca folder.' });
    }
}