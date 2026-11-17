# SI-PKL

Sistem Informasi Praktik Kerja Lapangan — aplikasi full-stack JavaScript/TypeScript
yang memigrasikan aplikasi Laravel SI-PKL ke **Next.js 15 + Prisma + MySQL 8.0**,
siap dijalankan di produksi dengan Docker di balik reverse proxy HTTPS Nginx.

Aplikasi asli Laravel tetap tersimpan di folder induk sebagai referensi; seluruh
implementasi baru berada di folder `si-pkl/` ini.

## Fitur

- Autentikasi email/password dengan sesi **JWT HTTP-only cookie** (`jose`) dan
  password **bcrypt**.
- Otorisasi berbasis role di middleware + pengecekan ulang di setiap halaman/aksi:
  `admin`, `siswa`, `guru`, `perusahaan`.
- Login, register siswa, lupa password, dan reset password.
- **Admin**: dashboard statistik, CRUD siswa/guru/perusahaan, pengajuan & status PKL,
  monitoring jurnal, absensi, dan penilaian.
- **Siswa**: dashboard, pengajuan/perubahan PKL, unggah laporan akhir (PDF), jurnal
  harian (dengan dokumentasi gambar), absensi harian, dan profil.
- **Guru**: dashboard, daftar siswa bimbingan, persetujuan/komentar jurnal,
  serta penilaian.
- **Perusahaan**: dashboard, daftar siswa PKL, komentar jurnal, serta penilaian.
- Upload aman (validasi MIME + signature file, batas 2 MB) yang disajikan melalui
  route terautentikasi `/api/files/...` dengan pemeriksaan kepemilikan.
- Rate limiter in-memory untuk percobaan login/reset password.
- Tabel data dengan pencarian dan paginasi.
- Healthcheck `GET /api/health`.

## Stack

| Komponen     | Teknologi                          |
| ------------ | ---------------------------------- |
| Framework    | Next.js 15 (App Router, standalone)|
| Bahasa       | TypeScript                         |
| Database     | MySQL 8.0                          |
| ORM          | Prisma 6                           |
| Styling      | Tailwind CSS 3 + `@tailwindcss/forms` |
| Auth         | `jose` (JWT) + `bcryptjs`          |
| Validasi     | `zod`                              |
| Email        | `nodemailer` (opsional)            |
| Ikon         | `lucide-react`                     |

## Struktur singkat

```
si-pkl/
├─ prisma/
│  ├─ schema.prisma          # skema MySQL (camelCase -> kolom snake_case)
│  ├─ migrations/0001_init/  # migrasi SQL awal
│  └─ seed.ts                # data & akun demo (idempotent)
├─ src/
│  ├─ actions/               # server actions per role
│  ├─ app/
│  │  ├─ (app)/              # halaman dashboard & fitur (route group)
│  │  ├─ api/health/         # healthcheck
│  │  ├─ api/files/[...path] # penyajian upload terautentikasi
│  │  └─ login, register, ...# halaman autentikasi
│  ├─ components/            # AppShell, DataTable, form, dll.
│  ├─ lib/                   # auth, prisma, upload, mail, validasi
│  └─ middleware.ts          # proteksi route + role
├─ deploy/nginx-si-pkl.conf  # contoh site Nginx HTTPS
├─ docker-compose.yml        # app + MySQL internal + migrator + seed
├─ docker-compose.external-db.yml # memakai container MySQL yang sudah ada
├─ Dockerfile                # target deps/builder/migrator/runner
└─ .env.example              # dokumentasi seluruh variabel environment
```

## Mulai cepat (Docker, MySQL internal)

```bash
cd si-pkl
cp .env.example .env
# Wajib diubah: AUTH_SECRET, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, DATABASE_URL.
# Contoh membuat secret: openssl rand -base64 48

docker compose up -d --build
```

Urutan otomatis: MySQL healthy → service `migrator` menjalankan
`prisma migrate deploy` → aplikasi start. Aplikasi hanya terikat ke
`127.0.0.1:9003` (tidak terbuka langsung ke internet).

Isi data demo/akun awal (opsional, sekali saja):

```bash
docker compose --profile seed run --rm seed
```

Cek status dan log:

```bash
docker compose ps
docker compose logs -f app
curl -fsS http://127.0.0.1:9003/api/health
```

Buka `https://si-pkl.akucintacysec.online` setelah Nginx dikonfigurasi.

## Perintah database

Di dalam Docker:

