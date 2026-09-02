import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Zap } from 'lucide-react';
import { SHOP_ITEMS } from '../data/shop';
import type { ShopItem } from '../data/shop';
import { useAuthStore } from '../store/authStore';
import { CrateOpeningModal } from '../components/gacha/CrateOpeningModal';

const CATEGORIES = [
  { id: 'offers', label: 'OFFERS', emoji: '🔥' },
  { id: 'skins', label: 'SKINS', emoji: '🎨' },
  { id: 'resources', label: 'RESOURCES', emoji: '⚡' },
  { id: 'daily', label: 'DAILY DEALS', emoji: '🎁' },
];

const RARITY_BADGE: Record<string, string> = {
  Legendary: 'text-amber-400',
  Epic: 'text-purple-400',
  'Super Rare': 'text-blue-400',
  Rare: 'text-green-400',
};

function ShopCard({ item, onBuy }: { item: ShopItem; onBuy: () => void }) {
  const [buying, setBuying] = useState(false);

  const handleBuy = () => {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      onBuy();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-[#0f1629]" />
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient}`} />

      {item.badge && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-black bg-amber-500 text-black tracking-wider">
            {item.badge}
          </span>
        </div>
      )}

      <div className="relative p-5">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl mb-4 mx-auto shadow-lg`}>
          {item.emoji}
        </div>

        {/* Name */}
        <h3 className="font-heading font-black text-center text-lg text-white mb-1 tracking-wide">{item.name}</h3>

        {/* Hero label */}
        {item.hero && (
          <p className="text-center text-xs text-slate-500 mb-1 font-medium">{item.hero} SKIN</p>
        )}
        {item.rarity && (
          <p className={`text-center text-xs font-heading font-bold mb-2 ${RARITY_BADGE[item.rarity] || ''}`}>★ {item.rarity}</p>
        )}

        <p className="text-center text-slate-400 text-xs mb-4 leading-relaxed min-h-8">{item.description}</p>

        {/* Price + Buy */}
        <div className="flex items-center justify-between gap-2">
          <div>
            {item.originalPrice && (
              <div className="text-slate-500 text-xs line-through font-medium">
                {item.currency === 'gems' ? '💎' : '🪙'} {item.originalPrice.toLocaleString()}
              </div>
            )}
            <div className={`font-heading font-black text-xl flex items-center gap-1 ${item.currency === 'gems' ? 'text-cyan-400' : 'text-amber-400'}`}>
              {item.currency === 'gems' ? '💎' : '🪙'} {item.price}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleBuy}
            disabled={buying}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-heading font-bold text-sm cursor-pointer transition-all ${
              buying
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
            }`}
          >
            {buying ? (
              <>✓ BOUGHT!</>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5" /> BUY</>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export const Shop: React.FC = () => {
  const { user, buyItem } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('offers');
  const [notification, setNotification] = useState<string | null>(null);
  const [openCrateModal, setOpenCrateModal] = useState(false);
  const [currentCrateTitle, setCurrentCrateTitle] = useState('STAR MEGA CRATE');

  const filtered = SHOP_ITEMS.filter((i) => i.category === activeCategory);

  const handleBuy = (item: ShopItem) => {
    if (item.category === 'daily' || item.name.toLowerCase().includes('box') || item.name.toLowerCase().includes('crate')) {
      setCurrentCrateTitle(item.name);
      setOpenCrateModal(true);
      return;
    }

    const success = buyItem(item.id, item.price, item.currency);
    if (success) {
      setNotification(`🎉 Successfully purchased ${item.name}!`);
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification(`❌ Not enough ${item.currency}!`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      {/* Interactive Gacha Crate Modal */}
      <CrateOpeningModal
        crateName={currentCrateTitle}
        isOpen={openCrateModal}
        onClose={() => setOpenCrateModal(false)}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-heading font-black text-5xl sm:text-6xl text-white mb-2">
              GAME <span className="text-[#F59E0B]">SHOP</span>
            </h1>
            <p className="text-slate-400 text-lg">Customize your heroes with exclusive skins and items</p>
          </div>

          {/* Currency display */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2.5 rounded-xl border border-amber-500/20 flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <span className="font-heading font-black text-amber-400 text-lg">{user.coins.toLocaleString()}</span>
              </div>
              <div className="glass px-4 py-2.5 rounded-xl border border-cyan-500/20 flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="font-heading font-black text-cyan-400 text-lg">{user.gems.toLocaleString()}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Purchase notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-xl p-4 border border-green-500/30 bg-green-500/10 text-green-400 font-heading font-bold mb-6"
          >
            {notification}
          </motion.div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-sm tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30'
                  : 'glass text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {cat.emoji} {cat.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20">
                {SHOP_ITEMS.filter(i => i.category === cat.id).length}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Items Grid */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {filtered.map((item) => (
            <ShopCard key={item.id} item={item} onBuy={() => handleBuy(item)} />
          ))}
        </motion.div>

        {/* Bottom promo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 glass rounded-2xl p-6 border border-cyan-500/20 text-center"
        >
          <div className="text-3xl mb-2">💎</div>
          <h3 className="font-heading font-black text-xl text-white mb-1">GET MORE GEMS</h3>
          <p className="text-slate-400 text-sm mb-4">Earn gems by completing events, achievements, and daily missions</p>
          <button className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-black rounded-xl font-heading font-bold text-sm cursor-pointer hover:from-cyan-400 hover:to-teal-400 transition-all">
            VIEW MISSIONS
          </button>
        </motion.div>
      </div>
    </div>
  );
};
