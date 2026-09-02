-- BATTLEVERSE: 3V3 HERO ARENA — Production Seed Data
-- 20 Users, 8 Original Heroes, 10 Skins, 10 Achievements, 5 Events

USE battleverse_db;

-- 1. Insert 8 Original Heroes
INSERT INTO heroes (id, slug, name, class, rarity, health, attack, speed, range_stat, super_charge, normal_attack, normal_attack_desc, super_ability, super_ability_desc, passive, passive_desc, description, color_hex, emoji) VALUES
('h-blaze', 'blaze', 'BLAZE', 'Damage', 'Legendary', 5200, 850, 80, 70, 85, 'Flame Shot', 'Shoots a burst of fire that damages enemies in a cone area.', 'Fire Storm', 'Summons a storm of fire dealing massive area damage.', 'Hot Blood', 'Moves 25% faster when health is below 40%.', 'A fearless fighter who commands living fire across the battlefield.', '#EF4444', '🔥'),
('h-volt', 'volt', 'VOLT', 'Assassin', 'Epic', 3800, 1100, 95, 60, 90, 'Thunder Strike', 'Throws electrified daggers that chain between nearby enemies.', 'Lightning Dash', 'Dashes at the speed of lightning, piercing through enemies.', 'Static Charge', 'Every 3rd hit deals 35% bonus shock damage.', 'An electrifying assassin who strikes in the blink of an eye.', '#3B82F6', '⚡'),
('h-titan', 'titan', 'TITAN', 'Tank', 'Epic', 8500, 650, 55, 50, 70, 'Hammer Smash', 'Slams a seismic hammer sending shockwaves.', 'Shield Wall', 'Deploys an impenetrable energy shield barrier.', 'Iron Skin', 'Reduces all incoming damage by 15%.', 'An armored colossus holding the frontline with unmatched tenacity.', '#10B981', '🛡️'),
('h-frost', 'frost', 'FROST', 'Controller', 'Super Rare', 4200, 720, 70, 80, 75, 'Ice Shards', 'Fires crystalline shards that slow enemy movement.', 'Ice Burst', 'Freezes all enemies within radius for 2 seconds.', 'Frost Trail', 'Leaves a frozen path granting allies movement speed.', 'A cold controller manipulating the battlefield with cryogenic mastery.', '#06B6D4', '❄️'),
('h-rocket', 'rocket', 'ROCKET', 'Damage', 'Super Rare', 4600, 950, 72, 90, 80, 'Missile Burst', 'Fires rapid mini-rockets dealing explosive area damage.', 'Rocket Barrage', 'Launches an aerial barrage of homing missiles.', 'Afterburner', 'Gains a speed burst for 3s after using Super.', 'A high-flying heavy artillery specialist dominating from afar.', '#F97316', '🚀'),
('h-luna', 'luna', 'LUNA', 'Support', 'Rare', 4000, 580, 75, 85, 65, 'Star Beam', 'Fires celestial starlight that heals allies or damages foes.', 'Healing Pulse', 'Radiates a massive healing wave restoring 1500 HP to team.', 'Moonlight Aura', 'Allies within range slowly regenerate health.', 'A celestial guardian keeping her team alive under starry radiance.', '#A855F7', '🌙'),
('h-buster', 'buster', 'BUSTER', 'Tank', 'Rare', 7800, 700, 60, 45, 72, 'Power Punch', 'Delivers a heavy kinetic punch knocking enemies back.', 'Ground Slam', 'Leaps into the air and slams down creating a stun wave.', 'Thick Hide', 'Immune to crowd control knockbacks for 4 seconds.', 'A relentless brawler smashing through any defensive line.', '#F59E0B', '👊'),
('h-pico', 'pico', 'PICO', 'Support', 'Rare', 3600, 500, 90, 75, 60, 'Drone Zap', 'Commands micro-drones dealing continuous electric beam damage.', 'Energy Boost', 'Supercharges all allies increasing attack damage by 40%.', 'Quick Charge', 'Super meter passively charges 25% faster.', 'A cheerful robotics marvel providing essential team utility.', '#14B8A6', '🤖')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert 20 Users
INSERT INTO users (id, username, email, password_hash, avatar, level, xp, trophies, highest_trophies, coins, gems, rank_tier) VALUES
('u-1', 'AjithKumar', 'ajith@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🔥', 28, 1620, 12540, 12800, 15420, 1250, 'Diamond I'),
('u-2', 'ShadowX', 'shadowx@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🦊', 35, 4200, 18540, 19200, 34200, 2400, 'Master'),
('u-3', 'ProGamer', 'progamer@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🐺', 33, 3100, 17920, 18400, 28100, 1900, 'Master'),
('u-4', 'DarkKnight', 'darkknight@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🐉', 31, 2400, 15760, 16100, 22400, 1450, 'Diamond II'),
('u-5', 'NinjaDev', 'ninjadev@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🦁', 29, 1850, 14920, 15200, 19800, 980, 'Diamond I'),
('u-6', 'LegendKill', 'legendkill@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🐻', 27, 1400, 13800, 14000, 14200, 800, 'Gold III'),
('u-7', 'StormByte', 'stormbyte@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🦅', 26, 950, 13100, 13400, 12500, 650, 'Gold II'),
('u-8', 'PixelRush', 'pixelrush@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🦋', 25, 600, 12400, 12600, 11000, 520, 'Gold I'),
('u-9', 'CosmicAce', 'cosmicace@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '⭐', 24, 450, 11800, 12000, 9800, 480, 'Silver III'),
('u-10', 'NeonBeast', 'neonbeast@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '⚡', 23, 200, 11200, 11500, 8900, 400, 'Silver II'),
('u-11', 'Gamer007', 'gamer007@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🎮', 22, 120, 10600, 10800, 8200, 350, 'Silver I'),
('u-12', 'StarBlast', 'starblast@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🚀', 21, 90, 10100, 10300, 7500, 300, 'Bronze III'),
('u-13', 'IronFist', 'ironfist@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '👊', 20, 80, 9500, 9800, 6800, 260, 'Bronze II'),
('u-14', 'VortexKing', 'vortexking@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🌀', 19, 70, 8900, 9200, 6100, 220, 'Bronze I'),
('u-15', 'BlazeMaster', 'blazemaster@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🔥', 18, 60, 8200, 8500, 5500, 180, 'Bronze I'),
('u-16', 'FrostBite', 'frostbite@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '❄️', 17, 50, 7600, 7800, 4900, 150, 'Bronze I'),
('u-17', 'CyberPunk', 'cyberpunk@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🤖', 16, 40, 7000, 7200, 4200, 120, 'Bronze I'),
('u-18', 'ApexStriker', 'apexstriker@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🎯', 15, 30, 6400, 6600, 3600, 100, 'Bronze I'),
('u-19', 'EchoKnight', 'echoknight@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '🛡️', 14, 20, 5800, 6000, 3000, 80, 'Bronze I'),
('u-20', 'NovaQueen', 'novaqueen@battleverse.gg', '$2a$10$abcdefghijklmnopqrstuu1234567890', '👑', 13, 10, 5200, 5400, 2500, 50, 'Bronze I')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- 3. Insert 10 Skins
INSERT INTO skins (id, hero_id, name, rarity, price, currency, emoji, description) VALUES
('sk-1', 'h-blaze', 'CYBER BLAZE', 'Epic', 149, 'gems', '🔥', 'High-tech cybernetic armor with neon flame thrusts.'),
('sk-2', 'h-volt', 'ROYAL VOLT', 'Epic', 149, 'gems', '⚡', 'Regal sapphire lightning battle suit with gilded accents.'),
('sk-3', 'h-titan', 'GOLD TITAN', 'Legendary', 199, 'gems', '🛡️', 'Solid 24k gold battle armor with glowing core.'),
('sk-4', 'h-frost', 'WINTER FROST', 'Super Rare', 99, 'gems', '❄️', 'Crystalline arctic queen garment with ice aura.'),
('sk-5', 'h-luna', 'COSMIC LUNA', 'Epic', 149, 'gems', '🌙', 'Galactic priestess robes shimmering with starlight.'),
('sk-6', 'h-rocket', 'ACE ROCKET', 'Super Rare', 99, 'gems', '🚀', 'Elite air-force pilot uniform with dual turbo boosters.'),
('sk-7', 'h-buster', 'MECHA BUSTER', 'Epic', 149, 'gems', '👊', 'Industrial hydraulic powerhouse with chrome fists.'),
('sk-8', 'h-pico', 'NEON PICO', 'Rare', 79, 'gems', '🤖', 'Glowing retro synthwave drone assistant.'),
('sk-9', 'h-blaze', 'INFERNO BLAZE', 'Legendary', 249, 'gems', '🔥', 'Demonic volcanic champion covered in molten magma.'),
('sk-10', 'h-volt', 'SHADOW VOLT', 'Super Rare', 99, 'gems', '⚡', 'Stealth black ops shinobi suit with dark lightning.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert 10 Achievements
INSERT INTO achievements (id, slug, name, description, icon, points) VALUES
('ach-1', 'champion', 'Champion', 'Win 100 matches in any game mode.', '🏆', 200),
('ach-2', 'gem_collector', 'Gem Collector', 'Collect 50 energy crystals in Crystal Clash.', '💎', 150),
('ach-3', 'win_streak_10', '10 Win Streak', 'Win 10 consecutive matches without losing.', '🔥', 300),
('ach-4', 'arena_master', 'Arena Master', 'Play a total of 500 arena battles.', '⚔️', 250),
('ach-5', 'diamond_rank', 'Diamond Rank', 'Reach the prestigious Diamond rank tier.', '💠', 400),
('ach-6', 'legend_tier', 'Legend', 'Reach the highest rank tier: Legend.', '⭐', 500),
('ach-7', 'perfect_game', 'Flawless Victory', 'Win a match without taking any damage.', '🛡️', 350),
('ach-8', 'unstoppable', 'Unstoppable Force', 'Win 50 ranked matches in a single season.', '💪', 250),
('ach-9', 'hero_collector', 'Hero Collector', 'Unlock all 8 Battleverse heroes.', '🦸', 300),
('ach-10', 'crystal_hoarder', 'Crystal Hoarder', 'Accumulate over 5,000 total crystals.', '✨', 200)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Insert 5 Events
INSERT INTO events (id, slug, name, description, reward_type, reward_amount, multiplier, emoji, starts_at, ends_at, is_active) VALUES
('ev-1', 'double_trophies', 'DOUBLE TROPHIES', 'Earn 2X trophies on all 3v3 Crystal Clash matches this weekend!', 'Trophies', '2X Multiplier', '2X', '🏆', NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), TRUE),
('ev-2', 'boss_fight', 'COLOSSUS BOSS FIGHT', 'Team up with 2 allies to bring down the legendary Arena Colossus!', 'Coins & Gems', '+5000 Coins', '1X', '💀', NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), TRUE),
('ev-3', 'gem_hunt', 'ENERGY CRYSTAL HUNT', 'Collect crystals in Crystal Clash to unlock exclusive tier rewards.', 'Gems', '+500 Gems', '1X', '💎', NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), TRUE),
('ev-4', 'power_surge', 'POWER SURGE', 'Heroes have 50% faster super charge for a limited time.', 'Power Points', '+300 Points', '1X', '⚡', NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), TRUE),
('ev-5', 'ranked_rush', 'RANKED RUSH SPRINT', 'Top 100 players in this tournament receive exclusive seasonal rank badges.', 'Rank Badge', 'Diamond Foil', '1X', '💠', NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Insert Leaderboard Cache
INSERT INTO leaderboards (user_id, global_rank, trophies, victories, win_rate, country_code) VALUES
('u-2', 1, 18540, 1420, 78.50, 'US'),
('u-3', 2, 17920, 1310, 75.20, 'KR'),
('u-1', 3, 12540, 342, 58.80, 'IN'),
('u-4', 4, 15760, 1120, 68.40, 'GB'),
('u-5', 5, 14920, 980, 64.10, 'JP'),
('u-6', 6, 13800, 890, 61.50, 'BR'),
('u-7', 7, 13100, 810, 59.20, 'DE'),
('u-8', 8, 12400, 740, 56.40, 'FR'),
('u-9', 9, 11800, 690, 54.10, 'CA'),
('u-10', 10, 11200, 630, 52.00, 'AU')
ON DUPLICATE KEY UPDATE global_rank=VALUES(global_rank);
