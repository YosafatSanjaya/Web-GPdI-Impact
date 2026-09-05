export default async function handler(req, res) {
    // Ambil URL Google Script rahasia dari Environment Variables
    const GAS_URL = process.env.GAS_URL;

    if (!GAS_URL) {
        return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    try {
        // ROUTING UNTUK ADMIN (GET REQUEST)
        if (req.method === 'GET') {
            const queryParams = new URLSearchParams(req.query).toString();
            const response = await fetch(`${GAS_URL}?${queryParams}`);
            const data = await response.json();
            return res.status(200).json(data);
        }

        // ROUTING UNTUK PENDAFTARAN (POST REQUEST)
        if (req.method === 'POST') {
            const payload = new URLSearchParams(req.body);
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload
            });
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Gateway timeout' });
    }
}