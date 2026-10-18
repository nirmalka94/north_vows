<?php
/**
 * North Vows Photography — Main API
 * Single-file PHP REST API that handles all CMS operations.
 * Deploy this to /api/index.php on your Hostinger server.
 */

require_once __DIR__ . '/config.php';

// ─── HEADERS ─────────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Passcode');
// Prevent LiteSpeed / CDN / browser from caching API responses.
// Without this, Hostinger LiteSpeed serves stale (cached) GET responses
// and newly uploaded photos/settings never appear until the cache expires.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ─── DATABASE CONNECTION ──────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    respond(500, ['error' => 'Database connection failed: ' . $e->getMessage()]);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function respond(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function getPasscode(PDO $pdo): string {
    $stmt = $pdo->prepare('SELECT setting_value FROM nv_settings WHERE setting_key = ?');
    $stmt->execute(['passcode']);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : DEFAULT_PASSCODE;
}

function requireAuth(PDO $pdo): void {
    $passcode = $_SERVER['HTTP_X_PASSCODE'] ?? ($_POST['passcode'] ?? '');
    if ($passcode !== getPasscode($pdo)) {
        respond(401, ['error' => 'Unauthorized — invalid passcode.']);
    }
}

function ensureUploadDir(): void {
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
}

// Make an outbound HTTP GET; prefers cURL (always available on Hostinger shared).
function httpGet(string $url, int $timeout = 15): ?string {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT      => 'NorthVows/1.0',
            CURLOPT_FOLLOWLOCATION => true,
        ]);
        $result = curl_exec($ch);
        curl_close($ch);
        return ($result !== false && $result !== '') ? $result : null;
    }
    // Fallback: allow_url_fopen
    $ctx = stream_context_create(['http' => ['timeout' => $timeout, 'user_agent' => 'NorthVows/1.0']]);
    $result = @file_get_contents($url, false, $ctx);
    return ($result !== false && $result !== '') ? $result : null;
}

