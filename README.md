# Sistem Pendaftaran PPDB Pondok Pesantren

Website pendaftaran Peserta Didik Baru (PPDB) untuk Pondok Pesantren yang dibuat dengan Next.js dan Supabase.

## 🚀 Fitur

- **Form Pendaftaran Sederhana**: Nama, No HP, Lembaga Pendidikan, Nama Wali
- **Database Integration**: Menggunakan Supabase untuk penyimpanan data
- **Cetak Struk**: Fitur cetak bukti pendaftaran otomatis
- **WhatsApp Integration**: Notifikasi otomatis ke bot WhatsApp
- **Responsive Design**: Tampilan yang optimal di desktop dan mobile

## 🛠️ Setup

### 1. Environment Variables

Buat file `.env.local` di root project dan isi dengan:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WhatsApp Bot Configuration  
WHATSAPP_BOT_ENDPOINT=https://bot.simsmk.sch.id/api/webhook
WHATSAPP_BOT_TOKEN=your_bot_token
```

### 2. Database Setup

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL script yang ada di `database/schema.sql` di SQL Editor Supabase
3. Salin URL project dan anon key ke file `.env.local`

### 3. Installation

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📋 Database Schema

Tabel `pendaftaran` dengan kolom:
- `id` (UUID, primary key)
- `nama` (VARCHAR, required)
- `no_hp` (VARCHAR, required)  
- `lembaga_pendidikan` (VARCHAR, enum: SD/SMP/SMA/SMK/Non Sekolah)
- `nama_wali` (VARCHAR, required)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🔗 WhatsApp Bot Integration

Setelah pendaftaran berhasil, sistem akan mengirim notifikasi ke endpoint bot WhatsApp dengan format:

**Endpoint:** `POST /send-message`

**Content-Type:** `application/x-www-form-urlencoded`

**Body Parameters:**
```
message=<pesan_whatsapp_encoded>
number=<nomor_hp_formatted>
```

**Format Nomor HP:**
- `08xxxxxxxxxx` → `628xxxxxxxxxx`
- `+62xxxxxxxxxx` → `62xxxxxxxxxx`

**Contoh Request:**
```bash
curl -X POST http://localhost:5001/send-message \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "message=🎓%20PENDAFTARAN%20PPDB%20BARU&number=628123456789"
```

**Environment Configuration:**
```env
# Untuk development (jika bot WhatsApp berjalan di localhost)
WHATSAPP_BOT_ENDPOINT=http://localhost:5001

# Untuk production (ganti dengan domain yang sesuai)
WHATSAPP_BOT_ENDPOINT=https://bot.simsmk.sch.id
```

## 📱 Cara Penggunaan

1. **Pendaftaran**: User mengisi form dengan data lengkap
2. **Validasi**: System memvalidasi input dan format nomor HP
3. **Simpan Data**: Data disimpan ke database Supabase
4. **Notifikasi WA**: Bot WhatsApp mengirim konfirmasi otomatis
5. **Cetak Struk**: User dapat mencetak bukti pendaftaran
6. **Pendaftaran Baru**: Option untuk membuat pendaftaran baru

## 🎨 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Modules
- **Deployment**: Vercel (recommended)

## 📦 Project Structure

```
src/
├── app/
│   ├── api/register/route.js    # API endpoint pendaftaran
│   ├── globals.css              # Global styles
│   ├── layout.js               # Root layout
│   └── page.js                 # Home page
├── components/
│   ├── RegistrationForm.js     # Form pendaftaran
│   ├── RegistrationForm.module.css
│   ├── Receipt.js              # Komponen struk
│   └── Receipt.module.css
└── lib/
    └── supabase.js             # Supabase client config
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Connect repository di [Vercel](https://vercel.com)
3. Set environment variables di Vercel dashboard
4. Deploy otomatis

### Manual Deployment

```bash
npm run build
npm start
```

## 📝 Customization

### Mengubah Data Form
Edit `src/components/RegistrationForm.js` dan sesuaikan field yang dibutuhkan.

### Styling
Ubah file CSS di `src/components/` untuk menyesuaikan tampilan.

### WhatsApp Message
Edit template pesan di `src/app/api/register/route.js` pada fungsi `sendWhatsAppNotification`.

## ⚠️ Important Notes

- Pastikan Row Level Security (RLS) aktif di Supabase
- Validasi nomor HP hanya menerima format numerik 10-15 digit
- Backup database secara berkala
- Monitor usage di Supabase dashboard

## 🔧 Troubleshooting

### Error: "Missing Supabase environment variables"
- Pastikan file `.env.local` sudah dibuat dan diisi dengan benar
- Restart development server setelah menambah environment variables

### Error: "Gagal menyimpan data pendaftaran"
- Cek koneksi internet
- Pastikan tabel `pendaftaran` sudah dibuat di Supabase
- Cek apakah RLS policy sudah benar

### WhatsApp notification gagal
- Cek endpoint bot WhatsApp masih aktif
- Pastikan format payload sesuai dengan API bot

## 📞 Support

Untuk bantuan teknis atau pertanyaan, silakan hubungi tim pengembang.
