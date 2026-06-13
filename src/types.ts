export type SubscriptionCategory = 'OTT' | 'Music' | 'Cloud' | 'Other';

export interface Subscription {
  id: string;
  name: string;
  provider: 'Netflix' | 'Spotify' | 'YouTube' | 'Google One' | 'Hotstar' | 'Amazon Prime' | 'Apple One' | 'Other';
  cost: number;
  category: SubscriptionCategory;
  isForgotten: boolean;
  usageFreq: 'never' | 'rarely' | 'frequently';
}

export interface FamilyMember {
  id: string;
  name: string;
  avatarColor: string; // Tailwind color class
  subscriptions: Subscription[];
  vpa?: string;
}

export interface AuditRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  type: 'cancel_forgotten' | 'music_overlap' | 'ott_overlap' | 'family_consolidation';
  impact: 'High' | 'Medium' | 'Low';
  actionLabel: string;
  resolved: boolean;
  confidenceScore?: number;
  confidenceReason?: string;
}
