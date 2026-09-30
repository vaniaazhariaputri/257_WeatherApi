const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3001;

const API_KEY = "SWjJnI1z0kC0dMuYTxon";

app.use(express.static(path.join(__dirname, "public")));

function pick(f, types) {
    for (const t of types) {
        if ((f.place_type || []).includes(t)) return f.text;
        const c = (f.context || []).find(x => String(x.id).split(".")[0] === t);
        if (c) return c.text;
    }
    return "-";
}

// Contoh: http://localhost:3001/api/lokasi?q=Kasihan
app.get("/api/lokasi", async (req, res) => {
    const kota = (req.query.q || "").trim();

    if (API_KEY === "ISI_API_KEY_KAMU") {
        return res.status(500).json({ message: "API_KEY belum diisi di app.js" });
    }
    if (!kota) {
        return res.status(400).json({ message: "Parameter q (lokasi) wajib diisi" });
    }

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json`;

    try {
        const response = await axios.get(url, {
            params: { key: API_KEY, language: "id", limit: 5 }
        });
        console.log(response.data); // tampilkan data hasil geocoding di console

        const hasil = response.data.features.map(f => ({
            lokasi: f.place_name,
            negara: pick(f, ["country"]),
            provinsi: pick(f, ["region"]),
            kecamatan: pick(f, ["municipality", "joint_municipality", "locality", "county", "subregion"]),
            longitude: f.center[0],
            latitude: f.center[1],
            tipe: (f.place_type || ["-"])[0]
        }));

        if (!hasil.length) {
            return res.status(404).json({ message: `Lokasi "${kota}" tidak ditemukan` });
        }
        res.json({ query: kota, hasil });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
