# 🎓 SPMB Asy-Syadzili - Admin Panel

Sistem Manajemen Admin dengan Role-Based Access Control untuk SPMB Pondok Pesantren Asy-Syadzili.

## 🚀 Setup & Installation

### 1. Database Setup
Jalankan SQL schema di Supabase:
```sql
-- Copy dan jalankan file: database/schema_users.sql
```

### 2. Dependencies
```bash
npm install bcryptjs jsonwebtoken
```

### 3. Environment Variables
File `.env.local`:
```env
JWT_SECRET=your-super-secret-key-change-this-in-production
WHATSAPP_BOT_ENDPOINT=your-whatsapp-bot-endpoint
```

## 👥 User Roles & Access

### 🔥 **Superadmin**
- ✅ CRUD semua users (buat, edit, hapus admin & lembaga)
- ✅ CRUD semua data pendaftar (semua lembaga)
- ✅ Akses semua fitur sistem
- ✅ Dashboard lengkap dengan statistik global

**Default Login:**
- Username: `superadmin`
- Password: `admin123`

### 🛠️ **Admin**
- ❌ Tidak bisa CRUD users
- ✅ CRUD semua data pendaftar (semua lembaga)
- ✅ Dashboard dengan statistik pendaftar
- ✅ Laporan dan export data

**Default Login:**
- Username: `admin`
- Password: `admin123`

### 🏫 **Lembaga (SMP/SMA/SMK)**
- ❌ Tidak bisa CRUD users
- ✅ CRUD data pendaftar hanya sesuai lembaganya
- ✅ Dashboard dengan statistik lembaga sendiri
- ✅ Filter otomatis berdasarkan lembaga

**Default Login:**
- SMP: `smp_admin` / `admin123`
- SMA: `sma_admin` / `admin123`
- SMK: `smk_admin` / `admin123`

## 🖥️ Halaman Admin

### 📊 **Dashboard** (`/admin`)
- **Statistik Real-time:**
  - Total pendaftar (sesuai akses role)
  - Pendaftar hari ini
  - Total users (superadmin only)
  - Status sistem
- **Pendaftar Terbaru:** 5 pendaftar terakhir
- **Welcome Banner:** Menyambut sesuai role user

### 👥 **Management Users** (`/admin/users`) - Superadmin Only
- **List Users:** Pagination, search, filter by role
- **Create User:** Form tambah user dengan validasi role
- **Edit User:** Update data user, role, dan lembaga akses
- **Delete User:** Soft delete (set inactive)
- **Fitur:**
  - Search by username, email, nama
  - Filter by role (superadmin/admin/lembaga)
  - Pagination dengan kontrol lengkap
  - Protection: tidak bisa hapus diri sendiri

### 📝 **Data Pendaftar** (`/admin/pendaftar`)
- **List Pendaftar:** Filter otomatis berdasarkan role
- **Search:** Nama, no HP, wali, alamat
- **Filter Lembaga:** 
  - Superadmin/Admin: semua lembaga
  - Lembaga: otomatis filter lembaganya
- **Actions per row:**
  - 👁️ View detail
  - ✏️ Edit data
  - 🗑️ Delete data
- **Responsive table** dengan pagination

## 🔐 Authentication Flow

### Login Process
1. User masuk ke `/login`
2. Input username/email dan password
3. Server verify dengan bcrypt
4. Generate JWT token (expire 24 jam)
5. Store token di localStorage
6. Redirect ke dashboard admin

### Protected Routes
- Semua route `/admin/*` require authentication
- Role-based access control pada setiap halaman
- Auto redirect ke login jika token expired

### Security Features
- Password hashing dengan bcrypt (salt rounds: 10)
- JWT token dengan expiration
- Row Level Security (RLS) di Supabase
- CSRF protection
- XSS protection

## 📱 Responsive Design

### Mobile Support
- ✅ Responsive sidebar dengan hamburger menu
- ✅ Collapsible navigation
- ✅ Touch-friendly buttons
- ✅ Mobile-optimized tables dengan horizontal scroll
- ✅ Responsive form layout

