-- OAuth and Login Tracking Migration
-- This SQL safely adds OAuth support to the users table

-- 1. Add provider column (tracks 'email' or 'google')
ALTER TABLE `users` 
ADD COLUMN `provider` enum('email','google') DEFAULT 'email' AFTER `password`;

-- 2. Add google_id column (stores Google's unique user ID)
ALTER TABLE `users` 
ADD COLUMN `google_id` varchar(255) UNIQUE AFTER `provider`;

-- 3. Add last_login timestamp for tracking
ALTER TABLE `users` 
ADD COLUMN `last_login` timestamp NULL AFTER `updated_at`;

-- 4. Create unique index on email for faster lookups (non-clustered)
-- Note: Email should already be unique for login, but this ensures fast searching
ALTER TABLE `users` 
ADD UNIQUE KEY `unique_email` (`email`);

-- Verify migration succeeded
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'lintara'
ORDER BY ORDINAL_POSITION;
