-- ========================================================================
-- BATTLEVERSE: 3V3 HERO ARENA — PostgreSQL Schema (Production)
-- Compatible with PostgreSQL 13+, Supabase, Neon, AWS RDS PostgreSQL
-- ========================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-creating
DROP TABLE IF EXISTS coins_transactions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS skins CASCADE;
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS user_heroes CASCADE;
DROP TABLE IF EXISTS heroes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(64) DEFAULT '🔥',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    trophies INTEGER DEFAULT 0,
    highest_trophies INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 500,
    gems INTEGER DEFAULT 50,
    rank_tier VARCHAR(32) DEFAULT 'Bronze',
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_trophies ON users(trophies DESC);
CREATE INDEX idx_user_username ON users(username);

-- 2. Heroes Table
CREATE TABLE heroes (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(32) NOT NULL,
    class VARCHAR(32) NOT NULL CHECK (class IN ('Damage', 'Assassin', 'Tank', 'Support', 'Controller')),
    rarity VARCHAR(32) NOT NULL CHECK (rarity IN ('Legendary', 'Epic', 'Super Rare', 'Rare')),
    health INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    range_stat INTEGER NOT NULL,
    super_charge INTEGER NOT NULL,
    normal_attack VARCHAR(64) NOT NULL,
    normal_attack_desc TEXT NOT NULL,
    super_ability VARCHAR(64) NOT NULL,
    super_ability_desc TEXT NOT NULL,
    passive VARCHAR(64) NOT NULL,
    passive_desc TEXT NOT NULL,
    description TEXT NOT NULL,
    color_hex VARCHAR(10) NOT NULL,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Heroes (Unlocked characters & upgrades)
CREATE TABLE user_heroes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hero_id VARCHAR(36) NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    power_level INTEGER DEFAULT 1,
    trophies INTEGER DEFAULT 0,
    mastery_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_hero UNIQUE (user_id, hero_id)
);

-- 4. Matches Table
CREATE TABLE matches (
    id VARCHAR(36) PRIMARY KEY,
    game_mode VARCHAR(32) NOT NULL CHECK (game_mode IN ('crystal_clash', 'survival', 'ranked_arena', 'custom')),
    arena_name VARCHAR(64) DEFAULT 'Crystal Cavern',
    winning_team VARCHAR(16) NOT NULL CHECK (winning_team IN ('blue', 'red', 'draw')),
    duration_seconds INTEGER NOT NULL,
    blue_crystals INTEGER DEFAULT 0,
    red_crystals INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_match_mode ON matches(game_mode);
CREATE INDEX idx_match_started ON matches(started_at DESC);

-- 5. Match Players
CREATE TABLE match_players (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hero_id VARCHAR(36) NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    team VARCHAR(16) NOT NULL CHECK (team IN ('blue', 'red')),
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    damage_dealt INTEGER DEFAULT 0,
    crystals_collected INTEGER DEFAULT 0,
    trophies_delta INTEGER DEFAULT 0,
    xp_gained INTEGER DEFAULT 0,
    is_mvp BOOLEAN DEFAULT FALSE
);

-- 6. Leaderboards Table
CREATE TABLE leaderboards (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    global_rank INTEGER NOT NULL,
    trophies INTEGER NOT NULL,
    victories INTEGER DEFAULT 0,
    win_rate NUMERIC(5, 2) DEFAULT 0.00,
    country_code VARCHAR(8) DEFAULT 'GLOBAL',
    season_id INTEGER DEFAULT 7,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_rank ON leaderboards(global_rank ASC);

-- 7. Skins Table
CREATE TABLE skins (
    id VARCHAR(36) PRIMARY KEY,
    hero_id VARCHAR(36) NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    rarity VARCHAR(32) NOT NULL CHECK (rarity IN ('Legendary', 'Epic', 'Super Rare', 'Rare')),
    price INTEGER NOT NULL,
    currency VARCHAR(16) NOT NULL CHECK (currency IN ('gems', 'coins')),
    emoji VARCHAR(16) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. User Inventory (Skins & Items)
CREATE TABLE inventory (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(32) NOT NULL CHECK (item_type IN ('skin', 'emote', 'badge', 'powerpoints')),
    item_id VARCHAR(64) NOT NULL,
    quantity INTEGER DEFAULT 1,
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_item UNIQUE (user_id, item_type, item_id)
);

-- 9. Friends Table
CREATE TABLE friends (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_friend_pair UNIQUE (user_id, friend_id)
);

-- 10. Achievements Table
CREATE TABLE achievements (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(16) NOT NULL,
    category VARCHAR(32) DEFAULT 'general',
    points INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. User Achievements
CREATE TABLE user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(36) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_achievement UNIQUE (user_id, achievement_id)
);

-- 12. Events Table
CREATE TABLE events (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    reward_type VARCHAR(32) NOT NULL,
    reward_amount VARCHAR(32) NOT NULL,
    multiplier VARCHAR(16) DEFAULT '1X',
    emoji VARCHAR(16) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Game Sessions
CREATE TABLE game_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    socket_id VARCHAR(64),
    current_room_id VARCHAR(64),
    status VARCHAR(20) DEFAULT 'lobby' CHECK (status IN ('lobby', 'in_game', 'offline')),
    last_ping TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('match_invite', 'friend_request', 'reward', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Coins & Gems Transactions Log
CREATE TABLE coins_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(16) NOT NULL CHECK (currency IN ('coins', 'gems')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_transactions ON coins_transactions(user_id, created_at DESC);
