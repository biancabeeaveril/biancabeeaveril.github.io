# Rak Perpustakaan

Portal multi-halaman berisi alat kerja tim + **Kelola Alteco** — aplikasi manajemen organisasi berbasis web (single-file, GitHub Pages, tanpa server).

---

## Struktur Repo

```
/
├── index.html              ← Homepage (banner Aliria Tech Community + fitur Masuk)
├── tentang.html           ← Isi homepage lama: misi, program, keratin sama, carousel
├── assets/                 ← Aset gambar homepage
│   ├── bg-hex.png          ← Background pola heksagon
│   ├── hero-mentoring.jpg  ← Foto mentoring Universitas Dinamika
│   ├── logo-universitas-dinamika.png  ← Logo Universitas Dinamika (transparan)
│   ├── logo-aliria-tech.png            ← Logo Aliria Tech Community (transparan)
│   └── emblem-aliria.png               ← Emblem Aliria (navbar & modal login)
├── proyekan/index.html     ← Referensi command & AI tools
├── pengajar/index.html     ← Sektor industri + modul ERP
├── pemasaran/index.html    ← Siklus penawaran
├── mitra/index.html        ← Logo & info mitra
├── todolist/index.html     ← Kelola Alteco (app utama)
├── logpengajar/            ← Log Pengajaran (riwayat mengajar tim)
│   ├── index.html          ← Aplikasi (single-file)
│   ├── worker.js           ← Cloudflare Worker (write proxy)
│   └── SETUP.md            ← Panduan setup Gist + Worker
├── banner_1.png            ← Foto komunitas (carousel halaman Tentang)
├── banner_2.jpg            ← Foto mentoring (carousel halaman Tentang)
├── banner_3.jpg            ← Foto komunitas (carousel halaman Tentang)
├── OneSignalSDKWorker.js   ← Service worker push notif
└── .github/workflows/
    └── daily-notif.yml     ← Cron harian kirim push notif
```

---

## Homepage & Fitur Masuk

Homepage (`index.html`) adalah banner **Aliria Tech Community × Universitas Dinamika — Mentoring** (silver geometris, logo, foto mentoring, kontak Instagram & WhatsApp).

Tombol **Masuk** membuka modal kode akses (punya tombol mata untuk tampil/sembunyikan kode). Kode yang benar memunculkan section **Ruang Tim** berisi link ke **Log Pengajaran**.

| Nilai | Lokasi |
|-------|--------|
| `PASS_TEAM = '20070407'` | `index.html` (blok `CONFIG` di bawah) |
| `PASS_TEAM = '20070407'` | `logpengajar/index.html` (blok `CONFIG`) |

> Satu login berlaku untuk homepage **dan** app Log Pengajaran (session `sessionStorage`): masuk di homepage → buka Log Pengajaran → langsung terbuka, tidak diminta kode lagi. "Keluar" di salah satu keduanya mengakhiri sesi di keduanya.

---

## Log Pengajaran (Tim Pengajar)

App terpisah untuk mencatat riwayat mengajar: **universitas → semester (statis 1–8) → mata kuliah (card) → jadwal & pertemuan → topik**, plus daftar **anggota tim pengajar**.

| Komponen | Isi |
|----------|-----|
| Frontend | `logpengajar/index.html` (single-file, tanpa build, tanpa dependency) |
| Data | GitHub Gist — file `ajar-data.json` |
| Sinkronisasi | **Gist langsung** (panel ⚙ di app) atau **Cloudflare Worker** (opsional, `logpengajar/worker.js`) |
| Deploy | GitHub Pages |

Fitur yang dipakai tim pengajar:

