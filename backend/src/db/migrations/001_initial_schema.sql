-- ========================================================================
-- BATTLEVERSE: Migration 001 — Initial Schema (PostgreSQL)
-- Run once: psql $DATABASE_URL -f 001_initial_schema.sql
-- ========================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast username search

-- ─── Drop order respects FK constraints ────────────────────────────────────
DROP TABLE IF EXISTS coins_transactions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS matchmaking_queue CASCADE;
DROP TABLE IF EXISTS battle_pass_progress CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
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
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── 1. Users ───────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(32)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar        VARCHAR(64)  DEFAULT '🔥',
    level         INTEGER      DEFAULT 1,
    xp            INTEGER      DEFAULT 0,
    max_xp        INTEGER      DEFAULT 500,
    trophies      INTEGER      DEFAULT 0,
    highest_trophies INTEGER   DEFAULT 0,
    coins         INTEGER      DEFAULT 500,
    gems          INTEGER      DEFAULT 50,
    rank_tier     VARCHAR(32)  DEFAULT 'Bronze' CHECK (rank_tier IN ('Bronze','Silver','Gold','Platinum','Diamond','Master','Legend')),
    wins          INTEGER      DEFAULT 0,
    losses        INTEGER      DEFAULT 0,
    is_active     BOOLEAN      DEFAULT TRUE,
    role          VARCHAR(20)  DEFAULT 'player' CHECK (role IN ('player','admin','moderator')),
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_trophies  ON users(trophies DESC);
CREATE INDEX idx_users_username  ON users USING GIN (username gin_trgm_ops);
CREATE INDEX idx_users_email     ON users(email);

-- ─── 2. Refresh Tokens ──────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_token_hash    ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_token_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token_expires ON refresh_tokens(expires_at);

-- ─── 3. Heroes ──────────────────────────────────────────────────────────────
CREATE TABLE heroes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                VARCHAR(32)  NOT NULL UNIQUE,
    name                VARCHAR(32)  NOT NULL,
    class               VARCHAR(32)  NOT NULL CHECK (class IN ('Damage','Assassin','Tank','Support','Controller')),
    rarity              VARCHAR(32)  NOT NULL CHECK (rarity IN ('Legendary','Epic','Super Rare','Rare')),
    health              INTEGER      NOT NULL,
    attack_damage       INTEGER      NOT NULL,
    movement_speed      INTEGER      NOT NULL,
    attack_range        INTEGER      NOT NULL,
    attack_cooldown_ms  INTEGER      NOT NULL DEFAULT 500,   -- server enforces this
    super_charge_per_hit INTEGER     NOT NULL DEFAULT 10,
    ammo_count          INTEGER      NOT NULL DEFAULT 3,
    ammo_recharge_ms    INTEGER      NOT NULL DEFAULT 1300,
    normal_attack       VARCHAR(64)  NOT NULL,
    normal_attack_desc  TEXT         NOT NULL,
    super_ability       VARCHAR(64)  NOT NULL,
    super_ability_desc  TEXT         NOT NULL,
    gadget              VARCHAR(64)  NOT NULL DEFAULT 'None',
    gadget_desc         TEXT         NOT NULL DEFAULT '',
    passive             VARCHAR(64)  NOT NULL,
    passive_desc        TEXT         NOT NULL,
    description         TEXT         NOT NULL,
    color_hex           VARCHAR(10)  NOT NULL DEFAULT '#ff4444',
    emoji               VARCHAR(16)  NOT NULL DEFAULT '⚔️',
    unlock_cost_coins   INTEGER      DEFAULT 0,
    is_default          BOOLEAN      DEFAULT FALSE,
    created_at          TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 4. User Heroes (unlocked characters) ───────────────────────────────────
CREATE TABLE user_heroes (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hero_id        UUID    NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    power_level    INTEGER DEFAULT 1,
    trophies       INTEGER DEFAULT 0,
    mastery_points INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_hero UNIQUE (user_id, hero_id)
);

