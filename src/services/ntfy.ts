// ntfy Push Notification Service for Battleverse

const NTFY_SERVER = import.meta.env.VITE_NTFY_SERVER || 'https://ntfy.sh';
const NTFY_TOPIC = import.meta.env.VITE_NTFY_TOPIC || 'battleverse-arena-alerts';
const NTFY_TOKEN = 'tk_cx9g8tbmtkf3f4nowup4h1gixdbog';

export interface NtfyMessageOptions {
  title?: string;
  message: string;
  tags?: string[];
  priority?: 1 | 2 | 3 | 4 | 5; // 1=min, 3=default, 5=urgent
  clickUrl?: string;
}

/**
 * Send push notification via ntfy.sh
 */
export async function sendNtfyNotification({
  title = 'BATTLEVERSE Arena',
  message,
  tags = ['video_game', 'trophy'],
  priority = 3,
  clickUrl,
}: NtfyMessageOptions) {
  try {
    const headers: Record<string, string> = {
      'Title': title,
      'Priority': priority.toString(),
      'Tags': tags.join(','),
      'Authorization': `Bearer ${NTFY_TOKEN}`,
    };

    if (clickUrl) {
      headers['Click'] = clickUrl;
    }

    const response = await fetch(`${NTFY_SERVER}/${NTFY_TOPIC}`, {
      method: 'POST',
      body: message,
      headers,
    });

    if (!response.ok) {
      console.warn('[ntfy] Notification dispatch failed:', response.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[ntfy] Error sending push notification:', err);
    return false;
  }
}

// Convenience Game Notifications
export const ntfyMatchVictory = (trophies: number) =>
  sendNtfyNotification({
    title: '🏆 VICTORY in Battleverse!',
    message: `You won the Crystal Clash match and gained +${trophies} Trophies!`,
    tags: ['trophy', 'fire'],
    priority: 4,
  });

export const ntfyHeroUnlocked = (heroName: string, rarity: string) =>
  sendNtfyNotification({
    title: `⭐ NEW HERO: ${heroName}!`,
    message: `Congratulations! You unlocked ${heroName} (${rarity}) from a Star Crate!`,
    tags: ['sparkles', 'star'],
    priority: 5,
  });

export const ntfyTournamentAlert = (eventName: string) =>
  sendNtfyNotification({
    title: `⚡ LIVE EVENT: ${eventName}`,
    message: `${eventName} is now live! Earn 2X Trophies and exclusive rewards!`,
    tags: ['zap', 'bell'],
    priority: 3,
  });
