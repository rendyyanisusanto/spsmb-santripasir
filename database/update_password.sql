-- Quick update untuk password hash yang benar
UPDATE users 
SET password_hash = '$2b$10$ZisE1SOA42vjCE1r/yyL3u5vvk5cBYsuttO0tTI8/tPDra8hXbEyW'
WHERE username IN ('admin', 'superadmin');