- **3 navigasi dengan URL sendiri** — `#/univ` (Universitas & tim pengajar), `#/matkul` (daftar + detail `#/matkul/<id>`), `#/jadwal` (jadwal mentoring) — bisa di-bookmark / dibagikan ke sesama tim
- Hierarki **Universitas → Semester → Mata Kuliah → Pertemuan → Topik**
- **Semester 1–8 statis** — bukan CRUD: tidak ada tombol tambah/hapus, langsung tersedia di tiap universitas
- **Mata kuliah punya deskripsi** (long text); kelas **berbayar** punya **nominal harga** (Rp) + **kode kelas** yang hanya muncul untuk kelas berbayar — kelas gratis otomatis tanpa harga & kode
- **Jadwal mentoring** per mata kuliah: **hari, jam, tanggal, Online/Offline, tempat/tautan, mentor (dropdown anggota), peserta** — tampil di tab Jadwal & di detail mata kuliah
- **Deskripsi** (topik & pertemuan) berupa **long text** — textarea multi-baris tanpa batas panjang
- Centang **sudah dibahas** per topik + progres persentase per mata kuliah
- Flag **Berbayar / Gratis** per mata kuliah (checkbox di form, tampil sebagai badge di card & detail)
- **Tambah Anggota** (modal multi-baris, `+ Tambah baris`): nama pendek, nama lengkap, **angkatan & jabatan berupa dropdown** (pilih dari data yang ada, atau "＋ Tulis sendiri…" bila baru), kelompok — plus **+ Kelompok** (chip bisa difilter, ✎ ubah, 🗑 hapus)
- **Tombol mengambang 💬 Panduan Mentoring** (kanan bawah) — panduan langkah mengajukan mentoring
- Sinkron ke Gist: klik **⚙** di nav → isi Gist ID + PAT (scope `gist`) → **Hubungkan** (file dibuat otomatis bila belum ada)
- Status sinkron di nav: hijau "Sinkron Gist" / "Lokal saja" kalau belum tersambung

Cara setup (Gist, PAT, koneksi ⚙, Worker opsional, kode akses): **[`logpengajar/SETUP.md`](logpengajar/SETUP.md)**

---

## Fork & Deploy ke Repo Baru

### 1. Fork / Clone

```bash
git clone https://github.com/dionisiusnp/dionisiusnp.github.io.git
cd dionisiusnp.github.io
```

Atau fork via GitHub UI → rename repo sesuai username: `<username>.github.io`

### 2. Aktifkan GitHub Pages

GitHub → repo → **Settings → Pages → Source: Deploy from branch → branch: main → / (root)**

Situs live di: `https://<username>.github.io`

---

## Setup Layanan Eksternal

Kelola Alteco butuh 4 layanan eksternal: **GitHub Gist** (data), **Cloudflare Workers** (write proxy), **OneSignal** (push notif), dan **GitHub Actions** (cron). Firebase Hosting opsional sebagai alternatif GitHub Pages.

---

## A — GitHub Gist (Penyimpanan Data)

Data organisasi disimpan di Gist agar semua device dapat data terbaru tanpa backend server.

### A1. Buat Gist

