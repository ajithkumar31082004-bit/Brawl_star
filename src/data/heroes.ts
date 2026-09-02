export type Hero = {
  id: string;
  name: string;
  class: 'Damage' | 'Assassin' | 'Tank' | 'Support' | 'Controller';
  rarity: 'Legendary' | 'Epic' | 'Super Rare' | 'Rare';
  health: number;
  attack: number;
  speed: number;
  range: number;
  superCharge: number;
  normalAttack: string;
  normalAttackDesc: string;
  superAbility: string;
  superAbilityDesc: string;
  passive: string;
  passiveDesc: string;
  description: string;
  color: string;
  emoji: string;
  powerLevel?: number;
  powerPoints?: number;
  maxPowerPoints?: number;
  gadgets: Array<{ id: string; name: string; icon: string; description: string; charges: number }>;
  starPowers: Array<{ id: string; name: string; icon: string; description: string }>;
};

export const RARITY_COLORS: Record<string, string> = {
  'Legendary': '#F59E0B',
  'Epic': '#A855F7',
  'Super Rare': '#3B82F6',
  'Rare': '#10B981',
};

export const CLASS_COLORS: Record<string, string> = {
  'Damage': '#EF4444',
  'Assassin': '#8B5CF6',
  'Tank': '#10B981',
  'Support': '#F59E0B',
  'Controller': '#06B6D4',
};

// Power level upgrade cost lookup (Power 1 -> 11)
export const POWER_LEVEL_COSTS: Record<number, { coins: number; powerPoints: number }> = {
  2: { coins: 20, powerPoints: 20 },
  3: { coins: 35, powerPoints: 30 },
  4: { coins: 75, powerPoints: 50 },
  5: { coins: 140, powerPoints: 80 },
  6: { coins: 290, powerPoints: 130 },
  7: { coins: 480, powerPoints: 210 }, // Unlocks Gadget 1
  8: { coins: 800, powerPoints: 340 },
  9: { coins: 1250, powerPoints: 550 }, // Unlocks Star Power 1
  10: { coins: 1875, powerPoints: 890 }, // Unlocks Gadget 2
  11: { coins: 2800, powerPoints: 1440 }, // Unlocks Hypercharge / Star Power 2
};

