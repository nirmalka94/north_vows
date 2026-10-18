<?php
/**
 * North Vows Photography — Backend Configuration
 */

// ─── DATABASE ────────────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_db_name');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// ─── FILE UPLOADS ────────────────────────────────────────────────────────────
define('UPLOAD_DIR', dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR);
define('UPLOAD_URL', '/uploads/');
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
define('DEFAULT_PASSCODE', 'change_me');

// ─── CORS / ENVIRONMENT ──────────────────────────────────────────────────────
// Accept both www and non-www production domains plus localhost for development.
$_allowedOrigins = [
    'https://northvowsphotography.com',
    'https://www.northvowsphotography.com',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://127.0.0.1',
];
$_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// For same-origin requests, $_origin is empty — reflect the production domain.
// For cross-origin requests, echo back the origin only if it is allowed.
define('ALLOWED_ORIGIN', (
    $_origin === '' || in_array($_origin, $_allowedOrigins, true)
        ? ($_origin ?: 'https://www.northvowsphotography.com')
        : 'https://www.northvowsphotography.com'
));

// ─── ERROR REPORTING (disable in production) ────────────────────────────────
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);
