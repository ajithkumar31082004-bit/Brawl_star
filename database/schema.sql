-- BATTLEVERSE: 3V3 HERO ARENA — Production MySQL Schema
-- Version: 1.0.0

CREATE DATABASE IF NOT EXISTS battleverse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE battleverse_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(64) DEFAULT '🔥',
    level INT UNSIGNED DEFAULT 1,
    xp INT UNSIGNED DEFAULT 0,
    trophies INT UNSIGNED DEFAULT 0,
    highest_trophies INT UNSIGNED DEFAULT 0,
    coins INT UNSIGNED DEFAULT 500,
    gems INT UNSIGNED DEFAULT 50,
    rank_tier VARCHAR(32) DEFAULT 'Bronze',
    is_active BOOLEAN DEFAULT TRUE,
    role ENUM('player', 'admin', 'moderator') DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_trophies (trophies DESC),
    INDEX idx_user_username (username)
) ENGINE=InnoDB;

-- 2. Heroes Table
CREATE TABLE IF NOT EXISTS heroes (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(32) NOT NULL,
    class ENUM('Damage', 'Assassin', 'Tank', 'Support', 'Controller') NOT NULL,
    rarity ENUM('Legendary', 'Epic', 'Super Rare', 'Rare') NOT NULL,
    health INT UNSIGNED NOT NULL,
    attack INT UNSIGNED NOT NULL,
    speed INT UNSIGNED NOT NULL,
    range_stat INT UNSIGNED NOT NULL,
    super_charge INT UNSIGNED NOT NULL,
    normal_attack VARCHAR(64) NOT NULL,
    normal_attack_desc TEXT NOT NULL,
    super_ability VARCHAR(64) NOT NULL,
    super_ability_desc TEXT NOT NULL,
    passive VARCHAR(64) NOT NULL,
    passive_desc TEXT NOT NULL,
    description TEXT NOT NULL,
    color_hex VARCHAR(10) NOT NULL,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. User Heroes (Unlocked characters & upgrade levels)
CREATE TABLE IF NOT EXISTS user_heroes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    hero_id VARCHAR(36) NOT NULL,
    power_level INT UNSIGNED DEFAULT 1,
    trophies INT UNSIGNED DEFAULT 0,
    mastery_points INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_hero (user_id, hero_id)
) ENGINE=InnoDB;

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(36) PRIMARY KEY,
    game_mode ENUM('crystal_clash', 'survival', 'ranked_arena', 'custom') NOT NULL,
    arena_name VARCHAR(64) DEFAULT 'Crystal Cavern',
    winning_team ENUM('blue', 'red', 'draw') NOT NULL,
    duration_seconds INT UNSIGNED NOT NULL,
    blue_crystals INT UNSIGNED DEFAULT 0,
    red_crystals INT UNSIGNED DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match_mode (game_mode),
    INDEX idx_match_started (started_at DESC)
) ENGINE=InnoDB;

-- 5. Match Players
CREATE TABLE IF NOT EXISTS match_players (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    hero_id VARCHAR(36) NOT NULL,
    team ENUM('blue', 'red') NOT NULL,
    kills INT UNSIGNED DEFAULT 0,
    deaths INT UNSIGNED DEFAULT 0,
    damage_dealt INT UNSIGNED DEFAULT 0,
    crystals_collected INT UNSIGNED DEFAULT 0,
    trophies_delta INT DEFAULT 0,
    xp_gained INT UNSIGNED DEFAULT 0,
    is_mvp BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Leaderboards Cache Table
CREATE TABLE IF NOT EXISTS leaderboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    global_rank INT UNSIGNED NOT NULL,
    trophies INT UNSIGNED NOT NULL,
    victories INT UNSIGNED DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    country_code VARCHAR(8) DEFAULT 'GLOBAL',
    season_id INT UNSIGNED DEFAULT 7,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_leaderboard_rank (global_rank ASC)
) ENGINE=InnoDB;

-- 7. Skins Table
CREATE TABLE IF NOT EXISTS skins (
    id VARCHAR(36) PRIMARY KEY,
    hero_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    rarity ENUM('Legendary', 'Epic', 'Super Rare', 'Rare') NOT NULL,
    price INT UNSIGNED NOT NULL,
    currency ENUM('gems', 'coins') NOT NULL,
    emoji VARCHAR(16) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. User Inventory (Skins & Items)
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    item_type ENUM('skin', 'emote', 'badge', 'powerpoints') NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    quantity INT UNSIGNED DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_item (user_id, item_type, item_id)
) ENGINE=InnoDB;

-- 9. Friends Table
CREATE TABLE IF NOT EXISTS friends (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    friend_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_friend_pair (user_id, friend_id)
) ENGINE=InnoDB;

-- 10. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(16) NOT NULL,
    category VARCHAR(32) DEFAULT 'general',
    points INT UNSIGNED DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(36) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB;

-- 12. Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    reward_type VARCHAR(32) NOT NULL,
    reward_amount VARCHAR(32) NOT NULL,
    multiplier VARCHAR(16) DEFAULT '1X',
    emoji VARCHAR(16) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. Game Sessions (Active connection state)
CREATE TABLE IF NOT EXISTS game_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    socket_id VARCHAR(64),
    current_room_id VARCHAR(64),
    status ENUM('lobby', 'in_game', 'offline') DEFAULT 'lobby',
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('match_invite', 'friend_request', 'reward', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Coins & Gems Transactions Log
CREATE TABLE IF NOT EXISTS coins_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    currency ENUM('coins', 'gems') NOT NULL,
    amount INT NOT NULL,
    balance_after INT UNSIGNED NOT NULL,
    reason VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_transactions (user_id, created_at DESC)
) ENGINE=InnoDB;