```bash
# Terapkan migrasi yang belum jalan
docker compose run --rm migrator

# Seed data demo (password mengikuti SEED_PASSWORD, default "password")
docker compose --profile seed run --rm seed

# Prisma Studio (opsional, buka port sesuai kebutuhan)
docker compose run --rm --service-ports migrator npx prisma studio --hostname 0.0.0.0
```

Di host (dengan `.env` yang menunjuk MySQL lokal):

```bash
npm ci
npx prisma migrate deploy   # produksi
npx prisma migrate dev      # development (membuat migrasi baru)
npx prisma db seed
```

## Akun demo

Semua akun memakai password `SEED_PASSWORD` (default `password`).

| Role       | Email                      |
| ---------- | -------------------------- |
| Admin      | `admin@si-pkl.test`        |
| Guru       | `budi@si-pkl.test`         |
| Guru       | `siti@si-pkl.test`         |
| Siswa      | `ahmad@si-pkl.test`        |
| Siswa      | `dewi@si-pkl.test`         |
| Perusahaan | `perusahaan@si-pkl.test`   |
| Perusahaan | `cvkarya@si-pkl.test`      |

Seeder bersifat idempotent: aman dijalankan ulang dan tidak mereset password
atau data profil yang sudah ada.

## Variabel environment

Semua konfigurasi dibaca dari environment (lihat `.env.example` untuk komentar
lengkap).

| Variabel                    | Wajib | Keterangan |
| --------------------------- | :---: | ---------- |
| `APP_URL`                   | ya    | URL publik, dipakai untuk tautan reset password. |
| `AUTH_SECRET`               | ya    | Kunci JWT, minimal 32 karakter. |
| `AUTH_COOKIE_SECURE`        | tidak | Default aman: cookie secure saat production. Set `false` hanya untuk uji HTTP lokal. |
| `DATABASE_URL`              | ya    | URL Prisma MySQL. Host `mysql` untuk compose internal. |
| `MYSQL_DATABASE`            | ya*   | Nama database untuk service MySQL internal. |
| `MYSQL_USER` / `MYSQL_PASSWORD` | ya* | Kredensial user database. |
| `MYSQL_ROOT_PASSWORD`       | ya*   | Password root MySQL. |
| `UPLOAD_DIR`                | tidak | Default `/app/uploads` di Docker. |
| `SMTP_HOST` ... `MAIL_FROM` | tidak | Tanpa SMTP, tautan reset dicatat ke log container. |
| `SMTP_SECURE`               | tidak | `true` untuk port 465. |
| `SMTP_REJECT_UNAUTHORIZED`  | tidak | `false` hanya untuk sertifikat self-signed. |
| `SEED_PASSWORD`             | tidak | Password akun demo saat seeding. |
| `EXTERNAL_DB_NETWORK`       | ya**  | Network container MySQL eksternal. |
| `EXTERNAL_DATABASE_URL`     | ya**  | URL database untuk skenario eksternal. |

\* Wajib untuk `docker-compose.yml` (MySQL internal).
\** Wajib hanya untuk `docker-compose.external-db.yml`.

Password dengan karakter khusus (`@`, `:`, `#`, `/`, `?`) harus di-URL-encode
pada `DATABASE_URL`/`EXTERNAL_DATABASE_URL`, mis. `p@ss#1` → `p%40ss%231`.

## Memakai container MySQL yang sudah ada

```bash
# 1. Temukan network container MySQL lama
docker inspect si_pkl_mysql \
  --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'

# 2. Isi .env
#    EXTERNAL_DB_NETWORK=<nama network di atas>
#    EXTERNAL_DATABASE_URL=mysql://user:password@si_pkl_mysql:3306/si_pkl

# 3. Jalankan tanpa membuat MySQL baru
docker compose -f docker-compose.external-db.yml up -d --build
docker compose -f docker-compose.external-db.yml --profile seed run --rm seed
```

Pastikan user database memiliki hak membuat/mengubah tabel pada database
tersebut karena migrasi dijalankan otomatis.

## Deployment Nginx + HTTPS

1. Jalankan stack:

   ```bash
   docker compose up -d --build
   ```

