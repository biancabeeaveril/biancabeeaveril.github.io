# Panduan Setup — Log Pengajaran

App **Log Pengajaran** (folder `logpengajar/`) menyimpan riwayat mengajar tim: universitas → semester → mata kuliah → pertemuan (dengan **notulensi**: jam, tempat, peserta, agenda, catatan, keputusan) → topik (long text) + flag **berbayar/gratis**, plus **jadwal mentoring** dan **inventaris aset**. Tampilan tersedia dalam **2 bahasa: Indonesia & English (US)** — tombol **EN/ID** di nav.

- **Frontend**: `logpengajar/index.html` (single file, tanpa build, tanpa dependency)
- **Data**: GitHub Gist, file `ajar-data.json`
- **Deploy**: GitHub Pages (repo ini)
- **Akses**: kode tim pengajar `20070407`

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
     {"univs":[],"courses":[],"meetings":[],"topics":[],"members":[],"groups":[],"schedules":[],"assets":[]}
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

1. Buka `https://<username>.github.io/logpengajar/` → masuk dengan kode **`20070407`**
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

Aplikasi punya **4 navigasi** (masing-masing punya URL sendiri, bisa dibagikan):

| Tab | URL | Isi |
|-----|-----|-----|
| Universitas | `…/logpengajar/#/univ` | Label universitas + Tim Pengajar (kelompok & anggota) |
| Mata Kuliah | `…/logpengajar/#/matkul` (detail: `#/matkul/<id>`) | Semester 1–8, daftar mata kuliah, jadwal & pertemuan per mata kuliah |
| Jadwal | `…/logpengajar/#/jadwal` | Semua jadwal mentoring lintas mata kuliah |
| Inventaris | `…/logpengajar/#/inventaris` | Daftar aset tim pengajar (tabel, pencarian & filter kategori) |

**Bahasa**: tombol **EN/ID** di nav atas mengganti seluruh tampilan antarmuka ke English (US) atau Bahasa Indonesia. Preferensi tersimpan di browser (`localStorage` `ajar_lang`) dan **dipakai bersama dengan homepage** — tombol yang sama juga ada di homepage (terlihat sebelum login) dan di layar gerbang app ini (pojok kanan atas kartu, sebelum kode dimasukkan). Data (nama universitas, topik, catatan, dst.) tidak diterjemahkan — hanya label UI.

1. Masuk dengan kode tim pengajar → full akses tambah/edit/hapus
2. Tab **Universitas**: **+ Tambah** untuk label universitas, lalu **+ Kelompok** & **+ Anggota** untuk tim pengajar. Form **Tambah Kelompok** mendukung **multi-baris** (nama + dropdown **Induk** + checkbox **Joinable** + tombol **+ Tambah baris**). Kelompok **joinable** muncul di dropdown anggota; yang non-joinable hanya untuk struktur (ditandai 🔒). **Angkatan & Jabatan berupa dropdown** (pilih dari data yang ada; ada opsi "＋ Tulis sendiri…" bila nilai baru), **+ Tambah baris** bisa isi banyak anggota sekaligus
3. Tab **Mata Kuliah**: pilih universitas → pilih **Semester 1–8** (statis, tidak perlu dibuat) → **+ Tambah Mata Kuliah**
4. Form mata kuliah: isi nama/kode/**deskripsi (long text)**/pengajar. Centang **Program berbayar** → muncul **Nominal Harga (Rp)** + **Kode Kelas** — hanya kelas berbayar yang punya harga & kode; tanpa centang = **Gratis** (kedua field itu disembunyikan)
5. Klik card → detail (`#/matkul/<id>`): deskripsi, blok harga + kode kelas (berbayar saja), daftar **jadwal**, dan daftar **pertemuan**
6. **+ Tambah Jadwal** (di tab Jadwal atau di detail mata kuliah): **Hari** (dropdown), **Tanggal**, **Jam Mulai** & **Jam Selesai** (time picker), **Pelaksanaan** Online/Offline, **Tempat/Tautan**, **Mentor** (dropdown anggota tim pengajar), **Peserta** (long text)
7. **+ Tambah Pertemuan**: form ala notulensi rapat — **Nomor**, **Tanggal**, **Jam** (time picker), **Tempat**, **Peserta**, **Agenda** (long text), **Catatan/Isi Notulensi** (long text) & **Keputusan/Tindak Lanjut** (long text). Di tiap pertemuan: `+ Topik` untuk menambah **deskripsi topik** (teks panjang, boleh banyak baris — `Enter` simpan, `Shift+Enter` baris baru), centang checkbox kalau **sudah dibahas**; catatan & keputusan tampil sebagai blok di card pertemuan
8. Tab **Inventaris**: **+ Tambah Aset** → nama, kategori, jumlah, satuan, URL, tanggal pengadaan, keterangan (long text). Tabel dengan **pencarian "Cari nama aset…"** & **filter kategori** (opsi unik dari data, plus "Semua Kategori"); URL jadi tautan yang bisa diklik
9. Tombol mengambang **💬 Panduan Mentoring** (kanan bawah) berisi langkah mengajukan mentoring untuk tim — ikut berganti bahasa

