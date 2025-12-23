-- Debug query to check pendaftar data
-- Run this in Supabase SQL Editor to see what data is actually in the table

-- 1. Check what fields are populated in pendaftar table
SELECT 
    id,
    nama,
    lembaga_pendidikan,
    lembaga_id,
    CASE 
        WHEN lembaga_id IS NOT NULL THEN 'HAS lembaga_id'
        ELSE 'NULL lembaga_id'
    END as lembaga_id_status,
    CASE 
        WHEN lembaga_pendidikan IS NOT NULL THEN 'HAS lembaga_pendidikan'
        ELSE 'NULL lembaga_pendidikan'
    END as lembaga_pendidikan_status
FROM pendaftar
LIMIT 10;

-- 2. Check unique values in lembaga_pendidikan
SELECT DISTINCT lembaga_pendidikan, COUNT(*) as count
FROM pendaftar
GROUP BY lembaga_pendidikan;

-- 3. Check lembaga table to see what IDs and names exist
SELECT id, nama, no_hp
FROM lembaga
ORDER BY nama;

-- 4. Check users with lembaga role and their lembaga_akses
SELECT id, username, role, lembaga_akses, lembaga_id
FROM users
WHERE role = 'lembaga';
