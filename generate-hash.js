import bcrypt from 'bcryptjs'

// Generate hash untuk password admin123
const password = 'admin123'
const saltRounds = 10
const hash = bcrypt.hashSync(password, saltRounds)

console.log('Password:', password)
console.log('Hash:', hash)
console.log('Hash length:', hash.length)

// Test verifikasi
const isValid = bcrypt.compareSync(password, hash)
console.log('Verification test:', isValid)

// SQL untuk update admin
console.log('\nSQL untuk update admin:')
console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`)