export const HEROES: Hero[] = [
  {
    id: 'blaze',
    name: 'BLAZE',
    class: 'Damage',
    rarity: 'Legendary',
    health: 5200,
    attack: 850,
    speed: 80,
    range: 70,
    superCharge: 85,
    normalAttack: 'Flame Shot',
    normalAttackDesc: 'Shoots a burst of fire that damages enemies in a cone area.',
    superAbility: 'Fire Storm',
    superAbilityDesc: 'Summons a storm of fire dealing massive area damage and burning targets over 4 seconds.',
    passive: 'Hot Blood',
    passiveDesc: 'Moves 25% faster when health drops below 40%.',
    description: 'A fearless champion of living flame who scorches through enemy defenses.',
    color: '#EF4444',
    emoji: '🔥',
    powerLevel: 9,
    powerPoints: 450,
    maxPowerPoints: 550,
    gadgets: [
      { id: 'b_g1', name: 'Inferno Flare', icon: '💥', description: 'Instantly explodes around Blaze, knocking back nearby enemies and dealing 600 damage.', charges: 3 },
      { id: 'b_g2', name: 'Heat Wave', icon: '🌊', description: 'Blaze creates a blazing trail behind him for 5 seconds that burns pursuing foes.', charges: 3 },
    ],
    starPowers: [
      { id: 'b_sp1', name: 'Scorched Earth', icon: '🌋', description: 'Super creates persistent lava pools on the ground that slow and burn enemies.', },
      { id: 'b_sp2', name: 'Blazing Reload', icon: '⚡', description: 'Hitting enemies with main attack reloads 15% of an ammo slot instantly.' },
    ],
  },
  {
    id: 'volt',
    name: 'VOLT',
    class: 'Assassin',
    rarity: 'Epic',
    health: 3800,
    attack: 1100,
    speed: 95,
    range: 60,
    superCharge: 90,
    normalAttack: 'Thunder Strike',
    normalAttackDesc: 'Throws electrified daggers that chain between up to 2 nearby enemies.',
    superAbility: 'Lightning Dash',
    superAbilityDesc: 'Dashes at the speed of lightning, piercing through enemies and shocking them.',
    passive: 'Static Charge',
    passiveDesc: 'Every 3rd hit deals 35% bonus shock damage.',
    description: 'An electrifying assassin who strikes and teleports in the blink of an eye.',
    color: '#3B82F6',
    emoji: '⚡',
    powerLevel: 7,
    powerPoints: 180,
    maxPowerPoints: 340,
    gadgets: [
      { id: 'v_g1', name: 'Overcharge', icon: '🔋', description: 'Instantly reloads all 3 ammo slots and increases speed by 30% for 3 seconds.', charges: 3 },
      { id: 'v_g2', name: 'Flash Teleport', icon: '✨', description: 'Teleports 4 tiles forward through walls and obstacles.', charges: 3 },
    ],
    starPowers: [
      { id: 'v_sp1', name: 'Chain Lightning', icon: '⚡', description: 'Attacks chain to 4 enemies instead of 2 with no damage decay.' },
      { id: 'v_sp2', name: 'Electric Shield', icon: '🛡️', description: 'After using Super, gains a shield absorbing 1200 damage for 4 seconds.' },
    ],
  },
  {
    id: 'titan',
    name: 'TITAN',
    class: 'Tank',
    rarity: 'Epic',
    health: 8500,
    attack: 650,
    speed: 55,
    range: 50,
    superCharge: 70,
    normalAttack: 'Hammer Smash',
    normalAttackDesc: 'Slams a seismic hammer sending heavy shockwaves through the ground.',
    superAbility: 'Shield Wall',
    superAbilityDesc: 'Deploys an impenetrable energy shield absorbing up to 4000 damage.',
    passive: 'Iron Skin',
    passiveDesc: 'Reduces all incoming damage by 15% permanently.',
    description: 'An armored colossus holding the frontline with unmatched durability.',
    color: '#10B981',
    emoji: '🛡️',
    powerLevel: 8,
    powerPoints: 260,
    maxPowerPoints: 550,
    gadgets: [
      { id: 't_g1', name: 'Fortify', icon: '🏰', description: 'Increases armor and heals Titan for 1500 HP over 3 seconds.', charges: 3 },
      { id: 't_g2', name: 'Shockwave Pulse', icon: '💫', description: 'Releases a radial shockwave that stuns all nearby enemies for 1.2 seconds.', charges: 3 },
    ],
    starPowers: [
      { id: 't_sp1', name: 'Bulwark', icon: '🛡️', description: 'Allies standing behind Titan take 20% less damage.' },
      { id: 't_sp2', name: 'Heavy Impact', icon: '🔨', description: 'Main attack slows enemies hit by 30% for 1.5 seconds.' },
    ],
  },
  {
    id: 'frost',
    name: 'FROST',
    class: 'Controller',
    rarity: 'Super Rare',
    health: 4200,
    attack: 720,
    speed: 70,
    range: 80,
    superCharge: 75,
    normalAttack: 'Ice Shards',
    normalAttackDesc: 'Fires crystalline shards that slow enemy movement by 20%.',
    superAbility: 'Ice Burst',
    superAbilityDesc: 'Freezes all enemies within a large radius for 2 seconds.',
    passive: 'Frost Trail',
    passiveDesc: 'Leaves a frozen path behind granting allies +20% movement speed.',
    description: 'A cold controller manipulating the battlefield with cryogenic mastery.',
    color: '#06B6D4',
    emoji: '❄️',
    powerLevel: 6,
    powerPoints: 90,
    maxPowerPoints: 210,
    gadgets: [
      { id: 'f_g1', name: 'Cryo Trap', icon: '🪤', description: 'Places a hidden ice mine that freezes the first enemy who steps on it.', charges: 3 },
      { id: 'f_g2', name: 'Blizzard Wind', icon: '💨', description: 'Creates a gust of wind blowing enemies backwards.', charges: 3 },
    ],
    starPowers: [
      { id: 'f_sp1', name: 'Deep Freeze', icon: '🧊', description: 'Frozen enemies take 25% increased damage from all team attacks.' },
      { id: 'f_sp2', name: 'Shatter Burst', icon: '💎', description: 'When frozen enemies unfreeze, they shatter dealing 500 area damage.' },
    ],
  },
  {
    id: 'rocket',
    name: 'ROCKET',
    class: 'Damage',
    rarity: 'Super Rare',
    health: 4600,
    attack: 950,
    speed: 72,
    range: 90,
    superCharge: 80,
    normalAttack: 'Missile Burst',
    normalAttackDesc: 'Fires rapid mini-rockets dealing explosive area damage.',
    superAbility: 'Rocket Barrage',
    superAbilityDesc: 'Launches an aerial barrage of homing missiles that destroy obstacles.',
    passive: 'Afterburner',
    passiveDesc: 'Gains a speed burst for 3s after using Super.',
    description: 'A high-flying heavy artillery specialist dominating the battlefield from afar.',
    color: '#F97316',
    emoji: '🚀',
    powerLevel: 5,
    powerPoints: 40,
    maxPowerPoints: 130,
    gadgets: [
      { id: 'r_g1', name: 'Jump Booster', icon: '🚀', description: 'Rocket launches into the air, leaping over walls and leaving burning fuel.', charges: 3 },
      { id: 'r_g2', name: 'Cluster Bomb', icon: '💣', description: 'Next attack splits into 4 sub-missiles upon impact.', charges: 3 },
    ],
    starPowers: [
      { id: 'r_sp1', name: 'Incendiary Payload', icon: '🔥', description: 'Rockets set the ground on fire, dealing 400 damage per second for 3s.' },
      { id: 'r_sp2', name: 'Target Lock', icon: '🎯', description: 'Rockets travel 30% faster and gain slight homing tracking.' },
    ],
  },
  {
    id: 'luna',
    name: 'LUNA',
    class: 'Support',
    rarity: 'Rare',
    health: 4000,
    attack: 580,
    speed: 75,
    range: 85,
    superCharge: 65,
    normalAttack: 'Star Beam',
    normalAttackDesc: 'Fires celestial starlight that heals allies or damages foes.',
    superAbility: 'Healing Pulse',
    superAbilityDesc: 'Radiates a massive healing wave restoring 1500 HP to all team members.',
    passive: 'Moonlight Aura',
    passiveDesc: 'Allies within range slowly regenerate health over time.',
    description: 'A celestial guardian keeping her team alive under starry radiance.',
    color: '#A855F7',
    emoji: '🌙',
    powerLevel: 6,
    powerPoints: 120,
    maxPowerPoints: 210,
    gadgets: [
      { id: 'l_g1', name: 'Celestial Ward', icon: '🌟', description: 'Grants Luna and nearby allies a 1000 HP shield for 4 seconds.', charges: 3 },
      { id: 'l_g2', name: 'Solar Flash', icon: '☀️', description: 'Blinds enemies in a cone for 1.5 seconds, disrupting their aim.', charges: 3 },
    ],
    starPowers: [
      { id: 'l_sp1', name: 'Full Moon', icon: '🌕', description: 'Healing Pulse also cleanses all negative status effects from allies.' },
      { id: 'l_sp2', name: 'Starfall', icon: '🌠', description: 'Star Beam hits rain down mini shooting stars for extra healing.' },
    ],
  },
  {
    id: 'buster',
    name: 'BUSTER',
    class: 'Tank',
    rarity: 'Rare',
    health: 7800,
    attack: 700,
    speed: 60,
    range: 45,
    superCharge: 72,
    normalAttack: 'Power Punch',
    normalAttackDesc: 'Delivers a heavy kinetic punch knocking enemies back.',
    superAbility: 'Ground Slam',
    superAbilityDesc: 'Leaps into the air and slams down creating a wide shockwave.',
    passive: 'Thick Hide',
    passiveDesc: 'Immune to crowd control knockbacks for 4 seconds when below 50% HP.',
    description: 'A relentless brawler smashing through any defensive line.',
    color: '#F59E0B',
    emoji: '👊',
    powerLevel: 4,
    powerPoints: 30,
    maxPowerPoints: 80,
    gadgets: [
      { id: 'bu_g1', name: 'Meat Hook', icon: '🪝', description: 'Pulls the furthest enemy in range directly to Buster.', charges: 3 },
      { id: 'bu_g2', name: 'Rally Cry', icon: '📢', description: 'Boosts team movement speed by 25% for 4 seconds.', charges: 3 },
    ],
    starPowers: [
      { id: 'bu_sp1', name: 'Seismic Shock', icon: '💥', description: 'Ground Slam range increased by 40% and deals 300 extra damage.' },
      { id: 'bu_sp2', name: 'Brawler Rage', icon: '😤', description: 'Attack speed increases by 20% for every 2000 HP lost.' },
    ],
  },
  {
    id: 'pico',
    name: 'PICO',
    class: 'Support',
    rarity: 'Rare',
    health: 3600,
    attack: 500,
    speed: 90,
    range: 75,
    superCharge: 60,
    normalAttack: 'Drone Zap',
    normalAttackDesc: 'Commands micro-drones dealing continuous electric beam damage.',
    superAbility: 'Energy Boost',
    superAbilityDesc: 'Supercharges all allies increasing their attack damage by 40% for 6s.',
    passive: 'Quick Charge',
    passiveDesc: 'Super meter passively charges 25% faster.',
    description: 'A cheerful robotics prodigy providing essential combat buffs.',
    color: '#14B8A6',
    emoji: '🤖',
    powerLevel: 3,
    powerPoints: 15,
    maxPowerPoints: 50,
    gadgets: [
      { id: 'p_g1', name: 'Repair Bot', icon: '🛠️', description: 'Deploys a stationary healing beacon that restores 400 HP/sec in radius.', charges: 3 },
      { id: 'p_g2', name: 'EMP Pulse', icon: '⚡', description: 'Disables all enemy gadgets and slows their reloads for 3 seconds.', charges: 3 },
    ],
    starPowers: [
      { id: 'p_sp1', name: 'Overclocked', icon: '⏱️', description: 'Energy Boost also gives +20% movement speed to all allies.' },
      { id: 'p_sp2', name: 'Micro Shielding', icon: '🛡️', description: 'Drones provide a passive 10% damage reduction aura.' },
    ],
  },
];
