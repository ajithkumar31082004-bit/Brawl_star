-- ========================================================================
-- BATTLEVERSE: PostgreSQL Seed Data
-- Run after: 001_initial_schema.sql
-- ========================================================================

-- ─── Season 1 (already inserted by migration, but safe to re-run) ────────────
INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES ('Season 1 — Dawn of Brawlers', NOW(), NOW() + INTERVAL '90 days', TRUE)
ON CONFLICT DO NOTHING;

-- ─── Heroes ──────────────────────────────────────────────────────────────────
-- All stat values are authoritative — game server uses these directly
INSERT INTO heroes (
    slug, name, class, rarity, health, attack_damage, movement_speed,
    attack_range, attack_cooldown_ms, super_charge_per_hit, ammo_count, ammo_recharge_ms,
    normal_attack, normal_attack_desc,
    super_ability, super_ability_desc,
    gadget, gadget_desc,
    passive, passive_desc,
    description, color_hex, emoji, is_default, unlock_cost_coins
) VALUES
-- BLAZE (Default — all players start with this hero)
(
    'blaze', 'BLAZE', 'Damage', 'Legendary',
    5200, 850, 80, 70, 500, 12, 3, 1300,
    'Fire Shot',           'Launches a searing fireball that deals 850 damage on impact.',
    'Fire Storm',          'Unleashes a tornado of flames, dealing 2000 damage per second in a large area for 3 seconds.',
    'Heat Shield',         'Activates a brief heat shield absorbing 1000 damage for 2 seconds.',
    'Burn Damage',         'Each shot applies a burn stack dealing 100 damage per second for 2s. Stacks up to 3 times.',
    'A volatile pyromancer who channels raw fire into devastating attacks. Excels at zone control and sustained pressure.',
    '#FF4500', '🔥', TRUE, 0
),
-- VOLT
(
    'volt', 'VOLT', 'Assassin', 'Epic',
    3800, 1100, 95, 60, 350, 15, 3, 1000,
    'Thunder Bolt',        'Fires a fast-moving bolt of lightning dealing 1100 damage.',
    'Lightning Dash',      'Dashes to target location and releases a shockwave dealing 1800 damage nearby.',
    'Static Field',        'Creates a field around VOLT slowing enemies by 40% for 2 seconds.',
    'Overcharge',          'After dashing, next attack deals 50% bonus damage.',
    'A high-risk, high-reward assassin who excels at bursting down single targets and escaping.',
    '#FFD700', '⚡', FALSE, 2000
),
-- TITAN
(
    'titan', 'TITAN', 'Tank', 'Epic',
    8500, 650, 55, 50, 700, 8, 3, 1600,
    'Iron Slam',           'A powerful melee strike dealing 650 damage to nearby enemies.',
    'Shield Wall',         'Deploys an energy barrier absorbing 3000 damage for 4 seconds. Reflects 30% damage back.',
    'Bulwark',             'Taunts nearby enemies, forcing them to target TITAN for 2 seconds.',
    'Fortified',           'Gains 150 HP per second when not taking damage for 3+ seconds.',
    'An unmovable juggernaut designed to absorb damage and protect teammates.',
    '#4A90E2', '🛡️', FALSE, 2000
),
-- FROST
(
    'frost', 'FROST', 'Controller', 'Super Rare',
    4200, 720, 70, 80, 550, 10, 3, 1200,
    'Ice Shard',           'Launches a piercing ice shard dealing 720 damage. Passes through enemies.',
    'Ice Burst',           'Releases a blizzard freezing all enemies in range for 2 seconds and dealing 1400 damage.',
    'Cryo Field',          'Drops a frost trap that slows enemies entering it by 60% for 3 seconds.',
    'Frostbite',           'Enemies hit by Ice Shard receive 20% reduced attack speed for 2 seconds.',
    'A tactical controller who dominates zones through slows, freezes, and area denial.',
    '#00CED1', '❄️', FALSE, 1500
),
-- ROCKET
(
    'rocket', 'ROCKET', 'Damage', 'Super Rare',
    4600, 950, 72, 90, 600, 11, 3, 1400,
    'Rocket Blast',        'Fires an explosive rocket dealing 950 splash damage in a 60px radius.',
    'Rocket Barrage',      'Launches 8 rockets in a spread pattern, each dealing 600 damage.',
    'Afterburn',           'Rocket exhaust damages enemies behind ROCKET for 400 damage.',
    'Payload',             'Each rocket has a 15% chance to deal double damage.',
    'A long-range artillery specialist who excels at area-of-effect damage and pressure.',
    '#FF6600', '🚀', FALSE, 1500
),
-- LUNA
(
    'luna', 'LUNA', 'Support', 'Rare',
    4000, 580, 75, 85, 450, 9, 3, 1100,
    'Moonbeam',            'Fires a healing beam. Deals 580 damage to enemies, heals 400 HP to allies.',
    'Healing Pulse',       'Releases a wave healing all nearby allies for 2000 HP over 3 seconds.',
    'Lunar Shield',        'Grants a targeted ally a shield absorbing 800 damage for 3 seconds.',
    'Moonlight',           'LUNA regenerates 80 HP per second passively when not taking damage.',
    'A versatile support who can turn the tide of battle through sustained healing and shields.',
    '#C0C0FF', '🌙', FALSE, 1000
),
-- BUSTER
(
    'buster', 'BUSTER', 'Tank', 'Rare',
    7800, 700, 60, 45, 650, 9, 3, 1500,
    'Ground Pound',        'Slams the ground dealing 700 damage to all enemies in melee range.',
    'Ground Slam',         'Leaps and crashes down, dealing 2200 damage in a large radius and stunning for 1.5s.',
    'Tough Guy',           'Reduces incoming damage by 200 for the next 3 hits.',
    'Ironclad',            'Every 5 hits taken grants BUSTER 400 bonus HP (up to 1600 stacked).',
    'A brawling tank who thrives in close quarters, soaking damage and stunning enemies.',
    '#8B4513', '👊', FALSE, 1000
),
-- PICO
(
    'pico', 'PICO', 'Support', 'Rare',
    3600, 500, 90, 75, 400, 10, 3, 900,
    'Bot Blast',           'Fires a rapid burst of 500 damage plasma bolts. 3 shots per attack.',
    'Energy Boost',        'Overclocks nearby allies, increasing their movement speed by 30% and attack speed by 20% for 4s.',
    'Deploy Bot',          'Deploys an autonomous bot that attacks nearby enemies for 250 damage/shot for 8 seconds.',
    'Overclocked',         'PICO''s attacks generate 50% more super charge when targeting the same enemy consecutively.',
    'A fast-moving support bot who augments the team through speed buffs and autonomous combat drones.',
    '#00FF7F', '🤖', FALSE, 1000
)
ON CONFLICT (slug) DO UPDATE SET
    health           = EXCLUDED.health,
    attack_damage    = EXCLUDED.attack_damage,
    movement_speed   = EXCLUDED.movement_speed,
    attack_range     = EXCLUDED.attack_range,
    attack_cooldown_ms = EXCLUDED.attack_cooldown_ms,
    super_charge_per_hit = EXCLUDED.super_charge_per_hit,
    ammo_count       = EXCLUDED.ammo_count,
    ammo_recharge_ms = EXCLUDED.ammo_recharge_ms;

