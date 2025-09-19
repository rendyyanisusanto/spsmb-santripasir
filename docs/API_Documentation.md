# Dokumentasi API Sistem Role-Based Access Control (RBAC)

## Overview
Sistem ini mengimplementasikan role-based access control dengan 3 level akses:
- **Superadmin**: Akses penuh ke semua fitur dan data
- **Admin**: CRUD semua data pendaftar
- **Lembaga**: CRUD data pendaftar sesuai lembaga (SMP/SMA/SMK)

## Setup Database

### 1. Jalankan Schema di Supabase
```sql
-- Jalankan file: database/schema_users.sql di Supabase SQL Editor
```

### 2. Default Users
Setelah menjalankan schema, akan tersedia user default:
```
Superadmin:
- Username: superadmin
- Email: superadmin@santripasir.com
- Password: admin123

Admin:
- Username: admin  
- Email: admin@santripasir.com
- Password: admin123

Lembaga Users:
- Username: smp_admin (SMP)
- Username: sma_admin (SMA) 
- Username: smk_admin (SMK)
- Password: admin123 (untuk semua)
```

## Struktur Role & Permission

### Superadmin
- ✅ CRUD Users (create, read, update, delete)
- ✅ CRUD Pendaftar semua lembaga
- ✅ Akses semua fitur sistem

### Admin  
- ❌ CRUD Users (tidak bisa)
- ✅ CRUD Pendaftar semua lembaga
- ✅ Lihat data semua lembaga

### Lembaga
- ❌ CRUD Users (tidak bisa)
- ✅ CRUD Pendaftar hanya sesuai lembaganya
- ❌ Tidak bisa akses data lembaga lain

## API Endpoints

### Authentication

#### POST /api/auth/login
Login user dan mendapatkan JWT token.

**Request:**
```json
{
  "credential": "username_atau_email",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Administrator",
      "role": "admin",
      "lembaga_akses": null
    },
    "token": "jwt_token_here",
    "expiresIn": "24h"
  }
}
```

### User Management (Superadmin Only)

#### GET /api/admin/users
List semua users dengan pagination dan filter.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah per halaman (default: 10)
- `role` (optional): Filter by role
- `search` (optional): Search username, email, atau nama

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Administrator",
      "role": "admin",
      "lembaga_akses": null,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### POST /api/admin/users
Buat user baru (superadmin only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nama Lengkap",
  "role": "lembaga",
  "lembaga_akses": "SMP"
}
```

#### GET /api/admin/users/[id]
Get detail user specific.

#### PUT /api/admin/users/[id]
Update user (password opsional).

#### DELETE /api/admin/users/[id]
Soft delete user (set is_active = false).

### Pendaftar Management

#### GET /api/admin/pendaftar
List pendaftar berdasarkan role akses.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `lembaga`: Filter by lembaga (untuk superadmin/admin)
- `search`: Search nama, no_hp, nama_wali, alamat

**Behavior berdasarkan role:**
- **Superadmin/Admin**: Lihat semua data, bisa filter by lembaga
- **Lembaga**: Hanya data sesuai lembaga_akses

#### POST /api/admin/pendaftar
Buat pendaftar baru.

**Request:**
```json
{
  "nama": "Nama Pendaftar",
  "jenis_kelamin": "Pria",
  "no_hp": "081234567890",
  "nama_wali": "Nama Wali",
  "alamat": "Alamat Lengkap",
  "lembaga_pendidikan": "SMP"
}
```

**Permission:**
- **Superadmin/Admin**: Bisa buat untuk semua lembaga
- **Lembaga**: Hanya bisa buat untuk lembaganya

#### GET /api/admin/pendaftar/[id]
#### PUT /api/admin/pendaftar/[id]  
#### DELETE /api/admin/pendaftar/[id]

Update/delete dengan permission yang sama seperti create.

### Public Registration

#### POST /api/register
Endpoint public untuk pendaftaran (tanpa authentication).
Format sama seperti POST /api/admin/pendaftar.

## Authentication & Authorization

### JWT Token
- Expire: 24 jam
- Payload berisi: id, username, email, role, lembaga_akses, full_name
- Header: `Authorization: Bearer {token}`

### Middleware
```javascript
import { withAuth, withMiddlewares, withErrorHandler } from '@/lib/middleware'

// Contoh penggunaan:
export const GET = withMiddlewares(
  withErrorHandler,
  withAuth(['superadmin', 'admin'])
)(async function(request, { user }) {
  // user object tersedia dari middleware
  // Implementasi handler
})
```

### Helper Functions
```javascript
import { canAccessLembaga } from '@/lib/auth'

// Cek akses lembaga
if (!canAccessLembaga(user, 'SMP')) {
  return Response.json({ error: 'Tidak memiliki akses' }, { status: 403 })
}
```

## Database Schema

### Tabel users
```sql
- id (UUID, primary key)
- username (varchar, unique)
- email (varchar, unique)  
- password_hash (varchar)
- full_name (varchar)
- role (enum: superadmin, admin, lembaga)
- lembaga_akses (enum: SD, SMP, SMA, SMK, Non Formal, nullable)
- is_active (boolean, default true)
- created_at, updated_at, last_login (timestamp)
```

### Tabel pendaftar (existing + tambahan)
```sql
- created_by (UUID, nullable, references users.id)
- updated_by (UUID, nullable, references users.id)
```

### Row Level Security (RLS)
- Enabled pada tabel users dan pendaftar
- Policy otomatis filter data berdasarkan role
- Superadmin akses semua, admin akses semua pendaftar, lembaga akses sesuai lembaga

## WhatsApp Integration

Nomor admin berdasarkan lembaga:
- **SMK**: 085894632505
- **SMP**: 081345009686  
- **SMA**: 085179711916

## Environment Variables

Tambahkan di `.env.local`:
```env
JWT_SECRET=your-super-secret-key-change-this-in-production
WHATSAPP_BOT_ENDPOINT=your-whatsapp-bot-endpoint
```

## Testing

### Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"credential":"superadmin","password":"admin123"}'
```

### Get Users (with token)
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer {your_token}"
```

### Get Pendaftar
```bash
curl -X GET http://localhost:3000/api/admin/pendaftar \
  -H "Authorization: Bearer {your_token}"
```

## Error Handling

Semua API menggunakan format error yang konsisten:
```json
{
  "error": "Pesan error",
  "details": "Detail tambahan (opsional)"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (token invalid/missing)
- 403: Forbidden (insufficient permission)
- 404: Not Found
- 409: Conflict (duplicate data)
- 500: Internal Server Error