export type LeaderboardEntry = {
  rank: number;
  username: string;
  avatar: string;
  trophies: number;
  victories: number;
  winRate: number;
  country: string;
  isCurrentUser?: boolean;
}

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, username: 'ShadowX', avatar: '👤', trophies: 15980, victories: 1240, winRate: 78.2, country: '🇺🇸' },
  { rank: 2, username: 'ProGamer', avatar: '👤', trophies: 15210, victories: 1180, winRate: 74.5, country: '🇰🇷' },
  { rank: 3, username: 'AjithKumar', avatar: '👤', trophies: 12540, victories: 342, winRate: 58.8, country: '🇮🇳', isCurrentUser: true },
  { rank: 4, username: 'DarkKnight', avatar: '👤', trophies: 11870, victories: 956, winRate: 65.3, country: '🇬🇧' },
  { rank: 5, username: 'NinjaDev', avatar: '👤', trophies: 11430, victories: 892, winRate: 62.1, country: '🇯🇵' },
  { rank: 6, username: 'LegendKill', avatar: '👤', trophies: 10980, victories: 820, winRate: 59.8, country: '🇧🇷' },
  { rank: 7, username: 'StormByte', avatar: '👤', trophies: 10540, victories: 788, winRate: 57.2, country: '🇩🇪' },
  { rank: 8, username: 'PixelRush', avatar: '👤', trophies: 10120, victories: 745, winRate: 54.9, country: '🇫🇷' },
  { rank: 9, username: 'CosmicAce', avatar: '👤', trophies: 9870, victories: 710, winRate: 52.8, country: '🇨🇦' },
  { rank: 10, username: 'NeonBeast', avatar: '👤', trophies: 9540, victories: 680, winRate: 50.4, country: '🇦🇺' },
];

export const FRIENDS_DATA = [
  { id: 1, username: 'ShadowX', status: 'online' as const, trophies: 15980, avatar: '🦊', hero: 'BLAZE' },
  { id: 2, username: 'Gamer007', status: 'online' as const, trophies: 12200, avatar: '🐺', hero: 'VOLT' },
  { id: 3, username: 'NinjaDev', status: 'ingame' as const, trophies: 11430, avatar: '🐉', hero: 'TITAN' },
  { id: 4, username: 'Ajay', status: 'online' as const, trophies: 9820, avatar: '🦁', hero: 'FROST' },
  { id: 5, username: 'MasterMind', status: 'offline' as const, trophies: 8320, avatar: '🐻', hero: 'LUNA' },
  { id: 6, username: 'ProKing', status: 'offline' as const, trophies: 7650, avatar: '🦅', hero: 'BUSTER' },
  { id: 7, username: 'StarBlast', status: 'ingame' as const, trophies: 6900, avatar: '🦋', hero: 'ROCKET' },
];
