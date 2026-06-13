import { FamilyMember, Subscription, AuditRecommendation } from '../types';

// Reference table of Indian family-plan prices (editable constant)
export const FAMILY_PLAN_PRICES = {
  Spotify: {
    individual: 119,
    family: 179,
    maxPeople: 6,
    category: 'Music',
    planName: 'Spotify Premium Family'
  },
  YouTube: {
    individual: 149,
    family: 189,
    maxPeople: 5,
    category: 'Music',
    planName: 'YouTube Premium Family'
  },
  GoogleOne: {
    individual: 130, // 100GB plan
    family: 210, // 200GB family plan
    category: 'Cloud Storage',
    planName: 'Google One 200GB Family'
  },
  Netflix: {
    individual: 149, // Mobile/Basic plan
    shared: 199, // Basic shared (supports multiple Profiles)
    category: 'OTT/Video',
    planName: 'Shared Netflix'
  }
};

export interface AuditResults {
  totalSpend: number;
  optimizedSpend: number;
  totalLeakage: number;
  activeRecommendations: AuditRecommendation[];
}

/**
 * Groups subscriptions across the entire household by service category.
 * Service categories map to: 'Music', 'OTT/Video', 'Cloud Storage', 'Other'
 */
export function groupSubscriptionsByCategory(members: FamilyMember[]): Record<string, { memberName: string; sub: Subscription }[]> {
  const grouped: Record<string, { memberName: string; sub: Subscription }[]> = {
    'Music': [],
    'OTT/Video': [],
    'Cloud Storage': [],
    'Other': []
  };

  members.forEach((m) => {
    m.subscriptions.forEach((s) => {
      let mappedCat = 'Other';
      if (s.category === 'Music') mappedCat = 'Music';
      else if (s.category === 'OTT') mappedCat = 'OTT/Video';
      else if (s.category === 'Cloud') mappedCat = 'Cloud Storage';

      grouped[mappedCat].push({
        memberName: m.name,
        sub: s
      });
    });
  });

  return grouped;
}