### Desktop Experience
- ✅ Fixed sidebar navigation
- ✅ Full-width content area
- ✅ Hover effects dan animations
- ✅ Keyboard shortcuts support

## 🎨 UI/UX Features

### Design System
- **Color Scheme:** Gradient purple-blue theme
- **Typography:** Poppins font family
- **Icons:** Emoji-based untuk universal support
- **Layout:** Clean, modern admin panel

### User Experience
- **Loading States:** Spinner untuk semua async operations
- **Error Handling:** User-friendly error messages
- **Success Feedback:** Notifications untuk actions
- **Empty States:** Helpful messages saat tidak ada data
- **Confirmation Dialogs:** Sebelum delete actions

## 🚦 Testing & Demo

### Quick Test
1. **Start Server:**
   ```bash
   npm run dev
   ```

2. **Access Admin:**
   - URL: `http://localhost:3000/login`
   - Try semua demo credentials

3. **Test Role Access:**
   - Login sebagai superadmin → akses semua fitur
   - Login sebagai admin → tidak bisa manage users
   - Login sebagai lembaga → hanya data lembaganya

### Demo Scenarios

#### Superadmin Test
1. Login dengan `superadmin/admin123`
2. Buat user baru di Management Users
3. Edit/delete users
4. Lihat semua data pendaftar
5. Access semua menu

#### Admin Test
1. Login dengan `admin/admin123`
2. Coba akses Management Users → blocked
3. CRUD data pendaftar semua lembaga
4. Lihat dashboard dengan semua statistik

#### Lembaga Test
1. Login dengan `smp_admin/admin123`
2. Hanya lihat data pendaftar SMP
3. Tidak bisa akses data SMA/SMK
4. Filter lembaga otomatis terset ke SMP

## 🔧 Development Tips

### Code Structure
```
src/
├── app/
│   ├── admin/           # Admin pages
│   ├── api/             # API routes
│   └── login/           # Login page
├── components/          # Reusable components
├── contexts/            # React contexts
└── lib/                 # Utilities & helpers
```

### API Endpoints
- `POST /api/auth/login` - Authentication
- `GET /api/auth/verify` - Token verification
- `GET|POST /api/admin/users` - User management
- `GET|POST|PUT|DELETE /api/admin/users/[id]` - User CRUD
- `GET|POST /api/admin/pendaftar` - Pendaftar management
- `GET|PUT|DELETE /api/admin/pendaftar/[id]` - Pendaftar CRUD

### Custom Hooks
- `useAuth()` - Authentication state & methods
- Protected routes dengan role checking
- Automatic token refresh

## 🐛 Troubleshooting

### Common Issues

1. **"Token tidak valid"**
   - Solution: Login ulang, token mungkin expired

2. **"Tidak memiliki akses"**
   - Solution: Check role user, pastikan sesuai dengan halaman

3. **Data tidak muncul**
   - Solution: Check RLS policies di Supabase

4. **WhatsApp tidak terkirim**
   - Solution: Check WHATSAPP_BOT_ENDPOINT di env

### Development Mode
```bash
# Clear localStorage jika ada masalah auth
localStorage.clear()

# Check network tab untuk API errors
# Verify Supabase connection
# Check console untuk detailed errors
```

## 📈 Next Features

### Planned Enhancements
- [ ] Export data ke Excel/PDF
- [ ] Email notifications
- [ ] Advanced reporting & analytics
- [ ] Bulk actions (delete multiple)
- [ ] User activity logs
- [ ] Advanced search dengan filters
- [ ] File upload untuk pendaftar
- [ ] Integration dengan payment gateway

## 🎯 Production Deployment

### Pre-deployment Checklist
- [ ] Ganti JWT_SECRET yang kuat
- [ ] Setup proper CORS policy
- [ ] Configure proper Supabase RLS
- [ ] Test semua user roles
- [ ] Backup database schema
- [ ] Setup monitoring & logging

---

**🎓 SPMB Asy-Syadzili Admin Panel**  
*Sistem admin modern dengan keamanan tingkat enterprise untuk pengelolaan pendaftaran santri.*