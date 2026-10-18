-- North Vows Photography — Database Setup
-- Run this ONCE on your Hostinger MySQL database via phpMyAdmin.
-- Go to: hPanel → Databases → phpMyAdmin → Select your DB → SQL tab → Paste & Run

CREATE TABLE IF NOT EXISTS `nv_settings` (
    `setting_key`   VARCHAR(100)    NOT NULL,
    `setting_value` LONGTEXT        NOT NULL,
    PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nv_albums` (
    `id`          VARCHAR(50)  NOT NULL,
    `name`        VARCHAR(200) NOT NULL,
    `slug`        VARCHAR(200) NOT NULL,
    `description` TEXT         DEFAULT NULL,
    `created_at`  BIGINT       NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nv_photos` (
    `id`           VARCHAR(50)  NOT NULL,
    `album_id`     VARCHAR(50)  NOT NULL,
    `title`        VARCHAR(200) NOT NULL,
    `url`          LONGTEXT     NOT NULL,
    `aspect`       VARCHAR(20)  DEFAULT 'portrait',
    `alt_text`     VARCHAR(500) DEFAULT '',
    `storage_type` VARCHAR(20)  DEFAULT 'url',
    `created_at`   BIGINT       NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_album_id` (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nv_instagram` (
    `id`         VARCHAR(50)  NOT NULL,
    `img_url`    LONGTEXT     NOT NULL,
    `caption`    TEXT         DEFAULT NULL,
    `likes`      INT          DEFAULT 0,
    `post_url`   VARCHAR(500) DEFAULT '',
    `created_at` BIGINT       NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default passcode setting (INSERT IGNORE: never overwrites an existing passcode)
INSERT IGNORE INTO `nv_settings` (`setting_key`, `setting_value`)
VALUES ('passcode', 'change_me');  -- set your own; must match DEFAULT_PASSCODE in config.php

-- Location update (Oct 2026): settings saved in the DB override the defaults in app.js,
-- so re-run these if the site still shows the old London / street address.
UPDATE `nv_settings` SET `setting_value` = 'Kitchener, ON N2E 2K2' WHERE `setting_key` = 'studioAddress';
UPDATE `nv_settings` SET `setting_value` = 'Available worldwide for weddings, editorial campaigns, architectural portfolios, and select creative projects. Based in Kitchener, Ontario, serving Kitchener, Waterloo and Cambridge.' WHERE `setting_key` = 'aboutDesc2';
UPDATE `nv_settings` SET `setting_value` = 'Wedding, engagement and portrait photographer serving Kitchener, Waterloo and Cambridge, Ontario. Minimal, elegant fine art photography by North Vows.' WHERE `setting_key` = 'siteDesc';

-- Placeholder cleanup (Oct 2026): replace the stock Instagram avatar with the studio logo.
UPDATE `nv_settings` SET `setting_value` = 'Assets/logo.png' WHERE `setting_key` = 'instaAvatar' AND `setting_value` LIKE '%unsplash.com%';
-- Remove made-up sample Instagram posts if any were saved to the database.
DELETE FROM `nv_instagram` WHERE `id` IN ('insta-1','insta-2','insta-3','insta-4','insta-5','insta-6');