1. Buka [gist.github.com](https://gist.github.com)
2. Isi:
   - **Description**: nama organisasimu
   - **Filename**: `alteco-data.json`
   - **Content**:
     ```json
     {"kelompoks":[],"members":[],"tasks":[],"assets":[],"events":[],"projects":[],"cultures":[],"regulasi":{"visi":"","misi":"","syaratAnggota":[],"syaratTim":[],"sanksi":[]},"orgName":"Nama Organisasi","settings":{"pushNotifEnabled":false,"notifTime":"07:00","notifDaysBefore":1,"writePat":""}}
     ```
3. Klik **Create secret gist**
4. Salin **Gist ID** dari URL:
   ```
   https://gist.github.com/<username>/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   ```

### A2. Buat GitHub Personal Access Token (PAT)

PAT dibutuhkan untuk dua keperluan: Cloudflare Worker secret (agar app bisa tulis ke Gist) dan GitHub Actions secret (agar cron harian bisa baca/tulis Gist).

1. Buka [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. Isi:
   - **Note**: `kelola-gist`
   - **Expiration**: No expiration
   - **Scope**: centang `gist` saja
4. Generate → **salin token sekarang** (hanya tampil sekali)

> PAT **jangan** ditaruh di kode atau browser. Disimpan di Cloudflare Worker secret dan GitHub Actions secret saja (lihat E dan D).

### A3. Pasang Gist ID ke Kode

Buka `todolist/index.html`, baris ~596:

```javascript
const GIST_ID   = 'GIST_ID_DISINI';
const WORKER_URL= 'WORKER_URL_DISINI';
```

Ganti `GIST_ID` dengan Gist ID dari A1. `WORKER_URL` diisi setelah setup Cloudflare Worker (langkah E). Commit & push.

---

## B — OneSignal (Push Notification)

### B1. Daftar & Buat App

1. Buka [onesignal.com](https://onesignal.com) → daftar akun gratis
2. **New App** → beri nama → pilih platform **Web**
3. Setup Web:
   - **Integration**: `Custom Code`
   - **Site URL**: `https://<username>.github.io` (atau domain Firebase jika pakai hosting Firebase)
   - **Default Icon URL**: URL ikon organisasimu (opsional)
4. Selesaikan wizard

### B2. Ambil Credentials

Di dashboard OneSignal → **Settings → Keys & IDs**:

| Key | Format |
|-----|--------|
| **App ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| **REST API Key** | `os_v2_...` |

### B3. Pasang App ID ke Kode

Buka `todolist/index.html`, baris ~593:

```javascript
const ONESIGNAL_APP_ID = 'ONESIGNAL_APP_ID_DISINI';
```

Ganti dengan App ID dari B2. Commit & push.

### B4. Service Worker

File `OneSignalSDKWorker.js` di root repo sudah siap — tidak perlu diubah:

```javascript
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
```

> **iOS Safari**: Push notif web hanya berfungsi jika situs di-*Add to Home Screen* dan iOS ≥ 16.4.

---

## C — Firebase Hosting (Opsional — Alternatif GitHub Pages)

Gunakan jika butuh custom domain lebih mudah atau ingin deploy di luar GitHub Pages.

### C1. Buat Project Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → beri nama → (opsional) nonaktifkan Google Analytics
3. Tunggu project dibuat

### C2. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### C3. Init Hosting

Di root repo:

```bash
firebase init hosting
```

Pilih:
- **Project**: pilih project yang dibuat di C1
- **Public directory**: `.` (root — karena `index.html` ada di root)
- **Single-page app**: `No`
- **GitHub automatic deploys**: opsional

Firebase akan membuat `firebase.json` dan `.firebaserc`.

### C4. Konfigurasi `firebase.json`

```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", ".firebaserc", ".git/**", "README.md"],
    "headers": [
      {
        "source": "/OneSignalSDKWorker.js",
        "headers": [{ "key": "Service-Worker-Allowed", "value": "/" }]
      }
    ]
  }
}
```

> Header `Service-Worker-Allowed` wajib agar OneSignal service worker bisa berjalan dari root scope.

### C5. Deploy

```bash
firebase deploy --only hosting
```

Situs live di: `https://<project-id>.web.app`

Update **Site URL** di OneSignal (B1) ke domain Firebase ini.

---

## D — GitHub Actions (Cron Notifikasi Harian)

Workflow di `.github/workflows/daily-notif.yml` mengirim push notif setiap hari pukul 00:01 WIB.

### D1. Pasang Repository Secrets

GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Nilai | Dari |
|--------|-------|------|
| `GIST_ID` | Gist ID | Langkah A1 |
| `GIST_PAT` | GitHub PAT | Langkah A2 |
| `ONESIGNAL_APP_ID` | OneSignal App ID | Langkah B2 |
| `ONESIGNAL_REST_KEY` | OneSignal REST API Key | Langkah B2 |

### D2. Aktifkan Push Notification di App

1. Buka app → login admin
2. **Pengaturan** → aktifkan **Push Notification**
3. Set **Waktu Kirim** (default 07:00 WIB)
4. Set **Notif Mulai H-** (berapa hari sebelum acara mulai notif dikirim)
5. Simpan

### D3. Trigger Manual

GitHub → **Actions → Daily Notification → Run workflow**

Centang `Force send` untuk kirim ulang semua acara aktif tanpa update `notifSentDate`.

---

## E — Cloudflare Workers (Write Proxy)

Semua perubahan data (admin maupun viewer) dikirim ke Cloudflare Worker. Worker melakukan **read-merge-write** ke Gist — mencegah data hilang saat dua user edit bersamaan. Worker juga proxy push notification OneSignal.

> **Kode lengkap Worker ada di [`todolist/WORKER.md`](todolist/WORKER.md)**

### E1. Buat Worker

1. Buka [workers.cloudflare.com](https://workers.cloudflare.com) → daftar akun gratis
2. Dashboard → **Workers & Pages → Create application → Create Worker**
3. Beri nama worker (contoh: `alteco-writer`) → **Deploy**
4. Klik **Edit code** → hapus isi default → paste kode dari `todolist/WORKER.md` (bagian **Kode Worker**)
5. Ganti `https://dionisiusnp.github.io` di baris `Access-Control-Allow-Origin` dengan domain GitHub Pages-mu
6. Klik **Deploy**

### E2. Tambah Secrets ke Worker

Worker settings → **Settings → Variables and Secrets → Add**:

| Secret | Nilai | Dari |
|--------|-------|------|
| `GIST_ID` | Gist ID | Langkah A1 |
| `GIST_PAT` | PAT | Langkah A2 |
| `ONESIGNAL_APP_ID` | OneSignal App ID | Langkah B2 |
| `ONESIGNAL_REST_KEY` | OneSignal REST API Key | Langkah B2 |

Klik **Encrypt** lalu **Save** untuk tiap secret.

### E3. Salin URL Worker & Pasang ke Kode

URL worker tampil di halaman Worker (format: `https://<name>.<subdomain>.workers.dev`).

Buka `todolist/index.html`, baris ~598:

```javascript
const WORKER_URL= 'https://<name>.<subdomain>.workers.dev';
```

Ganti dengan URL Worker-mu. Commit & push.

---

## F — Konfigurasi Kode Akses

Password login ada di `todolist/index.html`, baris ~589:

```javascript
const PASS_VIEW  = 'GANTI_KODE_VIEWER';   // akses baca semua data
const PASS_ADMIN = 'GANTI_KODE_ADMIN';    // akses penuh + CRUD
```

Ganti sesuai kebutuhan, commit & push.

> Ini bukan auth yang aman untuk data sensitif — cukup untuk use case internal komunitas.

---

## Ringkasan Checklist Deploy

- [ ] Fork repo & aktifkan GitHub Pages (atau setup Firebase Hosting)
- [ ] Buat GitHub Gist dengan content awal (lihat A1) → salin Gist ID
- [ ] Buat GitHub PAT classic (scope: `gist`) → simpan, hanya tampil sekali
- [ ] Pasang `GIST_ID` ke `todolist/index.html`
- [ ] Daftar Cloudflare → buat Worker → paste kode dari `todolist/WORKER.md` → set 4 secrets
- [ ] Salin URL Worker → pasang ke `WORKER_URL` di `todolist/index.html`
- [ ] Daftar OneSignal → pasang `ONESIGNAL_APP_ID` ke `todolist/index.html`
- [ ] Commit & push
- [ ] Pasang 4 secrets ke GitHub Actions (`GIST_ID`, `GIST_PAT`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_KEY`)
- [ ] Buka app → login admin → aktifkan push notif di Pengaturan