> Label universitas bersifat tetap: tambah sekali, hapus kalau memang dibatalkan (menghapus label ikut menghapus isinya — termasuk jadwal & pertemuannya). Semester 1–8 selalu tersedia untuk setiap universitas.

---

## Struktur Data (Gist)

```jsonc
{
  "univs":    [{ "id":"u1", "name":"Universitas Astrindo", "ord":0, "updatedAt":0 }],
  "courses":  [{ "id":"c1", "univId":"u1", "sem":1, "name":"Basis Data", "code":"IF201",
                 "desc":"Ringkasan mata kuliah (long text)", "lecturer":"Budi",
                 "paid":true, "price":"150000", "classCode":"BD-2026", "ord":0, "updatedAt":0 }],
  "meetings": [{ "id":"m1", "courseId":"c1", "no":1, "date":"2026-09-05",
                 "title":"Agenda pertemuan (long text, boleh multi-baris)",
                 "time":"13:00", "place":"Ruang 301",
                 "peserta":"Ahmad\nBella", "catatan":"Isi notulensi (long text)",
                 "decisions":"Keputusan / tindak lanjut (long text)", "updatedAt":0 }],
  "topics":   [{ "id":"t1", "meetingId":"m1", "text":"Deskripsi topik (long text)",
                 "done":true, "ord":0, "updatedAt":0 }],
  "members":  [{ "id":"a1", "shortName":"Dion", "fullName":"Dionisius Nur P", "batch":"2023",
                 "role":"Koordinator", "groupId":"g1", "ord":0, "updatedAt":0 }],
  "groups":   [{ "id":"g1", "name":"Pengajar", "parentId":"", "joinable":true, "ord":0, "updatedAt":0 }],
  "schedules":[{ "id":"j1", "courseId":"c1", "day":"Sabtu", "date":"2026-11-07",
                 "timeStart":"13:00", "timeEnd":"15:00", "time":"13:00–15:00",
                 "mode":"Online", "place":"https://zoom.us/j/…", "mentor":"Dion",
                 "participants":"Ahmad\nBella", "ord":0, "updatedAt":0 }],
  "assets":   [{ "id":"s1", "name":"Akses Canva", "category":"Software", "qty":"2",
                 "unit":"akun", "url":"https://canva.com", "boughtAt":"2026-01-15",
                 "notes":"Untuk desain poster (long text)", "ord":0, "updatedAt":0 }]
}
```

- Semua array **flat** (relasi pakai `id`) → merge cukup satu aturan untuk semua tabel.
- **Tidak ada array `sems`** — semester adalah angka `sem: 1..8` di setiap mata kuliah (statis). Data lama format `sems` + `semId` otomatis dimigrasikan saat aplikasi dibuka (`migrate()`).
- `paid: true` = kelas **berbayar**; tidak ada / `false` = **gratis**. Hanya kelas berbayar yang memakai `price` (angka rupiah sebagai string, tanpa titik) dan `classCode` (kode kelas) — saat diubah ke gratis, kedua field itu dikosongkan otomatis.
- `title` (agenda pertemuan), `catatan`, `decisions`, `peserta` (pertemuan), `text` (topik), `desc` (mata kuliah), `notes` (aset) dan `participants` (jadwal) adalah **long text** — tidak dibatasi panjangnya.
- `schedules`: `day` = Senin–Minggu (disimpan Bahasa Indonesia, ditampilkan sesuai bahasa UI), `date` (opsional; kosong = berkelanjutan), `timeStart`/`timeEnd` = jam mulai & selesai (`"HH:MM"`, time picker), `time` = string turunan `"13:00–15:00"` (dipertahankan untuk kompatibilitas data lama), `mode` = `Online`/`Offline`, `place` = tautan (online) atau ruangan (offline), `mentor` = nama pendek anggota, `participants` = daftar peserta.
- `groups`: `parentId` = induk (kosong = kelompok induk); `joinable: false` = hanya struktur/induk — tidak muncul di dropdown anggota dan ditandai 🔒. Nama tampil hierarkis `Induk › Anak`.
- `groupId: ""` = anggota tanpa kelompok. Menghapus kelompok mengosongkan `groupId` anggotanya (anggota tidak ikut terhapus); menghapus induk juga mengosongkan `parentId` anak-anaknya.
- `assets` (inventaris): `name` (wajib), `category`, `qty`, `unit`, `url`, `boughtAt` (tanggal pengadaan), `notes`.
- **Bahasa**: hari (`day`) dan tanggal (`date`) disimpan dalam format Indonesia/ISO, ditampilkan sesuai bahasa aktif (hari diterjemahkan; tanggal memakai locale `id-ID`/`en-US`).

---

## Merge Strategy (anti data hilang)

Baik Worker maupun Mode A memakai **read-merge-write** — tidak pernah menimpa Gist langsung:

| Tipe | Strategi |
|------|----------|
| Semua array (`univs`, `courses`, `meetings`, `topics`, `members`, `groups`, `schedules`, `assets`) | Merge by `id` — item dengan `updatedAt` lebih baru menang |

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