-- ─── 5. Seasons ─────────────────────────────────────────────────────────────
CREATE TABLE seasons (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(64)  NOT NULL,
    starts_at   TIMESTAMPTZ  NOT NULL,
    ends_at     TIMESTAMPTZ  NOT NULL,
    is_active   BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 6. Battle Pass Progress ─────────────────────────────────────────────────
CREATE TABLE battle_pass_progress (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id   INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    level       INTEGER DEFAULT 1,
    xp          INTEGER DEFAULT 0,
    is_premium  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_season UNIQUE (user_id, season_id)
);

-- ─── 7. Matches ─────────────────────────────────────────────────────────────
CREATE TABLE matches (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id          VARCHAR(64)  NOT NULL,
    game_mode        VARCHAR(32)  NOT NULL CHECK (game_mode IN ('gem_grab','team_deathmatch','showdown','capture_zone','ranked')),
    map_name         VARCHAR(64)  DEFAULT 'Crystal Cavern',
    winning_team     VARCHAR(16)  NOT NULL CHECK (winning_team IN ('blue','red','draw')),
    duration_seconds INTEGER      NOT NULL,
    blue_score       INTEGER      DEFAULT 0,
    red_score        INTEGER      DEFAULT 0,
    season_id        INTEGER      REFERENCES seasons(id),
    started_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_match_mode    ON matches(game_mode);
CREATE INDEX idx_match_started ON matches(started_at DESC);

-- ─── 8. Match Players ────────────────────────────────────────────────────────
CREATE TABLE match_players (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id          UUID    NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id           UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hero_id           UUID    NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    team              VARCHAR(16) NOT NULL CHECK (team IN ('blue','red')),
    kills             INTEGER DEFAULT 0,
    deaths            INTEGER DEFAULT 0,
    assists           INTEGER DEFAULT 0,
    damage_dealt      INTEGER DEFAULT 0,
    healing_done      INTEGER DEFAULT 0,
    score             INTEGER DEFAULT 0,  -- crystals/kills depending on mode
    trophies_delta    INTEGER DEFAULT 0,
    xp_gained         INTEGER DEFAULT 0,
    coins_gained      INTEGER DEFAULT 0,
    is_mvp            BOOLEAN DEFAULT FALSE,
    placement         INTEGER,            -- for showdown mode
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── 9. Leaderboards ─────────────────────────────────────────────────────────
CREATE TABLE leaderboards (
    id           SERIAL PRIMARY KEY,
    user_id      UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    global_rank  INTEGER      NOT NULL,
    trophies     INTEGER      NOT NULL,
    victories    INTEGER      DEFAULT 0,
    win_rate     NUMERIC(5,2) DEFAULT 0.00,
    country_code VARCHAR(8)   DEFAULT 'GLOBAL',
    season_id    INTEGER      DEFAULT 1,
    updated_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_rank    ON leaderboards(global_rank ASC);
CREATE INDEX idx_leaderboard_trophies ON leaderboards(trophies DESC);

-- ─── 10. Skins ───────────────────────────────────────────────────────────────
CREATE TABLE skins (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hero_id      UUID         NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    name         VARCHAR(64)  NOT NULL,
    rarity       VARCHAR(32)  NOT NULL CHECK (rarity IN ('Legendary','Epic','Super Rare','Rare')),
    price        INTEGER      NOT NULL,
    currency     VARCHAR(16)  NOT NULL CHECK (currency IN ('gems','coins')),
    emoji        VARCHAR(16)  NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 11. Inventory ───────────────────────────────────────────────────────────
CREATE TABLE inventory (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type   VARCHAR(32) NOT NULL CHECK (item_type IN ('skin','emote','badge','powerpoints')),
    item_id     VARCHAR(64) NOT NULL,
    quantity    INTEGER     DEFAULT 1,
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_item UNIQUE (user_id, item_type, item_id)
);

-- ─── 12. Friends ─────────────────────────────────────────────────────────────
CREATE TABLE friends (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_friend_pair UNIQUE (user_id, friend_id),
    CONSTRAINT no_self_friend CHECK (user_id != friend_id)
);

-- ─── 13. Achievements ────────────────────────────────────────────────────────
CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(64) NOT NULL UNIQUE,
    name        VARCHAR(64) NOT NULL,
    description TEXT        NOT NULL,
    icon        VARCHAR(16) NOT NULL,
    category    VARCHAR(32) DEFAULT 'general',
    points      INTEGER     DEFAULT 100,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_achievement UNIQUE (user_id, achievement_id)
);

-- ─── 14. Matchmaking Queue ────────────────────────────────────────────────────
CREATE TABLE matchmaking_queue (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hero_id     UUID        REFERENCES heroes(id),
    trophies    INTEGER     NOT NULL,
    region      VARCHAR(32) DEFAULT 'global',
    socket_id   VARCHAR(64),
    entered_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── 15. Game Sessions ────────────────────────────────────────────────────────
CREATE TABLE game_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    socket_id       VARCHAR(64),
    current_room_id VARCHAR(64),
    status          VARCHAR(20) DEFAULT 'lobby' CHECK (status IN ('lobby','matchmaking','in_game','offline')),
    last_ping       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── 16. Notifications ────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(128) NOT NULL,
    message    TEXT         NOT NULL,
    type       VARCHAR(32)  NOT NULL CHECK (type IN ('match_invite','friend_request','reward','system','achievement')),
    is_read    BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 17. Currency Transactions Log ───────────────────────────────────────────
CREATE TABLE coins_transactions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency     VARCHAR(16) NOT NULL CHECK (currency IN ('coins','gems')),
    amount       INTEGER     NOT NULL,
    balance_after INTEGER    NOT NULL,
    reason       VARCHAR(64) NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_transactions ON coins_transactions(user_id, created_at DESC);

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Initial season ───────────────────────────────────────────────────────────
INSERT INTO seasons (name, starts_at, ends_at, is_active) VALUES
    ('Season 1 — Dawn of Brawlers', NOW(), NOW() + INTERVAL '90 days', TRUE);
