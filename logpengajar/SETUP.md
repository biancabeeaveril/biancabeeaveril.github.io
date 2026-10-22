# Panduan Setup — Log Pengajaran

App **Log Pengajaran** (folder `logpengajar/`) menyimpan riwayat mengajar tim: universitas → semester → mata kuliah → pertemuan → topik (long text) + flag **berbayar/gratis**.

- **Frontend**: `logpengajar/index.html` (single file, tanpa build, tanpa dependency)
- **Data**: GitHub Gist, file `ajar-data.json`
- **Deploy**: GitHub Pages (repo ini)
- **Akses**: kode tim pengajar `20070704`

Ada **dua cara** menyambungkan ke Gist:

| Mode | Kebutuhan | Cocok untuk |
|------|-----------|-------------|
| **A. Gist langsung** (panel ⚙) | Gist + token PAT | Dipakai sekarang — tanpa deploy apa pun |
| **B. Worker** (opsional) | Cloudflare Worker | Kalau token tidak mau disimpan di browser |

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

> File `ajar-data.json` juga bisa dikosongkan/dibuat otomatis: panel ⚙ akan membuatnya kalau belum ada.

---

## Langkah 2 — Buat Personal Access Token (PAT)

1. Buka [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
   - **Note**: `log-pengajar-gist`
   - **Expiration**: pilih sesuai kebutuhan (mis. 90 hari)
   - **Scope**: centang **`gist` saja**
3. **Generate token** → salin (hanya tampil sekali): `ghp_xxxxxxxx...`

> ⚠️ Token harus benar-benar baru dan valid. Token yang sudah direvoke/Expired akan ditolak GitHub dengan HTTP 401.

---

## Langkah 3 — Sambungkan dari aplikasi (Mode A)

Tidak perlu deploy apa pun — semua dari dalam aplikasi:

1. Buka `https://<username>.github.io/logpengajar/` → masuk dengan kode **`20070704`**
2. Klik tombol **⚙** di kanan atas
3. Isi **Gist ID** + **Token GitHub (PAT)**
4. Klik **Hubungkan** → aplikasi mengecek koneksi, lalu reload
5. Titik hijau + label **"Sinkron Gist"** berarti tersambung

Titik abu + **"Lokal saja"** berarti data masih tersimpan di browser masing-masing.

**Putuskan** menghapus Gist ID & token dari browser tersebut.

> Konfigurasi ini tersimpan di `localStorage` browser admin (`ajar_gist_id`, `ajar_gist_pat`) — **tidak** pernah masuk ke repository.

---

## Langkah 4 (opsional) — Mode Worker

Kalau tim tidak nyaman menyimpan token di browser, jalankan write-proxy sendiri:

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
6. **Deploy**
7. **Settings → Variables and Secrets → Add** (2 secret, klik **Encrypt** lalu **Save**):

   | Secret | Nilai |
   |--------|-------|
   | `GIST_ID` | Gist ID dari Langkah 1 |
   | `GIST_PAT` | PAT dari Langkah 2 |

8. Salin URL Worker → isi di `logpengajar/index.html`, blok `CONFIG`:
   ```javascript
   const WORKER_URL = 'https://log-pengajar-writer.<subdomain>.workers.dev';
   ```
   Begitu `WORKER_URL` terisi, mode Worker dipakai otomatis dan panel ⚙ tidak lagi dipakai untuk menulis.

---

## Kode akses

```javascript
// logpengajar/index.html & index.html (homepage)
const PASS_TEAM = '20070407';
```

Nilai sudah terpasang di kedua file. Ganti di **dua** file supaya sinkron.

> Sudah login di homepage (Ruang Tim)? App Log Pengajaran **tidak** meminta kode lagi — session `aliria_in` dipakai bersama. "Keluar" di salah satunya mengakhiri sesi di keduanya.

---

## Langkah 5 — Mulai pakai

1. Masuk dengan kode tim pengajar → full akses tambah/edit/hapus
2. **+ Tambah** di baris **Universitas** → jadi chip label
3. Pilih universitas → pilih **Semester 1–8** (statis, tidak perlu dibuat — tidak ada tombol tambah/hapus)
4. **+ Tambah Mata Kuliah** → isi nama/kode/pengajar + centang **Program berbayar** bila kelas berbayar (tanpa centang = **Gratis**)
5. Klik card → halaman detail: daftar **pertemuan**
6. Di tiap pertemuan: `+ Topik` untuk menambah **deskripsi topik** (teks panjang, boleh banyak baris — `Enter` simpan, `Shift+Enter` baris baru), centang checkbox kalau **sudah dibahas**; **Deskripsi Pertemuan** juga berupa textarea panjang
7. **+ Kelompok** lalu **+ Anggota** untuk mengisi tim pengajar — modal mendukung **+ Tambah baris** (bisa isi banyak anggota sekaligus), ✕ menghapus baris, dan tombol Simpan menyimpan semua baris yang terisi

> Label universitas bersifat tetap: tambah sekali, hapus kalau memang dibatalkan (menghapus label ikut menghapus isinya). Semester 1–8 selalu tersedia untuk setiap universitas.

---

## Struktur Data (Gist)

```jsonc
{
  "univs":    [{ "id":"u1", "name":"Universitas Astrindo", "ord":0, "updatedAt":0 }],
  "courses":  [{ "id":"c1", "univId":"u1", "sem":1, "name":"Basis Data", "code":"IF201",
                 "lecturer":"Budi", "paid":false, "ord":0, "updatedAt":0 }],
  "meetings": [{ "id":"m1", "courseId":"c1", "no":1, "date":"2026-09-05",
                 "title":"Deskripsi pertemuan (long text, boleh multi-baris)", "updatedAt":0 }],
  "topics":   [{ "id":"t1", "meetingId":"m1", "text":"Deskripsi topik (long text)",
                 "done":true, "ord":0, "updatedAt":0 }],
  "members":  [{ "id":"a1", "shortName":"Dion", "fullName":"Dionisius Nur P", "batch":"2023",
                 "role":"Koordinator", "groupId":"g1", "ord":0, "updatedAt":0 }],
  "groups":   [{ "id":"g1", "name":"Pengajar", "ord":0, "updatedAt":0 }]
}
```

- Semua array **flat** (relasi pakai `id`) → merge cukup satu aturan untuk semua tabel.
- **Tidak ada array `sems`** — semester adalah angka `sem: 1..8` di setiap mata kuliah (statis). Data lama format `sems` + `semId` otomatis dimigrasikan saat aplikasi dibuka (`migrate()`).
- `paid: true` = kelas **berbayar**; tidak ada / `false` = **gratis**.
- `title` (pertemuan) dan `text` (topik) adalah **long text** — tidak dibatasi panjangnya.
- `groupId: ""` = anggota tanpa kelompok. Menghapus kelompok mengosongkan `groupId` anggotanya (anggota tidak ikut terhapus).

---

## Merge Strategy (anti data hilang)

Baik Worker maupun Mode A memakai **read-merge-write** — tidak pernah menimpa Gist langsung:

| Tipe | Strategi |
|------|----------|
| Semua array (`univs`, `courses`, `meetings`, `topics`, `members`, `groups`) | Merge by `id` — item dengan `updatedAt` lebih baru menang |

Dua orang edit data berbeda bersamaan → keduanya tetap tersimpan.

### Soft Delete

Hapus di browser tidak membuang item, tapi menandai `deleted: true` + update `updatedAt`. Item yang dihapus tidak muncul di UI tapi tetap tercatat di Gist.

---

## Catatan Keamanan

- Kode akses (`PASS_TEAM`) dicek **di browser** — untuk use internal komunitas, **bukan auth yang kuat**.
- **Mode A**: token PAT (scope `gist`) tersimpan di `localStorage` browser admin. Dampaknya dibatasi scope `gist`, tapi jangan dipakai di komputer bersama. **Putuskan** dari panel ⚙ kalau selesai.
- **Mode B**: PAT hanya ada di secret Worker; browser tidak pernah menyentuh token. Tapi siapa pun yang tahu **URL Worker** bisa POST ke Gist tanpa kode akses (bisa ditutup dengan header wajib, misal `X-Ajar-Key`).

---

## Rotasi PAT

1. GitHub → **Settings → Tokens** → hapus token lama → buat baru (scope `gist`)
2. **Mode A**: buka aplikasi → ⚙ → tempel token baru → **Hubungkan**
3. **Mode B**: Worker → **Settings → Variables and Secrets** → edit `GIST_PAT` → **Save**

---

## Troubleshooting

| Gejala | Penyebab / Solusi |
|--------|-------------------|
| "Kode tidak dikenali" | Kode salah — yang benar `20070407` |
| "Token tidak valid / sudah kedaluwarsa" (HTTP 401) | PAT salah, expired, atau sudah di-revoke. Buat baru (Langkah 2) |
| "Gist tidak ditemukan" (HTTP 404) | Gist ID salah, atau token tidak punya akses ke gist itu (gist milik akun lain) |
| Status "Lokal saja" | Belum tersambung — klik ⚙ lalu isi Gist ID + token |
| Tab "CORS" di console (Mode B) | Domain halaman tidak ada di `ALLOWED_ORIGINS` (`worker.js`) |
| Perubahan tidak tersimpan | DevTools → Network → cek request PATCH ke `api.github.com` (401 = token) atau POST ke Worker (500 = secret salah) |
| Gist terisi 0 byte / file hilang | Pastikan nama file persis `ajar-data.json` |
