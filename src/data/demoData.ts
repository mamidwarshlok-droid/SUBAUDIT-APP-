import { FamilyMember, Subscription } from '../types';

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'rahul',
    name: 'Rahul',
    avatarColor: 'bg-indigo-500',
    vpa: 'rahul@okhdfcbank',
    subscriptions: [
      {
        id: 'r_spotify',
        name: 'Spotify Premium Individual',
        provider: 'Spotify',
        cost: 119,
        category: 'Music',
        isForgotten: false,
        usageFreq: 'frequently',
      },
      {
        id: 'r_netflix',
        name: 'Netflix Mobile',
        provider: 'Netflix',
        cost: 149,
        category: 'OTT',
        isForgotten: false,
        usageFreq: 'frequently',
      },
    ],
  },
  {
    id: 'priya',
    name: 'Priya',
    avatarColor: 'bg-pink-500',
    vpa: 'priya@okaxis',
    subscriptions: [
      {
        id: 'p_spotify',
        name: 'Spotify Premium Individual',
        provider: 'Spotify',
        cost: 119,
        category: 'Music',
        isForgotten: false,
        usageFreq: 'rarely', // Double-spending on music apps!
      },
      {
        id: 'p_youtube',
        name: 'YouTube Premium Individual',
        provider: 'YouTube',
        cost: 149,
        category: 'Music', // counts as OTT & Music
        isForgotten: false,
        usageFreq: 'frequently',
      },
    ],
  },
  {
    id: 'amit',
    name: 'Amit',
    avatarColor: 'bg-emerald-500',
    vpa: 'amit@okicici',
    subscriptions: [
      {
        id: 'a_netflix',
        name: 'Netflix Basic',
        provider: 'Netflix',
        cost: 199,
        category: 'OTT',
        isForgotten: false,
        usageFreq: 'frequently',
      },
    ],
  },
  {
    id: 'neha',
    name: 'Neha',
    avatarColor: 'bg-amber-500',
    vpa: 'neha@oksbi',
    subscriptions: [
      {
        id: 'n_google',
        name: 'Google One 100GB',
        provider: 'Google One',
        cost: 130,
        category: 'Cloud',
        isForgotten: false,
        usageFreq: 'frequently',
      },
      {
        id: 'n_hotstar',
        name: 'Forgotten Hotstar Mobile',
        provider: 'Hotstar',
        cost: 149,
        category: 'OTT',
        isForgotten: true, // Forgotten auto-debit!
        usageFreq: 'never',
      },
    ],
  },
];

export interface CatalogItem {
  name: string;
  provider: Subscription['provider'];
  cost: number;
  category: Subscription['category'];
  description: string;
}

export const SUBSCRIPTION_CATALOG: CatalogItem[] = [
  { name: 'Netflix Mobile', provider: 'Netflix', cost: 149, category: 'OTT', description: '1 Mobile screen, 480p' },
  { name: 'Netflix Basic', provider: 'Netflix', cost: 199, category: 'OTT', description: '1 Screen (Mobile/TV), 720p' },
  { name: 'Netflix Standard', provider: 'Netflix', cost: 499, category: 'OTT', description: '2 Screens, 1080p, shareable HD' },
  { name: 'Netflix Premium', provider: 'Netflix', cost: 649, category: 'OTT', description: '4 Screens, 4K HDR, Family sharing' },
  { name: 'Spotify Premium Individual', provider: 'Spotify', cost: 119, category: 'Music', description: '1 Premium account, Ad-free' },
  { name: 'Spotify Premium Duo', provider: 'Spotify', cost: 149, category: 'Music', description: '2 Premium accounts for couples' },
  { name: 'Spotify Premium Family', provider: 'Spotify', cost: 179, category: 'Music', description: 'Up to 6 accounts, kids content supported' },
  { name: 'YouTube Premium Individual', provider: 'YouTube', cost: 149, category: 'Music', description: 'Includes YouTube Music and Ad-free' },
  { name: 'YouTube Premium Family', provider: 'YouTube', cost: 189, category: 'Music', description: 'Up to 5 family members, Ad-free' },
  { name: 'Disney+ Hotstar Super', provider: 'Hotstar', cost: 299, category: 'OTT', description: '2 Screens, Full HD' },
  { name: 'Disney+ Hotstar Mobile', provider: 'Hotstar', cost: 149, category: 'OTT', description: '1 Mobile screen only' },
  { name: 'Google One 100GB', provider: 'Google One', cost: 130, category: 'Cloud', description: '100 GB storage, shareable with 5 members' },
  { name: 'Google One 200GB', provider: 'Google One', cost: 210, category: 'Cloud', description: '200 GB storage, shareable with 5 members' },
  { name: 'Google One 2TB', provider: 'Google One', cost: 650, category: 'Cloud', description: '2 TB storage, shareable with 5 members' },
  { name: 'Amazon Prime Mobile Edition', provider: 'Other', cost: 149, category: 'OTT', description: '1 Mobile single screen streaming' },
  { name: 'Apple One Individual', provider: 'Apple One', cost: 195, category: 'Other', description: 'Music, Arcade, TV+, and iCloud storage' },
  { name: 'Apple One Family', provider: 'Apple One', cost: 365, category: 'Other', description: 'Shareable with 5 members, 200GB iCloud' },
];