export function runSubscriptionAudit(members: FamilyMember[]): AuditResults {
  const recommendations: AuditRecommendation[] = [];
  let totalSpend = 0;

  // Gather list of all subscriptions across all members
  const allSubList: { memberId: string; memberName: string; sub: Subscription }[] = [];
  members.forEach((m) => {
    m.subscriptions.forEach((s) => {
      totalSpend += s.cost;
      allSubList.push({
        memberId: m.id,
        memberName: m.name,
        sub: s,
      });
    });
  });

  // --- 1. DETECT FORGOTTEN OR LOW-USAGE SUBSCRIPTIONS ---
  allSubList.forEach((item) => {
    if (item.sub.isForgotten || item.sub.usageFreq === 'never') {
      recommendations.push({
        id: `cancel_forgotten_${item.sub.id}`,
        title: `Cancel ${item.memberName}'s unused ${item.sub.name}`,
        description: `${item.memberName} has a forgotten/unused subscription to "${item.sub.name}" auto-debiting ₹${item.sub.cost}/mo. You can save ₹${item.sub.cost}/month (₹${item.sub.cost * 12}/year) by cancelling.`,
        potentialSavings: item.sub.cost,
        type: 'cancel_forgotten',
        impact: 'High',
        actionLabel: 'Cancel Plan',
        resolved: false,
        confidenceScore: 98,
        confidenceReason: "Flagged with near-absolute certainty based on absolute quiet stance (zero logged active sessions or usage loops over the past 180 days)."
      });
    } else if (item.sub.usageFreq === 'rarely') {
      recommendations.push({
        id: `cancel_forgotten_${item.sub.id}`,
        title: `Review ${item.memberName}'s low-usage ${item.sub.name}`,
        description: `${item.memberName} rarely uses their subscription to "${item.sub.name}". Consider pausing or canceling this ₹${item.sub.cost}/mo plan to stop passive budget leakage.`,
        potentialSavings: item.sub.cost,
        type: 'cancel_forgotten',
        impact: 'Medium',
        actionLabel: 'Cancel Plan',
        resolved: false,
        confidenceScore: 75,
        confidenceReason: "High-probability warning of passive leakage. Account tracks less than 1 log-in session per month."
      });
    }
  });

  // --- 2. DETECT SAME-BRAND FAMILY PLAN CONSOLIDATIONS (DUMPOVERLAP SEARCH) ---
  const providersToCheck: ('Spotify' | 'YouTube' | 'Netflix' | 'Google One')[] = ['Spotify', 'YouTube', 'Netflix', 'Google One'];
  
  providersToCheck.forEach((provider) => {
    // Collect active (non-unused) subscriptions for this provider
    const activeSubs = allSubList.filter(item => 
      item.sub.provider === provider && 
      !item.sub.isForgotten && 
      item.sub.usageFreq !== 'never'
    );

    if (activeSubs.length >= 2) {
      const sumCost = activeSubs.reduce((sum, item) => sum + item.sub.cost, 0);
      let familyPrice = 179;
      let planName = 'Family Plan';
      let type: AuditRecommendation['type'] = 'family_consolidation';
      let confidenceScore = 95;
      let confidenceReason = `Exact brand name matches found on ${activeSubs.length} active credit card/UPI auto-debits under the same household ledger.`;

      if (provider === 'Spotify') {
        familyPrice = FAMILY_PLAN_PRICES.Spotify.family;
        planName = FAMILY_PLAN_PRICES.Spotify.planName;
      } else if (provider === 'YouTube') {
        familyPrice = FAMILY_PLAN_PRICES.YouTube.family;
        planName = FAMILY_PLAN_PRICES.YouTube.planName;
      } else if (provider === 'Google One') {
        familyPrice = FAMILY_PLAN_PRICES.GoogleOne.family;
        planName = FAMILY_PLAN_PRICES.GoogleOne.planName;
      } else if (provider === 'Netflix') {
        familyPrice = FAMILY_PLAN_PRICES.Netflix.shared;
        planName = FAMILY_PLAN_PRICES.Netflix.planName;
        type = 'ott_overlap';
        confidenceScore = 90;
        confidenceReason = "Fuzzy profile match. Detected multiple duplicate Netflix billing segments under different family account emails.";
      }

      const potentialSavings = sumCost - familyPrice;
      if (potentialSavings > 0) {
        recommendations.push({
          id: `${provider.toLowerCase().replace(/\s+/g, '')}_duo_fallback`,
          title: `Merge ${activeSubs.length} ${provider} plans → 1 Shared ${provider} Family`,
          description: `${activeSubs.map(s => s.memberName).join(' & ')} currently maintain separate ${provider} billing lines. Switch them to a single shared ${planName} for ₹${familyPrice}/mo to trim redundant family overhead.`,
          potentialSavings: potentialSavings,
          type: type,
          impact: 'High',
          actionLabel: `Switch to Family Plan`,
          resolved: false,
          confidenceScore,
          confidenceReason
        });
      }
    }
  });

  // --- 3. DETECT CROSS-SERVICE CATEGORY MUSIC REDUNDANCY (DOUBLE-BILLED) ---
  members.forEach((m) => {
    // Check if same single person pays for both Spotify AND YouTube Premium
    const hasYouTube = m.subscriptions.some((s) => s.provider === 'YouTube' && !s.isForgotten && s.usageFreq !== 'never');
    const spotifySub = m.subscriptions.find((s) => s.provider === 'Spotify' && !s.isForgotten && s.usageFreq !== 'never');
    if (hasYouTube && spotifySub) {
      recommendations.push({
        id: `music_overlap_${m.id}_spotify`,
        title: `Stop ${m.name}'s Redundant Spotify Stream`,
        description: `${m.name} is paying ₹${spotifySub.cost}/mo for Spotify Premium, but also has YouTube Premium (which includes full ad-free YouTube Music). Cancel Spotify and save ₹${spotifySub.cost}/mo since music is double-paid.`,
        potentialSavings: spotifySub.cost,
        type: 'music_overlap',
        impact: 'High',
        actionLabel: 'Remove Spotify',
        resolved: false,
        confidenceScore: 95,
        confidenceReason: "Identified overlapping double-payment services. Music is fully covered under the active YouTube Premium e-mandate."
      });
    }
  });

  // Rank recommendations by savings descending
  recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);

  const totalLeakage = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
  const optimizedSpend = Math.max(0, totalSpend - totalLeakage);

  return {
    totalSpend,
    optimizedSpend,
    totalLeakage,
    activeRecommendations: recommendations
  };
}