-- ─── Achievements ─────────────────────────────────────────────────────────────
INSERT INTO achievements (slug, name, description, icon, category, points) VALUES
    ('first_blood',    'First Blood',      'Get your first kill',                       '🩸', 'combat',    100),
    ('win_first',      'Victory!',         'Win your first match',                      '🏆', 'matches',   200),
    ('kill_10',        'On a Roll',        'Get 10 kills in total',                     '⚔️', 'combat',    300),
    ('win_10',         'Arena Champion',   'Win 10 matches',                            '🎖️', 'matches',   500),
    ('crystals_100',   'Crystal Hoarder',  'Collect 100 crystals across all matches',   '💎', 'objectives',400),
    ('trophy_1000',    'Trophy Hunter',    'Reach 1000 trophies',                       '🏅', 'progress',  500),
    ('trophy_10000',   'Legend',           'Reach 10000 trophies',                      '👑', 'progress', 2000),
    ('mvp_5',          'Star Player',      'Be MVP in 5 matches',                       '⭐', 'matches',   600),
    ('damage_50000',   'Damage Dealer',    'Deal 50,000 total damage',                  '💥', 'combat',    400),
    ('friend_1',       'Sociable',         'Add your first friend',                     '🤝', 'social',    100)
ON CONFLICT (slug) DO NOTHING;

-- ─── Default Skins for BLAZE ─────────────────────────────────────────────────
INSERT INTO skins (hero_id, name, rarity, price, currency, emoji, description)
SELECT
    h.id,
    skin.name,
    skin.rarity,
    skin.price,
    skin.currency,
    skin.emoji,
    skin.description
FROM heroes h
CROSS JOIN (VALUES
    ('Inferno BLAZE',   'Legendary',  800, 'gems',  '🌋', 'Engulfed in volcanic flames'),
    ('Shadow BLAZE',    'Epic',       400, 'gems',  '🖤', 'Draped in darkness and embers'),
    ('Coastal BLAZE',   'Super Rare', 150, 'gems',  '🌊', 'Fire meets the ocean'),
    ('Classic BLAZE',   'Rare',      5000, 'coins', '🔥', 'The original flame')
) AS skin(name, rarity, price, currency, emoji, description)
WHERE h.slug = 'blaze'
ON CONFLICT DO NOTHING;
