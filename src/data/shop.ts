export type ShopItem = {
  id: string;
  name: string;
  category: 'offers' | 'skins' | 'resources' | 'daily';
  type: 'skin' | 'coins' | 'gems' | 'powerpoints' | 'lootbox' | 'emote';
  price: number;
  currency: 'gems' | 'coins';
  hero?: string;
  description: string;
  rarity?: string;
  emoji: string;
  gradient: string;
  badge?: string;
  originalPrice?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  // OFFERS
  {
    id: 'mega_box',
    name: 'MEGA BOX',
    category: 'offers',
    type: 'lootbox',
    price: 17900,
    currency: 'coins',
    description: 'Contains 3x guaranteed hero skins and bonus resources',
    emoji: '📦',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    badge: 'BEST VALUE',
    originalPrice: 25000,
  },
  // SKINS
  {
    id: 'cyber_blaze',
    name: 'CYBER BLAZE',
    category: 'skins',
    type: 'skin',
    price: 149,
    currency: 'gems',
    hero: 'BLAZE',
    description: 'Blaze in full cybernetic armor with neon fire effects',
    rarity: 'Epic',
    emoji: '🔥',
    gradient: 'from-red-600 via-orange-500 to-pink-600',
    badge: 'NEW',
  },
  {
    id: 'royal_volt',
    name: 'ROYAL VOLT',
    category: 'skins',
    type: 'skin',
    price: 149,
    currency: 'gems',
    hero: 'VOLT',
    description: 'Volt draped in royal blue lightning armor with golden trim',
    rarity: 'Epic',
    emoji: '⚡',
    gradient: 'from-blue-600 via-indigo-500 to-purple-600',
  },
  {
    id: 'titan_gold',
    name: 'TITAN GOLD',
    category: 'skins',
    type: 'skin',
    price: 199,
    currency: 'gems',
    hero: 'TITAN',
    description: 'Titan clad in legendary gold-plated battle armor',
    rarity: 'Legendary',
    emoji: '🛡️',
    gradient: 'from-yellow-500 via-amber-400 to-orange-500',
    badge: 'LEGENDARY',
  },
  {
    id: 'frost_winter',
    name: 'WINTER FROST',
    category: 'skins',
    type: 'skin',
    price: 99,
    currency: 'gems',
    hero: 'FROST',
    description: 'Frost in a crystalline winter wonderland outfit',
    rarity: 'Super Rare',
    emoji: '❄️',
    gradient: 'from-cyan-400 via-sky-300 to-blue-500',
  },
  {
    id: 'luna_cosmic',
    name: 'COSMIC LUNA',
    category: 'skins',
    type: 'skin',
    price: 149,
    currency: 'gems',
    hero: 'LUNA',
    description: 'Luna as a cosmic goddess surrounded by galaxies',
    rarity: 'Epic',
    emoji: '🌙',
    gradient: 'from-purple-600 via-pink-500 to-violet-700',
    badge: 'HOT',
  },
  {
    id: 'rocket_ace',
    name: 'ACE ROCKET',
    category: 'skins',
    type: 'skin',
    price: 99,
    currency: 'gems',
    hero: 'ROCKET',
    description: 'Rocket in an elite ace pilot uniform with custom jetpack',
    rarity: 'Super Rare',
    emoji: '🚀',
    gradient: 'from-orange-500 via-red-400 to-yellow-500',
  },
  // RESOURCES
  {
    id: 'coins_small',
    name: '2,000 COINS',
    category: 'resources',
    type: 'coins',
    price: 20,
    currency: 'gems',
    description: 'Small pack of battle coins',
    emoji: '🪙',
    gradient: 'from-yellow-400 via-amber-300 to-orange-400',
  },
  {
    id: 'powerpoints_pack',
    name: '150 POWER POINTS',
    category: 'resources',
    type: 'powerpoints',
    price: 30,
    currency: 'gems',
    description: 'Use to upgrade your heroes\' power level',
    emoji: '⚡',
    gradient: 'from-purple-500 via-indigo-400 to-blue-500',
  },
  {
    id: 'gem_pack',
    name: '80 GEMS',
    category: 'resources',
    type: 'gems',
    price: 8900,
    currency: 'coins',
    description: 'Premium gems for exclusive purchases',
    emoji: '💎',
    gradient: 'from-cyan-400 via-teal-300 to-emerald-500',
  },
  {
    id: 'lootbox_daily',
    name: 'DAILY BOX',
    category: 'daily',
    type: 'lootbox',
    price: 60,
    currency: 'coins',
    description: 'Today\'s special box with guaranteed rewards',
    emoji: '🎁',
    gradient: 'from-green-500 via-teal-400 to-cyan-500',
    badge: 'TODAY ONLY',
  },
];