function getSetting(PDO $pdo, string $key): ?string {
    $stmt = $pdo->prepare('SELECT setting_value FROM nv_settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : null;
}

function upsertSetting(PDO $pdo, string $key, string $value): void {
    $stmt = $pdo->prepare(
        'INSERT INTO nv_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    $stmt->execute([$key, $value]);
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── STATUS / DIAGNOSTIC (visit /api/index.php?action=status in browser) ───────
if ($action === 'status') {
    $tables   = ['nv_settings', 'nv_albums', 'nv_photos', 'nv_instagram'];
    $found    = [];
    $missing  = [];
    foreach ($tables as $t) {
        $r = $pdo->query("SHOW TABLES LIKE '$t'")->fetchAll();
        if (count($r)) $found[] = $t; else $missing[] = $t;
    }
    $passcode = getPasscode($pdo);
    respond(200, [
        'db_connected'    => true,
        'db_name'         => DB_NAME,
        'tables_found'    => $found,
        'tables_missing'  => $missing,
        'passcode_hint'   => str_repeat('*', max(0, strlen($passcode) - 2)) . substr($passcode, -2),
        'setup_needed'    => count($missing) > 0,
    ]);
}

try {

switch ($action) {

    // ── AUTH ──────────────────────────────────────────────────────────────────
    case 'auth':
        if ($method !== 'POST') respond(405, ['error' => 'Method not allowed']);

        // Read passcode from multiple sources for maximum LiteSpeed/WAF compatibility:
        // 1. X-Passcode header (most reliable — not affected by body parsing)
        // 2. JSON request body via php://input
        // 3. Standard POST field
        $fromHeader  = $_SERVER['HTTP_X_PASSCODE'] ?? '';
        $rawBody     = file_get_contents('php://input');
        $parsedBody  = json_decode($rawBody, true);
        $fromJson    = is_array($parsedBody) ? ($parsedBody['passcode'] ?? '') : '';
        $fromPost    = $_POST['passcode'] ?? '';

        // Use whichever source has a value
        $submitted = $fromHeader ?: $fromJson ?: $fromPost;

        $stored = getPasscode($pdo);
        if ($submitted === $stored) {
            respond(200, ['success' => true]);
        } else {
            respond(401, [
                'success'    => false,
                'error'      => 'Wrong passcode',
                // Debug: remove these lines once login works
                '_dbg_got'   => $submitted === '' ? '(empty)' : '(non-empty, length ' . strlen($submitted) . ')',
                '_dbg_stored_len' => strlen($stored),
            ]);
        }


    // ── SETTINGS ─────────────────────────────────────────────────────────────
    case 'get_settings':
        $stmt = $pdo->query('SELECT setting_key, setting_value FROM nv_settings');
        $rows = $stmt->fetchAll();
        $out  = [];
        $sensitiveKeys = ['passcode', 'instagram_access_token'];
        $hasInstaToken = false;
        foreach ($rows as $r) {
            if ($r['setting_key'] === 'instagram_access_token') {
                $hasInstaToken = !empty($r['setting_value']);
                continue;
            }
            if (!in_array($r['setting_key'], $sensitiveKeys, true)) {
                $out[$r['setting_key']] = $r['setting_value'];
            }
        }
        // Expose a safe boolean so the admin UI can show "Token connected"
        $out['instagram_token_set'] = $hasInstaToken ? '1' : '0';
        respond(200, $out);

    case 'save_setting':
        requireAuth($pdo);
        $body  = json_decode(file_get_contents('php://input'), true);
        $key   = $body['key']   ?? '';
        $value = $body['value'] ?? '';
        if (!$key) respond(400, ['error' => 'Missing key']);
        $stmt = $pdo->prepare(
            'INSERT INTO nv_settings (setting_key, setting_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        );
        $stmt->execute([$key, $value]);
        respond(200, ['success' => true]);

    case 'change_passcode':
        requireAuth($pdo);
        $body    = json_decode(file_get_contents('php://input'), true);
        $newPass = trim($body['newPasscode'] ?? '');
        if (strlen($newPass) < 4) respond(400, ['error' => 'Passcode must be at least 4 characters']);
        $stmt = $pdo->prepare(
            'INSERT INTO nv_settings (setting_key, setting_value)
             VALUES ("passcode", ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        );
        $stmt->execute([$newPass]);
        respond(200, ['success' => true]);

    // ── ALBUMS ────────────────────────────────────────────────────────────────
    case 'get_albums':
        $stmt   = $pdo->query('SELECT * FROM nv_albums ORDER BY created_at ASC');
        $albums = $stmt->fetchAll();
        // Normalise keys to camelCase to match JS
        $out = array_map(fn($r) => [
            'id'          => $r['id'],
            'name'        => $r['name'],
            'slug'        => $r['slug'],
            'description' => $r['description'] ?? '',
            'createdAt'   => (int)$r['created_at'],
        ], $albums);
        respond(200, $out);

    case 'save_album':
        requireAuth($pdo);
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = $body['id']          ?? ('album-' . time());
        $name = trim($body['name']   ?? '');
        $slug = trim($body['slug']   ?? '');
        $desc = trim($body['description'] ?? '');
        $cat  = (int)($body['createdAt'] ?? (time() * 1000));
        if (!$name || !$slug) respond(400, ['error' => 'Name and slug are required']);
        $stmt = $pdo->prepare(
            'INSERT INTO nv_albums (id, name, slug, description, created_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description)'
        );
        $stmt->execute([$id, $name, $slug, $desc, $cat]);
        respond(200, ['success' => true, 'id' => $id]);

    case 'delete_album':
        requireAuth($pdo);
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = $body['id'] ?? '';
        if (!$id) respond(400, ['error' => 'Missing id']);
        // Delete photos in album too
        $stmt = $pdo->prepare('DELETE FROM nv_photos WHERE album_id = ?');
        $stmt->execute([$id]);
        $stmt = $pdo->prepare('DELETE FROM nv_albums WHERE id = ?');
        $stmt->execute([$id]);
        respond(200, ['success' => true]);

    // ── PHOTOS ────────────────────────────────────────────────────────────────
    case 'get_photos':
        $stmt   = $pdo->query('SELECT * FROM nv_photos ORDER BY created_at ASC');
        $photos = $stmt->fetchAll();
        $out = array_map(fn($r) => [
            'id'          => $r['id'],
            'albumId'     => $r['album_id'],
            'title'       => $r['title'],
            'url'         => $r['url'],
            'aspect'      => $r['aspect'],
            'altText'     => $r['alt_text'],
            'storageType' => $r['storage_type'],
            'createdAt'   => (int)$r['created_at'],
        ], $photos);
        respond(200, $out);

    case 'upload_photo':
        requireAuth($pdo);
        ensureUploadDir();

        // --- Handle file upload ---
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $file    = $_FILES['file'];
            $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            $mime    = mime_content_type($file['tmp_name']);

            if (!in_array($mime, $allowed)) {
                respond(400, ['error' => 'Only JPEG, PNG, WebP and GIF images are allowed.']);
            }
            if ($file['size'] > MAX_UPLOAD_SIZE) {
                respond(400, ['error' => 'File exceeds 10 MB limit.']);
            }

            $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'nv_' . uniqid() . '.' . strtolower($ext);
            $dest     = UPLOAD_DIR . $filename;

            if (!move_uploaded_file($file['tmp_name'], $dest)) {
                respond(500, ['error' => 'Failed to save uploaded file.']);
            }

            // --- Save metadata to DB ---
            $id      = 'photo-' . time() . rand(100, 999);
            $albumId = $_POST['albumId']     ?? '';
            $title   = $_POST['title']       ?? 'Untitled';
            $aspect  = $_POST['aspect']      ?? 'portrait';
            $alt     = $_POST['altText']     ?? '';
            $url     = UPLOAD_URL . $filename;
            $cat     = time() * 1000;

            $stmt = $pdo->prepare(
                'INSERT INTO nv_photos (id, album_id, title, url, aspect, alt_text, storage_type, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, "upload", ?)'
            );
            $stmt->execute([$id, $albumId, $title, $url, $aspect, $alt, $cat]);

            respond(201, [
                'success' => true,
                'id'      => $id,
                'url'     => $url,
            ]);
        }

        // --- Handle remote URL ---
        $body    = json_decode(file_get_contents('php://input'), true);
        $id      = 'photo-' . time() . rand(100, 999);
        $albumId = $body['albumId']  ?? '';
        $title   = $body['title']    ?? 'Untitled';
        $url     = $body['url']      ?? '';
        $aspect  = $body['aspect']   ?? 'portrait';
        $alt     = $body['altText']  ?? '';
        $cat     = (int)($body['createdAt'] ?? (time() * 1000));

        if (!$url) respond(400, ['error' => 'No file or URL provided.']);

        $stmt = $pdo->prepare(
            'INSERT INTO nv_photos (id, album_id, title, url, aspect, alt_text, storage_type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, "url", ?)'
        );
        $stmt->execute([$id, $albumId, $title, $url, $aspect, $alt, $cat]);

        respond(201, ['success' => true, 'id' => $id, 'url' => $url]);

    case 'delete_photo':
        requireAuth($pdo);
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = $body['id'] ?? '';
        if (!$id) respond(400, ['error' => 'Missing id']);

        // If it's an uploaded file, delete it from disk too
        $stmt = $pdo->prepare('SELECT url, storage_type FROM nv_photos WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row && $row['storage_type'] === 'upload') {
            $file = UPLOAD_DIR . basename($row['url']);
            if (file_exists($file)) {
                @unlink($file);
            }
        }

        $stmt = $pdo->prepare('DELETE FROM nv_photos WHERE id = ?');
        $stmt->execute([$id]);
        respond(200, ['success' => true]);

    // ── INSTAGRAM ─────────────────────────────────────────────────────────────
    case 'get_instagram':
        $stmt  = $pdo->query('SELECT * FROM nv_instagram ORDER BY created_at ASC');
        $posts = $stmt->fetchAll();
        $out = array_map(fn($r) => [
            'id'        => $r['id'],
            'imgUrl'    => $r['img_url'],
            'caption'   => $r['caption'],
            'likes'     => (int)$r['likes'],
            'postUrl'   => $r['post_url'],
            'createdAt' => (int)$r['created_at'],
        ], $posts);
        respond(200, $out);

    case 'save_instagram':
        requireAuth($pdo);
        $body    = json_decode(file_get_contents('php://input'), true);
        $id      = $body['id']        ?? ('insta-' . time());
        $imgUrl  = $body['imgUrl']    ?? '';
        $caption = $body['caption']   ?? '';
        $likes   = (int)($body['likes'] ?? 0);
        $postUrl = $body['postUrl']   ?? '';
        $cat     = (int)($body['createdAt'] ?? (time() * 1000));
        if (!$imgUrl) respond(400, ['error' => 'Image URL is required']);
        $stmt = $pdo->prepare(
            'INSERT INTO nv_instagram (id, img_url, caption, likes, post_url, created_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE img_url=VALUES(img_url), caption=VALUES(caption),
                                     likes=VALUES(likes), post_url=VALUES(post_url)'
        );
        $stmt->execute([$id, $imgUrl, $caption, $likes, $postUrl, $cat]);
        respond(200, ['success' => true, 'id' => $id]);

    case 'delete_instagram':
        requireAuth($pdo);
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = $body['id'] ?? '';
        if (!$id) respond(400, ['error' => 'Missing id']);
        $stmt = $pdo->prepare('DELETE FROM nv_instagram WHERE id = ?');
        $stmt->execute([$id]);
        respond(200, ['success' => true]);

    // ── INSTAGRAM API SYNC ────────────────────────────────────────────────────
    case 'get_instagram_status':
        // Public endpoint — tells the frontend when the last sync was and whether a token is set.
        $lastSync  = getSetting($pdo, 'instagram_last_sync');
        $tokenSet  = !empty(getSetting($pdo, 'instagram_access_token'));
        respond(200, [
            'token_set'  => $tokenSet,
            'last_sync'  => $lastSync ? (int)$lastSync : null,
        ]);

    case 'sync_instagram':
        requireAuth($pdo);

        $token = getSetting($pdo, 'instagram_access_token');
        if (!$token) {
            respond(400, ['error' => 'No Instagram access token saved. Add one in Admin → Instagram → API Settings.']);
        }

        // ── Auto-refresh token when it is within 7 days of the 60-day expiry ──
        $lastRefresh = (int)(getSetting($pdo, 'instagram_token_refreshed') ?? 0);
        $daysSinceRefresh = (time() - $lastRefresh) / 86400;
        if ($daysSinceRefresh > 53) { // refresh after 53 days so we stay well inside the 60-day window
            $refreshUrl    = 'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' . urlencode($token);
            $refreshResult = httpGet($refreshUrl, 10);
            if ($refreshResult) {
                $refreshJson = json_decode($refreshResult, true);
                if (!empty($refreshJson['access_token'])) {
                    $token = $refreshJson['access_token'];
                    upsertSetting($pdo, 'instagram_access_token', $token);
                }
            }
            upsertSetting($pdo, 'instagram_token_refreshed', (string)time());
        }

        // ── Fetch latest media from Instagram Graph API ───────────────────────
        $mediaUrl    = 'https://graph.instagram.com/me/media'
                     . '?fields=id,caption,media_url,media_type,permalink,timestamp'
                     . '&limit=12'
                     . '&access_token=' . urlencode($token);
        $mediaResult = httpGet($mediaUrl, 20);

        if (!$mediaResult) {
            respond(503, ['error' => 'Could not reach Instagram API. Check server outbound connections or your access token.']);
        }

        $mediaJson = json_decode($mediaResult, true);

        if (!empty($mediaJson['error'])) {
            $msg = $mediaJson['error']['message'] ?? 'Unknown Instagram API error';
            $code = (int)($mediaJson['error']['code'] ?? 0);
            // Token expired / invalid
            if ($code === 190 || $code === 102) {
                respond(401, ['error' => 'Instagram token expired or invalid. Generate a new one and save it again. (' . $msg . ')']);
            }
            respond(400, ['error' => 'Instagram API: ' . $msg]);
        }

        $items = $mediaJson['data'] ?? [];
        if (empty($items)) {
            respond(200, ['success' => true, 'synced' => 0, 'message' => 'No media found on this Instagram account.']);
        }

        // Replace all existing posts with fresh data from Instagram
        $pdo->exec('DELETE FROM nv_instagram');
        $synced = 0;
        foreach ($items as $item) {
            // Skip video-only items that have no image preview
            if (empty($item['media_url'])) continue;
            $id        = 'ig-' . $item['id'];
            $imgUrl    = $item['media_url'];
            $caption   = mb_substr($item['caption'] ?? '', 0, 2200);
            $postUrl   = $item['permalink'] ?? '';
            $createdAt = !empty($item['timestamp']) ? (strtotime($item['timestamp']) * 1000) : (time() * 1000);
            $stmt = $pdo->prepare(
                'INSERT INTO nv_instagram (id, img_url, caption, likes, post_url, created_at)
                 VALUES (?, ?, ?, 0, ?, ?)'
            );
            $stmt->execute([$id, $imgUrl, $caption, $postUrl, $createdAt]);
            $synced++;
        }

        upsertSetting($pdo, 'instagram_last_sync', (string)time());
        respond(200, ['success' => true, 'synced' => $synced]);

    // ── STANDALONE IMAGE UPLOAD (hero bg, etc.) ───────────────────────────────
    case 'upload_image':
        requireAuth($pdo);
        ensureUploadDir();
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            respond(400, ['error' => 'No file provided or upload error.']);
        }
        $file    = $_FILES['file'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $mime    = mime_content_type($file['tmp_name']);
        if (!in_array($mime, $allowed)) {
            respond(400, ['error' => 'Only JPEG, PNG, WebP and GIF images are allowed.']);
        }
        if ($file['size'] > MAX_UPLOAD_SIZE) {
            respond(400, ['error' => 'File exceeds 10 MB limit.']);
        }
        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'nv_img_' . uniqid() . '.' . strtolower($ext);
        $dest     = UPLOAD_DIR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            respond(500, ['error' => 'Failed to save uploaded file.']);
        }
        respond(201, ['success' => true, 'url' => UPLOAD_URL . $filename]);

    default:
        respond(404, ['error' => 'Unknown action: ' . htmlspecialchars($action)]);
}

} catch (PDOException $e) {
    // Catch any uncaught DB errors (e.g. table not found - run setup.sql!)
    respond(500, ['error' => 'Database query failed: ' . $e->getMessage(), 'hint' => 'Have you run setup.sql in phpMyAdmin?']);
} catch (Throwable $e) {
    respond(500, ['error' => 'Server error: ' . $e->getMessage()]);
}
