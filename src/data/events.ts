export type GameEvent = {
  id: string;
  name: string;
  description: string;
  reward: string;
  rewardAmount: string;
  emoji: string;
  gradient: string;
  endsIn: { days: number; hours: number; minutes: number };
  badge: string;
  multiplier?: string;
}

export const EVENTS: GameEvent[] = [
  {
    id: 'double_trophies',
    name: 'DOUBLE TROPHIES',
    description: '2X trophies for all 3v3 matches this weekend! Climb the ranks faster than ever!',
    reward: 'Double Trophies',
    rewardAmount: '2X',
    emoji: '🏆',
    gradient: 'from-yellow-500 via-amber-400 to-orange-500',
    endsIn: { days: 2, hours: 14, minutes: 0 },
    badge: 'ACTIVE',
    multiplier: '2X',
  },
  {
    id: 'boss_fight',
    name: 'BOSS FIGHT',
    description: 'Team up and defeat the legendary Arena Boss "COLOSSUS" to earn massive rewards!',
    reward: 'Legendary Skin',
    rewardAmount: '+ 5000',
    emoji: '💀',
    gradient: 'from-red-700 via-red-500 to-orange-600',
    endsIn: { days: 1, hours: 14, minutes: 30 },
    badge: 'HARD',
  },
  {
    id: 'gem_hunt',
    name: 'GEM HUNT',
    description: 'Collect crystals in Crystal Clash mode to earn bonus gems and exclusive rewards!',
    reward: 'Gems + Coins',
    rewardAmount: '+ 500',
    emoji: '💎',
    gradient: 'from-cyan-500 via-teal-400 to-emerald-500',
    endsIn: { days: 3, hours: 10, minutes: 0 },
    badge: 'POPULAR',
  },
  {
    id: 'power_surge',
    name: 'POWER SURGE',
    description: 'All heroes receive 50% increased power during this electrifying event!',
    reward: 'Power Points',
    rewardAmount: '+ 300',
    emoji: '⚡',
    gradient: 'from-purple-600 via-indigo-500 to-blue-600',
    endsIn: { days: 0, hours: 8, minutes: 45 },
    badge: 'ENDING SOON',
  },
  {
    id: 'ranked_rush',
    name: 'RANKED RUSH',
    description: 'Climb the ranked ladder in this special weekend sprint tournament!',
    reward: 'Exclusive Rank Badge',
    rewardAmount: 'Diamond',
    emoji: '💠',
    gradient: 'from-blue-600 via-cyan-500 to-indigo-600',
    endsIn: { days: 5, hours: 2, minutes: 20 },
    badge: 'RANKED',
  },
];

export type GameMode = {
  id: string;
  name: string;
  players: string;
  objective: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  rewards: string;
  emoji: string;
  gradient: string;
  description: string;
  features: string[];
}

export const GAME_MODES: GameMode[] = [
  {
    id: 'crystal_clash',
    name: 'CRYSTAL CLASH',
    players: '3v3',
    objective: 'Collect 10 energy crystals',
    difficulty: 'Medium',
    rewards: '+25 Trophies • +500 XP • +250 Coins',
    emoji: '💎',
    gradient: 'from-cyan-600 via-teal-500 to-blue-600',
    description: 'Work together to collect energy crystals spawning in the center. First team to 10 crystals wins!',
    features: ['Team coordination', 'Crystal spawns every 15s', 'Respawn after 5s', 'Power-ups on map'],
  },
  {
    id: 'survival',
    name: 'SHOWDOWN',
    players: 'Solo / Duo',
    objective: 'Be the last player alive',
    difficulty: 'Hard',
    rewards: '+20 Trophies • +400 XP • +200 Coins',
    emoji: '💀',
    gradient: 'from-red-700 via-rose-600 to-red-800',
    description: 'Every player for themselves. The arena shrinks over time. Be the last hero standing!',
    features: ['Solo or Duo mode', 'Shrinking arena', 'No respawns', 'Rare power boxes'],
  },
  {
    id: 'ranked_arena',
    name: 'RANKED ARENA',
    players: '3v3',
    objective: 'Compete and climb the ranks',
    difficulty: 'Extreme',
    rewards: '+35 Trophies • +700 XP • +350 Coins',
    emoji: '🏆',
    gradient: 'from-amber-600 via-orange-500 to-yellow-500',
    description: 'The ultimate competitive mode. Only the best rise to the top. Lose and face demotion!',
    features: ['Ranked matchmaking', 'Season rewards', 'Rank protection', 'Global leaderboard'],
  },
  {
    id: 'custom',
    name: 'CUSTOM GAME',
    players: 'Up to 6',
    objective: 'Play with your own rules',
    difficulty: 'Easy',
    rewards: 'No ranked rewards',
    emoji: '🎮',
    gradient: 'from-purple-600 via-violet-500 to-purple-700',
    description: 'Create your own private room and invite friends. Set custom rules and have fun!',
    features: ['Private rooms', 'Custom rules', 'Invite friends', 'Training mode'],
  },
];