2. Pasang site Nginx (sesuaikan domain/path sertifikat):

   ```bash
   sudo cp deploy/nginx-si-pkl.conf /etc/nginx/sites-available/si-pkl
   sudo ln -s /etc/nginx/sites-available/si-pkl /etc/nginx/sites-enabled/si-pkl
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. Terbitkan sertifikat (jika belum ada):

   ```bash
   sudo certbot --nginx -d si-pkl.akucintacysec.online
   ```

4. Pastikan `.env` berisi:

   ```env
   APP_URL=https://si-pkl.akucintacysec.online
   AUTH_COOKIE_SECURE=true
   ```

### Perilaku di balik reverse proxy

- Nginx mengirim `Host`, `X-Forwarded-Proto`, `X-Forwarded-Host`,
  `X-Forwarded-For`, dan `X-Real-IP`. Next.js memakai header tersebut untuk
  membentuk URL absolut dan validasi origin Server Action.
- Cookie sesi `si_pkl_session` bersifat `HttpOnly`, `SameSite=Lax`, `Secure`
  saat production, sehingga hanya dikirim melalui HTTPS dan tidak dapat dibaca
  JavaScript.
- Redirect HTTP → HTTPS dilakukan di Nginx, bukan di aplikasi, sehingga tidak
  terjadi redirect loop.
- Aplikasi hanya listen di `127.0.0.1:9003`; jangan buka port tersebut ke publik.
- `client_max_body_size 8m` memberi ruang untuk upload maksimal 2 MB.

## Development lokal

```bash
cp .env.example .env
# Ubah DATABASE_URL ke MySQL lokal, mis.:
# DATABASE_URL=mysql://si_pkl:password@127.0.0.1:3306/si_pkl
# AUTH_COOKIE_SECURE=false
npm ci
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Buka `http://localhost:3000`.

Perintah berguna:

```bash
npm run typecheck     # TypeScript
npm run build         # build produksi (standalone)
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy
npm run db:seed       # prisma db seed
```

## Upload & penyimpanan

- Foto jurnal, dokumentasi, dan laporan disimpan di `UPLOAD_DIR`
  (Docker: volume `si-pkl-uploads` → `/app/uploads`).
- Nama file diacak; validasi ekstensi, MIME, dan signature file.
- File TIDAK disajikan langsung oleh Nginx. Akses melalui
  `/api/files/<path>` yang memeriksa sesi dan kepemilikan data.
- Backup volume upload bersama backup database:

  ```bash
  docker run --rm -v si-pkl-uploads:/data -v "$PWD":/backup alpine \
    tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
  ```

- Jika memakai bind mount, pastikan direktori dapat ditulis UID container
  (`1001:1001`):

  ```bash
  sudo chown -R 1001:1001 /path/ke/uploads
  ```

## Catatan migrasi dari Laravel

- Skema bisnis direplikasi: `users`, `password_reset_tokens`, `siswas`, `gurus`,
  `perusahaans`, `pkls`, `jurnals`, `absensis`, `penilaians`.
- Tabel infrastruktur Laravel (`cache`, `jobs`, `sessions`) tidak diperlukan
  karena Next.js memakai JWT stateless dan rate limiter in-memory.
- Notifikasi SweetAlert diganti flash message berbasis query param
  (`?success=...` / `?error=...`).
- Perhitungan nilai akhir tetap rata-rata 5 komponen nilai, dibulatkan.

## Troubleshooting

| Gejala | Penyebab & solusi |
| ------ | ----------------- |
| Container `app` restart terus | Lihat `docker compose logs app`; biasanya `DATABASE_URL`/`AUTH_SECRET` salah atau migrasi gagal. |
| Login berhasil tetapi kembali ke halaman login | Cookie `Secure` diakses lewat HTTP. Gunakan HTTPS, atau set `AUTH_COOKIE_SECURE=false` untuk uji lokal. |
| `P1001: Can't reach database server` | Host database salah. Di compose internal gunakan host `mysql`, bukan `127.0.0.1`. |
| Migrasi gagal karena akses | User DB eksternal butuh hak DDL pada database tujuan. |
| Upload 413 | Periksa `client_max_body_size` di Nginx (disarankan 8 MB) dan batas ukuran file 2 MB di aplikasi. |
| Tautan reset password tidak terkirim | Isi konfigurasi SMTP, atau ambil tautan dari `docker compose logs app` (prefix `[mail:fallback]`). |

## Keamanan produksi

- Ganti `AUTH_SECRET`, seluruh password database, dan `SEED_PASSWORD`.
- Jangan jalankan seeder demo di produksi nyata; buat akun admin melalui
  prosedur internal yang aman.
- Batasi akses port `9003` hanya dari localhost (sudah default).
- Aktifkan firewall, perbarui image secara berkala, dan backup volume MySQL
  serta uploads.
