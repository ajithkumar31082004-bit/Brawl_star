import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { notifyUserRegistration, notifyMatchCompleted } from './services/snsService.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// In-memory mock DB fallback (active when MySQL is not connected)
const HEROES_DATA = [
  { id: 'blaze', name: 'BLAZE', class: 'Damage', rarity: 'Legendary', health: 5200, attack: 850, speed: 80, range: 70, emoji: '🔥', ability: 'Fire Storm' },
  { id: 'volt', name: 'VOLT', class: 'Assassin', rarity: 'Epic', health: 3800, attack: 1100, speed: 95, range: 60, emoji: '⚡', ability: 'Lightning Dash' },
  { id: 'titan', name: 'TITAN', class: 'Tank', rarity: 'Epic', health: 8500, attack: 650, speed: 55, range: 50, emoji: '🛡️', ability: 'Shield Wall' },
  { id: 'frost', name: 'FROST', class: 'Controller', rarity: 'Super Rare', health: 4200, attack: 720, speed: 70, range: 80, emoji: '❄️', ability: 'Ice Burst' },
  { id: 'rocket', name: 'ROCKET', class: 'Damage', rarity: 'Super Rare', health: 4600, attack: 950, speed: 72, range: 90, emoji: '🚀', ability: 'Rocket Barrage' },
  { id: 'luna', name: 'LUNA', class: 'Support', rarity: 'Rare', health: 4000, attack: 580, speed: 75, range: 85, emoji: '🌙', ability: 'Healing Pulse' },
  { id: 'buster', name: 'BUSTER', class: 'Tank', rarity: 'Rare', health: 7800, attack: 700, speed: 60, range: 45, emoji: '👊', ability: 'Ground Slam' },
  { id: 'pico', name: 'PICO', class: 'Support', rarity: 'Rare', health: 3600, attack: 500, speed: 90, range: 75, emoji: '🤖', ability: 'Energy Boost' },
];

const LEADERBOARD_DATA = [
  { rank: 1, username: 'ShadowX', trophies: 18540, victories: 1420, winRate: 78.5, country: 'US' },
  { rank: 2, username: 'ProGamer', trophies: 17920, victories: 1310, winRate: 75.2, country: 'KR' },
  { rank: 3, username: 'AjithKumar', trophies: 12540, victories: 342, winRate: 58.8, country: 'IN', isCurrentUser: true },
  { rank: 4, username: 'DarkKnight', trophies: 15760, victories: 1120, winRate: 68.4, country: 'GB' },
  { rank: 5, username: 'NinjaDev', trophies: 14920, victories: 980, winRate: 64.1, country: 'JP' },
];

// ================= REST API ROUTES =================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'battleverse-api', uptime: process.uptime(), timestamp: new Date() });
});

// Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Return authenticated user token
  return res.json({
    token: 'mock_jwt_battleverse_token_' + Date.now(),
    user: {
      id: 'u-1',
      username: username || 'AjithKumar',
      email: 'ajith@battleverse.gg',
      level: 28,
      xp: 1620,
      maxXp: 3100,
      trophies: 12540,
      coins: 15420,
      gems: 1250,
      avatar: '🔥',
      rank: 'Diamond I',
      wins: 342,
      losses: 239,
      matches: 581,
    },
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Publish SNS notification event
  await notifyUserRegistration(username, email);

  return res.status(201).json({
    message: 'User registered successfully',
    token: 'mock_jwt_battleverse_token_' + Date.now(),
    user: { id: 'u-new', username, email, level: 1, xp: 0, maxXp: 500, trophies: 0, coins: 500, gems: 50, avatar: '🔥', rank: 'Bronze' },
  });
});

// Heroes
app.get('/api/heroes', (_req: Request, res: Response) => {
  res.json({ heroes: HEROES_DATA });
});

app.get('/api/heroes/:id', (req: Request, res: Response) => {
  const hero = HEROES_DATA.find((h) => h.id === req.params.id);
  if (!hero) return res.status(404).json({ error: 'Hero not found' });
  res.json({ hero });
});

// Leaderboard
app.get('/api/leaderboard', (_req: Request, res: Response) => {
  res.json({ leaderboard: LEADERBOARD_DATA, totalPlayers: '2.4M', season: 7 });
});

// Matches
app.post('/api/matches', (req: Request, res: Response) => {
  const { mode, teamWon, stats } = req.body;
  res.status(201).json({
    matchId: 'match_' + Date.now(),
    mode: mode || 'crystal_clash',
    result: teamWon ? 'VICTORY' : 'DEFEAT',
    rewards: teamWon ? { trophies: 25, xp: 500, coins: 250 } : { trophies: -5, xp: 150, coins: 50 },
    stats,
  });
});

// ================= SOCKET.IO MULTIPLAYER =================
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

interface PlayerState {
  id: string;
  socketId: string;
  name: string;
  hero: string;
  team: 'blue' | 'red';
  x: number;
  y: number;
  hp: number;
  crystals: number;
}

const rooms: Record<string, { id: string; players: PlayerState[]; blueCrystals: number; redCrystals: number }> = {};

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Join match room
  socket.on('match:join', ({ roomId, playerName, heroId }: { roomId: string; playerName: string; heroId: string }) => {
    const roomKey = roomId || 'arena_default';
    socket.join(roomKey);

    if (!rooms[roomKey]) {
      rooms[roomKey] = { id: roomKey, players: [], blueCrystals: 0, redCrystals: 0 };
    }

    const team = rooms[roomKey].players.length % 2 === 0 ? 'blue' : 'red';
    const player: PlayerState = {
      id: `p_${socket.id}`,
      socketId: socket.id,
      name: playerName || 'Player',
      hero: heroId || 'blaze',
      team,
      x: team === 'blue' ? 200 : 760,
      y: 320,
      hp: 3200,
      crystals: 0,
    };

    rooms[roomKey].players.push(player);
    io.to(roomKey).emit('match:players_update', { players: rooms[roomKey].players });
  });

  // Player position sync
  socket.on('player:move', ({ roomId, x, y }: { roomId: string; x: number; y: number }) => {
    socket.to(roomId).emit('player:moved', { socketId: socket.id, x, y });
  });

  // Player shooting sync
  socket.on('player:attack', ({ roomId, targetX, targetY }: { roomId: string; targetX: number; targetY: number }) => {
    socket.to(roomId).emit('player:attacked', { socketId: socket.id, targetX, targetY });
  });

  // Crystal pickup sync
  socket.on('crystal:collect', ({ roomId, team }: { roomId: string; team: 'blue' | 'red' }) => {
    if (rooms[roomId]) {
      if (team === 'blue') rooms[roomId].blueCrystals += 1;
      else rooms[roomId].redCrystals += 1;

      io.to(roomId).emit('crystal:score_update', {
        blue: rooms[roomId].blueCrystals,
        red: rooms[roomId].redCrystals,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    Object.keys(rooms).forEach((rKey) => {
      rooms[rKey].players = rooms[rKey].players.filter((p) => p.socketId !== socket.id);
      io.to(rKey).emit('match:players_update', { players: rooms[rKey].players });
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [BATTLEVERSE] Backend server active on port ${PORT}`);
});
