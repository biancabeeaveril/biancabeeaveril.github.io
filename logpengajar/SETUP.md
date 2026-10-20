# Panduan Setup — Log Pengajaran

App **Log Pengajaran** (folder `logpengajar/`) menyimpan riwayat mengajar tim: universitas → semester → mata kuliah → topik per pertemuan.

- **Frontend**: `logpengajar/index.html` (single file, tanpa build, tanpa dependency)
- **Data**: GitHub Gist, file `ajar-data.json`
- **Write proxy**: Cloudflare Worker (`logpengajar/worker.js`)
- **Deploy**: GitHub Pages (repo ini)

---

## Langkah 1 — Buat Gist

1. Buka [gist.github.com](https://gist.github.com)
2. Isi:
   - **Gist description**: `Log Pengajaran`
   - **Filename**: `ajar-data.json`
   - **Content**:
     ```json
     {"univs":[],"sems":[],"courses":[],"meetings":[],"topics":[]}
     ```
3. Klik **Create secret gist**
4. Salin **Gist ID** dari URL browser:
   ```
   https://gist.github.com/<username>/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         ini Gist ID-nya
   ```

> Secret gist **tidak** bisa dibaca langsung oleh browser tanpa token. Karena itu app membaca lewat Worker (`GET`), bukan lewat API GitHub langsung. Kalau Gist kamu **public**, pembacaan langsung juga bisa jalan sebagai fallback.

---

## Langkah 2 — Buat Personal Access Token (PAT)

PAT hanya dipakai Worker untuk tulis ke Gist. **Tidak pernah** ditaruh di kode browser.

1. Buka [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
   - **Note**: `log-pengajar-gist`
   - **Expiration**: `No expiration`
   - **Scope**: centang **`gist`** saja
3. **Generate token** → salin token (hanya tampil sekali): `ghp_xxxxxxxx...`

---

## Langkah 3 — Deploy Cloudflare Worker

1. Buka [workers.cloudflare.com](https://workers.cloudflare.com) → login
2. **Workers & Pages → Create application → Create Worker**
3. Nama: `log-pengajar-writer` → **Deploy**
4. **Edit code** → hapus isi default → paste isi `logpengajar/worker.js`
5. Cek daftar origin di bagian atas file:
   ```js
   const ALLOWED_ORIGINS = [
     'https://biancabeeaveril.github.io', // repo fork (username.github.io)
     'https://dionisiusnp.github.io',     // repo asal
   ];
   ```
   Tambahkan domain lain bila app dibuka dari domain berbeda (misal custom domain).
6. **Deploy**
7. **Settings → Variables and Secrets → Add** (2 secret, klik **Encrypt** lalu **Save**):

   | Secret | Nilai |
   |--------|-------|
   | `GIST_ID` | Gist ID dari Langkah 1 |
   | `GIST_PAT` | PAT dari Langkah 2 |

8. Salin URL Worker: `https://log-pengajar-writer.<subdomain>.workers.dev`

---

## Langkah 4 — Pasang konfigurasi ke kode

Buka `logpengajar/index.html`, cari blok `CONFIG` (± baris 300):

```javascript
const PASS_TEAM  = 'GANTI_KODE_TIM';   // kode akses tim pengajar

const GIST_ID    = 'GIST_ID_DISINI';
const WORKER_URL = 'WORKER_URL_DISINI';
```

Isi:

```javascript
const PASS_TEAM  = '20260101';

const GIST_ID    = '6bf5ebb0397393324168d3dd14c018c8';
const WORKER_URL = 'https://log-pengajar-writer.dionisiusn1.workers.dev';
```

Commit & push → GitHub Pages deploy otomatis.

> Kode yang sama juga dipakai homepage (`index.html`, konstanta `PASS_TEAM`) untuk fitur **Masuk** → **Ruang Tim**. Ganti di kedua file supaya sinkron.

---

## Langkah 5 — Mulai pakai

1. Buka `https://<username>.github.io/logpengajar/`
2. Masuk dengan **kode tim pengajar** → full akses tambah/edit/hapus
3. Klik **+ Tambah** di baris **Universitas** → isi nama → jadi chip label
4. Pilih universitas itu → **+ Tambah** di baris **Semester** → jadi chip label
5. Klik **+ Tambah Mata Kuliah** → isi nama/kode/pengajar → muncul sebagai **card**
6. Klik card → masuk halaman detail: daftar **pertemuan** + topik yang dibahas
7. Di tiap pertemuan: `+ Topik` untuk menambah topik, centang checkbox kalau topiknya **sudah dibahas**

> Label universitas & semester bersifat tetap: tambah sekali, hapus kalau memang dibatalkan
> (menghapus label ikut menghapus isinya). Isi yang berkembang tiap pertemuan (mata kuliah,
> pertemuan, topik) tetap bisa di-ubah lewat tombol ✎.

---

## Struktur Data (Gist)

```jsonc
{
  "univs":    [{ "id":"u1", "name":"Universitas Astrindo", "ord":0, "updatedAt":0 }],
  "sems":     [{ "id":"s1", "univId":"u1", "name":"Ganjil 2026/2027", "ord":0, "updatedAt":0 }],
  "courses":  [{ "id":"c1", "semId":"s1", "name":"Basis Data", "code":"IF201", "lecturer":"Budi", "ord":0, "updatedAt":0 }],
  "meetings": [{ "id":"m1", "courseId":"c1", "no":1, "date":"2026-09-05", "title":"Pengenalan Basis Data", "updatedAt":0 }],
  "topics":   [{ "id":"t1", "meetingId":"m1", "text":"Konsep basis data", "done":true, "ord":0, "updatedAt":0 }]
}
```

Semua array bersifat **flat** (relasi pakai `id`), jadi merge di Worker cukup satu aturan untuk semua tabel.

---

## Merge Strategy (anti data hilang)

Worker tidak menimpa Gist langsung, tapi **read-merge-write**:

| Tipe | Strategi |
|------|----------|
| Semua array (`univs`, `sems`, `courses`, `meetings`, `topics`) | Merge by `id` — item dengan `updatedAt` lebih baru menang |

Kalau dua orang edit data berbeda bersamaan, keduanya tetap tersimpan.

### Soft Delete

Hapus di browser tidak membuang item, tapi menandai `deleted: true` + update `updatedAt`. Item yang dihapus tidak muncul di UI tapi tetap tercatat di Gist (aman kalau salah hapus).

---

## Catatan Keamanan

- Kode akses (`PASS_TEAM`) dicek **di browser** — cocok untuk use case internal komunitas, tapi **bukan auth yang kuat**.
- Siapa pun yang tahu **URL Worker** bisa POST ke Gist tanpa kode akses. Kalau mau ditutup total: tambahkan header wajib di `worker.js` (misal `X-Ajar-Key`) dan simpan key-nya di secret Worker + konfigurasi frontend.
- **PAT tidak pernah** ada di kode HTML. Hanya di secret Worker.

---

## Rotasi PAT

1. GitHub → **Settings → Tokens** → hapus token lama → buat baru (scope `gist`)
2. Cloudflare → Worker `log-pengajar-writer` → **Settings → Variables and Secrets** → edit `GIST_PAT` → **Save**

---

## Troubleshooting

| Gejala | Penyebab / Solusi |
|--------|-------------------|
| "Kode tidak dikenali" | `PASS_TEAM` belum diganti di `index.html` |
| Data tidak muncul | Cek `GIST_ID` & `WORKER_URL` sudah diisi; cek secret Worker (`GIST_ID`, `GIST_PAT`) |
| Tab "CORS" di console | Domain halaman tidak ada di `ALLOWED_ORIGINS` (`worker.js`) |
| Perubahan tidak tersimpan | Buka DevTools → Network → lihat request POST ke Worker (statusnya 403/500 berarti secret Worker salah) |
| Gist terisi 0 byte | Worker menulis file `ajar-data.json` — pastikan tidak ada file dengan nama berbeda di Gist itu |
