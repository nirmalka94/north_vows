<?php
/**
 * North Vows Photography — Photo carousel feed
 *
 * Lists the photos in /Photo_carousel, one category per sub-folder:
 *   Photo_carousel/Wedding/photo1.jpg
 *   Photo_carousel/Family/photo2.jpg
 * A numeric prefix sets the order and is hidden on the site ("01 Wedding" → "Wedding").
 *
 * Web-sized copies are created once in Photo_carousel/_web/ (needs the PHP GD
 * extension, standard on Hostinger). Without GD the originals are served.
 * No database needed, so new photos appear as soon as they are uploaded.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-cache'); // admin uploads/removals show up straight away

const CAROUSEL_DIR    = __DIR__ . '/../Photo_carousel';
const CAROUSEL_URL    = 'Photo_carousel';
const WEB_DIR_NAME    = '_web';
const REMOVED_DIR_NAME = '_removed';   // photos removed in the admin panel (recoverable)
const SIZES           = ['large' => 1600, 'medium' => 1000, 'thumb' => 640];
const JPEG_QUALITY    = 78;
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

@ini_set('memory_limit', '256M');
@set_time_limit(120);

function displayName(string $folder): string {
    $name = preg_replace('/^\d+[\s._-]*/', '', $folder);   // drop "01 " ordering prefix
    $name = trim(preg_replace('/\s+/', ' ', str_replace(['_', '-'], ' ', $name)));
    return $name !== '' ? ucwords($name) : $folder;               // "family_sessions" → "Family Sessions"
}

function slugify(string $text): string {
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $text), '-'));
    return $slug !== '' ? $slug : 'photos';
}

function urlPath(string ...$parts): string {
    return implode('/', array_map('rawurlencode', $parts));
}

/** Creates (once) a resized JPEG copy; returns its URL, or null if GD is unavailable. */
function webCopy(string $category, string $file, string $sizeName, int $maxWidth): ?string {
    if (!function_exists('imagecreatetruecolor')) return null;

    $source   = CAROUSEL_DIR . "/$category/$file";
    $baseName = pathinfo($file, PATHINFO_FILENAME) . '.jpg';
    $targetDir = CAROUSEL_DIR . '/' . WEB_DIR_NAME . "/$sizeName/$category";
    $target   = "$targetDir/$baseName";
    $url      = CAROUSEL_URL . '/' . urlPath(WEB_DIR_NAME, $sizeName, $category, $baseName);

    if (is_file($target) && filemtime($target) >= filemtime($source)) return $url;
    if (!is_dir($targetDir) && !@mkdir($targetDir, 0755, true)) return null;

    $info = @getimagesize($source);
    if (!$info) return null;
    [$width, $height] = $info;
    switch ($info[2]) {
        case IMAGETYPE_JPEG: $img = @imagecreatefromjpeg($source); break;
        case IMAGETYPE_PNG:  $img = @imagecreatefrompng($source);  break;
        case IMAGETYPE_WEBP: $img = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($source) : false; break;
        default: $img = false;
    }
    if (!$img) return null;

    // Respect camera rotation
    if ($info[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($source);
        $rotate = ['3' => 180, '6' => -90, '8' => 90][(string)($exif['Orientation'] ?? '')] ?? 0;
        if ($rotate) {
            $img = imagerotate($img, $rotate, 0);
            [$width, $height] = [imagesx($img), imagesy($img)];
        }
    }

    $scale = min(1, $maxWidth / $width);
    $newW  = (int)round($width * $scale);
    $newH  = (int)round($height * $scale);
    $out   = imagecreatetruecolor($newW, $newH);
    imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
    imagecopyresampled($out, $img, 0, 0, 0, 0, $newW, $newH, $width, $height);
    imageinterlace($out, true);
    $ok = imagejpeg($out, $target, JPEG_QUALITY);
    imagedestroy($img);
    imagedestroy($out);
    return $ok ? $url : null;
}

$categories = [];
if (is_dir(CAROUSEL_DIR)) {
    $folders = array_filter(scandir(CAROUSEL_DIR), function ($f) {
        return $f[0] !== '.' && $f !== WEB_DIR_NAME && $f !== REMOVED_DIR_NAME && is_dir(CAROUSEL_DIR . "/$f");
    });
    natcasesort($folders);

    foreach ($folders as $folder) {
        $files = array_filter(scandir(CAROUSEL_DIR . "/$folder"), function ($f) use ($folder) {
            return $f[0] !== '.'
                && is_file(CAROUSEL_DIR . "/$folder/$f")
                && in_array(strtolower(pathinfo($f, PATHINFO_EXTENSION)), IMAGE_EXTENSIONS, true);
        });
        natcasesort($files);

        $name   = displayName($folder);
        $photos = [];
        foreach ($files as $file) {
            $original = CAROUSEL_URL . '/' . urlPath($folder, $file);
            $size     = @getimagesize(CAROUSEL_DIR . "/$folder/$file");
            $photos[] = [
                'large'  => webCopy($folder, $file, 'large', SIZES['large']) ?? $original,
                'medium' => webCopy($folder, $file, 'medium', SIZES['medium']) ?? $original,
                'thumb'  => webCopy($folder, $file, 'thumb', SIZES['thumb']) ?? $original,
                'width'  => $size[0] ?? null,
                'height' => $size[1] ?? null,
                'alt'    => "$name photography by North Vows Photography, Kitchener-Waterloo",
                'folder' => $folder,   // used by the admin panel to remove a photo
                'file'   => $file,
            ];
        }
        if ($photos) {
            $categories[] = ['name' => $name, 'slug' => slugify($name), 'photos' => $photos];
        }
    }
}

echo json_encode(['categories' => $categories], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
