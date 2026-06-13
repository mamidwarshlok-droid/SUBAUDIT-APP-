import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  Tv,
  Music,
  Cloud,
  Layers,
  CheckCircle,
  X,
  Users,
  Info,
  Sparkles,
  Edit2,
  Check,
  RefreshCw,
  TrendingDown,
  UserPlus,
  FileSpreadsheet,
  Share2,
  CreditCard,
  Coins,
  Sliders,
  ShieldAlert,
  Receipt,
  Award,
  Copy,
  Bell,
  Mail,
  Database,
  Upload,
  Calendar,
  Clock,
  BarChart2,
  PieChart as PieChartIcon,
  Eye,
  EyeOff,
  CheckSquare,
  Zap,
  Lightbulb,
  SlidersHorizontal,
  Settings
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { FamilyMember, Subscription, AuditRecommendation, SubscriptionCategory } from './types';
import { INITIAL_FAMILY_MEMBERS, SUBSCRIPTION_CATALOG, CatalogItem } from './data/demoData';
import { runSubscriptionAudit, AuditResults } from './utils/auditEngine';

export default function App() {
  // Page routing state
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'connect' | 'scanning' | 'reveal' | 'quick_wins' | 'dashboard'>('landing');
  const [onboardingSelectMethod, setOnboardingSelectMethod] = useState<'bank' | 'gmail' | 'sms' | 'manual'>('bank');

  // Core demo/debugging state
  const [demoModeActive, setDemoModeActive] = useState<boolean>(true);
  const [hasRealData, setHasRealData] = useState<boolean>(false);
  const [isImpactOpen, setIsImpactOpen] = useState<boolean>(false);

  // Onboarding Stage state
  const [onboardingStage, setOnboardingStage] = useState<'create_household' | 'add_members' | 'invite_link'>('create_household');
  const [tempMemberName, setTempMemberName] = useState<string>('');
  const [tempMemberAvatarColor, setTempMemberAvatarColor] = useState<string>('bg-indigo-500');

  // Unified Integration Hub (Add Subscriptions) Active Tab State
  const [addSubTab, setAddSubTab] = useState<'manual' | 'csv' | 'gmail' | 'sms'>('manual');

  // Manual sub form states
  const [manualSubName, setManualSubName] = useState<string>('');
  const [manualSubProvider, setManualSubProvider] = useState<Subscription['provider']>('Other');
  const [manualSubCost, setManualSubCost] = useState<number>(149);
  const [manualSubCategory, setManualSubCategory] = useState<SubscriptionCategory>('Other');
  const [manualSubCycle, setManualSubCycle] = useState<'monthly' | 'annual'>('monthly');
  const [manualSubOwner, setManualSubOwner] = useState<string>('');
  const [manualSubUsage, setManualSubUsage] = useState<Subscription['usageFreq']>('frequently');
  const [manualSubForgotten, setManualSubForgotten] = useState<boolean>(false);

  // Resolution Guidance Panel modal states
  const [activeGuidanceSub, setActiveGuidanceSub] = useState<{
    memberId: string;
    sub: Subscription;
    recommendationId?: string;
  } | null>(null);
  const [isGuidanceConfirmed, setIsGuidanceConfirmed] = useState<boolean>(false);
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);

  // A) --- CONNECTED ACCOUNTS MOCK BANK STATEMENT CSV STATE ---
  const [catalog, setCatalog] = useState<CatalogItem[]>(SUBSCRIPTION_CATALOG);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvContentText, setCsvContentText] = useState<string>('');
  const [csvTargetMemberId, setCsvTargetMemberId] = useState<string>('rahul');
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string>('');
  const [csvParsedRecords, setCsvParsedRecords] = useState<{
    id: string;
    name: string;
    provider: Subscription['provider'];
    cost: number;
    category: Subscription['category'];
    usageFreq: Subscription['usageFreq'];
    isForgotten: boolean;
    dateOfDebit: string;
    isMandate: boolean;
    selected: boolean;
  }[]>([]);

  // B) --- PUSH/EMAIL NUDGES ALERT FEED STATE ---
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    body: string;
    type: 'warning' | 'alert' | 'success' | 'new_mandate';
    timestamp: string;
    read: boolean;
    hasAction?: boolean;
    actionType?: string;
    subId?: string;
    memberId?: string;
  }[]>([
    {
      id: 'notif_init_1',
      title: '🚨 Cross-Member Overlap Nudge',
      body: 'Both Rahul and Priya are paying ₹119/mo for Spotify Premium Individual separately. Consolidate into Spotify Duo/Family and save over ₹89/mo!',
      type: 'warning',
      timestamp: '3 mins ago',
      read: false
    },
    {
      id: 'notif_init_2',
      title: '⏰ Ghost Auto-Debit Approaching',
      body: 'A new ₹149 auto-debit for Hotstar Mobile is starting in 3 days on Neha\'s account. No active history found. Cancel plan to prevent leak!',
      type: 'alert',
      timestamp: 'Just now',
      read: false,
      hasAction: true,
      actionType: 'CANCEL_HOTSTAR',
      memberId: 'neha',
      subId: 'n_hotstar'
    }
  ]);

  // C) --- ADMIN INDIA PLAN-PRICE TABLE REFERENCE EDITOR STATE ---
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminNewPlanName, setAdminNewPlanName] = useState<string>('');
  const [adminNewPlanProvider, setAdminNewPlanProvider] = useState<Subscription['provider']>('Netflix');
  const [adminNewPlanCost, setAdminNewPlanCost] = useState<number>(149);
  const [adminNewPlanCategory, setAdminNewPlanCategory] = useState<Subscription['category']>('OTT');
  const [adminNewPlanDesc, setAdminNewPlanDesc] = useState<string>('');
  const [adminEditingIndex, setAdminEditingIndex] = useState<number | null>(null);

  // Core application state - Keeping track of our family members group
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyName, setFamilyName] = useState<string>('My Household Ledger');
  const [isEditingFamilyName, setIsEditingFamilyName] = useState<boolean>(false);

  // Scan screen step state
  const [scanningStatusIndex, setScanningStatusIndex] = useState<number>(0);
  const scanningSteps = [
    '🇮🇳 Initializing sandbox for client e-mandate scanning...',
    '📊 Grouping recurring charges by service categories ("OTT", "Music", "Storage")...',
    '💳 Analyzing recurring billing cycles and active auto-debut limits...',
    '💡 Comparing plan prices against current Indian family subscription profiles...',
    '🕵️ Scanning same-brand duplicates and separate overlapping logins...',
    '📺 Checking streaming vendor accounts for shared basic profiles...',
    '☁️ Auditing joint Google One cloud packages for storage allocation pools...',
    '🚀 Compiling custom dynamic, data-driven leakage recommendations...'
  ];

  // Selected member to edit sub in Dashboard
  const [selectedMemberId, setSelectedMemberId] = useState<string>('rahul');

  // Triggering the scanning screen animation sequence
  useEffect(() => {
    if (currentScreen === 'scanning') {
      setScanningStatusIndex(0);
      const interval = setInterval(() => {
        setScanningStatusIndex((prev) => {
          if (prev >= scanningSteps.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 250);

      const timeout = setTimeout(() => {
        setCurrentScreen('reveal');
      }, 2200);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [currentScreen]);

  // Modal controllers
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberAvatarColor, setNewMemberAvatarColor] = useState<string>('bg-purple-500');

  const [isAddSubOpen, setIsAddSubOpen] = useState<boolean>(false);
  const [subTargetMemberId, setSubTargetMemberId] = useState<string>('rahul');

  // State to track manual resolution overrides in the UI state
  // key: recommendation ID, value: true if manually marked resolved in session
  const [resolvedOverrideIds, setResolvedOverrideIds] = useState<Record<string, boolean>>({});

  // --- BOTTOM-TAB DASHBOARD STATES ---
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'subscriptions' | 'insights' | 'calendar' | 'family' | 'settings'>('overview');
  const [insightsSubTab, setInsightsSubTab] = useState<'advisor' | 'analytics'>('advisor');
  const [calendarSubTab, setCalendarSubTab] = useState<'grid' | 'timeline'>('grid');
  const [calendarViewMode, setCalendarViewMode] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(13);
  const [disabledNotificationCategories, setDisabledNotificationCategories] = useState<string[]>([]);
  
  const [customNotifications, setCustomNotifications] = useState<{
    id: string;
    type: 'renewal_tomorrow' | 'payment_failed' | 'trial_ending' | 'duplicate_found' | 'price_increase' | 'new_recurring_charge';
    serviceName: string;
    category: SubscriptionCategory;
    title: string;
    body: string;
    timestamp: string;
    amount: number;
    read: boolean;
    snoozed: boolean;
  }[]>([
    {
      id: 'notif_1',
      type: 'renewal_tomorrow',
      serviceName: 'Netflix Mobile',
      category: 'OTT',
      title: '📅 Renewal Tomorrow',
      body: 'Your Netflix Mobile subscription on Amit\'s account is renewing tomorrow. Automatic UPI e-mandate will trigger.',
      timestamp: 'Today, 2:30 PM',
      amount: 149,
      read: false,
      snoozed: false
    },
    {
      id: 'notif_2',
      type: 'payment_failed',
      serviceName: 'YouTube Premium',
      category: 'Music',
      title: '❌ UPI Auto-debit Failed',
      body: 'Auto-Debit mandate of ₹189 for YouTube Premium Family failed on Priya\'s HDFC account due to low balance.',
      timestamp: 'Yesterday',
      amount: 189,
      read: false,
      snoozed: false
    },
    {
      id: 'notif_3',
      type: 'trial_ending',
      serviceName: 'Amazon Prime',
      category: 'OTT',
      title: '⏳ Trial Period Ending',
      body: 'The 30-day Prime free trial on Rahul\'s card ends in 48 hours. Cancel now to avoid the automatic ₹1,499 annual levy.',
      timestamp: '2 days ago',
      amount: 1499,
      read: false,
      snoozed: false
    },
    {
      id: 'notif_4',
      type: 'duplicate_found',
      serviceName: 'Spotify Premium',
      category: 'Music',
      title: '🚨 Duplicate Subscription Leak',
      body: 'Multiple Spotify Premium Individual accounts detected (Priya and Rahul). Switch to Family plan to save ₹119/mo!',
      timestamp: '3 days ago',
      amount: 238,
      read: false,
      snoozed: false
    },
    {
      id: 'notif_5',
      type: 'price_increase',
      serviceName: 'Disney+ Hotstar',
      category: 'OTT',
      title: '📈 Tariff Rate Hike Notice',
      body: 'Disney+ Hotstar has announced a price revision for their Super plan from ₹299 to ₹349 starting next billing cycle.',
      timestamp: 'Last week',
      amount: 50,
      read: false,
      snoozed: false
    },
    {
      id: 'notif_6',
      type: 'new_recurring_charge',
      serviceName: 'Google One 100GB',
      category: 'Cloud',
      title: '✨ New Recurring Auto-Debit',
      body: 'A new e-mandate for Google One 100GB has been registered under Neha\'s UPI ID. Monthly authorization detected.',
      timestamp: 'Just now',
      amount: 130,
      read: false,
      snoozed: false
    }
  ]);

  // --- BILL SPLITTER STATE ---
  // ID of subscription currently selected to split
  const [splitSubId, setSplitSubId] = useState<string | null>(null);
  
  // Custom participants selection: Record of subId -> Record of memberId -> boolean
  const [subParticipants, setSubParticipants] = useState<Record<string, Record<string, boolean>>>({});
  
  // Custom paid status: Record of `${subId}__${memberId}` -> boolean (true if paid)
  const [subPaidStatus, setSubPaidStatus] = useState<Record<string, boolean>>({});

  // --- MONETIZATION STATE ---
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallPlanSelected, setPaywallPlanSelected] = useState<'recurring_mo' | 'forever_one'>('recurring_mo');
  const [showMonetizationConfig, setShowMonetizationConfig] = useState<boolean>(false);

  // Editable, config-driven pricing setup
  const [pricingConfig, setPricingConfig] = useState({
    premiumMonthlyPrice: 49,
    premiumForeverPrice: 199,
    successFeePercent: 20, // 20%
  });

  // Success fee stubs & transaction histories
  const [successFeeModalData, setSuccessFeeModalData] = useState<{
    recommendation: AuditRecommendation;
    annualSavings: number;
    fee: number;
  } | null>(null);

  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<{
    id: string;
    recommendationId: string;
    recommendationTitle: string;
    annualSavings: number;
    fee: number;
    paymentIntentId: string;
    timestamp: string;
    status: string;
  } | null>(null);

  const [successFeePayments, setSuccessFeePayments] = useState<{
    id: string;
    recommendationId: string;
    recommendationTitle: string;
    annualSavings: number;
    fee: number;
    paymentIntentId: string;
    timestamp: string;
    status: string;
  }[]>([]);

  // Inline VPA modification helpers
  const [editingVpaMemberId, setEditingVpaMemberId] = useState<string | null>(null);
  const [editingVpaValue, setEditingVpaValue] = useState<string>('');

  // Copy-link toast feedback timer key
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  // Localization Language selection State
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');

  // Rupee formatter helper
  const formatRupee = (value: number) => {
    return '₹' + Math.round(value).toLocaleString('en-IN');
  };

  // Run audit engine dynamically over our state
  const auditResults: AuditResults = useMemo(() => {
    const freshAudit = runSubscriptionAudit(familyMembers);
    
    // Apply resolved status based on interactive override IDs
    const updatedRecommendations = freshAudit.activeRecommendations.map((rec) => {
      if (resolvedOverrideIds[rec.id]) {
        return { ...rec, resolved: true };
      }
      return rec;
    });

    // Recalculate savings and optimized total
    const activeRecsCount = updatedRecommendations.filter(r => !r.resolved).length;
    const resolvedSavings = updatedRecommendations
      .filter((r) => r.resolved)
      .reduce((sum, r) => sum + r.potentialSavings, 0);

    const actualLeakage = Math.max(0, freshAudit.totalLeakage - resolvedSavings);
    const actualOptimized = freshAudit.totalSpend - actualLeakage;

    return {
      totalSpend: freshAudit.totalSpend,
      optimizedSpend: actualOptimized,
      totalLeakage: actualLeakage,
      activeRecommendations: updatedRecommendations,
    };
  }, [familyMembers, resolvedOverrideIds]);

  // Gathers a complete list of all household subscriptions
  const allSubscriptionsList = useMemo(() => {
    const list: { memberId: string; memberName: string; avatarColor: string; sub: Subscription }[] = [];
    familyMembers.forEach((m) => {
      m.subscriptions.forEach((s) => {
        list.push({
          memberId: m.id,
          memberName: m.name,
          avatarColor: m.avatarColor,
          sub: s,
        });
      });
    });
    return list;
  }, [familyMembers]);

  // Memoized selected subscription info for bill splitting
  const currentSplitSubInfo = useMemo(() => {
    if (allSubscriptionsList.length === 0) return null;
    const found = allSubscriptionsList.find(item => item.sub.id === splitSubId);
    if (found) return found;
    return allSubscriptionsList[0];
  }, [splitSubId, allSubscriptionsList]);

  // Selected members participating in the current split
  const activeParticipantsForSplit = useMemo(() => {
    if (!currentSplitSubInfo) return [];
    const subId = currentSplitSubInfo.sub.id;
    const customMap = subParticipants[subId];
    
    return familyMembers.filter((m) => {
      if (customMap) {
        return customMap[m.id] !== false; // exclude if explicitly false
      }
      return true; // default is true (all group members participate)
    });
  }, [currentSplitSubInfo, familyMembers, subParticipants]);

  // Split calculation
  const currentSplitCostPerMember = useMemo(() => {
    if (!currentSplitSubInfo || activeParticipantsForSplit.length === 0) return 0;
    return Math.round(currentSplitSubInfo.sub.cost / activeParticipantsForSplit.length);
  }, [currentSplitSubInfo, activeParticipantsForSplit]);

  const toggleParticipantInSplit = (subId: string, memberId: string) => {
    setSubParticipants((prev) => {
      const currentMap = prev[subId] || {};
      const isCurrentlyActive = currentMap[memberId] !== false;
      return {
        ...prev,
        [subId]: {
          ...currentMap,
          [memberId]: !isCurrentlyActive,
        },
      };
    });
  };

  const togglePaidStatus = (subId: string, memberId: string) => {
    const key = `${subId}__${memberId}`;
    setSubPaidStatus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateMemberVpa = (memberId: string, vpaValue: string) => {
    setFamilyMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return { ...m, vpa: vpaValue.trim() };
        }
        return m;
      })
    );
    setEditingVpaMemberId(null);
  };

  const getWhatsAppMessage = (memberName: string, subName: string, amount: number, upiUrl: string) => {
    const text = `Hi ${memberName}! Here is the SubAudit split reminder for our ${subName} subscription. Please pay your share of ₹${amount} using this UPI link:\n\n${upiUrl}\n\nSplit managed via SubAudit 💸`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleCopyLink = (upiUrl: string, key: string) => {
    navigator.clipboard.writeText(upiUrl).then(() => {
      setCopiedLinkKey(key);
      setTimeout(() => {
        setCopiedLinkKey(null);
      }, 2000);
    });
  };

  // Handle active underlying state changes back to back
  const performResolutionStateChange = (id: string, isRevert: boolean) => {
    setResolvedOverrideIds((prev) => {
      return { ...prev, [id]: !isRevert };
    });

    if (!isRevert) {
      if (id === 'cancel_neha_hotstar') {
        // Remove Hotstar Mobile from Neha (which was forgotten)
        removeSubFromState('neha', 'n_hotstar');
      } else if (id === 'priya_spotify_redundancy') {
        // Remove Priya's Spotify Individual plan
        removeSubFromState('priya', 'p_spotify');
      } else if (id === 'netflix_family_consolidation') {
        // Rahul cancels Netflix Mobile (149) and shares Amit's Netflix Basic (199).
        // We can remove Rahul's Netflix Mobile plan.
        removeSubFromState('rahul', 'r_netflix');
      } else if (id === 'youtube_family_bundle') {
        // YouTube family bundle saves ₹433 by switching family to YouTube Premium Family and eliminating both Spotify Individual accounts and the YouTube Premium Individual.
        // In family state, cancel Rahul's Spotify, Priya's Spotify, and change Priya's YouTube Individual to "YouTube Premium Family" (₹189/mo).
        setFamilyMembers((prevMembers) => {
          return prevMembers.map((m) => {
            let updatedSubs = m.subscriptions.filter(
              (s) => !(s.provider === 'Spotify') // Delete all spotifys as we're consolidated on family YouTube Premium
            );
            if (m.id === 'priya') {
              // Priya upgraded YouTube Premium to Family
              updatedSubs = updatedSubs.map((s) => {
                if (s.provider === 'YouTube') {
                  return {
                    ...s,
                    name: 'YouTube Premium Family',
                    cost: 189,
                  };
                }
                return s;
              });
            }
            return { ...m, subscriptions: updatedSubs };
          });
        });
      } else if (id.startsWith('cancel_forgotten_')) {
        // Parse forgotten ID
        const subId = id.replace('cancel_forgotten_', '');
        removeSubByIdGlobal(subId);
      } else if (id.startsWith('music_overlap_')) {
        // Remove Spotify duplicate
        const memberId = id.split('_')[2];
        setFamilyMembers(prev => prev.map(m => {
          if (m.id === memberId) {
            return { ...m, subscriptions: m.subscriptions.filter(s => s.provider !== 'Spotify') };
          }
          return m;
        }));
      } else if (id === 'netflix_overlap_fallback') {
        // Consolidate separate Netflix lines to 1 shared Standard or shared basic
        // Cancel the cheapest Netflix
        setFamilyMembers(prev => {
          let foundCheapestId = '';
          let minNetflixValue = 9999;
          prev.forEach(m => {
            m.subscriptions.forEach(s => {
              if (s.provider === 'Netflix' && s.cost < minNetflixValue) {
                minNetflixValue = s.cost;
                foundCheapestId = s.id;
              }
            });
          });
          return prev.map(m => ({
            ...m,
            subscriptions: m.subscriptions.filter(s => s.id !== foundCheapestId)
          }));
        });
      } else if (id === 'spotify_duo_fallback') {
        // Consolidate multiple Spotify into 1 Duo plan (149) with Priya
        setFamilyMembers(prev => {
          return prev.map(m => {
            // Cancel Spotifys on non-priya members, Priya gets Duo
            if (m.id === 'priya') {
              const cleanSubs = m.subscriptions.filter(s => s.provider !== 'Spotify');
              cleanSubs.push({
                id: 'spotify_duo_family',
                name: 'Spotify Premium Duo',
                provider: 'Spotify',
                cost: 149,
                category: 'Music',
                isForgotten: false,
                usageFreq: 'frequently'
              });
              return { ...m, subscriptions: cleanSubs };
            } else {
              return { ...m, subscriptions: m.subscriptions.filter(s => s.provider !== 'Spotify') };
            }
          });
        });
      }
    } else {
      // Revert actions
      if (id === 'cancel_neha_hotstar' || id === 'priya_spotify_redundancy' || id === 'netflix_family_consolidation' || id === 'youtube_family_bundle' || id === 'spotify_duo_fallback') {
        resetToDemoData();
      }
    }
  };

  // Handle recommendation action clicks - Intercepts saves to show transparent success fee invoice
  const toggleResolveRecommendation = (id: string) => {
    const isCurrentlyResolved = !!resolvedOverrideIds[id];
    
    if (!isCurrentlyResolved) {
      // Look up our recommendation in active audit list
      const rec = auditResults.activeRecommendations.find(r => r.id === id);
      if (rec) {
        let targetSubId = '';
        let targetMemberId = '';
        
        if (id.startsWith('cancel_forgotten_')) {
          targetSubId = id.replace('cancel_forgotten_', '');
        } else if (id === 'cancel_neha_hotstar') {
          targetSubId = 'n_hotstar';
          targetMemberId = 'neha';
        } else if (id === 'priya_spotify_redundancy') {
          targetSubId = 'p_spotify';
          targetMemberId = 'priya';
        } else if (id === 'netflix_family_consolidation') {
          targetSubId = 'r_netflix';
          targetMemberId = 'rahul';
        }
        
        let foundSub: Subscription | undefined;
        let foundMemberId = targetMemberId;
        
        if (targetSubId) {
          familyMembers.forEach(m => {
            const match = m.subscriptions.find(s => s.id === targetSubId);
            if (match) {
              foundSub = match;
              foundMemberId = m.id;
            }
          });
        }
        
        const tempSub: Subscription = foundSub || {
          id: targetSubId || `rec_fallback_${Date.now()}`,
          name: rec.title.replace('Cancel ', '').replace('Review ', '').replace("'s unused ", ' ').replace("'s low-usage ", ' '),
          provider: rec.title.includes('Netflix') ? 'Netflix' : rec.title.includes('Spotify') ? 'Spotify' : rec.title.includes('YouTube') ? 'YouTube' : rec.title.includes('Hotstar') ? 'Hotstar' : rec.title.includes('Google') ? 'Google One' : 'Other',
          cost: rec.potentialSavings,
          category: rec.title.includes('Spotify') || rec.title.includes('YouTube') ? 'Music' : rec.title.includes('Google') ? 'Cloud' : 'OTT',
          isForgotten: id.includes('forgotten'),
          usageFreq: 'never'
        };
        
        setActiveGuidanceSub({
          memberId: foundMemberId || familyMembers[0]?.id || 'papa',
          sub: tempSub,
          recommendationId: id
        });
        setIsGuidanceConfirmed(false);
      } else {
        // Direct resolution fallback
        performResolutionStateChange(id, false);
      }
    } else {
      // Immediate revert directly
      performResolutionStateChange(id, true);
      // Remove any historical payments matching this recommendation ID
      setSuccessFeePayments(prev => prev.filter(p => p.recommendationId !== id));
    }
  };

  // State actions helper
  const removeSubFromState = (memberId: string, subId: string) => {
    setFamilyMembers((prev) => {
      return prev.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            subscriptions: m.subscriptions.filter((s) => s.id !== subId),
          };
        }
        return m;
      });
    });
  };

  const removeSubByIdGlobal = (subId: string) => {
    setFamilyMembers((prev) => {
      return prev.map((m) => {
        return {
          ...m,
          subscriptions: m.subscriptions.filter((s) => s.id !== subId),
        };
      });
    });
  };

  const getProviderCancellationDetails = (providerName: string, subName: string, cost: number) => {
    const norm = (providerName || '').trim().toUpperCase();
    let instructions: string[] = [];
    let manageLink = '';
    let providerBrand = providerName;
    
    if (norm.includes('NETFLIX')) {
      providerBrand = 'Netflix';
      instructions = [
        'Enter Netflix.com/youraccount on your secure desktop or mobile browser.',
        'Log in using your registered family email credentials.',
        'Locate the "Membership & Billing" header on your screen.',
        'Click on the "Cancel Membership" button next to your billing information.',
        'Verify the cancellation and click "Finish Cancellation" to lock in the savings.'
      ];
      manageLink = 'https://www.netflix.com/youraccount';
    } else if (norm.includes('SPOTIFY')) {
      providerBrand = 'Spotify';
      instructions = [
        'Navigate to spotify.com/account in your web browser.',
        'Log into your personal Spotify Account dashboard.',
        'Under the "Your plan" section, locate and click the "Change Plan" option.',
        'Scroll past different Premium packages down to the "Spotify Free" section.',
        'Click "Cancel Premium" and confirm that you wish to pause or end premium features.'
      ];
      manageLink = 'https://www.spotify.com/account';
    } else if (norm.includes('YOUTUBE')) {
      providerBrand = 'YouTube Premium';
      instructions = [
        'Open the YouTube smartphone app or visit youtube.com.',
        'Click your user profile picture at the top right corner of the screen.',
        'Select the "Purchases and memberships" menu options.',
        'Identify your active YouTube Individual plan, then tap "Deactivate".',
        'Follow prompts on screen to downgrade safely and transition back to ad-supported mode.'
      ];
      manageLink = 'https://www.youtube.com/paid_memberships';
    } else if (norm.includes('HOTSTAR')) {
      providerBrand = 'Disney+ Hotstar';
      instructions = [
        'Load hotstar.com on web or open Disney+ Hotstar App on phone.',
        'Locate your user profile and navigate to "My Space".',
        'Tap on the "Help & Support" or "Account Settings" button.',
        'Under Subscriptions menu, choose "Cancel Subscription" option.',
        'Acknowledge cancellation terms and click "Confirm" to void upcoming auto-debit leakage.'
      ];
      manageLink = 'https://www.hotstar.com/my-space';
    } else if (norm.includes('PRIME') || norm.includes('AMAZON')) {
      providerBrand = 'Amazon Prime';
      instructions = [
        'Log in at amazon.in on browser or Open your Amazon India App.',
        'Select the Accounts and Lists dropdown menu and go to "Your Prime Membership".',
        'At the top right of your Prime panel banner, click "Manage Membership".',
        'Select "Update, Cancel and More" inside the drop-down menu.',
        'Click "End Membership" and complete the click confirmation sequence to finalize.'
      ];
      manageLink = 'https://www.amazon.in/prime';
    } else if (norm.includes('GOOGLE') || norm.includes('GCLOUD')) {
      providerBrand = 'Google One';
      instructions = [
        'Visit google.com/one or load your Google One application on Android/iOS.',
        'Ensure you are logged into the correct main Google Account.',
        'Open the left-side hamburger drawer or Settings panel (gear icon on upper right).',
        'Tap on "Membership Plan" and click "Cancel Membership".',
        'Follow Google Accounts steps to confirm cancellation and complete.'
      ];
      manageLink = 'https://one.google.com/settings';
    } else {
      providerBrand = providerName || 'Other Provider';
      instructions = [
        'Open the main platform website or application billing tab for ' + providerBrand + '.',
        'Type/Log in with the credentials of the account being audited.',
        'Manage subscription or cancel payment e-mandate under Billing profile.',
        'Confirm cancellation of the subscription agreement to reclaim budget flow.'
      ];
      manageLink = 'https://play.google.com/store/account/subscriptions';
    }
    
    return { instructions, manageLink, providerBrand };
  };

  const handleGuidanceDone = () => {
    if (!activeGuidanceSub) return;
    if (!isGuidanceConfirmed) {
      alert("Please confirm that you have cancelled the plan with the provider first.");
      return;
    }
    
    const { memberId, sub, recommendationId } = activeGuidanceSub;
    
    if (recommendationId) {
      // Opened via Quick Win Recommendation!
      // Close the guidance modal first
      setActiveGuidanceSub(null);
      
      // Look up our recommendation in active audit list and trigger Success Fee Modal!
      const rec = auditResults.activeRecommendations.find(r => r.id === recommendationId);
      if (rec) {
        const annualSavings = rec.potentialSavings * 12;
        const fee = Math.round(annualSavings * (pricingConfig.successFeePercent / 100));
        setSuccessFeeModalData({
          recommendation: rec,
          annualSavings,
          fee
        });
      } else {
        // Fallback direct resolution
        performResolutionStateChange(recommendationId, false);
      }
    } else {
      // Opened from standard subscription list Trash / Cancel buttons!
      removeSubFromState(memberId, sub.id);
      
      // Dispatch alert
      const newNudge = {
        id: `nudge_manual_cancel_${Date.now()}`,
        title: '✅ Subscription Cancelled',
        body: `Successfully recorded the physical cancellation of ${sub.name} (formatRupee savings). Leakage plugged!`,
        type: 'success' as const,
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [newNudge, ...prev]);
      setActiveGuidanceSub(null);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "Date,Merchant/VPA,Amount,Type\n12/06/2026,SPOTIFY-PREMIUM,119.00,CHG\n10/06/2026,NETFLIX-MUMBAI,199.00,CHG\n05/06/2026,UPI-PAY-HOTSTAR,149.00,UPI\n08/06/2026,GOOGLE-ONE-STORAGE,130.00,CHG";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subaudit_sample_statement.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitManualSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubName.trim()) {
      alert("Please enter a service name.");
      return;
    }
    if (!manualSubOwner) {
      alert("Please select who pays for this subscription.");
      return;
    }
    
    const calculatedCost = manualSubCycle === 'annual' ? Math.round(manualSubCost / 12) : manualSubCost;
    
    const newSub: Subscription = {
      id: `manual_${Date.now()}__${Math.floor(Math.random() * 1000)}`,
      name: manualSubName.trim(),
      provider: manualSubProvider,
      cost: calculatedCost,
      category: manualSubCategory,
      isForgotten: manualSubForgotten,
      usageFreq: manualSubUsage
    };
    
    setFamilyMembers(prev => {
      return prev.map(m => {
        if (m.id === manualSubOwner) {
          return {
            ...m,
            subscriptions: [...m.subscriptions, newSub]
          };
        }
        return m;
      });
    });
    
    setHasRealData(true);
    setIsAddSubOpen(false);
    
    // Dispatch nudge alert
    const targetMemberName = familyMembers.find(m => m.id === manualSubOwner)?.name || 'Papa';
    const newNudge = {
      id: `nudge_manual_sub_${Date.now()}`,
      title: '➕ Subscription Registered',
      body: `Registered ${newSub.name} under ${targetMemberName}'s ledger bucket.`,
      type: 'success' as const,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNudge, ...prev]);
    
    // Reset fields
    setManualSubName('');
    setManualSubProvider('Other');
    setManualSubCost(149);
    setManualSubCategory('Other');
    setManualSubCycle('monthly');
    setManualSubForgotten(false);
  };

  // Add custom subscription to member
  const handleAddNewSubscription = (catalogItem: CatalogItem) => {
    setFamilyMembers((prev) => {
      return prev.map((m) => {
        if (m.id === subTargetMemberId) {
          // Check if already subscribed to this provider to prevent UI clutter
          const alreadyHasProvider = m.subscriptions.some((s) => s.provider === catalogItem.provider);
          
          const newSub: Subscription = {
            id: `custom_${Date.now()}__${Math.floor(Math.random() * 1000)}`,
            name: catalogItem.name,
            provider: catalogItem.provider,
            cost: catalogItem.cost,
            category: catalogItem.category,
            isForgotten: false,
            usageFreq: 'frequently',
          };
          
          return {
            ...m,
            subscriptions: [...m.subscriptions, newSub],
          };
        }
        return m;
      });
    });
    setHasRealData(true);
    setIsAddSubOpen(false);
  };

  // Add a new family member to audit group
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name: newMemberName.trim(),
      avatarColor: newMemberAvatarColor,
      subscriptions: [],
      vpa: `${newMemberName.trim().toLowerCase().replace(/\s+/g, '')}@okpay`,
    };

    setFamilyMembers((prev) => [...prev, newMember]);
    setHasRealData(true);
    setSelectedMemberId(newMember.id);
    setNewMemberName('');
    setIsAddMemberOpen(false);
  };

  // Remove member completely
  const handleRemoveMember = (memberId: string) => {
    if (familyMembers.length <= 1) return; // Must have at least 1 member
    setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
    
    // Fallback current selected selection
    const index = familyMembers.findIndex(m => m.id !== memberId);
    if (index !== -1) {
      setSelectedMemberId(familyMembers[index].id);
    }
  };

  // Demo Mode state coordinator
  const handleDemoModeToggle = (isActive: boolean) => {
    setDemoModeActive(isActive);
    if (isActive) {
      setFamilyMembers(JSON.parse(JSON.stringify(INITIAL_FAMILY_MEMBERS)));
      setFamilyName('Sharma Family');
      setSelectedMemberId('rahul');
      setResolvedOverrideIds({});
      setIsPremium(false);
      setSuccessFeePayments([]);
      setLastPaymentReceipt(null);
    } else {
      setFamilyMembers([]);
      setFamilyName('My Family Ledger');
      setSelectedMemberId('');
      setResolvedOverrideIds({});
      setIsPremium(false);
      setSuccessFeePayments([]);
      setLastPaymentReceipt(null);
    }
  };

  // Reset to default Demo Sharma Family Setup
  const resetToDemoData = () => {
    setDemoModeActive(true);
    setHasRealData(false);
    setFamilyMembers(JSON.parse(JSON.stringify(INITIAL_FAMILY_MEMBERS)));
    setFamilyName('Sharma Family');
    setSelectedMemberId('rahul');
    setResolvedOverrideIds({});
    setIsPremium(false);
    setSuccessFeePayments([]);
    setLastPaymentReceipt(null);
  };

  // A) --- CONNECTED ACCOUNTS STATEMENT PARSING AND IMPORT HANDLERS ---
  const handleCsvContentParse = (text: string, filename: string) => {
    setCsvContentText(text);
    setCsvFileName(filename || 'statement_uploaded.csv');
    
    // Parse
    const lines = text.split('\n');
    const detected: any[] = [];
    
    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return; // skip header
      // handles standard, commas, or tab separators
      const parts = line.split(/[,\t]/);
      if (parts.length < 2) return;
      
      const date = parts[0]?.trim() || '12/06/2026';
      const desc = parts[1]?.trim() || '';
      const amtStr = parts[2]?.trim() || '149';
      const parsedAmt = Math.abs(parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 149);
      
      if (!desc) return;
      
      const descUpper = desc.toUpperCase();
      let matchedProvider: Subscription['provider'] | null = null;
      let matchedName = desc;
      let matchedCategory: Subscription['category'] = 'Other';
      let freq: Subscription['usageFreq'] = 'frequently';
      let isForg = false;
      
      if (descUpper.includes('NETFLIX')) {
        matchedProvider = 'Netflix';
        matchedName = parsedAmt <= 149 ? 'Netflix Mobile' : parsedAmt <= 199 ? 'Netflix Basic' : 'Netflix Standard';
        matchedCategory = 'OTT';
      } else if (descUpper.includes('SPOTIFY')) {
        matchedProvider = 'Spotify';
        matchedName = 'Spotify Premium Individual';
        matchedCategory = 'Music';
        if (csvTargetMemberId === 'priya') freq = 'rarely'; // Priya can double spend
      } else if (descUpper.includes('YOUTUBE')) {
        matchedProvider = 'YouTube';
        matchedName = 'YouTube Premium Individual';
        matchedCategory = 'Music';
      } else if (descUpper.includes('GOOGLE') || descUpper.includes('GCLOUD')) {
        matchedProvider = 'Google One';
        matchedName = 'Google One 100GB';
        matchedCategory = 'Cloud';
      } else if (descUpper.includes('HOTSTAR')) {
        matchedProvider = 'Hotstar';
        matchedName = 'Forgotten Hotstar Mobile';
        matchedCategory = 'OTT';
        isForg = true;
        freq = 'never';
      } else if (descUpper.includes('AMAZON') || descUpper.includes('PRIME')) {
        matchedProvider = 'Other';
        matchedName = 'Amazon Prime Mobile Edition';
        matchedCategory = 'OTT';
      } else if (descUpper.includes('APPLE')) {
        matchedProvider = 'Apple One';
        matchedName = 'Apple One Individual';
        matchedCategory = 'Other';
      }
      
      if (matchedProvider) {
        detected.push({
          id: `csv_parsed_${Date.now()}__${Math.floor(Math.random() * 1000)}__${index}`,
          name: matchedName,
          provider: matchedProvider,
          cost: parsedAmt || 149,
          category: matchedCategory,
          usageFreq: freq,
          isForgotten: isForg,
          dateOfDebit: date,
          isMandate: parsedAmt < 5000,
          selected: true
        });
      }
    });

    if (detected.length === 0) {
      // Fallback stub list if no recognizable patterns were parsed
      setCsvParsedRecords([
        {
          id: `csv_fallback_netflix_${Date.now()}`,
          name: 'Netflix Mobile',
          provider: 'Netflix' as const,
          cost: 149,
          category: 'OTT' as const,
          usageFreq: 'frequently' as const,
          isForgotten: false,
          dateOfDebit: '13/06/2026',
          isMandate: true,
          selected: true
        },
        {
          id: `csv_fallback_spotify_${Date.now()}`,
          name: 'Spotify Premium Individual',
          provider: 'Spotify' as const,
          cost: 119,
          category: 'Music' as const,
          usageFreq: 'frequently' as const,
          isForgotten: false,
          dateOfDebit: '11/06/2026',
          isMandate: true,
          selected: true
        },
        {
          id: `csv_fallback_hotstar_${Date.now()}`,
          name: 'Forgotten Hotstar Mobile',
          provider: 'Hotstar' as const,
          cost: 149,
          category: 'OTT' as const,
          usageFreq: 'never' as const,
          isForgotten: true,
          dateOfDebit: '05/06/2026',
          isMandate: true,
          selected: true
        }
      ]);
    } else {
      setCsvParsedRecords(detected);
    }
  };

  const handleImportCsvToMember = () => {
    const selectedPlans = csvParsedRecords.filter(r => r.selected);
    if (selectedPlans.length === 0) {
      alert("Please select at least one checkboxed transaction debit to import.");
      return;
    }
    
    // Add member if non-existent or list empty
    let memberIdToUse = csvTargetMemberId;
    if (familyMembers.length === 0) {
      const newMId = `member_${Date.now()}`;
      const newM: FamilyMember = {
        id: newMId,
        name: 'Papa (Self)',
        avatarColor: 'bg-indigo-600',
        subscriptions: [],
        vpa: 'papa@okpay'
      };
      setFamilyMembers([newM]);
      memberIdToUse = newMId;
    }

    // Append plans to selected member
    setFamilyMembers(prev => {
      return prev.map(m => {
        if (m.id === memberIdToUse) {
          const freshSubs: Subscription[] = selectedPlans.map(p => ({
            id: p.id,
            name: p.name,
            provider: p.provider,
            cost: p.cost,
            category: p.category,
            isForgotten: p.isForgotten,
            usageFreq: p.usageFreq
          }));
          return {
            ...m,
            subscriptions: [...m.subscriptions, ...freshSubs]
          };
        }
        return m;
      });
    });

    setHasRealData(true);
    setCsvSuccessMessage(`Successfully matching & imported ${selectedPlans.length} recurring e-mandates into the household ledger!`);
    
    // Dispatch nudge alert
    const targetMemberName = familyMembers.find(m => m.id === memberIdToUse)?.name || 'Papa (Self)';
    const newNudge = {
      id: `nudge_csv_${Date.now()}`,
      title: '✅ Bank Card Statement Synced',
      body: `Imported ${selectedPlans.length} active mandate debit logs for ${targetMemberName}. Dynamic leakage recalculation in progress.`,
      type: 'success' as const,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNudge, ...prev]);

    setTimeout(() => {
      setIsCsvModalOpen(false);
      setIsAddSubOpen(false);
      setCsvSuccessMessage('');
      setCsvParsedRecords([]);
      setCsvFileName('');
      setCsvContentText('');
    }, 1800);
  };

  // B) --- PUSH/EMAIL NUDGES TRIGGER LOGIC ---
  const triggerNudgeNudge = () => {
    const newNudge = {
      id: `nudge_live_${Date.now()}`,
      title: '⚠️ New Auto-Debit Warning',
      body: 'A new ₹149 auto-debit started on your account 3 days before renewal — review it.',
      type: 'warning' as const,
      timestamp: 'Just now',
      read: false,
      hasAction: true,
      actionType: 'CANCEL_HOTSTAR',
      memberId: 'neha',
      subId: 'n_hotstar'
    };
    setNotifications(prev => [newNudge, ...prev]);
    setShowNotifications(true); // slides notifications feed down!
  };

  const handleActionOnNudge = (notifId: string, actionType?: string) => {
    if (actionType === 'CANCEL_HOTSTAR') {
      // Instantly cancel Neha's forgotten Hotstar to prove the loop resolves!
      setFamilyMembers(prev => {
        return prev.map(m => {
          if (m.id === 'neha') {
            return {
              ...m,
              subscriptions: m.subscriptions.filter(s => s.id !== 'n_hotstar')
            };
          }
          return m;
        });
      });
      // Add success nudge
      const successNudge = {
        id: `nudge_success_${Date.now()}`,
        title: '✅ Forgotten Plan Terminated',
        body: 'Successfully terminated Neha\'s Hotstar Mobile plan auto-debit. Saving ₹149/mo (₹1,788/yr) instantly is reflected on the scorecard!',
        type: 'success' as const,
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [successNudge, ...prev.map(n => n.id === notifId ? { ...n, read: true } : n)]);
    } else {
      // Just mark read
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
  };

  // C) --- INDIA PLAN PRICE DYNAMIC CATALOG REFERENCE CRUD EDITOR ---
  const handleAddNewCatalogPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPlanName.trim()) {
      alert("Please provide a name for the custom subscriber plan.");
      return;
    }
    const newPlan: CatalogItem = {
      name: adminNewPlanName.trim(),
      provider: adminNewPlanProvider,
      cost: adminNewPlanCost,
      category: adminNewPlanCategory,
      description: adminNewPlanDesc.trim() || `${adminNewPlanName.trim()} premium plan`
    };

    setCatalog(prev => [...prev, newPlan]);
    setAdminNewPlanName('');
    setAdminNewPlanDesc('');
    setAdminNewPlanCost(149);
    alert(`Added "${adminNewPlanName}" Plan to official India pricing index successfully!`);
  };

  const handleDeleteCatalogPlan = (index: number) => {
    setCatalog(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdatePriceInCatalog = (index: number, newCost: number) => {
    setCatalog(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], cost: Math.max(0, newCost) };
      return copy;
    });
  };

  const [animatedCounter, setAnimatedCounter] = useState<number>(0);
  useEffect(() => {
    if (currentScreen === 'reveal') {
      let start = 0;
      const end = auditResults.totalLeakage;
      const duration = 1250; // ms
      if (end <= 0) {
        setAnimatedCounter(0);
        return;
      }
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setAnimatedCounter(end);
          clearInterval(timer);
        } else {
          setAnimatedCounter(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [currentScreen, auditResults.totalLeakage]);

  // Current active totals
  const totalWastedCurrently = auditResults.totalLeakage;
  const activeUnresolvedRecommendationsCount = auditResults.activeRecommendations.filter(r => !r.resolved).length;
  const totalAnnualSavingsPotential = totalWastedCurrently * 12;

  // Dynamics for the Pitch / Impact screenshot card
  const resolvedRecommendations = auditResults.activeRecommendations.filter(r => r.resolved);
  const totalRealizedSavingsMonthly = resolvedRecommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
  const totalRealizedSavingsAnnual = totalRealizedSavingsMonthly * 12;
  const currentTotalSpend = auditResults.totalSpend;
  const originalSpend = currentTotalSpend + totalRealizedSavingsMonthly;
  const percentageSaved = originalSpend > 0 ? Math.round((totalRealizedSavingsMonthly / originalSpend) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-stretch font-sans overflow-x-hidden">
      
      {/* PRIMARY VIEWER PORT (SIMULATING PRESTIGE MOBILE SHELL ON DESKTOP OR FILLING SCREEN ON RESIZABLE CLIENTS) */}
      <div className="w-full max-w-2xl bg-white text-slate-900 flex flex-col min-h-screen relative shadow-2xl overflow-y-auto">
        
        {/* HACKATHON LIVE CONTROLLER BANNER */}
        <div className="bg-slate-950 text-white px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 text-xs shrink-0 select-none">
          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            <span className="text-slate-400">DEMO MODE:</span>
            {/* Toggle group */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 ml-1">
              <button 
                onClick={() => handleDemoModeToggle(true)}
                className={`px-2 py-0.5 rounded-md font-bold text-[9px] transition-all cursor-pointer ${
                  demoModeActive 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sharma
              </button>
              <button 
                onClick={() => handleDemoModeToggle(false)}
                className={`px-2 py-0.5 rounded-md font-bold text-[9px] transition-all cursor-pointer ${
                  !demoModeActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sandbox
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Bank Statement CSV upload button */}
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Import bank e-mandates"
            >
              <FileSpreadsheet className="w-2.5 h-2.5 text-indigo-400" />
              <span>Statement CSV</span>
            </button>

            {/* Price Catalog editor */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Edit India plan prices index"
            >
              <Database className="w-2.5 h-2.5 text-purple-400" />
              <span>Price Catalog</span>
            </button>

            {/* Nudge Trigger */}
            <button
              onClick={triggerNudgeNudge}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Simulate push nudge warning alert"
              id="simulate_nudge_btn"
            >
              <Bell className="w-2.5 h-2.5 text-red-400" />
              <span>Simulate Nudge</span>
            </button>

            {/* Pitch report card button */}
            <button
              onClick={() => setIsImpactOpen(true)}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>Pitch Stats</span>
            </button>
          </div>
        </div>
        
        {/* MOBILE HEADER FOR EASY BRAND ACCESS */}
        {currentScreen !== 'landing' && currentScreen !== 'scanning' && (
          <header className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-40 shadow-sm" id="mobile_header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 flex items-center justify-center rounded-lg border border-emerald-100 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Sub<span className="text-emerald-600">Audit</span></span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-full text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>₹{totalWastedCurrently}/mo Leak</span>
              </div>

              {/* Smart alert notifications center */}
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDashboardTab('notifications');
                    setCurrentScreen('dashboard');
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-all relative cursor-pointer"
                  title="Smart alert nudges center"
                  id="notifications_bell_trigger"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                  {(() => {
                    const unreadCount = customNotifications.filter(n => !n.read && !disabledNotificationCategories.includes(n.category)).length;
                    if (unreadCount > 0) {
                      return (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 border border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white leading-none scale-90">
                          {unreadCount}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>
              </div>

              <button 
                onClick={resetToDemoData}
                title="Reset to initial state"
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                id="reset_btn"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* SCREEN VIEWS CONTAINER */}
        <div className="flex-1 flex flex-col min-h-full">
          <AnimatePresence mode="wait">
            
            {/* ------ VIEW 1: LANDING SCREEN ------ */}
            {currentScreen === 'landing' && (
              <motion.div
                key="landing-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-b from-emerald-50/40 via-white to-white"
                id="screen_landing"
              >
                {/* Upper branding section */}
                <div className="mt-6 flex flex-col items-center text-center">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/80 text-emerald-600 shadow-xl shadow-emerald-100/30 mb-6">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                    Sub<span className="text-emerald-600">Audit</span>
                  </h2>
                  <p className="text-sm font-mono text-emerald-800 uppercase tracking-widest font-bold px-3 py-0.5 bg-emerald-100/80 rounded-full mb-6">
                    Subscription-Leakage Auditor
                  </p>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug px-2">
                    How much money is your household throwing away in recurring apps?
                  </h3>
                  
                  <p className="mt-4 text-slate-600 text-sm max-w-sm px-2">
                    Overlapping OTT profiles, redundant music servers, and forgotten auto-debits leak up to <strong className="text-slate-900">₹10,200/year</strong> per family.
                  </p>
                </div>

                {/* Pre-loaded Sharma Family Mockup Card inside Landing Page */}
                <div className="my-8 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-md max-w-md mx-auto w-full text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 bg-indigo-50 text-indigo-700 text-[10px] font-mono rounded-bl-xl border-l border-b border-slate-100 uppercase tracking-wider font-bold">
                    PRELOADED AUDIT DEMO
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-900 text-sm">Sharma Family Households</span>
                    <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">4 Members</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700">Rahul (Age 23)</div>
                      <div className="text-slate-400 mt-0.5 leading-relaxed">Spotify Individual, Netflix Mobile</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700">Priya (Age 20)</div>
                      <div className="text-slate-400 mt-0.5 leading-relaxed">Spotify Individual, YouTube Premium</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700">Amit (Age 45)</div>
                      <div className="text-slate-400 mt-0.5 leading-relaxed">Netflix Basic Account</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700">Neha (Age 42)</div>
                      <div className="text-slate-400 mt-0.5 leading-relaxed font-semibold text-amber-700">Forgotten Hotstar Mobile</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Monthly Bills:</span>
                    <span className="font-bold text-slate-900">₹1,014 / month</span>
                  </div>
                </div>

                {/* Landing Button Actions */}
                <div className="flex flex-col gap-3 mt-4 max-w-md mx-auto w-full">
                  <button
                    onClick={() => {
                      // By default seed preloaded demo content for high impact, but let them choose integration method
                      setFamilyMembers(JSON.parse(JSON.stringify(INITIAL_FAMILY_MEMBERS)));
                      setHasRealData(false);
                      setCurrentScreen('connect');
                    }}
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-200/55 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                    id="cta_landing_run"
                  >
                    <span>Securely Analyze Family Leaks</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="flex justify-center items-center gap-2 text-slate-400 text-[11px] mt-2 font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>SECURE SANDBOXED BILL LEAK MONITORING</span>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ------ VIEW 1.5: ONBOARDING CONNECT DATA CHOICE ------ */}
            {currentScreen === 'connect' && (
              <motion.div
                key="connect-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col justify-between p-6 sm:p-10 bg-slate-950 text-white"
                id="screen_connect"
              >
                <div className="my-auto max-w-md mx-auto w-full text-left">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs bg-emerald-500/25 text-emerald-400 font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Step 1 of 4: Select Data Connector
                    </span>
                  </div>

                  <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                    What would you like to connect?
                  </h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    SubAudit audits family spending logs to automatically flag overlapping profiles, redundant premium channels, and forgotten auto-debits.
                  </p>

                  <div className="space-y-3 mb-8">
                    {/* Option 1: Bank Statement */}
                    <button
                      onClick={() => {
                        setOnboardingSelectMethod('bank');
                        setFamilyMembers(JSON.parse(JSON.stringify(INITIAL_FAMILY_MEMBERS)));
                        setHasRealData(false);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        onboardingSelectMethod === 'bank'
                          ? 'bg-slate-900 border-emerald-500 shadow-lg'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        onboardingSelectMethod === 'bank' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-450'
                      }`}>
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                          <span>Bank Statement (CSV/PDF)</span>
                          {onboardingSelectMethod === 'bank' && <span className="text-[9px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Selected</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Extract e-mandates automatically. Reads credit card and sandbox statement files safe and offline.
                        </p>
                      </div>
                    </button>

                    {/* Option 2: Gmail Sync */}
                    <button
                      onClick={() => {
                        setOnboardingSelectMethod('gmail');
                        setFamilyMembers(JSON.parse(JSON.stringify(INITIAL_FAMILY_MEMBERS)));
                        setHasRealData(false);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        onboardingSelectMethod === 'gmail'
                          ? 'bg-slate-900 border-indigo-500 shadow-lg'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        onboardingSelectMethod === 'gmail' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-450'
                      }`}>
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                          <span>Gmail Connection</span>
                          {onboardingSelectMethod === 'gmail' && <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Simulator</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Securely scan recurring billing receipts from subscription confirmation emails automatic.
                        </p>
                      </div>
                    </button>

                    {/* Option 3: SMS Alerts Scan */}
                    <button
                      onClick={() => {
                        setOnboardingSelectMethod('sms');
                        setFamilyMembers(JSON.parse(JSON.stringify(INITIAL_FAMILY_MEMBERS)));
                        setHasRealData(false);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        onboardingSelectMethod === 'sms'
                          ? 'bg-slate-900 border-amber-500 shadow-lg'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        onboardingSelectMethod === 'sms' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-450'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                          <span>SMS Log Parsing</span>
                          {onboardingSelectMethod === 'sms' && <span className="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Simulator</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Audit silent e-mandate texts under the ₹5,000 threshold that auto-debit accounts without monthly OTP.
                        </p>
                      </div>
                    </button>

                    {/* Option 4: Manual setup */}
                    <button
                      onClick={() => {
                        setOnboardingSelectMethod('manual');
                        setFamilyMembers([{
                          id: 'papa',
                          name: 'Papa (Self)',
                          avatarColor: 'bg-indigo-600',
                          subscriptions: [],
                          vpa: 'papa@okicici'
                        }]);
                        setHasRealData(true);
                        setSelectedMemberId('papa');
                      }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        onboardingSelectMethod === 'manual'
                          ? 'bg-slate-900 border-slate-400 shadow-lg'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        onboardingSelectMethod === 'manual' ? 'bg-slate-200 text-slate-950' : 'bg-slate-800 text-slate-450'
                      }`}>
                        <Edit2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                          <span>Manual Setup</span>
                          {onboardingSelectMethod === 'manual' && <span className="text-[9px] bg-slate-100 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Manual Fresh</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Add individual names, providers & bill cycles manually. Best to build custom households.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Sandbox Simulated Label Indicators */}
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-850 text-xs text-left text-slate-400 leading-relaxed">
                    {onboardingSelectMethod === 'bank' && "📂 Sandbox HDFC & ICICI e-mandate logs preloaded. Press 'Run Leakage Checkup' below to trigger the audit of Sharma Family data."}
                    {onboardingSelectMethod === 'gmail' && "✉️ Google Accounts Simulator: Connected. Reads digital subscription receipts for Spotify Duo overlapping channels."}
                    {onboardingSelectMethod === 'sms' && "📱 Phone Alert Scanner: Listening. Intercepts recurring silent under-₹5,000 mandates from automated text gateways."}
                    {onboardingSelectMethod === 'manual' && "✍️ Creating empty family ledger. Starts completely empty for your custom member insertions & fresh test profiles."}
                  </div>
                </div>

                <div className="w-full max-w-md mx-auto mt-6">
                  <button
                    onClick={() => {
                      setCurrentScreen('scanning');
                    }}
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    id="cta_connect_submit"
                  >
                    <span>Run Leakage Checkup</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ------ VIEW 2: SCANNING SCREEN ...... */}
            {currentScreen === 'scanning' && (
              <motion.div
                key="scanning-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 bg-slate-950 text-white flex flex-col justify-center items-center p-8 text-center"
                id="screen_scanning"
              >
                {/* Circular Radar Scan Visualizer */}
                <div className="relative mb-10">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-t-4 border-emerald-500"
                    ></motion.div>
                    <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                  Scanning your subscriptions...
                </h3>
                <p className="text-slate-400 text-sm max-w-xs mb-8">
                  Analyzing familial spending logs, service overlap codes, and ghost auto-debit loops.
                </p>

                {/* Live Console Diagnostic Logs */}
                <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 text-left font-mono text-xs text-emerald-400/90 h-32 overflow-y-auto shadow-inner bg-slate-950/90">
                  <div className="flex h-full flex-col justify-end">
                    {scanningSteps.slice(0, scanningStatusIndex + 1).map((step, idx) => (
                      <motion.p 
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="truncate"
                      >
                        <span className="text-slate-500 font-mono">[{idx + 1}]</span> {step}
                      </motion.p>
                    ))}
                    <div className="w-2 h-4 bg-emerald-400 animate-pulse inline-block mt-1"></div>
                  </div>
                </div>

                <div className="mt-8 text-xs text-slate-500 tracking-wider">
                  SHARMA HOUSEHOLD SYSTEM • IN-MEMORY SHIELD
                </div>
              </motion.div>
            )}

            {/* ------ VIEW 3: REVEAL SCREEN ------ */}
            {currentScreen === 'reveal' && (
              <motion.div
                key="reveal-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col justify-between p-6 sm:p-10 bg-slate-950 text-white"
                id="screen_reveal"
              >
                <div className="my-auto flex flex-col items-center">
                  
                  {/* Real/Demo Distinct Badge */}
                  {!hasRealData ? (
                    <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-2xl max-w-sm text-center">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full inline-block mb-1.5 animate-pulse">
                        🧪 Demo Mode Data
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        This is a sample checkup using demo data. Care to connect actual data?
                      </p>
                      <div className="flex gap-2 justify-center mt-2.5">
                        <button
                          onClick={() => {
                            setIsCsvModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white rounded-lg text-[9px] font-bold font-mono transition-transform cursor-pointer"
                        >
                          📂 Upload Statement
                        </button>
                        <button
                          onClick={() => {
                            // Clear and seed a default "Papa (Self)" member for real entry
                            setFamilyMembers([{
                              id: 'papa',
                              name: 'Papa (Self)',
                              avatarColor: 'bg-indigo-600',
                              subscriptions: [],
                              vpa: 'papa@okicici'
                            }]);
                            setHasRealData(true);
                            setSelectedMemberId('papa');
                            setIsAddSubOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white rounded-lg text-[9px] font-bold font-mono transition-transform cursor-pointer"
                        >
                          ✍️ Manual Entry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-2xl max-w-sm text-center">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full inline-block mb-1.5">
                        🟢 Real Data Mode
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        Generated dynamically from your custom group data entries and imported statements!
                      </p>
                    </div>
                  )}

                  {/* Alarm Severity Indicator Icon */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    className={`p-4 rounded-full border mb-6 ${
                      auditResults.totalLeakage > 0 
                        ? 'bg-red-500/10 border-red-500/30 text-amber-400' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {auditResults.totalLeakage > 0 ? (
                      <AlertTriangle className="w-14 h-14" />
                    ) : (
                      <ShieldCheck className="w-14 h-14" />
                    )}
                  </motion.div>

                  <p className="text-xs font-mono tracking-widest text-red-550 uppercase font-bold mb-2">
                    {auditResults.totalLeakage > 0 ? 'CRITICAL BILL LEAKAGE DETECTED' : 'SYSTEM FULLY SECURE'}
                  </p>

                  {/* High Impact Alert Card Description */}
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center text-white mb-6 leading-tight max-w-md px-2">
                    {auditResults.totalLeakage > 0 ? (
                      <>
                        Your family is losing <span className="text-red-400">{formatRupee(auditResults.totalLeakage)}</span> this month on duplicate subscriptions
                      </>
                    ) : (
                      <>Your family has optimized all recurring subscriptions perfectly!</>
                    )}
                  </h2>

                  {/* Large High Impact Scoreboard */}
                  <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden text-center mb-8">
                    <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 rounded-full blur-2xl ${auditResults.totalLeakage > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}></div>
                    
                    <div className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
                      LEAKAGE METER (MONTHLY)
                    </div>
                    
                    {/* Tick-up Counter */}
                    <div className="text-5xl font-extrabold tracking-tight text-white mb-4">
                      {formatRupee(animatedCounter)}
                      <span className="text-xs text-slate-400 font-normal"> / month</span>
                    </div>

                    <div className={`py-2.5 px-4 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 ${
                      auditResults.totalLeakage > 0 
                        ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    }`}>
                      {auditResults.totalLeakage > 0 ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span>Equivalent to {formatRupee(auditResults.totalLeakage * 12)} / year</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Zero inactive financial leakage</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Detailed Diagnostics Quick Report - COMPLETELY DYNAMIC WITHOUT LOG CLUTTER */}
                  <div className="w-full max-w-sm space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center mb-1">
                      Auditor Confidence Scores
                    </div>
                    {(() => {
                      const dupes = auditResults.activeRecommendations.filter(r => r.type === 'family_consolidation' || r.type === 'ott_overlap').length;
                      const forgots = auditResults.activeRecommendations.filter(r => r.type === 'cancel_forgotten').length;
                      const overlapMusic = auditResults.activeRecommendations.filter(r => r.type === 'music_overlap').length;

                      if (auditResults.activeRecommendations.length === 0) {
                        return (
                          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
                            <p className="text-xs text-slate-300 font-mono">🔍 0 active leaks identified. Perfect optimization.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {dupes > 0 && (
                            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80 text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase font-bold text-red-400">Direct Duplications</span>
                                <span className="text-[9.5px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono font-bold">98% Confidence</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-100">{dupes} Direct brand overlap{dupes > 1 ? 's' : ''}</span>: Multiple streaming family accounts premium logins billed on separate cards.
                              </p>
                            </div>
                          )}

                          {forgots > 0 && (
                            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80 text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase font-bold text-amber-400">Ghost Mandates</span>
                                <span className="text-[9.5px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">85% Confidence</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-100">{forgots} Inactive plan{forgots > 1 ? 's' : ''}</span>: Auto-debit limits running with low or zero captured server sync log history during the trailing 90 days.
                              </p>
                            </div>
                          )}

                          {overlapMusic > 0 && (
                            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80 text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase font-bold text-indigo-400">Category Overlaps</span>
                                <span className="text-[9.5px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold">92% Confidence</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-100">{overlapMusic} Heavy music overlap{overlapMusic > 1 ? 's' : ''}</span>: Overlapping premiums for individual music streamers on both YouTube & Spotify.
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* See how to fix it Action -> Leads to Quick Wins */}
                <div className="w-full max-w-md mx-auto mt-8">
                  <button
                    onClick={() => setCurrentScreen('quick_wins')}
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    id="cta_reveal_dashboard"
                  >
                    <span>🎁 View Quick Wins (Fix First Leak Free)</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-slate-500 text-[10px] text-center mt-3 font-mono">
                    PROCEED TO THE UNLOCKED ZERO-COST REPAIR SCREEN
                  </p>
                </div>
              </motion.div>
            )}

            {/* ------ VIEW 3.5: ONBOARDING QUICK WINS ------ */}
            {currentScreen === 'quick_wins' && (
              <motion.div
                key="quickwins-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-slate-950 text-white"
                id="screen_quick_wins"
              >
                <div className="max-w-md mx-auto w-full text-left">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs bg-emerald-500/25 text-emerald-400 font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Step 3 of 4: Reclaim savings (100% Free)
                    </span>
                  </div>

                  <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                    🎁 Your First Fix is Free!
                  </h2>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    We found critical billing duplicates. To experience the immediate value of SubAudit, you can plug your first monthly leak absolutely free.
                  </p>

                  {/* Recommendations Cards list */}
                  <div className="space-y-3 mb-6">
                    {auditResults.activeRecommendations.map((rec) => {
                      const isResolved = !!resolvedOverrideIds[rec.id];
                      const resolvedCount = Object.values(resolvedOverrideIds).filter(Boolean).length;
                      const hasUsedFreeFix = resolvedCount >= 1;

                      return (
                        <div
                          key={rec.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isResolved
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                  rec.type === 'cancel_forgotten' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                                }`}>
                                  {rec.type === 'cancel_forgotten' ? 'Forgot Plan' : 'Overlapping'}
                                </span>
                                <span className="text-[10px] text-slate-405 font-mono">
                                  Confidence: {rec.type === 'cancel_forgotten' ? '85%' : '98%'}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-slate-100 mt-2">{rec.title}</h4>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {rec.description}
                              </p>
                              <div className="mt-2.5 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                                <span>Potential Savings: {formatRupee(rec.potentialSavings)}/mo</span>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="shrink-0">
                              {isResolved ? (
                                <div className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-extrabold text-[11px] rounded-lg flex items-center gap-1 select-none">
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  <span>Fixed!</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (hasUsedFreeFix && !isPremium) {
                                      // Pro locked!
                                      setIsPaywallOpen(true);
                                      return;
                                    }
                                    toggleResolveRecommendation(rec.id);
                                  }}
                                  className={`px-3 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                    hasUsedFreeFix && !isPremium
                                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-[1.02]'
                                  }`}
                                >
                                  {hasUsedFreeFix && !isPremium ? (
                                    <span className="flex items-center gap-1">
                                      <Lock className="w-3 h-3" />
                                      <span>Upgrade</span>
                                    </span>
                                  ) : (
                                    <span>Fix Free</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Micro reassurance message */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 text-xs text-slate-450 text-left flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Resolving is instant! We automatically adjust virtual credit allocations and group ledger accounts.
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-md mx-auto mt-6">
                  <button
                    onClick={() => {
                      setCurrentScreen('dashboard');
                    }}
                    className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    id="cta_quick_wins_continue"
                  >
                    <span>Proceed to Main Ledger Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-3 font-mono">
                    YOUR CONFUGURED LEAK SOLUTIONS WILL PERSIST
                  </p>
                </div>
              </motion.div>
            )}

            {/* ------ VIEW 4: MAIN FAMILY AUDIT DASHBOARD ------ */}
            {currentScreen === 'dashboard' && (
              <motion.div
                key="dashboard-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 bg-slate-50 text-slate-900 flex flex-col min-h-screen"
                id="screen_dashboard"
              >
                {/* DYNAMIC TOP APP HEADER BAR */}
                <div className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 border-b border-slate-805 flex justify-between items-center shadow-lg" id="app_header">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 font-mono text-sm leading-none">SA</div>
                    <div className="text-left">
                      <h1 className="text-xs font-black tracking-tight flex items-center gap-1.5 text-white leading-tight">
                        SubAudit
                        {isPremium && <span className="bg-amber-400 font-mono font-black text-[7.5px] text-slate-950 px-1 py-0.5 rounded uppercase leading-none scale-90">PRO</span>}
                      </h1>
                      <p className="text-[9px] text-slate-400 font-mono leading-none">
                        {language === 'en' ? "India's No.1 Family Bill Auditor" : language === 'hi' ? "भारत का नंबर 1 बिल ऑडिटर" : "Ghar Ka Subscriptions Auditor"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveDashboardTab('settings');
                      }}
                      className="p-1 px-2 hover:bg-slate-800 rounded-lg relative text-slate-350 transition cursor-pointer text-[10px] font-mono flex items-center gap-1"
                      title="Configuration Control Panel"
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                      <span>{language === 'en' ? 'Settings' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
                    </button>
                    <button
                      onClick={resetToDemoData}
                      className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-750 font-mono text-red-400 font-bold border border-slate-700/60 rounded transition cursor-pointer"
                      title="Reset to Demo State"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="pb-28">
                  {/* TAB 1: OVERVIEW SUBVIEW */}
                  {activeDashboardTab === 'overview' && (
                    <>
                      {/* DYNAMIC STATISTICS HEADER (Overview Tab Only!) */}
                      <div className="bg-slate-900 text-white px-6 py-6 relative overflow-hidden" id="dashboard_stats_hdr">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl"></div>
                        <div className="max-w-md mx-auto relative z-10 text-left">
                          
                          {/* Demo Dataset Ribbon Badge */}
                          {!hasRealData && (
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-[8px] font-extrabold font-mono uppercase tracking-widest bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full inline-block animate-pulse">
                                  🧪 DEMO
                                </span>
                                <span className="text-[10px] font-bold">Using simulated family e-mandates.</span>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-relaxed mb-2.5">
                                Ready to run a real customized audit on your own ledger?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setActiveDashboardTab('subscriptions');
                                    setIsCsvModalOpen(true);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[9px] font-bold font-mono px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  📂 Upload Statement
                                </button>
                                <button
                                  onClick={() => {
                                    setFamilyMembers([{
                                      id: 'papa',
                                      name: 'Papa (Self)',
                                      avatarColor: 'bg-indigo-600',
                                      subscriptions: [],
                                      vpa: 'papa@okicici'
                                    }]);
                                    setHasRealData(true);
                                    setSelectedMemberId('papa');
                                    setActiveDashboardTab('subscriptions');
                                    setIsAddSubOpen(true);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[9px] font-bold font-mono px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  ✍️ Manual Addition
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Family Name Label Editor */}
                          <div className="flex items-center gap-2 mb-3">
                            {isEditingFamilyName ? (
                              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 w-full">
                                <input
                                  type="text"
                                  value={familyName}
                                  onChange={(e) => setFamilyName(e.target.value)}
                                  className="bg-transparent text-white font-bold text-xs px-2 py-0.5 outline-none w-full"
                                />
                                <button
                                  onClick={() => setIsEditingFamilyName(false)}
                                  className="p-1 text-emerald-400 hover:bg-slate-700 rounded-md"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold tracking-tight text-emerald-400 capitalize text-xs font-mono tracking-wider">
                                  {language === 'en' ? `${familyName} SUBSCRIPTION LEDGER` : language === 'hi' ? `${familyName} का बजट बहीखाता` : `${familyName} Ki Budget Ledger`}
                                </span>
                                <button
                                  onClick={() => setIsEditingFamilyName(true)}
                                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Three Top Summary Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            
                            {/* Card 1: Total Monthly Spend */}
                            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-705 flex flex-col justify-between">
                              <div>
                                <span className="text-slate-400 text-[8.5px] uppercase font-mono tracking-wider block font-bold">
                                  {language === 'hi' ? 'कुल मासिक खर्च' : language === 'hinglish' ? 'Har Mahine Ka Spend' : 'Total Monthly Spend'}
                                </span>
                                <span className="text-xl font-bold font-sans text-slate-105">{formatRupee(auditResults.totalSpend)}</span>
                                <span className="text-slate-450 text-[9.5px] block mt-0.5">Target: {formatRupee(auditResults.optimizedSpend)}/mo</span>
                              </div>
                              <div className="text-[9px] text-slate-450 mt-1.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <span>Active: {familyMembers.reduce((acc, m) => acc + m.subscriptions.length, 0)} plans</span>
                              </div>
                            </div>

                            {/* Card 2: Monthly Leakage */}
                            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-colors ${
                              totalWastedCurrently > 0 
                                ? 'bg-red-950/25 border-red-900/40 text-red-100' 
                                : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-100'
                            }`}>
                              <div>
                                <span className="text-slate-400 text-[8.5px] uppercase font-mono tracking-wider block font-bold">
                                  {language === 'hi' ? 'मासिक फालतू खर्च' : language === 'hinglish' ? 'Monthly Leakage' : 'Monthly Leakage'}
                                </span>
                                <span className="text-xl font-extrabold font-sans text-red-400">
                                  {formatRupee(totalWastedCurrently)}
                                </span>
                                <span className="text-slate-400 text-[10px] block mt-0.5 font-semibold">{totalWastedCurrently > 0 ? 'Urgent Action' : 'All Clear!'}</span>
                              </div>
                              <div className="text-[9px] mt-1.5 flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${totalWastedCurrently > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                <span>{totalWastedCurrently > 0 ? `${activeUnresolvedRecommendationsCount} active leaks` : '0 Leakage'}</span>
                              </div>
                            </div>

                            {/* Card 3: Projected Annual Savings */}
                            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-705 flex flex-col justify-between">
                              <div>
                                <span className="text-slate-400 text-[8.5px] uppercase font-mono tracking-wider block font-bold">
                                  {language === 'hi' ? 'वार्षिक बचत' : language === 'hinglish' ? 'Saal Bhar Ki Bachat' : 'Projected Annual Savings'}
                                </span>
                                <span className="text-xl font-extrabold font-sans text-emerald-400">
                                  {formatRupee(totalAnnualSavingsPotential)}
                                </span>
                                <span className="text-slate-400 text-[10px] block mt-0.5 font-semibold">At 100% resolve</span>
                              </div>
                              <div className="text-[9px] text-slate-450 mt-1.5 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>Saved budget</span>
                              </div>
                            </div>

                          </div>

                          {/* Savings Tracker Progress Bar */}
                          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-805 text-left">
                            <div className="flex justify-between text-[10px] text-slate-405 mb-1 font-mono">
                              <span>LEAKAGE CONTROL STATUS</span>
                              <span className="font-bold text-emerald-400">
                                {Math.round(((auditResults.totalSpend - totalWastedCurrently) / (auditResults.totalSpend || 1)) * 100)}% Optimized
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                              <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.max(5, ((auditResults.totalSpend - totalWastedCurrently) / (auditResults.totalSpend || 1)) * 100)}%` }}
                                 className="bg-emerald-500 h-full rounded-full transition-all"
                              ></motion.div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* QUICK WINS LIST */}
                      <div className="max-w-md mx-auto px-6 pt-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
                          ⚡ Optimization Quick Wins
                        </h3>
                      </div>
                      {activeUnresolvedRecommendationsCount > 0 && (
                        <span className="text-[10px] font-bold font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                          {activeUnresolvedRecommendationsCount} Actionable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4 text-left">
                      Consolidate overlapping profiles, stop redundant family streams, and reclaim double-paid charges instantly:
                    </p>

                    {auditResults.activeRecommendations.length === 0 ? (
                      <div className="p-6 bg-emerald-50 border border-emerald-100 text-center rounded-xl">
                        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                        <h4 className="font-extrabold text-emerald-950 text-xs">Ledger Completely Safe!</h4>
                        <p className="text-[11px] text-emerald-850 mt-1">
                          No duplicate subscriptions, redundancy, or leaks remain in your state.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {auditResults.activeRecommendations.map((rec) => {
                          return (
                            <div
                              key={rec.id}
                              className={`p-3.5 bg-slate-50 rounded-xl border transition-all ${
                                rec.resolved
                                  ? 'border-slate-200/60 bg-slate-50/50 opacity-60'
                                  : 'border-slate-250 hover:border-slate-350 bg-white shadow-sm'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase ${
                                      rec.resolved
                                        ? 'bg-slate-200 text-slate-500'
                                        : rec.impact === 'High'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-amber-500 text-white'
                                    }`}>
                                      {rec.resolved ? 'RESOLVED' : `${rec.impact} Impact`}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">{rec.title}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                                    {rec.description}
                                  </p>
                                  {rec.confidenceScore !== undefined && (
                                    <div className="mt-2 p-2 bg-indigo-50/70 border border-indigo-100/50 rounded-lg text-left">
                                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 font-mono uppercase tracking-wide">
                                        <span>🎯 {rec.confidenceScore}% confident matched</span>
                                      </div>
                                      {rec.confidenceReason && (
                                        <p className="text-[9px] text-indigo-905 italic font-sans leading-relaxed mt-0.5">
                                          {rec.confidenceReason}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-xs font-extrabold font-mono text-emerald-600">
                                    {rec.resolved ? '✓ Saved' : `Save ${formatRupee(rec.potentialSavings)}`}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono">/ month</span>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-400 font-mono uppercase">
                                  Annual Impact: {formatRupee(rec.potentialSavings * 12)}/yr
                                </span>

                                <button
                                  onClick={() => toggleResolveRecommendation(rec.id)}
                                  className={`font-bold px-3 py-1 rounded transition text-[11px] ${
                                    rec.resolved
                                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      : 'bg-emerald-650 hover:bg-emerald-700 text-white shadow-sm font-semibold'
                                  }`}
                                  id={`fix_win_btn_${rec.id}`}
                                >
                                  {rec.resolved ? 'Revert fix' : 'Fix this'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* HIDDEN AUTO-DEBITS SECTION */}
                <div className="max-w-md mx-auto px-6">
                  <div className="bg-amber-50/75 p-5 rounded-2xl border border-amber-250 shadow-sm mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-amber-955 text-sm tracking-wide uppercase">
                          ⚠️ Hidden Auto-Debits (&lt; ₹5,000)
                        </h3>
                        <p className="text-[11px] text-amber-900 mt-1 leading-relaxed text-left">
                          <strong>RBI E-Mandate Loopholes:</strong> Under Reserve Bank of India guidelines, recurring e-mandates <strong>under ₹5,000</strong> are processed <strong>automatically without a monthly OTP consent</strong>. Once initially approved, they silently debit your credit cards month after month, leading families to completely overlook forgotten plans.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(() => {
                        // Gather all household subscriptions that are under ₹5,000
                        const listUnder5000: { memberName: string; memberId: string; sub: Subscription }[] = [];
                        familyMembers.forEach((m) => {
                          m.subscriptions.forEach((s) => {
                            if (s.cost < 5000) {
                              listUnder5000.push({
                                memberName: m.name,
                                memberId: m.id,
                                sub: s
                              });
                            }
                          });
                        });

                        if (listUnder5000.length === 0) {
                          return (
                            <div className="text-center py-4 bg-white/50 rounded-xl border border-amber-100 text-xs text-amber-900 font-medium">
                              No auto-debits detected under ₹5,000.
                            </div>
                          );
                        }

                        return listUnder5000.map(({ memberName, memberId, sub }) => {
                          const isRisky = sub.isForgotten || sub.usageFreq === 'never' || sub.usageFreq === 'rarely';
                          return (
                            <div 
                              key={sub.id}
                              className={`p-3 rounded-xl border flex justify-between items-center text-xs transition-all ${
                                isRisky 
                                  ? 'bg-red-50 border-red-200 text-red-950' 
                                  : 'bg-white border-amber-100 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg text-xs shrink-0 ${
                                  isRisky ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {sub.category === 'Music' ? <Music className="w-3.5 h-3.5" /> : sub.category === 'Cloud' ? <Cloud className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                                </div>
                                <div className="truncate text-left">
                                  <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate">{sub.name}</span>
                                    {sub.isForgotten && (
                                      <span className="text-[8px] font-extrabold bg-red-600 text-white px-1 leading-normal rounded uppercase">FORGOTTEN LEAK</span>
                                    )}
                                    {!sub.isForgotten && isRisky && (
                                      <span className="text-[8px] font-extrabold bg-amber-600 text-white px-1 leading-normal rounded uppercase">LOW USAGE</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500">
                                    Charged to <strong>{memberName}</strong> • Silent OTP-less debit
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-4">
                                <span className="font-extrabold font-mono text-slate-900">{formatRupee(sub.cost)}</span>
                                <button
                                  onClick={() => {
                                    setActiveGuidanceSub({ memberId, sub });
                                    setIsGuidanceConfirmed(false);
                                  }}
                                  className="p-1 px-2 border border-red-200 hover:bg-red-100 hover:border-red-300 text-[10px] font-bold text-red-600 rounded-lg transition shrink-0 bg-white"
                                  title="Cancel Silent Auto-Debit"
                                >
                                  Cancel Plan
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SUBSCRIPTIONS SUBVIEW */}
            {activeDashboardTab === 'subscriptions' && (
              <>
                {/* DETECTED ACTIVE HOUSEHOLD MEMBERS SECTION */}
                <div className="max-w-md mx-auto px-6 py-4" id="dashboard_members_section">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Family Members ({familyMembers.length})</span>
                    </h4>

                    {/* Button trigger add family member */}
                    <button
                      onClick={() => setIsAddMemberOpen(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-emerald-100 transition-colors"
                      id="add_member_trigger"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {/* Avatar row selector */}
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x" id="members_avatars_row">
                    {familyMembers.map((m) => {
                      const totalMemberCost = m.subscriptions.reduce((sum, s) => sum + s.cost, 0);
                      const isSelected = selectedMemberId === m.id;
                      
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMemberId(m.id)}
                          className={`flex-shrink-0 snap-start p-3 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                              : 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50'
                          } w-28 text-center`}
                          id={`member_card_${m.id}`}
                        >
                          <div className="flex justify-center mb-1.5 relative">
                            <span className={`w-8 h-8 rounded-full ${m.avatarColor} flex items-center justify-center text-xs font-bold text-white uppercase`}>
                              {m.name.charAt(0)}
                            </span>
                            {m.subscriptions.some(s => s.isForgotten || s.usageFreq === 'never') && (
                              <span className="absolute -top-1 right-6 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          
                          <div className="text-xs font-bold truncate">{m.name}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'} font-mono mt-0.5`}>
                            {formatRupee(totalMemberCost)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Member Detailed Subscription Table / View */}
                  {selectedMemberId && (
                    <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm" id="member_detail_box">
                      {familyMembers.find((m) => m.id === selectedMemberId) && (() => {
                        const member = familyMembers.find((m) => m.id === selectedMemberId)!;
                        const subCount = member.subscriptions.length;
                        
                        return (
                          <div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold uppercase text-[10px]`}>
                                  {member.name.charAt(0)}
                                </span>
                                <span className="font-bold text-slate-800">{member.name}'s Subscription Deck</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSubTargetMemberId(member.id);
                                    setIsAddSubOpen(true);
                                  }}
                                  className="text-[11px] text-indigo-700 bg-indigo-50 font-bold px-2 py-1 rounded select-none cursor-pointer"
                                  id="add_sub_trigger"
                                >
                                  + Add Subscription
                                </button>
                                
                                {familyMembers.length > 1 && (
                                  <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    title="Delete family member"
                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* List of subs on this member */}
                            {subCount === 0 ? (
                              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                                No active premium subscriptions detected for {member.name}. Tap Add Subscription to audit their services.
                              </div>
                            ) : (
                              <div className="space-y-3.5">
                                {member.subscriptions.map((s) => {
                                  // Determine visual warnings
                                  const isGhostSub = s.isForgotten || s.usageFreq === 'never';
                                  const isRedundantMusic = member.subscriptions.some(sm => sm.provider === 'YouTube') && s.provider === 'Spotify';
                                  const hasAlert = isGhostSub || isRedundantMusic;

                                  return (
                                    <div
                                      key={s.id}
                                      className={`flex justify-between items-center p-3 rounded-xl border text-xs ${
                                        hasAlert 
                                          ? 'border-red-100 bg-red-50/50' 
                                          : 'border-slate-100 bg-slate-50/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Icon picker based on category */}
                                        <div className={`p-2 rounded-lg ${
                                          hasAlert ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {s.category === 'Music' ? (
                                            <Music className="w-4 h-4" />
                                          ) : s.category === 'Cloud' ? (
                                            <Cloud className="w-4 h-4" />
                                          ) : (
                                            <Tv className="w-4 h-4" />
                                          )}
                                        </div>

                                        <div className="text-left">
                                          <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                            <span>{s.name}</span>
                                            {s.isForgotten && (
                                              <span className="text-[9px] font-bold font-mono uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded">GHOST</span>
                                            )}
                                            {isRedundantMusic && (
                                              <span className="text-[9px] font-bold font-mono uppercase bg-red-500 text-white px-1.5 py-0.5 rounded">REDUNDANT</span>
                                            )}
                                          </div>
                                          
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            Category: {s.category} • Frequency: <span className="font-semibold">{s.usageFreq}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-950 font-mono">{formatRupee(s.cost)}</span>
                                        <button
                                          onClick={() => {
                                            setActiveGuidanceSub({ memberId: member.id, sub: s });
                                            setIsGuidanceConfirmed(false);
                                          }}
                                          title="Remove subscription line"
                                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* --- UPI BILL-SPLITTER SECTION --- */}
                <div className="max-w-md mx-auto px-6 py-4" id="dashboard_billsplit_section">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
                    
                    {/* Locked overlay for Freemium Paywall */}
                    {!isPremium && (
                      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20">
                        <div className="bg-amber-500 text-slate-950 p-2.5 rounded-full mb-3 shadow-lg animate-bounce">
                          <Sparkles className="w-5 h-5 text-slate-950" />
                        </div>
                        <h4 className="text-white text-base font-extrabold tracking-tight">
                          ✨ Unlock UPI Auto Bill-Splitter
                        </h4>
                        <p className="text-slate-300 text-xs mt-1.5 max-w-[280px] leading-relaxed">
                          Let household members pay their split via customized UPI deep links, automatic calculations & prefilled WhatsApp reminders.
                        </p>
                        <button
                          onClick={() => setIsPaywallOpen(true)}
                          className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 bg-amber-500 hover:bg-amber-405 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                          id="billsplit_unlock_btn"
                        >
                          Unlock Premium SubSplit
                        </button>
                        <span className="text-[10px] text-slate-450 font-mono mt-2">
                          Premium plans start at just {formatRupee(pricingConfig.premiumMonthlyPrice)}/mo (Adjustable)
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Share2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
                          💸 UPI Family Bill-Splitter
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        UPI QR & Reminders
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-4 text-left">
                      Split shared streaming, cloud storage, or music bills with household members automatically. Every participant gets an instant custom UPI launch link.
                    </p>

                    {allSubscriptionsList.length === 0 ? (
                      <div className="p-6 bg-slate-50 border border-slate-200/80 text-center rounded-xl text-slate-400 text-xs font-semibold">
                        No active subscriptions in the family deck to split. Add one above or restore demo data!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Select Subscription to Split */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-left">
                            Select Subscription to Split
                          </label>
                          <select
                            value={currentSplitSubInfo?.sub.id || ''}
                            onChange={(e) => setSplitSubId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                          >
                            {allSubscriptionsList.map((item) => (
                              <option key={item.sub.id} value={item.sub.id}>
                                {item.memberName}'s {item.sub.name} ({formatRupee(item.sub.cost)}/mo)
                              </option>
                            ))}
                          </select>
                        </div>

                        {currentSplitSubInfo && (
                          <>
                            {/* Headcount Selection Pill / Grid */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                                  Select Split Participants
                                </label>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {activeParticipantsForSplit.length} selected
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {familyMembers.map((m) => {
                                  const subId = currentSplitSubInfo.sub.id;
                                  const isSelected = subParticipants[subId] 
                                    ? subParticipants[subId][m.id] !== false 
                                    : true; // default true
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => toggleParticipantInSplit(subId, m.id)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border select-none cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                                          : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className={`w-3.5 h-3.5 rounded-full ${m.avatarColor} flex items-center justify-center text-[7px] text-white font-bold uppercase`}>
                                        {m.name.charAt(0)}
                                      </span>
                                      <span>{m.name}</span>
                                      <span className="ml-0.5 text-[10px]">
                                        {isSelected ? '✓' : '+'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Split Summary Equation Card */}
                            <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 relative overflow-hidden text-left shadow-sm">
                              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl"></div>
                              <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-400 uppercase block">
                                LIVE COST SPLIT RATIO
                              </span>
                              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-slate-200">
                                  {currentSplitSubInfo.sub.name}
                                </span>
                                <span className="font-mono font-bold text-slate-100 text-sm">
                                  {formatRupee(currentSplitSubInfo.sub.cost)}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">÷</span>
                                <span className="font-bold text-indigo-400 text-sm font-mono">
                                  {activeParticipantsForSplit.length} share{activeParticipantsForSplit.length !== 1 ? 's' : ''}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">=</span>
                                <span className="text-lg font-black text-emerald-400 font-mono">
                                  {formatRupee(currentSplitCostPerMember)}
                                </span>
                                <span className="text-[10px] text-slate-450">/ each</span>
                              </div>
                            </div>

                            {/* Splits and Links Roll */}
                            <div className="space-y-3 pt-2.5">
                              <div className="flex justify-between items-center px-1 border-b border-slate-50 pb-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Participant share list
                                </span>
                                <span className="text-[9px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  ₹ Split Active
                                </span>
                              </div>

                              {activeParticipantsForSplit.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                  Select at least 1 member to split the cost!
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  {activeParticipantsForSplit.map((member) => {
                                    const subId = currentSplitSubInfo.sub.id;
                                    const amount = currentSplitCostPerMember;
                                    
                                    // Generate mock/real VPA if missing
                                    const memberVpa = member.vpa || `${member.name.toLowerCase().replace(/\s+/g, '')}@okpay`;
                                    
                                    // Build the exact deep link as specified:
                                    // upi://pay?pa=MEMBER_VPA&pn=MemberName&am=AMOUNT&cu=INR&tn=SubAudit%20split
                                    const upiUrl = `upi://pay?pa=${memberVpa}&pn=${member.name}&am=${amount}&cu=INR&tn=SubAudit%2520split`;
                                    
                                    const paidKey = `${subId}__${member.id}`;
                                    const isPaid = !!subPaidStatus[paidKey];

                                    return (
                                      <div
                                        key={member.id}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 transition-all text-xs gap-3 ${
                                          isPaid ? 'border-emerald-100 bg-emerald-50/20' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className={`w-7 h-7 rounded-full ${member.avatarColor} text-white flex justify-center items-center font-bold uppercase text-[10px] shrink-0`}>
                                            {member.name.charAt(0)}
                                          </span>
                                          <div className="text-left min-w-0">
                                            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                              <span>{member.name}</span>
                                              <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                                                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                              }`}>
                                                {isPaid ? 'PAID' : 'PENDING'}
                                              </span>
                                            </div>
                                            
                                            {/* UPI VPA Display & Inline Editor */}
                                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                                              <span className="font-mono">UPI ID:</span>
                                              {editingVpaMemberId === member.id ? (
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="text"
                                                    value={editingVpaValue}
                                                    onChange={(e) => setEditingVpaValue(e.target.value)}
                                                    className="p-0.5 font-mono bg-white border border-slate-300 rounded text-[9px] w-24 outline-none"
                                                    size={12}
                                                  />
                                                  <button
                                                    onClick={() => updateMemberVpa(member.id, editingVpaValue)}
                                                    className="px-1 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-bold"
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={() => setEditingVpaMemberId(null)}
                                                    className="px-1 py-0.5 bg-slate-200 text-slate-500 rounded text-[8px]"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-1">
                                                  <span className="font-semibold font-mono text-slate-700 bg-slate-200/50 px-1 py-0.2 rounded truncate max-w-[124px]">
                                                    {memberVpa}
                                                  </span>
                                                  <button
                                                    onClick={() => {
                                                      setEditingVpaMemberId(member.id);
                                                      setEditingVpaValue(memberVpa);
                                                    }}
                                                    title="Edit UPI ID"
                                                    className="p-0.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer"
                                                  >
                                                    <Edit2 className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                                          {/* Price */}
                                          <div className="text-left sm:text-right">
                                            <span className="font-extrabold text-slate-900 font-mono block text-sm">
                                              {formatRupee(amount)}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono">dues</span>
                                          </div>

                                          {/* Action Group */}
                                          <div className="flex items-center gap-1.5">
                                            {/* Paid/Pending Toggle */}
                                            <button
                                              onClick={() => togglePaidStatus(subId, member.id)}
                                              title="Toggle paid status"
                                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                                isPaid 
                                                  ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600' 
                                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                                              }`}
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Copy UPI Link */}
                                            <button
                                              onClick={() => handleCopyLink(upiUrl, `${subId}__${member.id}`)}
                                              title="Copy exact UPI Deep Link"
                                              className={`p-1.5 rounded-lg border transition text-xs font-bold leading-none cursor-pointer ${
                                                copiedLinkKey === `${subId}__${member.id}`
                                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                                              }`}
                                            >
                                              {copiedLinkKey === `${subId}__${member.id}` ? (
                                                <span className="text-[9px]">Copied</span>
                                              ) : (
                                                <span className="font-mono text-[9px] tracking-tight uppercase">UPI</span>
                                              )}
                                            </button>

                                            {/* Send WhatsApp Reminder */}
                                            <a
                                              href={getWhatsAppMessage(member.name, currentSplitSubInfo.sub.name, amount, upiUrl)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center shadow-sm select-none"
                                              title="Send WhatsApp Reminder"
                                            >
                                              <span className="text-[10px] font-sans px-1 uppercase tracking-tight">Reminder</span>
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* FULL HOUSEHOLD SUBSCRIPTIONS TABLE */}
                <div className="max-w-md mx-auto px-6 py-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 text-slate-705 rounded-lg">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
                          📋 All Household Subscriptions
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                        {allSubscriptionsList.length} global items
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="py-2 px-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Service</th>
                            <th className="py-2 px-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Member</th>
                            <th className="py-2 px-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Price (₹)</th>
                            <th className="py-2 px-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Category</th>
                            <th className="py-2 px-1 text-right text-[10px] font-bold uppercase text-slate-400 tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allSubscriptionsList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                                No active household subscriptions detected.
                              </td>
                            </tr>
                          ) : (
                            allSubscriptionsList.map(({ memberId, memberName, avatarColor, sub }) => (
                              <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                <td className="py-3 px-1 font-bold text-slate-800 text-xs text-left">
                                  <div className="flex items-center gap-1">
                                    <span className="truncate">{sub.name}</span>
                                    {sub.isForgotten && (
                                      <span className="text-[8px] bg-amber-500 text-white font-bold px-1 rounded uppercase tracking-tight">Ghost</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-1 text-xs text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-4 h-4 rounded-full ${avatarColor} flex items-center justify-center text-[8px] font-bold text-white uppercase`}>
                                      {memberName.charAt(0)}
                                    </span>
                                    <span className="text-slate-600 font-medium truncate">{memberName}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-1 font-mono font-bold text-slate-900 text-xs text-left">
                                  {formatRupee(sub.cost)}
                                </td>
                                <td className="py-3 px-1 text-xs text-left">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                    sub.category === 'Music' 
                                      ? 'bg-blue-55 text-blue-700 border border-blue-100' 
                                      : sub.category === 'OTT' 
                                      ? 'bg-purple-55 text-purple-700 border border-purple-100' 
                                      : sub.category === 'Cloud' 
                                      ? 'bg-indigo-55 text-indigo-700 border border-indigo-100' 
                                      : 'bg-slate-55 text-slate-600 border border-slate-100'
                                  }`}>
                                    {sub.category}
                                  </span>
                                </td>
                                <td className="py-3 px-1 text-right">
                                <button
                                  onClick={() => {
                                    setActiveGuidanceSub({ memberId, sub });
                                    setIsGuidanceConfirmed(false);
                                  }}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition"
                                  title="Cancel Plan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* --- SUCCESS FEE RECEIPTS HISTORICAL LEDGER --- */}
                {successFeePayments.length > 0 && (
                  <div className="max-w-md mx-auto px-6 py-4 animate-fadeIn" id="dashboard_success_payments_ledger">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Receipt className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
                            🧾 SubSplit Sandbox Ledger ({successFeePayments.length})
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-550 mb-3.5 leading-relaxed">
                        Invoices generated under active premium contracts or performance-guarantee leakage audit clearances. Click any row to review payment authorization credentials.
                      </p>

                      <div className="space-y-2">
                        {successFeePayments.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setLastPaymentReceipt(p)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer flex justify-between items-center transition group"
                            title="Click to view full invoice stub receipt"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition-colors">
                                {p.recommendationTitle}
                              </div>
                              <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                Ref: {p.id} • {p.timestamp}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <span className="font-bold text-slate-900 font-mono text-xs">{formatRupee(p.fee)}</span>
                              <span className="text-[9px] text-emerald-600 block font-bold font-mono">PAID</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                      </>
                    )}

                    {/* TIMELINE SUBVIEW PANEL */}
                    {activeDashboardTab === 'timeline' && (
                      <div className="max-w-md mx-auto px-6 py-6 text-left animate-in fade-in duration-300" id="tab_timeline_panel">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                              🗓️ Household Payment Timeline
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mt-0.5 animate-pulse">
                              Chronological Auto-Debit Ledger
                            </p>
                          </div>
                        </div>

                        {allSubscriptionsList.length === 0 ? (
                          <div className="p-8 bg-slate-50 border border-slate-200 text-center rounded-2xl">
                            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                            <h4 className="font-extrabold text-slate-800 text-xs">No Active Mandates Detected</h4>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Add members and subscriptions to start tracking auto-debit payments.
                            </p>
                          </div>
                        ) : (
                          <div className="relative border-l-2 border-slate-200 ml-3.5 pl-5 space-y-5">
                            {(() => {
                              const timelineEvents: {
                                date: string;
                                dayNum: number;
                                serviceName: string;
                                provider: string;
                                eventType: 'upcoming_renewal' | 'recently_paid' | 'free_trial_ending' | 'price_increase';
                                amount: number;
                                ownerName: string;
                                ownerAvatarColor: string;
                              }[] = [];

                              allSubscriptionsList.forEach(({ sub, memberName, avatarColor }, idx) => {
                                // 1. Recently Paid (days 1 to 12)
                                const recentDay = 1 + ((idx * 4) % 12);
                                timelineEvents.push({
                                  date: `2026-06-${recentDay.toString().padStart(2, '0')}`,
                                  dayNum: recentDay,
                                  serviceName: sub.name,
                                  provider: sub.provider,
                                  eventType: 'recently_paid',
                                  amount: sub.cost,
                                  ownerName: memberName,
                                  ownerAvatarColor: avatarColor
                                });

                                // 2. Upcoming Renewal (days 14 to 28)
                                const upcomingDay = 14 + ((idx * 3) % 15);
                                timelineEvents.push({
                                  date: `2026-06-${upcomingDay.toString().padStart(2, '0')}`,
                                  dayNum: upcomingDay,
                                  serviceName: sub.name,
                                  provider: sub.provider,
                                  eventType: 'upcoming_renewal',
                                  amount: sub.cost,
                                  ownerName: memberName,
                                  ownerAvatarColor: avatarColor
                                });

                                // 3. Free Trial Ending
                                if (sub.isForgotten || idx % 3 === 0) {
                                  const trialDay = 14 + ((idx * 5) % 14);
                                  timelineEvents.push({
                                    date: `2026-06-${trialDay.toString().padStart(2, '0')}`,
                                    dayNum: trialDay,
                                    serviceName: sub.name,
                                    provider: sub.provider,
                                    eventType: 'free_trial_ending',
                                    amount: 0,
                                    ownerName: memberName,
                                    ownerAvatarColor: avatarColor
                                  });
                                }

                                // 4. Price Increase Notice
                                if (sub.provider === 'Netflix' || idx % 3 === 1) {
                                  const increaseDay = 24 + ((idx * 2) % 5);
                                  timelineEvents.push({
                                    date: `2026-06-${increaseDay.toString().padStart(2, '0')}`,
                                    dayNum: increaseDay,
                                    serviceName: sub.name,
                                    provider: sub.provider,
                                    eventType: 'price_increase',
                                    amount: Math.round(sub.cost * 1.15),
                                    ownerName: memberName,
                                    ownerAvatarColor: avatarColor
                                  });
                                }
                              });

                              timelineEvents.sort((a, b) => a.dayNum - b.dayNum);
                              const subCostMap = (name: string, amt: number) => Math.round(amt / 1.15);

                              return timelineEvents.map((evt, index) => {
                                const formattedDateObj = new Date(evt.date);
                                const dayStr = formattedDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                                return (
                                  <div key={index} className="relative group">
                                    <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-all group-hover:scale-125 ${
                                      evt.eventType === 'upcoming_renewal'
                                        ? 'border-indigo-600 ring-2 ring-indigo-100'
                                        : evt.eventType === 'recently_paid'
                                        ? 'border-emerald-600'
                                        : evt.eventType === 'free_trial_ending'
                                        ? 'border-pink-500'
                                        : 'border-red-500 animate-pulse'
                                    }`}></div>

                                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-slate-350">
                                      <div className="flex justify-between items-start gap-4">
                                        <div className="text-left">
                                          <span className="text-[10px] font-extrabold font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                            {dayStr} • 2026
                                          </span>
                                          <h4 className="font-extrabold text-slate-800 mt-1.5 text-xs text-left">
                                            {evt.serviceName}
                                          </h4>
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`w-3.5 h-3.5 rounded-full ${evt.ownerAvatarColor} text-white font-mono text-[8px] flex items-center justify-center font-bold`}>
                                              {evt.ownerName.charAt(0)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 text-left">
                                              Paid through <strong>{evt.ownerName}</strong>
                                            </span>
                                          </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                          {evt.eventType === 'recently_paid' && (
                                            <span className="text-[8px] font-black font-mono tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase block text-center">
                                              PAID CURRENT
                                            </span>
                                          )}
                                          {evt.eventType === 'upcoming_renewal' && (
                                            <span className="text-[8px] font-black font-mono tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase block text-center">
                                              AUTO-DEBIT CYC
                                            </span>
                                          )}
                                          {evt.eventType === 'free_trial_ending' && (
                                            <span className="text-[8px] font-black font-mono tracking-wider text-pink-700 bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded uppercase block text-center">
                                              TRIAL END
                                            </span>
                                          )}
                                          {evt.eventType === 'price_increase' && (
                                            <span className="text-[8px] font-black font-mono tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase block text-center animate-pulse">
                                              TARIFF RATE HIKE
                                            </span>
                                          )}

                                          <div className="mt-2 text-xs font-black font-mono text-slate-800 text-right">
                                            {evt.eventType === 'free_trial_ending' ? (
                                              <span className="text-pink-600 font-bold">₹0 (Trial Space)</span>
                                            ) : evt.eventType === 'price_increase' ? (
                                              <div className="flex flex-col text-right">
                                                <span className="text-red-500 line-through text-[10px] opacity-60 font-mono">₹{subCostMap(evt.serviceName, evt.amount)}</span>
                                                <span className="text-red-650 text-xs font-black">Hike to {formatRupee(evt.amount)}</span>
                                              </div>
                                            ) : (
                                              <span className={evt.eventType === 'recently_paid' ? 'text-slate-700 font-mono' : 'text-indigo-600 font-mono font-black'}>
                                                {formatRupee(evt.amount)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CALENDAR SUBVIEW PANEL */}
                    {activeDashboardTab === 'calendar' && (
                      <div className="max-w-md mx-auto px-6 py-6 text-left animate-in fade-in" id="tab_calendar_panel">
                        {/* Summary metric banner */}
                        <div className="bg-slate-900 text-white p-4 rounded-3xl mb-5 flex justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Calendar className="w-16 h-16 text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <span className="text-[9px] uppercase font-mono text-emerald-400 tracking-wider font-extrabold block">Forecast Period • June 2026</span>
                            <h3 className="text-lg font-black font-mono mt-0.5 leading-none">
                              {formatRupee(allSubscriptionsList.reduce((acc, s) => acc + s.sub.cost, 0))}
                            </h3>
                            <span className="text-[10px] text-slate-400 block mt-1">This Month's Forecast Total</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider font-extrabold block text-right">Active Date</span>
                            <span className="text-sm font-black text-amber-400 block font-mono text-right leading-none">June 13</span>
                            <span className="text-[9px] font-mono text-slate-400 text-right block mt-1">2026 Calendar Hub</span>
                          </div>
                        </div>

                        {/* Weekly vs Monthly Layout Switch */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 uppercase font-sans">June 2026 Grid</span>
                          </div>
                          <div className="bg-slate-150 p-0.5 rounded-lg flex border border-slate-200">
                            <button
                              onClick={() => setCalendarViewMode('monthly')}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                                calendarViewMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => setCalendarViewMode('weekly')}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                                calendarViewMode === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                              }`}
                            >
                              Weekly View
                            </button>
                          </div>
                        </div>

                        {/* Calendar Grid Construction */}
                        {(() => {
                          const parsedSubsWithDays = allSubscriptionsList.map(({ sub, memberName, avatarColor }) => {
                            const hash = (sub.cost + sub.name.length * 3 + sub.provider.length) % 28 + 1;
                            return {
                              sub,
                              memberName,
                              avatarColor,
                              billingDay: hash
                            };
                          });

                          // Building June 2026 (Starts Monday, 30 Days)
                          const JuneWeeks: number[][] = [];
                          let currentWeek: number[] = [0]; // Sunday pad

                          for (let d = 1; d <= 30; d++) {
                            currentWeek.push(d);
                            if (currentWeek.length === 7) {
                              JuneWeeks.push(currentWeek);
                              currentWeek = [];
                            }
                          }
                          if (currentWeek.length > 0) {
                            while (currentWeek.length < 7) {
                              currentWeek.push(0);
                            }
                            JuneWeeks.push(currentWeek);
                          }

                          const activeWeeksToRender = calendarViewMode === 'weekly'
                            ? JuneWeeks.filter(week => week.includes(selectedCalendarDay))
                            : JuneWeeks;

                          return (
                            <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-xs mb-5">
                              <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-2 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dl) => (
                                  <span key={dl} className="text-[10px] font-extrabold text-slate-400 font-mono uppercase">{dl}</span>
                                ))}
                              </div>

                              <div className="space-y-1.5">
                                {activeWeeksToRender.map((week, wIdx) => (
                                  <div key={wIdx} className="grid grid-cols-7 gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    {week.map((dayNum, dIdx) => {
                                      if (dayNum === 0) {
                                        return <div key={`empty-${dIdx}`} className="aspect-square bg-slate-50/30 rounded-lg"></div>;
                                      }

                                      const daySubs = parsedSubsWithDays.filter(ps => ps.billingDay === dayNum);
                                      const isSelected = selectedCalendarDay === dayNum;
                                      const isToday = dayNum === 13;

                                      return (
                                        <div
                                          key={`day-${dayNum}`}
                                          onClick={() => setSelectedCalendarDay(dayNum)}
                                          className={`aspect-square p-1 rounded-xl flex flex-col justify-between cursor-pointer transition-all border ${
                                            isSelected
                                              ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-103 z-10'
                                              : isToday
                                              ? 'bg-indigo-50 text-indigo-950 border-indigo-200 ring-2 ring-indigo-50/50'
                                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                          }`}
                                        >
                                          <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-black font-mono ${
                                              isSelected ? 'text-white' : isToday ? 'text-indigo-600 font-black' : 'text-slate-800'
                                            }`}>
                                              {dayNum}
                                            </span>
                                          </div>

                                          <div className="flex gap-0.5 overflow-hidden flex-wrap max-h-3 mt-1 justify-center shrink-0">
                                            {daySubs.map((ds, sIdx) => (
                                              <span
                                                key={sIdx}
                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                  ds.sub.category === 'Music'
                                                    ? 'bg-emerald-500'
                                                    : ds.sub.category === 'OTT'
                                                    ? 'bg-red-500'
                                                    : ds.sub.category === 'Cloud'
                                                    ? 'bg-blue-500'
                                                    : 'bg-slate-450'
                                                }`}
                                                title={ds.sub.name}
                                              ></span>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Inspection for selected day */}
                        {(() => {
                          const parsedSubsWithDays = allSubscriptionsList.map(({ sub, memberName, avatarColor, memberId }) => {
                            const hash = (sub.cost + sub.name.length * 3 + sub.provider.length) % 28 + 1;
                            return { sub, memberName, avatarColor, memberId, billingDay: hash };
                          });

                          const selectedDaySubs = parsedSubsWithDays.filter(ps => ps.billingDay === selectedCalendarDay);

                          return (
                            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-5 text-left animate-in fade-in-50">
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-3 text-xs">
                                <span className="font-extrabold text-slate-800 uppercase tracking-widest font-mono text-[9.5px] text-left">
                                  🔎 Day Inspections: June {selectedCalendarDay}
                                </span>
                                <span className="font-mono text-[9.5px] text-slate-500 font-black uppercase text-right leading-none">
                                  {selectedDaySubs.length} auto-debits schedule
                                </span>
                              </div>

                              {selectedDaySubs.length === 0 ? (
                                <p className="text-[11px] text-slate-450 text-center py-4 italic font-medium leading-none">
                                  No mandates are debited on Day {selectedCalendarDay}.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {selectedDaySubs.map(({ sub, memberName, avatarColor }, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-55/60 p-2.5 rounded-xl border border-slate-150 text-xs">
                                      <div className="flex items-center gap-2.5 min-w-0 text-left">
                                        <div className={`p-1 w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                          sub.category === 'Music' ? 'bg-emerald-50 text-emerald-600' : sub.category === 'Cloud' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                                        }`}>
                                          {sub.category === 'Music' ? <Music className="w-4 h-4" /> : sub.category === 'Cloud' ? <Cloud className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                                        </div>
                                        <div className="truncate text-left">
                                          <span className="font-extrabold text-slate-800 text-[11px] block truncate">{sub.name}</span>
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <span className={`w-3.5 h-3.5 rounded-full ${avatarColor} text-white flex items-center justify-center text-[8px] font-bold font-mono shrink-0`}>
                                              {memberName.charAt(0)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 truncate">Debited: {memberName}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="font-mono font-black text-slate-900 border-l border-slate-205 pl-3 shrink-0 text-right">
                                        {formatRupee(sub.cost)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Upcoming charges tracker */}
                        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm text-left">
                          <div className="pb-2 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-indigo-50 mb-3 flex justify-between items-center">
                            <span>🚀 Upcoming Charges Cycle</span>
                            <span className="p-1 px-2 bg-emerald-50 text-emerald-700 text-[9px] rounded font-bold uppercase shrink-0">Continuous checks</span>
                          </div>

                          <div className="space-y-3.5">
                            {(() => {
                              const parsedSubsWithDays = allSubscriptionsList.map(({ sub, memberName, avatarColor }) => {
                                const hash = (sub.cost + sub.name.length * 3 + sub.provider.length) % 28 + 1;
                                return { sub, memberName, avatarColor, billingDay: hash };
                              });

                              const upcomingList = parsedSubsWithDays
                                .filter(ps => ps.billingDay >= 13)
                                .sort((a, b) => a.billingDay - b.billingDay);

                              if (upcomingList.length === 0) {
                                return <p className="text-xs text-slate-400 py-3 text-center italic">No upcoming cycle debits found.</p>;
                              }

                              return upcomingList.map(({ sub, memberName, billingDay }, index) => (
                                <div key={index} className="flex justify-between items-center text-xs text-left">
                                  <div className="text-left min-w-0">
                                    <span className="text-[9px] font-black font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none uppercase inline-block">
                                      June {billingDay} (in {billingDay - 13} days)
                                    </span>
                                    <span className="font-bold text-slate-800 block mt-1 truncate">{sub.name}</span>
                                    <span className="text-[10px] text-slate-400 truncate">Card Holder: {memberName}</span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-extrabold font-mono text-slate-900 block">{formatRupee(sub.cost)}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">/mo mandate</span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ANALYTICS SUBVIEW PANEL */}
                    {activeDashboardTab === 'analytics' && (
                      <div className="max-w-md mx-auto px-6 py-6 text-left animate-in fade-in" id="tab_analytics_panel">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                              📊 Smart Financial Analytics
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">
                              Realtime Outflow Dynamics
                            </p>
                          </div>
                        </div>

                        {/* Metric Grid of KPI Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-2xl text-left">
                            <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold leading-none mb-1">Current spend</span>
                            <span className="text-base font-black text-slate-800 block">
                              {formatRupee(auditResults.totalSpend)} <span className="text-[9px] font-mono font-medium text-slate-400">/mo</span>
                            </span>
                            <span className="text-[9px] text-slate-450 block mt-1 leading-normal">Live active mandate leak</span>
                          </div>

                          <div className="p-3 bg-white border border-slate-200 shadow-xs rounded-2xl text-left">
                            <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold leading-none mb-1">Last Month</span>
                            <span className="text-base font-black text-slate-600 block">
                              {formatRupee(auditResults.totalSpend + (auditResults.activeRecommendations.filter(r => !r.resolved).reduce((s, r) => s + r.potentialSavings, 0) * 0.4))} <span className="text-[9px] font-mono font-semibold text-slate-400">/mo</span>
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1 leading-normal">Estimations before fixes</span>
                          </div>

                          <div className="p-3 bg-white border border-slate-200 shadow-xs rounded-2xl text-left">
                            <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold leading-none mb-1">Annual projection</span>
                            <span className="text-base font-black text-indigo-700 block">
                              {formatRupee(auditResults.totalSpend * 12)} <span className="text-[9px] font-mono font-semibold text-slate-400">/yr</span>
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1 leading-normal">Cycle Projection</span>
                          </div>

                          <div className="p-3 bg-emerald-50/50 border border-emerald-100/80 shadow-xs rounded-2xl text-left">
                            <span className="text-[9px] uppercase font-mono text-emerald-800 block font-bold leading-none mb-1">Savings unlocked</span>
                            <span className="text-base font-black text-emerald-600 block">
                              {formatRupee(auditResults.activeRecommendations.filter(r => r.resolved).reduce((s, r) => s + r.potentialSavings, 0) * 12)} <span className="text-[9px] font-mono font-semibold text-emerald-500">/yr</span>
                            </span>
                            <span className="text-[9px] text-emerald-600 block font-semibold mt-1 leading-none">Verified reclaimed coins</span>
                          </div>
                        </div>

                        {/* Spending Trend (Recharts AreaChart) */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-5 text-left">
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-extrabold tracking-wider mb-2.5 text-left leading-none">
                            📈 Spend Trend (Past 6 Months)
                          </label>
                          <div className="w-full h-44 text-xs font-mono">
                            {(() => {
                              const baseSpend = allSubscriptionsList.reduce((acc, s) => acc + s.sub.cost, 0);
                              const spendTrendData = [
                                { name: 'Jan', Spend: Math.round(baseSpend * 0.92) },
                                { name: 'Feb', Spend: Math.round(baseSpend * 0.95) },
                                { name: 'Mar', Spend: Math.round(baseSpend * 1.08) },
                                { name: 'Apr', Spend: Math.round(baseSpend * 1.02) },
                                { name: 'May', Spend: Math.round(baseSpend * 0.97) },
                                { name: 'Jun', Spend: Math.round(baseSpend) }
                              ];

                              return (
                                <ResponsiveContainer width="100%" height={170}>
                                  <AreaChart
                                    data={spendTrendData}
                                    margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                                    <YAxis stroke="#94A3B8" fontSize={9} />
                                    <RechartsTooltip formatter={(val: number) => [`₹${val}`, 'Monthly Mandates']} />
                                    <Area type="monotone" dataKey="Spend" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Category breakdown (Recharts Pie Donut Chart) */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-5 text-left">
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-extrabold tracking-wider mb-2 text-left leading-none">
                            🍩 Category Volume Breakdowns
                          </label>

                          {allSubscriptionsList.length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center italic">Add active subscriptions to view category breakdowns.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <div className="h-40 font-mono">
                                {(() => {
                                  const statsRecord: Record<SubscriptionCategory, number> = {
                                    OTT: 0,
                                    Music: 0,
                                    Cloud: 0,
                                    Other: 0
                                  };
                                  allSubscriptionsList.forEach(({ sub }) => {
                                    const cat = sub.category;
                                    statsRecord[cat] = (statsRecord[cat] || 0) + sub.cost;
                                  });
                                  const categoryStats = Object.entries(statsRecord).map(([name, value]) => ({ name, value }));
                                  const CATEGORY_COLORS = {
                                    OTT: '#EF4444',
                                    Music: '#10B981',
                                    Cloud: '#3B82F6',
                                    Other: '#64748B'
                                  };

                                  return (
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={categoryStats}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={45}
                                          outerRadius={65}
                                          paddingAngle={3}
                                          dataKey="value"
                                        >
                                          {categoryStats.map((entry, index) => (
                                            <Cell
                                              key={`cell-${index}`}
                                              fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#64748B'}
                                            />
                                          ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(val: number) => [`₹${val}`, 'Monthly Spend']} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  );
                                })()}
                              </div>

                              <div className="space-y-2 text-xs">
                                {(() => {
                                  const statsRecord: Record<SubscriptionCategory, number> = {
                                    OTT: 0,
                                    Music: 0,
                                    Cloud: 0,
                                    Other: 0
                                  };
                                  allSubscriptionsList.forEach(({ sub }) => {
                                    const cat = sub.category;
                                    statsRecord[cat] = (statsRecord[cat] || 0) + sub.cost;
                                  });
                                  const categoryStats = Object.entries(statsRecord).map(([name, value]) => ({ name, value }));
                                  const CATEGORY_COLORS = {
                                    OTT: '#EF4444',
                                    Music: '#10B981',
                                    Cloud: '#3B82F6',
                                    Other: '#64748B'
                                  };

                                  return categoryStats.map((stat, i) => {
                                    const color = CATEGORY_COLORS[stat.name as keyof typeof CATEGORY_COLORS] || '#64748B';
                                    const totalCost = categoryStats.reduce((s, e) => s + e.value, 0);
                                    const percent = totalCost > 0 ? Math.round((stat.value / totalCost) * 105) : 0;
                                    return (
                                      <div key={i} className="flex items-center justify-between text-left">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color }}></span>
                                          <span className="font-bold text-slate-700 truncate">{stat.name}</span>
                                        </div>
                                        <span className="text-slate-500 font-mono text-[10px] shrink-0 font-bold">{formatRupee(stat.value)} ({percent}%)</span>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Waste reduction visual gauge card */}
                        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm text-left">
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-extrabold tracking-wider mb-3 leading-none text-left">
                            🎯 Savings & Leakage Control Metrics
                          </label>

                          <div className="space-y-4">
                            {(() => {
                              const totalUnlockedSavings = auditResults.activeRecommendations.filter(r => r.resolved).reduce((s, r) => s + r.potentialSavings, 0);
                              const remainingLeakage = auditResults.activeRecommendations.filter(r => !r.resolved).reduce((s, r) => s + r.potentialSavings, 0);
                              const percentResolved = Math.max(0, Math.round((totalUnlockedSavings / (remainingLeakage + totalUnlockedSavings || 1)) * 100));

                              return (
                                <div>
                                  <div className="flex justify-between text-xs mb-1 font-sans text-left">
                                    <span className="font-extrabold text-slate-805">Waste Reduction Ratio:</span>
                                    <span className="font-mono text-emerald-600 font-black">{percentResolved}% Leakage Resolved</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                                    <div
                                      style={{ width: `${percentResolved}%` }}
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    ></div>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed text-left">
                                    You have resolved <strong className="text-slate-700">{formatRupee(totalUnlockedSavings)}</strong> of leaks. Let's resolve the leftover <strong className="text-red-500">{formatRupee(remainingLeakage)}</strong> waste to achieve 100% cost health!
                                  </p>
                                </div>
                              );
                            })()}

                            <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs gap-3">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-mono font-bold text-indigo-700 block text-left">Audit Health Index</span>
                                <span className="text-[11px] font-semibold text-slate-600 leading-relaxed block text-left">
                                  Your budget is performing at safe parameters. Continual UPI checks will guarantee multiple-member overlaps remain de-authorized instantly.
                                </span>
                              </div>
                              <div className="p-2 bg-white rounded-xl border border-indigo-100/50 shrink-0 text-center font-mono shadow-xs">
                                <span className="text-[10px] text-indigo-650 font-bold block leading-none mb-1">Score</span>
                                <span className="text-lg font-black text-indigo-950">
                                  {(() => {
                                    const remainingLeakage = auditResults.activeRecommendations.filter(r => !r.resolved).reduce((s, r) => s + r.potentialSavings, 0);
                                    return Math.round(((auditResults.totalSpend - remainingLeakage) / (auditResults.totalSpend || 1)) * 100);
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NOTIFICATION FEED SCREEN PANEL */}
                    {activeDashboardTab === 'notifications' && (
                      <div className="max-w-md mx-auto px-6 py-6 text-left animate-in fade-in" id="tab_notifications_panel">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                              🔔 Notifications Alerts Center
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">
                              Auto-Debit Mandates Warning Logs
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCustomNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }}
                            className="bg-slate-100 hover:bg-slate-205 transition text-[10px] rounded-lg px-2.5 py-1.5 text-slate-600 font-extrabold border border-slate-200 shrink-0 cursor-pointer"
                          >
                            Mark All Read
                          </button>
                        </div>

                        {/* Mute/Disable Category Control Pills */}
                        <div className="mb-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
                          <label className="text-[9px] uppercase font-mono text-slate-450 font-black tracking-wider block text-left">
                            Mute Category (Silence Alarm Channels):
                          </label>
                          <div className="flex gap-1.5 flex-wrap">
                            {(['OTT', 'Music', 'Cloud', 'Other'] as const).map((cat) => {
                              const isDisabled = disabledNotificationCategories.includes(cat);
                              return (
                                <button
                                  key={cat}
                                  onClick={() => {
                                    if (isDisabled) {
                                      setDisabledNotificationCategories(prev => prev.filter(c => c !== cat));
                                    } else {
                                      setDisabledNotificationCategories(prev => [...prev, cat]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                                    isDisabled
                                      ? 'bg-slate-100 text-slate-400 line-through border-slate-200'
                                      : cat === 'OTT'
                                      ? 'bg-red-50 text-red-700 border-red-150'
                                      : cat === 'Music'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                      : cat === 'Cloud'
                                      ? 'bg-blue-50 text-blue-700 border-blue-150'
                                      : 'bg-slate-100 text-slate-700 border-slate-250'
                                  }`}
                                >
                                  {isDisabled ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3" />}
                                  <span>{cat} alerts {isDisabled ? '(Muted)' : '(Live)'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active Alerts List */}
                        {(() => {
                          const visibleNotifs = customNotifications.filter(n => !disabledNotificationCategories.includes(n.category));

                          if (visibleNotifs.length === 0) {
                            return (
                              <div className="p-8 bg-slate-50 border border-slate-200 text-center rounded-3xl animate-in fade-in-50">
                                <Bell className="w-9 h-9 text-slate-450 mx-auto mb-2 animate-bounce" />
                                <h4 className="font-extrabold text-slate-800 text-xs">Alerthub Feed is Clear</h4>
                                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                                  No active auto-debit notification warnings. Check muting toggles above.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3.5">
                              {visibleNotifs.map((notif) => {
                                const isUnread = !notif.read;
                                return (
                                  <div
                                    key={notif.id}
                                    className={`p-3.5 bg-white rounded-2xl border transition-all ${
                                      isUnread
                                        ? 'border-rose-150 bg-rose-50/10 shadow-sm'
                                        : 'border-slate-200 opacity-60'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2 text-left">
                                      <div className="flex items-start gap-2.5 text-left">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                          notif.read ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                          <Bell className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="font-extrabold text-[11.5px] text-slate-900 flex items-center gap-1.5 flex-wrap text-left leading-snug">
                                            <span>{notif.title}</span>
                                            {isUnread && (
                                              <span className="text-[7px] font-extrabold bg-red-650 text-white px-1 leading-normal rounded uppercase">Fresh</span>
                                            )}
                                            {notif.snoozed && (
                                              <span className="text-[7px] font-extrabold bg-amber-500 text-slate-950 px-1 leading-normal rounded uppercase">Snoozed</span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-slate-650 mt-1 leading-relaxed text-left">
                                            {notif.body}
                                          </p>

                                          <div className="flex gap-2 items-center mt-2 flex-wrap">
                                            <span className="text-[9.5px] font-black font-mono text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                                              INR {formatRupee(notif.amount)}
                                            </span>
                                            <span className="text-[9.5px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                                              Channel: {notif.category}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-[8px] text-slate-400 font-mono shrink-0 leading-none">{notif.timestamp}</span>
                                    </div>

                                    {/* Action row */}
                                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2.5 text-[10px]">
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: !n.read } : n));
                                          }}
                                          className="text-[10px] font-black text-slate-650 bg-slate-10 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-205 transition cursor-pointer"
                                        >
                                          {notif.read ? 'Mark Unread' : 'Done / Ack'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, snoozed: !n.snoozed } : n));
                                            
                                            const pushState = {
                                              id: `snooze_${Date.now()}`,
                                              title: '⏰ Alert Warning Snoozed',
                                              body: `Snoozed alarm warns for ${notif.serviceName} for 24h.`,
                                              type: 'success' as const,
                                              timestamp: 'Just now',
                                              read: false
                                            };
                                            setNotifications(prev => [pushState, ...prev]);
                                          }}
                                          className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                            notif.snoozed
                                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                                              : 'bg-slate-10 hover:bg-slate-205 text-slate-500 border-slate-200'
                                          }`}
                                        >
                                          {notif.snoozed ? 'Unsnooze' : 'Snooze'}
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDisabledNotificationCategories(prev => [...prev, notif.category]);
                                          
                                          const nudgeState = {
                                            id: `disable_cat_${Date.now()}`,
                                            title: `🔇 Alerts Restricted: ${notif.category}`,
                                            body: `Notifications related to category ${notif.category} have been disabled globally.`,
                                            type: 'warning' as const,
                                            timestamp: 'Just now',
                                            read: false
                                          };
                                          setNotifications(prev => [nudgeState, ...prev]);
                                        }}
                                        className="text-[10px] font-black text-red-500 px-2 py-1 hover:bg-red-50 transition rounded-lg cursor-pointer"
                                      >
                                        Disable Category
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* AI SAVINGS ADVISOR SCREEN PANEL (PREMIUM LOCK) */}
                    {activeDashboardTab === 'advisor' && (
                      <div className="max-w-md mx-auto px-6 py-6 text-left animate-in fade-in" id="tab_advisor_panel">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-left">
                            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                              <span>AI Savings Advisor</span>
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">
                              Plain-Language Reclaim Strategy
                            </p>
                          </div>
                          <span className="text-[9.5px] font-mono tracking-wider bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase leading-none">
                            ★ PRO MEMBERSHIP
                          </span>
                        </div>

                        {!isPremium ? (
                          /* PAYWALL FRONTENDS */
                          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 text-center relative overflow-hidden my-4" id="advisor_paywall_card">
                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-24 h-24 bg-amber-400/10 rounded-full blur-xl animate-pulse"></div>
                            <h4 className="font-extrabold text-sm text-amber-400 uppercase tracking-wide mb-2 flex items-center justify-center gap-1 leading-none">
                              <span>🔒 Pro Advisor Access Only</span>
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed max-w-sm mx-auto mb-4">
                              Dynamic semantic grouping, household audio overlap checks, and continuous optimization scripts are restricted to Pro organizers. Skip checks in the sandbox below to try instantly!
                            </p>

                            <button
                              type="button"
                              onClick={() => {
                                setIsPremium(true);
                                const nudgeState = {
                                  id: `premium_sandbox_${Date.now()}`,
                                  title: '✨ Premium Account Provisioned',
                                  body: 'You have upgraded to PRO tier inside the active sandbox. Premium advisors unlocked!',
                                  type: 'success' as const,
                                  timestamp: 'Just now',
                                  read: false
                                };
                                setNotifications(prev => [nudgeState, ...prev]);
                              }}
                              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1"
                              id="advisor_paywall_unlock_btn"
                            >
                              <span>Upgrade to Premium (Free Sandbox Trial)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* UNLOCKED ADVICE CARD PANELS */
                          <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl text-[11px] text-amber-950 leading-relaxed text-left flex gap-3 items-start animate-in zoom-in-95">
                              <span className="text-xl shrink-0 leading-none">💡</span>
                              <div>
                                <strong>Smart Overlap Audits Completed:</strong> Our algorithm parsed double-paying profiles and idle subscriptions. Convert or cancel below to reclaimed family budget coins.
                              </div>
                            </div>

                            {(() => {
                              const recommendationsList: {
                                id: string;
                                advice: string;
                                savings: number;
                                impact: 'High' | 'Medium' | 'Low';
                                details: string;
                                actionLabel: string;
                                resolved: boolean;
                              }[] = [];

                              const spotifyCount = allSubscriptionsList.filter(s => s.sub.provider === 'Spotify').length;
                              const youtubeCount = allSubscriptionsList.filter(s => s.sub.provider === 'YouTube').length;

                              if (spotifyCount >= 2) {
                                recommendationsList.push({
                                  id: 'adv_rec_spotify_family',
                                  advice: "Two Spotify plans — switch to Spotify Family, save ₹59/month",
                                  details: "Both Priya and Rahul pay ₹119/mo separately. Convert to Spotify Premium Family at ₹179/mo. Everyone keeps their playlists, saving ₹59 monthly!",
                                  savings: 59,
                                  impact: 'High',
                                  actionLabel: 'Convert to Family Plan',
                                  resolved: !!resolvedOverrideIds['adv_rec_spotify_family']
                                });
                              }

                              if (youtubeCount > 0 && spotifyCount > 0) {
                                recommendationsList.push({
                                  id: 'adv_rec_drop_spotify_yt',
                                  advice: "You pay for YouTube Premium + Spotify — drop Spotify, save ₹119/month",
                                  details: "YouTube Premium already includes YouTube Music ad-free for Priya! Drop individual Spotify subscriptions entirely to reclaim wasteful double spending.",
                                  savings: 119,
                                  impact: 'Medium',
                                  actionLabel: 'Drop Spotify Plan',
                                  resolved: !!resolvedOverrideIds['adv_rec_drop_spotify_yt']
                                });
                              }

                              const netflixCount = allSubscriptionsList.filter(s => s.sub.provider === 'Netflix').length;
                              if (netflixCount >= 2) {
                                recommendationsList.push({
                                  id: 'adv_rec_netflix_consolidation',
                                  advice: "Multiple Netflix accounts detected — merge to Standard & save ₹199/month",
                                  details: "Amt pays ₹199/mo and Rahul pays ₹149/mo separately. Migrate both to a single Netflix Standard (₹499/mo) which supports multi-display sharing seamlessly.",
                                  savings: 199,
                                  impact: 'High',
                                  actionLabel: 'Merge Netflix Accounts',
                                  resolved: !!resolvedOverrideIds['adv_rec_netflix_consolidation']
                                });
                              }

                              recommendationsList.push({
                                id: 'adv_rec_net_prime_overlap',
                                advice: "You pay for Netflix + Prime but mostly watch Netflix — drop Prime, save ₹125/month",
                                details: "Active TV stats indicate Prime remained idle over 30 days while Netflix logged 94% display usage. Stop automatic Amazon Prime cycle triggers.",
                                savings: 125,
                                impact: 'Medium',
                                actionLabel: 'Void Amazon Prime Mandate',
                                  resolved: !!resolvedOverrideIds['adv_rec_net_prime_overlap']
                              });

                              return recommendationsList.map((rec) => (
                                <div
                                  key={rec.id}
                                  className={`p-4 rounded-3xl border transition-all text-left ${
                                    rec.resolved
                                      ? 'bg-slate-50/50 border-slate-200 opacity-60'
                                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-4 text-left">
                                    <div className="text-left">
                                      <div className="flex items-center gap-2 flex-wrap mb-1.5 font-mono">
                                        <span className={`text-[9.5px] font-black tracking-wider px-2 py-0.5 rounded uppercase leading-none ${
                                          rec.resolved
                                            ? 'bg-slate-205 text-slate-500'
                                            : rec.impact === 'High'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-amber-500 text-white'
                                        }`}>
                                          {rec.resolved ? '✓ Resolved' : `${rec.impact} Impact`}
                                        </span>
                                        <span className="text-[10px] text-emerald-600 font-extrabold font-mono">Savings: {formatRupee(rec.savings)}/mo</span>
                                      </div>

                                      <h4 className="font-extrabold text-slate-800 text-xs text-left mb-1.5 leading-snug">
                                        {rec.advice}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                                        {rec.details}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-400 font-mono uppercase tracking-wider">
                                      Annual savings: {formatRupee(rec.savings * 12)}/yr
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResolvedOverrideIds(prev => ({
                                          ...prev,
                                          [rec.id]: !prev[rec.id]
                                        }));

                                        if (!rec.resolved) {
                                          const pushAlert = {
                                            id: `rec_resolved_${rec.id}`,
                                            title: '🎉 Subscription Leak Optimized',
                                            body: `Reclaimed family budget! Saved ${formatRupee(rec.savings)} monthly through automatic AI conversions.`,
                                            type: 'success' as const,
                                            timestamp: 'Just now',
                                            read: false
                                          };
                                          setNotifications(prev => [pushAlert, ...prev]);
                                        }
                                      }}
                                      className={`font-black px-4 py-2 rounded-xl transition text-[11px] cursor-pointer ${
                                        rec.resolved
                                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-205'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                      }`}
                                    >
                                      {rec.resolved ? 'Revert Fix' : rec.actionLabel}
                                    </button>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                  {familyMembers.length === 0 && (
                  <div className="max-w-md mx-auto px-6 pt-6">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white p-6 rounded-3xl border border-slate-200/90 text-left shadow-lg relative overflow-hidden"
                    >
                      {/* Stepper progress path */}
                      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3.5 shrink-0">
                        <div className="flex gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${onboardingStage === 'create_household' ? 'bg-indigo-650' : 'bg-slate-250'}`}></span>
                          <span className={`w-2.5 h-2.5 rounded-full ${onboardingStage === 'add_members' ? 'bg-indigo-650' : 'bg-slate-250'}`}></span>
                          <span className={`w-2.5 h-2.5 rounded-full ${onboardingStage === 'invite_link' ? 'bg-indigo-650' : 'bg-slate-250'}`}></span>
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                          {onboardingStage === 'create_household' && 'Step 1 of 3: Name'}
                          {onboardingStage === 'add_members' && 'Step 2 of 3: Members'}
                          {onboardingStage === 'invite_link' && 'Step 3 of 3: Shared Net'}
                        </span>
                      </div>

                      {/* STEP 1: CREATE HOUSEHOLD */}
                      {onboardingStage === 'create_household' && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-2xl">🏠</span>
                            <h3 className="font-extrabold text-sm text-slate-905">Name your Household Ledger</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                            Start custom offline tracking of shared auto-debit payments. Enter your family or team ledger designation below:
                          </p>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Ledger Name</label>
                              <input
                                type="text"
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                                placeholder="e.g. Sharma Family Ledger, Flat 104 Co-op"
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-slate-50 font-bold text-slate-900"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => setOnboardingStage('add_members')}
                              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Next: Add Members</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-5.5 pt-4 border-t border-slate-100 text-center">
                            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-2">Or load simulated metrics:</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleDemoModeToggle(true);
                                setOnboardingStage('create_household');
                              }}
                              className="w-full py-2 bg-slate-50 hover:bg-indigo-50 text-indigo-750 font-black text-[11px] border border-indigo-200/50 rounded-xl transition cursor-pointer"
                            >
                              🚀 Instant Demo Mode (Loads Sharma Family)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 2: REGISTER HOUSEHOLD MEMBERS */}
                      {onboardingStage === 'add_members' && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-2xl">👥</span>
                            <h3 className="font-extrabold text-sm text-slate-905">Register Household Members</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                            Log the distinct accounts carrying active auto-debits within your group. At least 1 member is required.
                          </p>

                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Member Name / Alias</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={tempMemberName}
                                  onChange={(e) => setTempMemberName(e.target.value)}
                                  placeholder="e.g. Papa, Neha, Priya"
                                  className="flex-1 p-2 bg-white rounded-lg border border-slate-205 text-xs outline-none focus:border-indigo-500 font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!tempMemberName.trim()) {
                                      alert("Please enter a member name.");
                                      return;
                                    }
                                    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-500', 'bg-purple-600', 'bg-blue-650', 'bg-amber-500'];
                                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                    
                                    const new_m: FamilyMember = {
                                      id: `temp_m_${Date.now()}__${Math.floor(Math.random() * 1000)}`,
                                      name: tempMemberName.trim(),
                                      avatarColor: randomColor,
                                      subscriptions: [],
                                      vpa: `${tempMemberName.trim().toLowerCase().replace(/ /g, '')}@okaxis`
                                    };
                                    
                                    setFamilyMembers(prev => [...prev, new_m]);
                                    setTempMemberName('');
                                    
                                    const nudge = {
                                      id: `m_add_${Date.now()}`,
                                      title: '👤 Member onboarding registered',
                                      body: `Added ${new_m.name} with custom direct e-mandate scanner target.`,
                                      type: 'success' as const,
                                      timestamp: 'Just now',
                                      read: false
                                    };
                                    setNotifications(prev => [nudge, ...prev]);
                                  }}
                                  className="px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition"
                                >
                                  Register
                                </button>
                              </div>
                            </div>

                            {/* Current checklist */}
                            {familyMembers.length > 0 && (
                              <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100 flex flex-col gap-1.5 max-h-32 overflow-y-auto scrollbar-thin text-xs">
                                <span className="text-[10px] uppercase font-mono font-bold text-indigo-950 block mb-1">Members joined so far ({familyMembers.length}):</span>
                                {familyMembers.map((m, i) => (
                                  <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-indigo-100/40">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded-full ${m.avatarColor} text-white flex justify-center items-center text-[9px] font-bold`}>
                                        {m.name.charAt(0)}
                                      </span>
                                      <span className="font-bold text-slate-800">{m.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setFamilyMembers(prev => prev.filter(p => p.id !== m.id))}
                                      className="text-[10px] text-red-500 hover:underline font-bold"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                              <button
                                type="button"
                                onClick={() => setOnboardingStage('create_household')}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl"
                              >
                                Back
                              </button>
                              <button
                                type="button"
                                disabled={familyMembers.length === 0}
                                onClick={() => setOnboardingStage('invite_link')}
                                className={`px-4 py-2 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 ${
                                  familyMembers.length > 0 
                                    ? 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/10 cursor-pointer' 
                                    : 'bg-slate-200 text-slate-450 cursor-not-allowed'
                                }`}
                              >
                                <span>Next: Invite Link</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: DISCOVERY SHARING INVITE LINK */}
                      {onboardingStage === 'invite_link' && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-2xl">📲</span>
                            <h3 className="font-extrabold text-sm text-slate-905">Invite Co-Payers to Join</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                            Simulate dispatching a shared invite key to family members to sync their bank mandates securely to the ledger.
                          </p>

                          <div className="space-y-4">
                            {/* Copy block */}
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono gap-2 text-[11px]">
                              <span className="text-emerald-400 select-all truncate">
                                https://subaudit.in/join/{familyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_sys
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `https://subaudit.in/join/${familyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_sys`;
                                  navigator.clipboard.writeText(text);
                                  setIsLinkCopied(true);
                                  setTimeout(() => setIsLinkCopied(false), 2000);
                                  
                                  const nudge = {
                                    id: `invite_copy_${Date.now()}`,
                                    title: '🔗 Invite link copied',
                                    body: 'Simulated household membership invitation credentials copied to clip buffer.',
                                    type: 'success' as const,
                                    read: false,
                                    timestamp: 'Just now'
                                  };
                                  setNotifications(prev => [nudge, ...prev]);
                                }}
                                className="p-1 px-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded cursor-pointer transition shrink-0"
                              >
                                {isLinkCopied ? 'Copied !' : 'Copy'}
                              </button>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-normal italic text-center">
                              🔑 Copy and send this invite link in your simulated chat. Members can tap to join and register OTT receipts immediately.
                            </p>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                              <button
                                type="button"
                                onClick={() => setOnboardingStage('add_members')}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl"
                              >
                                Back
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Complete onboarding setup
                                  setOnboardingStage('create_household');
                                  setHasRealData(true);
                                  
                                  // Dispatch notification of ledger creation
                                  const triggerNudge = {
                                    id: `ledger_created_${Date.now()}`,
                                    title: '⭐️ Ledger Created Successfully',
                                    body: `The shared household subscription board "${familyName}" has booted successfully into offline memory.`,
                                    type: 'success' as const,
                                    read: false,
                                    timestamp: 'Just now'
                                  };
                                  setNotifications(prev => [triggerNudge, ...prev]);
                                }}
                                className="px-5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow shadow-emerald-600/15 cursor-pointer transition"
                              >
                                Complete Setup & Open Dashboard 🏠
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}

                {/* Reset button controller */}
                <div className="max-w-md mx-auto px-6 pb-24 text-center">
                  <button
                    onClick={resetToDemoData}
                    className="text-xs text-slate-400 hover:text-slate-800 flex items-center justify-center gap-1.5 hover:underline mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Revert simulation to original Sharma Family data</span>
                  </button>
                </div>

              </div>
            </motion.div>
            )}

                {/* ------ MODAL 1: ADD RECIPIENT FAMILY MEMBER ------ */}
                {isAddMemberOpen && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-slate-900"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-extrabold text-base flex items-center gap-1.5 text-slate-900">
                          <UserPlus className="w-5 h-5 text-emerald-600" />
                          <span>Add Family Member</span>
                        </h3>
                        <button
                          onClick={() => setIsAddMemberOpen(false)}
                          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleAddMember}>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Member's First Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Grandma, Rohit, Self"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-sm placeholder:text-slate-400 outline-none focus:border-emerald-500"
                          maxLength={12}
                        />

                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Select Avatar Accent
                        </label>
                        <div className="flex justify-between gap-2.5 mb-6">
                          {[
                            { color: 'bg-indigo-500', name: 'Indigo' },
                            { color: 'bg-pink-500', name: 'Pink' },
                            { color: 'bg-emerald-500', name: 'Emerald' },
                            { color: 'bg-amber-500', name: 'Amber' },
                            { color: 'bg-purple-500', name: 'Purple' },
                            { color: 'bg-rose-500', name: 'Rose' },
                          ].map((av) => (
                            <button
                              key={av.color}
                              type="button"
                              onClick={() => setNewMemberAvatarColor(av.color)}
                              className={`w-8 h-8 rounded-full ${av.color} border-2 ${
                                newMemberAvatarColor === av.color ? 'border-indigo-900 scale-110 shadow-md' : 'border-transparent'
                              } transition-all`}
                              title={av.name}
                            ></button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl"
                        >
                          Add to House Ledger
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL 2: ADD SUBSCRIPTION TO MEMBER ------ */}
                {isAddSubOpen && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 text-slate-900 border border-slate-100 flex flex-col max-h-[90vh]"
                    >
                      {/* Unified Modal Header */}
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 text-left shrink-0">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                            <span>🔌</span> Subscription Registration Hub
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                            Sync household recurring charges
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsAddSubOpen(false);
                            setCsvParsedRecords([]);
                            setCsvSuccessMessage('');
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Unified Hub Tabs */}
                      <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-4 text-xs font-bold shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setAddSubTab('manual')}
                          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                            addSubTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>✍️</span>
                          <span>Manual Entry</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddSubTab('csv')}
                          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                            addSubTab === 'csv' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>📂</span>
                          <span>Statement CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddSubTab('gmail')}
                          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer opacity-70 ${
                            addSubTab === 'gmail' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>📧</span>
                          <span>Gmail Sync</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddSubTab('sms')}
                          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer opacity-70 ${
                            addSubTab === 'sms' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>💬</span>
                          <span>SMS Inbox</span>
                        </button>
                      </div>

                      {/* Tab 1 Content: Manual Entry Form */}
                      {addSubTab === 'manual' && (
                        <div className="flex-1 overflow-y-auto pr-1 text-left scrollbar-thin">
                          <form onSubmit={submitManualSub} className="space-y-4">
                            {/* Auto-Fill Templates */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                                ⚡ Fast Autofill Indian Plans:
                              </label>
                              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full whitespace-nowrap scrollbar-thin">
                                {catalog.map(cat_sub => (
                                  <button
                                    key={cat_sub.name}
                                    type="button"
                                    onClick={() => {
                                      setManualSubName(cat_sub.name);
                                      setManualSubProvider(cat_sub.provider);
                                      setManualSubCost(cat_sub.cost);
                                      setManualSubCategory(cat_sub.category);
                                      setManualSubCycle('monthly');
                                    }}
                                    className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] border border-slate-200 hover:border-emerald-250 rounded-lg transition text-slate-750 font-bold"
                                  >
                                    {cat_sub.name} (₹{cat_sub.cost})
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Service Name */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                Service Name / Title
                              </label>
                              <input
                                type="text"
                                value={manualSubName}
                                onChange={(e) => setManualSubName(e.target.value)}
                                placeholder="e.g. Netflix Standard, Spotify Premium Duo"
                                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-indigo-500 bg-slate-50"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                              {/* Provider Dropdown */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                  Provider Brand
                                </label>
                                <select
                                  value={manualSubProvider}
                                  onChange={(e) => setManualSubProvider(e.target.value as Subscription['provider'])}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-slate-50"
                                >
                                  <option value="Netflix">Netflix</option>
                                  <option value="Spotify">Spotify</option>
                                  <option value="YouTube">YouTube Premium</option>
                                  <option value="Hotstar">Disney+ Hotstar</option>
                                  <option value="Google One">Google One</option>
                                  <option value="Amazon Prime">Amazon Prime</option>
                                  <option value="Apple One">Apple One</option>
                                  <option value="Other">Other / Custom</option>
                                </select>
                              </div>

                              {/* Category Dropdown */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                  Service Category
                                </label>
                                <select
                                  value={manualSubCategory}
                                  onChange={(e) => setManualSubCategory(e.target.value as SubscriptionCategory)}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-slate-50"
                                >
                                  <option value="OTT">OTT / Video streaming</option>
                                  <option value="Music">Music player</option>
                                  <option value="Cloud">Cloud Storage</option>
                                  <option value="Other">Other Services</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                              {/* Price Cost */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                  Billing Amount (₹)
                                </label>
                                <input
                                  type="number"
                                  value={manualSubCost}
                                  onChange={(e) => setManualSubCost(Number(e.target.value))}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-slate-50 font-mono"
                                />
                              </div>

                              {/* Cycle */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                  Billing Frequency
                                </label>
                                <select
                                  value={manualSubCycle}
                                  onChange={(e) => setManualSubCycle(e.target.value as 'monthly' | 'annual')}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-slate-50"
                                >
                                  <option value="monthly">Monthly Recurring</option>
                                  <option value="annual">Annual Recurring</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                              {/* Charged Owner */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                  Charged To (Who Pays?)
                                </label>
                                <select
                                  value={manualSubOwner}
                                  onChange={(e) => setManualSubOwner(e.target.value)}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-slate-50"
                                >
                                  <option value="">-- Choose Family Member --</option>
                                  {familyMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                {familyMembers.length === 0 && (
                                  <span className="text-[9px] text-amber-600 block mt-1 leading-tight">
                                    ⚠️ Create at least one family member in ledger onboarding first!
                                  </span>
                                )}
                              </div>

                              {/* Usage Activity */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                                  Usage Level
                                </label>
                                <select
                                  value={manualSubUsage}
                                  onChange={(e) => setManualSubUsage(e.target.value as Subscription['usageFreq'])}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-slate-50"
                                >
                                  <option value="frequently">Active (UsedFrequently)</option>
                                  <option value="rarely">Rare / Low usage warning</option>
                                  <option value="never">Unused / Forgotten Leakage</option>
                                </select>
                              </div>
                            </div>

                            {/* Unused direct toggle checkbox */}
                            <div className="flex items-center gap-2.5 p-3.5 bg-red-55 border border-red-100 rounded-xl">
                              <input
                                type="checkbox"
                                id="manualSubForgottenChb"
                                checked={manualSubForgotten}
                                onChange={(e) => setManualSubForgotten(e.target.checked)}
                                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                              />
                              <label htmlFor="manualSubForgottenChb" className="text-xs text-slate-700 leading-none select-none cursor-pointer">
                                <strong>Flag as a Forgotten Ghost Leak</strong> (triggers redundancy scan warnings)
                              </label>
                            </div>

                            {/* Submit */}
                            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setIsAddSubOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={familyMembers.length === 0}
                                className={`px-5 py-2 text-white text-xs font-extrabold rounded-xl transition ${
                                  familyMembers.length > 0 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-650/20' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Add Subscription to Ledger 🚀
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Tab 2 Content: Statement CSV Import */}
                      {addSubTab === 'csv' && (
                        <div className="flex-1 overflow-y-auto pr-1 text-left scrollbar-thin">
                          {csvSuccessMessage ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100">
                              <div className="w-12 h-12 bg-emerald-100/50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-200 animate-pulse">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                              </div>
                              <h4 className="font-extrabold text-slate-900 text-xs leading-normal">{csvSuccessMessage}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                                Dynamic scans updated the ledger. Scorecards are compiling double-spending overlaps!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4 text-xs text-slate-700">
                              <div className="p-3 bg-indigo-50/50 border border-indigo-100/40 rounded-xl space-y-2">
                                <div className="font-bold text-slate-900 flex justify-between items-center">
                                  <span>📁 Demo Auto-debit Statement scan</span>
                                  {/* Download Sample Button */}
                                  <button
                                    type="button"
                                    onClick={handleDownloadSampleCsv}
                                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] uppercase font-bold rounded flex items-center gap-1 cursor-pointer"
                                    title="Download working raw CSV example"
                                  >
                                    📥 Sample CSV
                                  </button>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-500">
                                  Download the sample CSV using the link above, or select one of our prepackaged mock billing statements to load transactions securely:
                                </p>
                              </div>

                              {/* Templates Grid */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const t1 = `Date,Merchant,Amount,Type\n10/06/2026,SPOTIFY-PREMIUM-INDIVIDUAL,119.00,DEBIT\n12/06/2026,NETFLIX-MUMBAI-OFFICE,199.00,DEBIT`;
                                    handleCsvContentParse(t1, 'HDFC_Card_Statement_India.csv');
                                  }}
                                  className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left rounded-xl transition text-slate-900 cursor-pointer"
                                >
                                  <span className="font-bold block text-[10px] text-indigo-950">💳 HDFC Credit Card</span>
                                  <p className="text-[9px] text-slate-500 mt-0.5">Detects active Spotify (₹119) & Netflix (₹199).</p>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const t2 = `Date,UPI-VPA-Ref,Amount,Type\n05/06/2026,UPI-PAY-HOTSTAR-MANDATE,149.00,DEBIT\n08/06/2026,UPI-GCLOUD-ONE-DRIVE,130.00,DEBIT`;
                                    handleCsvContentParse(t2, 'ICICI_Bank_UPI_Mandates.csv');
                                  }}
                                  className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left rounded-xl transition text-slate-900 cursor-pointer"
                                >
                                  <span className="font-bold block text-[10px] text-indigo-950">📱 ICICI Savings UPI</span>
                                  <p className="text-[9px] text-slate-500 mt-0.5">Detects forgotten Hotstar (₹149/mo) auto-receipt.</p>
                                </button>
                              </div>

                              {/* RAW CSV Text area */}
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                                    Statement Raw CSV Input
                                  </label>
                                  {csvFileName && (
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono border border-indigo-100">
                                      📂 {csvFileName}
                                    </span>
                                  )}
                                </div>
                                <textarea
                                  rows={3}
                                  value={csvContentText}
                                  onChange={(e) => handleCsvContentParse(e.target.value, 'Custom_Edit.csv')}
                                  placeholder="Date,Merchant,Amount,Type&#10;12/06/2026,NETFLIX,149.00,DEBIT&#10;10/06/2026,SPOTIFY,119.00,DEBIT"
                                  className="w-full p-2.5 bg-slate-950 font-mono text-[10px] text-emerald-400 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 h-20"
                                />
                              </div>

                              <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                  Load Subscriptions Into:
                                </label>
                                <select
                                  value={csvTargetMemberId}
                                  onChange={(e) => setCsvTargetMemberId(e.target.value)}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-slate-50 text-slate-900"
                                >
                                  {familyMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                {familyMembers.length === 0 && (
                                  <span className="text-[9px] text-amber-600 block leading-tight">
                                    ⚠️ Create at least one family member in ledger onboarding first!
                                  </span>
                                )}
                              </div>

                              {/* Live parsed results checklists */}
                              {csvParsedRecords.length > 0 && (
                                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900">
                                  <div className="font-bold text-[10px] font-mono tracking-wider uppercase text-slate-500 mb-2">
                                    Detected Recurrent Auto-Debits ({csvParsedRecords.length}):
                                  </div>
                                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                    {csvParsedRecords.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => {
                                              setCsvParsedRecords(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
                                            }}
                                            className="w-4 h-4 text-indigo-650 rounded"
                                          />
                                          <div className="text-left leading-tight">
                                            <span className="font-semibold block text-[11px] text-slate-950">{item.name}</span>
                                            <span className="text-[9px] text-slate-400 block">Simulated billing cycle • 1 e-mandate</span>
                                          </div>
                                        </div>
                                        <div className="text-right font-mono font-bold text-slate-900">
                                          {formatRupee(item.cost)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setIsAddSubOpen(false)}
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleImportCsvToMember}
                                  disabled={csvParsedRecords.length === 0 || familyMembers.length === 0}
                                  className={`px-5 py-2 text-white font-extrabold rounded-xl transition ${
                                    csvParsedRecords.length > 0 && familyMembers.length > 0
                                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-600/20' 
                                      : 'bg-slate-200 text-slate-405 cursor-not-allowed'
                                  }`}
                                >
                                  Import Selected Mandates
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3 Content: Gmail receipt syncing */}
                      {addSubTab === 'gmail' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                          <div className="p-4 bg-indigo-55 rounded-3xl text-indigo-700 border border-indigo-100 mb-4 h-16 w-16 flex items-center justify-center text-2xl">
                            📧
                          </div>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase font-mono rounded-full tracking-wider">
                            Syncing Locked / Coming Soon
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-3">Gmail In-Inbox Receipt Auto-Importer</h4>
                          <p className="text-[11px] text-slate-400 mt-2 max-w-sm leading-relaxed">
                            Connect Gmail Inbox securely via encrypted Google Workspace OAuth scopes. Automatically scans incoming billing receipts and auto-debut renewal emails from OTT publishers in real time.
                          </p>
                          <button
                            disabled
                            className="mt-5 w-full py-2.5 bg-slate-150 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed border border-slate-200"
                          >
                            Integration Locked
                          </button>
                        </div>
                      )}

                      {/* Tab 4 Content: SMS Auto-detection */}
                      {addSubTab === 'sms' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                          <div className="p-4 bg-purple-55 rounded-3xl text-purple-700 border border-purple-100 mb-4 h-16 w-16 flex items-center justify-center text-2xl">
                            💬
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-805 text-[9px] font-extrabold uppercase font-mono rounded-full tracking-wider">
                            Syncing Locked / Coming Soon
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-3">Smartphone SMS Mandate Scanner</h4>
                          <p className="text-[11px] text-slate-400 mt-2 max-w-sm leading-relaxed">
                            Sync through our mobile companion utility. Automatically records active UPI e-mandates issued via GPay, PhonePe, and PayTM the exact second they are created in your bank ledger.
                          </p>
                          <button
                            disabled
                            className="mt-5 w-full py-2.5 bg-slate-150 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed border border-slate-200"
                          >
                            Integration Locked
                          </button>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono uppercase tracking-wider shrink-0">
                        SUPPORTING IN-MEMORY ENCRYPTED LEDGERS ONLY
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL: ACTIONABLE "FIX THIS" CANCELLATION GUIDANCE ADVISOR ------ */}
                {activeGuidanceSub && (() => {
                  const { memberId, sub, recommendationId } = activeGuidanceSub;
                  const targetMember = familyMembers.find(m => m.id === memberId);
                  const memberName = targetMember ? targetMember.name : 'Household Member';
                  const details = getProviderCancellationDetails(sub.provider, sub.name, sub.cost);
                  const annualSavings = sub.cost * 12;

                  return (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 text-slate-900 border border-slate-150 flex flex-col max-h-[90vh]"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-rose-50 text-left shrink-0">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500 border border-rose-100">
                              <ShieldAlert className="w-5 h-5 text-rose-650 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5 leading-tight">
                                Cancellation Advisor: {details.providerBrand}
                              </h3>
                              <p className="text-[10px] text-rose-655 uppercase tracking-widest font-mono font-bold">
                                Action Required • Plug Auto-Debit Leakage
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveGuidanceSub(null)}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto space-y-4 text-left text-xs pr-1 scrollbar-thin">
                          {/* Top Card Summary */}
                          <div className="p-4 bg-gradient-to-br from-rose-50/50 to-orange-50/20 border border-red-100 rounded-2xl">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono block">Active Renewal</span>
                                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{sub.name}</span>
                                <span className="text-xs text-slate-500 font-medium block mt-0.5">Recurring through {memberName}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono block">Leakage Impact</span>
                                <span className="text-base font-black text-rose-600 block mt-0.5">{formatRupee(sub.cost)} /mo</span>
                                <span className="text-[10px] text-slate-500 font-semibold font-mono block mt-0.5">
                                  ₹{annualSavings.toLocaleString('en-IN')}/year wasteful
                                </span>
                              </div>
                            </div>

                            <div className="mt-3.5 pt-3 border-t border-red-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Recommended Action:</span>
                                <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">
                                  Stop active silent UPI mandate to instantly save <strong className="text-rose-600 font-extrabold">{formatRupee(sub.cost)}</strong> monthly.
                                </span>
                              </div>
                              <a
                                href={details.manageLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm shadow-rose-500/20"
                              >
                                <span>Manage subscription</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* Step-by-Step Instructions */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Step-by-Step Provider Instructions:
                            </label>
                            <ol className="space-y-2">
                              {details.instructions.map((step, index) => (
                                <li key={index} className="flex gap-2.5 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="text-slate-700 leading-relaxed text-[11px]">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Important Consent / Confirmation */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mt-2 flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="cancellationConsentCheckbox"
                              checked={isGuidanceConfirmed}
                              onChange={(e) => setIsGuidanceConfirmed(e.target.checked)}
                              className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 mt-0.5 cursor-pointer shrink-0"
                            />
                            <label htmlFor="cancellationConsentCheckbox" className="text-[11px] text-slate-650 leading-relaxed font-medium select-none cursor-pointer">
                              🔔 <strong>I confirm that I have logged in, followed the cancellation steps</strong>, and requested to cancel this plan or voided the automatic payment e-mandate.
                            </label>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end shrink-0 mt-4">
                          <button
                            type="button"
                            onClick={() => setActiveGuidanceSub(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Keep Plan
                          </button>
                          <button
                            type="button"
                            onClick={handleGuidanceDone}
                            disabled={!isGuidanceConfirmed}
                            className={`px-5 py-2 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1 ${
                              isGuidanceConfirmed 
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/10 cursor-pointer' 
                                : 'bg-slate-200 text-slate-405 cursor-not-allowed'
                            }`}
                          >
                            <span>Done, Plug Leak !</span>
                            <span>🔒</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  );
                })()}

                {/* ------ MODAL 3: FREEMIUM PAYWALL MODAL ------ */}
                {isPaywallOpen && (
                  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-slate-900 border border-amber-100 flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                          <span className="font-extrabold text-base tracking-tight text-slate-900">Unlock Premium features</span>
                        </div>
                        <button
                          onClick={() => setIsPaywallOpen(false)}
                          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-center mb-5 bg-gradient-to-tr from-amber-500/10 to-indigo-500/10 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black font-mono tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase">
                          PREVIEWING MODEL
                        </span>
                        <h4 className="text-slate-800 font-extrabold text-xs mt-1.5 leading-snug">
                          Activate auto bill-splitting and customized UPI deep links for your family.
                        </h4>
                      </div>

                      {/* Benefits checked list */}
                      <div className="space-y-2.5 mb-6 text-xs text-slate-605 text-left">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Custom member UPI deep links (No payment delay)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Prefilled WhatsApp reminders with split details</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Flexible math splits for up to 12 members</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>24/7 Silent auto-debit triggers alerts</span>
                        </div>
                      </div>

                      {/* Configurable Plans selection */}
                      <div className="space-y-2.5 mb-6">
                        <button
                          type="button"
                          onClick={() => setPaywallPlanSelected('recurring_mo')}
                          className={`w-full p-3.5 rounded-2xl border transition text-left flex justify-between items-center cursor-pointer ${
                            paywallPlanSelected === 'recurring_mo'
                              ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              paywallPlanSelected === 'recurring_mo' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                            }`}>
                              {paywallPlanSelected === 'recurring_mo' && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-xs">Premium Monthly Plan</div>
                              <div className="text-[10px] text-slate-400 font-mono">₹49/month recurring split calculations</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 font-mono text-xs">{formatRupee(pricingConfig.premiumMonthlyPrice)}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">/ mo</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaywallPlanSelected('forever_one')}
                          className={`w-full p-3.5 rounded-2xl border transition text-left flex justify-between items-center relative overflow-hidden cursor-pointer ${
                            paywallPlanSelected === 'forever_one'
                              ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="absolute top-0 right-0 bg-amber-500 text-[8px] text-slate-950 font-mono uppercase font-black tracking-widest px-2.5 py-0.5 rounded-bl">
                            BEST VALUE
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              paywallPlanSelected === 'forever_one' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                            }`}>
                              {paywallPlanSelected === 'forever_one' && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                <span>Premium Lifetime Plan</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">₹199 one-time. Unlock forever!</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 font-mono text-xs">{formatRupee(pricingConfig.premiumForeverPrice)}</span>
                            <span className="text-[9px] text-amber-600 font-bold block bg-amber-50 px-1 rounded font-mono">once</span>
                          </div>
                        </button>
                      </div>

                      {/* CTA Confirmation btn */}
                      <button
                        onClick={() => {
                          const paymentIntentId = `pi_upg_${Math.floor(Math.random() * 90000) + 10000}`;
                          const title = paywallPlanSelected === 'recurring_mo'
                            ? 'Premium Monthly Subscription'
                            : 'Premium Lifetime Plan (Unlock Forever)';
                          const feeAmt = paywallPlanSelected === 'recurring_mo'
                            ? pricingConfig.premiumMonthlyPrice
                            : pricingConfig.premiumForeverPrice;

                          const newReceipt = {
                            id: `rec_upg_${Math.floor(Math.random() * 900000) + 100000}`,
                            recommendationId: 'premium_upgrade',
                            recommendationTitle: title,
                            annualSavings: 0,
                            fee: feeAmt,
                            paymentIntentId,
                            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                            status: 'PAID (Demo Sandbox)'
                          };

                          setSuccessFeePayments(prev => [newReceipt, ...prev]);
                          setLastPaymentReceipt(newReceipt);
                          setIsPremium(true);
                          setIsPaywallOpen(false);
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        id="paywall_confirm_upgrade_btn"
                      >
                        Confirm Upgrade Now ({formatRupee(paywallPlanSelected === 'recurring_mo' ? pricingConfig.premiumMonthlyPrice : pricingConfig.premiumForeverPrice)})
                      </button>
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL 4: SUCCESS FEE AUTHORIZATION DIALOG ------ */}
                {successFeeModalData && (
                  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-slate-900 border border-slate-100 flex flex-col text-left"
                    >
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-105">
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <Receipt className="w-4 h-4 text-indigo-600" />
                          <span className="font-extrabold text-sm tracking-tight text-slate-900">One-Time Success Fee Invoice</span>
                        </div>
                        <button
                          onClick={() => setSuccessFeeModalData(null)}
                          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <span className="text-[8px] font-black font-mono tracking-widest bg-emerald-105 text-emerald-800 px-2 py-0.5 rounded">
                          AUDITED ACTION VERIFICATION
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-800 mt-2">
                          {successFeeModalData.recommendation.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {successFeeModalData.recommendation.recommendation}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mb-5 font-sans text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Monthly Saving Realised:</span>
                          <span className="font-bold text-slate-800 font-mono">{formatRupee(successFeeModalData.recommendation.potentialSavings)}/mo</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Projected Annual Savings:</span>
                          <span className="font-extrabold text-emerald-600 font-mono">{formatRupee(successFeeModalData.annualSavings)}/yr</span>
                        </div>
                        <div className="border-t border-slate-205 my-2 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                          <span className="flex items-center gap-1">
                            Success Fee ({pricingConfig.successFeePercent}%)
                          </span>
                          <span className="font-extrabold text-slate-950 font-mono">{formatRupee(successFeeModalData.fee)}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 mb-5 leading-relaxed">
                        Under our shared performance-guarantee fee structure, we only levy a {pricingConfig.successFeePercent}% one-time fee on verified savings. If you revert this action, the savings model adjusts back.
                      </p>

                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const recId = successFeeModalData.recommendation.id;
                            // Perform data states modification and save transaction log
                            performResolutionStateChange(recId, false);
                            
                            const paymentIntentId = `pi_demo_${Math.floor(Math.random() * 90000) + 10000}`;
                            const newReceipt = {
                              id: `rec_${Math.floor(Math.random() * 900000) + 100000}`,
                              recommendationId: recId,
                              recommendationTitle: successFeeModalData.recommendation.title,
                              annualSavings: successFeeModalData.annualSavings,
                              fee: successFeeModalData.fee,
                              paymentIntentId,
                              timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                              status: 'PAID (Demo Sandbox)'
                            };

                            setSuccessFeePayments(prev => [newReceipt, ...prev]);
                            setSuccessFeeModalData(null);
                            setLastPaymentReceipt(newReceipt);
                          }}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                          id="confirm_success_fee_btn"
                        >
                          Authorize Plan Fix & Pay Fee ({formatRupee(successFeeModalData.fee)})
                        </button>

                        <button
                          onClick={() => setSuccessFeeModalData(null)}
                          className="w-full py-2.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-55 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                        >
                          Cancel Action
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL 5: SUCCESS FEE RECEIPT DIALOG ------ */}
                {lastPaymentReceipt && (
                  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-slate-900 border border-slate-100 flex flex-col text-left font-sans"
                    >
                      <div className="text-center pb-5 border-b border-dashed border-slate-200">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <Check className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="font-extrabold text-sm tracking-tight text-slate-900">TRANSACTION SUCCESSFUL</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {lastPaymentReceipt.paymentIntentId}</p>
                      </div>

                      <div className="py-5 space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Receipt Ref:</span>
                          <span className="font-mono text-slate-800 font-bold">{lastPaymentReceipt.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            {lastPaymentReceipt.recommendationId === 'premium_upgrade' ? 'Service/Tier Purchased:' : 'Action Applied:'}
                          </span>
                          <span className="font-bold text-slate-800 text-right max-w-[180px] break-words">{lastPaymentReceipt.recommendationTitle}</span>
                        </div>
                        {lastPaymentReceipt.recommendationId !== 'premium_upgrade' && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Projected Savings:</span>
                            <span className="font-mono text-emerald-600 font-extrabold">{formatRupee(lastPaymentReceipt.annualSavings)}/yr</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            {lastPaymentReceipt.recommendationId === 'premium_upgrade' ? 'Upgrade Price Charged:' : 'One-Time Fee Paid:'}
                          </span>
                          <span className="font-mono text-slate-950 font-extrabold text-sm">{formatRupee(lastPaymentReceipt.fee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Completed:</span>
                          <span className="font-mono text-slate-800">{lastPaymentReceipt.timestamp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reference:</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded font-bold font-mono">
                            {lastPaymentReceipt.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-5 text-[10px] text-slate-500 leading-normal text-center">
                        {lastPaymentReceipt.recommendationId === 'premium_upgrade'
                          ? '🔒 SubSplit premium subscription registered in demonstration sandbox. No real bank accounts have been debited.'
                          : '🔒 Success fee split processed in demonstration sandbox. No real bank accounts have been debited.'}
                      </div>

                      <button
                        onClick={() => setLastPaymentReceipt(null)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        id="close_receipt_receipt_btn"
                      >
                        Got it, thank you!
                      </button>
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL 6: SCREENSHOT-READY PITCH SUMMARY CARD ------ */}
                {isImpactOpen && (
                  <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-white relative font-sans"
                    >
                      {/* Ambient corner highlights */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl"></div>

                      <div className="flex justify-between items-center mb-6 relative z-10 text-left">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Award className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                              SubAudit Impact Report
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono tracking-wider">PITCH SLIDE COMPANION CARD</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsImpactOpen(false)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-full text-slate-400 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Header Title Badge */}
                      <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6 relative z-10 text-center">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                          Household Registry: {familyName}
                        </span>
                        <div className="text-xl font-extrabold text-slate-100 mt-1">
                          Leakage Solved: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">₹{totalRealizedSavingsMonthly}/mo</span>
                        </div>
                      </div>

                      {/* Dynamic Metrics */}
                      <div className="grid grid-cols-3 gap-2.5 mb-6 relative z-10 text-center">
                        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                          <span className="text-[9px] text-slate-400 block font-mono uppercase">Monthly Saved</span>
                          <span className="text-sm font-black text-white font-mono">₹{totalRealizedSavingsMonthly}</span>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                          <span className="text-[9px] text-slate-400 block font-mono uppercase">Annualized Saved</span>
                          <span className="text-sm font-black text-emerald-400 font-mono">₹{totalRealizedSavingsAnnual}</span>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                          <span className="text-[9px] text-slate-400 block font-mono uppercase">Reduction %</span>
                          <span className="text-sm font-black text-purple-400 font-mono">
                            {percentageSaved}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="bg-slate-950/20 border border-slate-800/60 rounded-2xl p-4 mb-6 relative z-10 text-left">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                          Budget Progress Bar (Consolidated vs leaks)
                        </h4>
                        
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>BEFORE AUDIT (leak active)</span>
                              <span className="font-bold text-red-400">₹{originalSpend}/mo</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-red-500 to-red-400 h-full" style={{ width: '100%' }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>AFTER AUDIT (zero waste status)</span>
                              <span className="font-bold text-emerald-400">₹{currentTotalSpend}/mo</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-300" style={{ width: `${originalSpend > 0 ? (currentTotalSpend / originalSpend) * 100 : 0}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consolidations list */}
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono text-left">Resolved Leakage Actions</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2 mb-6 pr-1 relative z-10 scrollbar-thin text-left">
                        {resolvedRecommendations.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                            <p className="text-[11px] text-slate-400 leading-normal">
                              No leaks closed in this session yet. Scroll down to Quick Wins and click the <strong className="text-white">"Fix This"</strong> buttons on the duplicate Spotify or Netflix plans to see the budget live metrics adjust!
                            </p>
                          </div>
                        ) : (
                          resolvedRecommendations.map(rec => (
                            <div key={rec.id} className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                                <span className="text-slate-300 font-medium truncate">{rec.title}</span>
                              </div>
                              <span className="font-bold font-mono text-emerald-400 shrink-0 ml-2">+₹{rec.potentialSavings}/mo</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 text-xs relative z-10">
                        <button
                          onClick={() => {
                            const markdownPitch = `
### SubAudit Pitch & Impact Report
- **Family / Group**: ${familyName}
- **Consolidation Status**: ${resolvedRecommendations.length} service overlaps consolidated
- **Monthly Budget Savings Realized**: ₹${totalRealizedSavingsMonthly}/mo
- **Annualized Reclaimed Wealth**: ₹${totalRealizedSavingsMonthly * 12}/year
- **Household Overhead Reduction**: ${percentageSaved}% billing reduction!

*Generated dynamically from SubAudit's Live Hackathon Sandbox.*
                            `.trim();
                            navigator.clipboard.writeText(markdownPitch);
                            alert("📋 Pitch statistics copied to clipboard as clean markdown presentation bullet points! Perfect for your slidedeck notes.");
                          }}
                          className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 hover:text-white text-slate-350 border border-slate-750 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Slide Info</span>
                        </button>
                        <button
                          onClick={() => setIsImpactOpen(false)}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow text-center cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL 7: BANK STATEMENT CSV IMPORTER ------ */}
                {isCsvModalOpen && (
                  <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 text-slate-900 border border-indigo-100 relative max-h-[90vh] flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 text-left">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                              Connected Accounts: Statement Importer
                            </h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                              Simulating UPI & Credit Card mandate scanning
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsCsvModalOpen(false);
                            setCsvParsedRecords([]);
                            setCsvSuccessMessage('');
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {csvSuccessMessage ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-emerald-50/20 rounded-2xl p-6 border border-emerald-100/50 my-2">
                          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100 animate-pulse">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                          </div>
                          <h4 className="font-extrabold text-slate-950 text-sm leading-normal">{csvSuccessMessage}</h4>
                          <p className="text-xs text-slate-500 mt-2 max-w-sm">
                            The dynamic auditing core has compiled the imported mandates. Check the household dashboard scorecard for computed double-spending overlaps!
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Under <strong>RBI e-mandate regulations</strong>, active auto-debits under <strong>₹5,000</strong> mandate automatically without individual OTP consents. paste billing logs or load an interactive CSV statement template:
                          </p>

                          {/* Quick template pickers */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const t1 = `Date,Merchant,Amount,Type\n10/06/2026,SPOTIFY-PREMIUM-INDIVIDUAL,119.00,DEBIT\n12/06/2026,NETFLIX-MUMBAI-OFFICE,199.00,DEBIT`;
                                handleCsvContentParse(t1, 'HDFC_Card_Statement_India.csv');
                              }}
                              className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-205 hover:border-indigo-300 text-left rounded-xl transition cursor-pointer"
                            >
                              <div className="font-bold text-[11px] text-indigo-950 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                                💳 HDFC Credit Card Template
                              </div>
                              <p className="text-[9px] text-slate-500 mt-1">Contains active Spotify (₹119/mo) and Netflix (₹199/mo) logs.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const t2 = `Date,UPI-VPA-Ref,Amount,Type\n05/06/2026,UPI-PAY-HOTSTAR-MANDATE,149.00,DEBIT\n08/06/2026,UPI-GCLOUD-ONE-DRIVE,130.00,DEBIT`;
                                handleCsvContentParse(t2, 'ICICI_Bank_UPI_Mandates.csv');
                              }}
                              className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-205 hover:border-indigo-300 text-left rounded-xl transition cursor-pointer"
                            >
                              <div className="font-bold text-[11px] text-indigo-950 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                                📱 ICICI Savings UPI Template
                              </div>
                              <p className="text-[9px] text-slate-500 mt-1">Contains forgotten Hotstar (₹149/mo) ghost auto-debit loops.</p>
                            </button>
                          </div>

                          {/* Text input for custom CSV */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                                Statement Raw CSV Editor
                              </label>
                              {csvFileName && (
                                <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                                  📂 {csvFileName}
                                </span>
                              )}
                            </div>
                            <textarea
                              rows={3}
                              value={csvContentText}
                              onChange={(e) => handleCsvContentParse(e.target.value, 'Custom_Edit.csv')}
                              placeholder="Date,Merchant,Amount,Type&#10;12/06/2026,NETFLIX,149.00,DEBIT&#10;10/06/2026,SPOTIFY,119.00,DEBIT"
                              className="w-full p-2.5 bg-slate-950 font-mono text-[10px] text-emerald-400 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 h-20"
                            />
                          </div>

                          {/* Target Member Selector */}
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">
                                Inject Subscriptions Into Member:
                              </label>
                              <p className="text-[10px] text-slate-400 mt-0.5">Select family bucket to load these records</p>
                            </div>
                            <select
                              value={csvTargetMemberId}
                              onChange={(e) => setCsvTargetMemberId(e.target.value)}
                              className="p-2 rounded-lg bg-white border border-slate-300 text-xs font-bold font-sans outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              {familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Merged parsed items table */}
                          {csvParsedRecords.length > 0 && (
                            <div className="border border-slate-205 rounded-xl overflow-hidden">
                              <div className="bg-slate-100 px-3 py-2 text-[10px] font-mono font-bold text-slate-550 border-b border-slate-200 uppercase tracking-wider">
                                Parsed Mandate debits ({csvParsedRecords.length})
                              </div>
                              <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto font-sans">
                                {csvParsedRecords.map((item, idx) => (
                                  <div key={item.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={item.selected}
                                        onChange={() => {
                                          setCsvParsedRecords(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
                                        }}
                                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                      />
                                      <div className="truncate text-left font-sans">
                                        <div className="font-bold text-slate-800 truncate">{item.name}</div>
                                        <div className="text-[10px] text-slate-450 font-mono mt-0.5">{item.dateOfDebit} • {item.provider}</div>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-bold text-slate-900 font-mono font-sans">₹{item.cost}/mo</span>
                                      {item.isMandate && (
                                        <span className="text-[8px] bg-red-100 text-red-700 font-extrabold px-1 block rounded ml-auto mt-0.5 uppercase tracking-wider font-mono">E-MANDATE</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      {!csvSuccessMessage && (
                        <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end text-xs shrink-0 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCsvModalOpen(false);
                              setCsvParsedRecords([]);
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleImportCsvToMember}
                            disabled={csvParsedRecords.length === 0}
                            className={`px-5 py-2 text-white font-extrabold rounded-xl transition cursor-pointer ${
                              csvParsedRecords.length > 0 
                                ? 'bg-indigo-600 hover:bg-indigo-705 shadow shadow-indigo-600/30 font-sans' 
                                : 'bg-slate-300 cursor-not-allowed text-slate-400'
                            }`}
                          >
                            Import Selected Mandates
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}

                {/* ------ MODAL 8: ADMIN INDIA PRICE INDEX CATALOG CONFIGURATOR ------ */}
                {isAdminOpen && (
                  <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 text-slate-900 border border-purple-100 relative max-h-[90vh] flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 text-left">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 text-purple-705 rounded-xl">
                            <Database className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                              India Plan Pricing Catalog Admin
                            </h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                              Edit local subscription price index guides (code-free)
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAdminOpen(false)}
                          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
                        <p className="text-xs text-slate-500 leading-relaxed font-mono bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/55">
                          🔧 <strong>Dynamic Catalog Mode:</strong> Changing plan prices here updates the catalog instantly. Any custom plan you create is immediately available to select in the "Add Subscription" menu!
                        </p>

                        {/* Existing Catalog List */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <div className="bg-slate-100 px-3 py-2 text-[10px] font-mono font-bold text-slate-550 border-b border-slate-200 uppercase tracking-wider">
                            Active Catalog subscription prices
                          </div>
                          <div className="divide-y divide-slate-150 max-h-48 overflow-y-auto">
                            {catalog.map((item, idx) => (
                              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <div className="text-left min-w-0 pr-2">
                                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                                    {item.provider} • {item.category}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  {/* Price Input field */}
                                  <div className="flex items-center">
                                    <span className="text-slate-500 font-bold mr-0.5 font-mono">₹</span>
                                    <input
                                      type="number"
                                      value={item.cost}
                                      onChange={(e) => handleUpdatePriceInCatalog(idx, parseInt(e.target.value) || 0)}
                                      className="w-16 p-1 text-center bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-950 focus:border-purple-550 outline-none"
                                    />
                                    <span className="text-[9px] text-slate-400 font-mono ml-1">/mo</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCatalogPlan(idx)}
                                    className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition cursor-pointer"
                                    title="Delete plan"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Create custom subscription pricing plan form */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-3 font-sans">
                            ✨ Add dynamic plan to Index
                          </h4>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Plan Name</label>
                              <input
                                type="text"
                                value={adminNewPlanName}
                                onChange={(e) => setAdminNewPlanName(e.target.value)}
                                placeholder="e.g. JioCinema Premium"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-sans outline-none focus:border-purple-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Plan Cost /mo</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  value={adminNewPlanCost}
                                  onChange={(e) => setAdminNewPlanCost(parseInt(e.target.value) || 0)}
                                  className="w-full p-2 pl-6 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Provider</label>
                              <select
                                value={adminNewPlanProvider}
                                onChange={(e) => setAdminNewPlanProvider(e.target.value as any)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500 font-sans cursor-pointer"
                              >
                                <option value="Netflix">Netflix</option>
                                <option value="Spotify">Spotify</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Google One">Google One</option>
                                <option value="Hotstar">Hotstar</option>
                                <option value="Other">Other (Jio Cinema/Prime)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Category</label>
                              <select
                                value={adminNewPlanCategory}
                                onChange={(e) => setAdminNewPlanCategory(e.target.value as any)}
                                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500 font-sans cursor-pointer"
                              >
                                <option value="OTT">OTT/Video Streaming</option>
                                <option value="Music">Music Streaming</option>
                                <option value="Cloud">Cloud Storage</option>
                                <option value="Other">Other category</option>
                              </select>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Plan Description</label>
                            <input
                              type="text"
                              value={adminNewPlanDesc}
                              onChange={(e) => setAdminNewPlanDesc(e.target.value)}
                              placeholder="e.g. 1 device, 1080p, Ad-free premium OTT content"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500 font-sans"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddNewCatalogPlanSubmit}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                          >
                            Inject new plan into India Catalog Price Index
                          </button>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsAdminOpen(false)}
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition text-center cursor-pointer font-sans"
                        >
                          Dismiss Admin Portal
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ------ PUSH/EMAIL NUDGES NOTIFICATION SLIDEDOWN WIDGET ------ */}
                {showNotifications && (
                  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 p-4 flex justify-center items-start pt-16">
                    <motion.div
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-red-100 text-slate-900"
                    >
                      <div className="bg-slate-950 text-white px-5 py-3.5 flex justify-between items-center text-left">
                        <div className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-red-400 animate-bounce" />
                          <div>
                            <span className="font-extrabold text-sm tracking-tight block">Smart Household Alerts Feed</span>
                            <span className="text-[9px] text-slate-400 font-mono tracking-wider">REALTIME MULTI-STAKEHOLDER PROTOCOL</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-slate-50 text-left">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-450 font-mono text-xs animate-pulse">
                            No alerts currently waiting for review. All clean!
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isWarning = notif.type === 'warning' || notif.type === 'alert';
                            return (
                              <div
                                key={notif.id}
                                className={`p-3 rounded-2xl border transition-all ${
                                  notif.read 
                                    ? 'bg-white border-slate-100 opacity-65' 
                                    : isWarning 
                                      ? 'bg-red-50/50 border-red-105 text-slate-900 shadow-sm animate-pulse'
                                      : 'bg-emerald-50/20 border-emerald-100'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isWarning ? 'bg-red-100 text-red-650' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {isWarning ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 animate-pulse" />}
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                                        <span>{notif.title}</span>
                                        {!notif.read && (
                                          <span className="text-[7px] font-extrabold bg-red-600 text-white px-1 leading-normal rounded uppercase font-mono">NEW</span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-655 mt-1 leading-normal">
                                        {notif.body}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-mono italic shrink-0 whitespace-nowrap">{notif.timestamp}</span>
                                </div>

                                {/* Custom actions on nudge */}
                                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-end gap-1.5 text-[10px]">
                                  {!notif.read && notif.hasAction && (
                                    <button
                                      type="button"
                                      onClick={() => handleActionOnNudge(notif.id, notif.actionType)}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg transition-transform cursor-pointer hover:scale-[1.01] shadow-sm"
                                    >
                                      Terminate Ghost Auto-Debit
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleActionOnNudge(notif.id)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg transition cursor-pointer"
                                  >
                                    {notif.read ? 'Done' : 'Acknowledge (Mark Read)'}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="p-3 bg-white border-t border-slate-100 text-center flex justify-between items-center text-[10px]">
                        <button
                          type="button"
                          onClick={() => setNotifications([])}
                          className="text-slate-400 hover:text-red-500 font-bold transition cursor-pointer font-sans"
                        >
                          Clear All Alerts
                        </button>
                        <span className="text-slate-400 font-mono tracking-wide">
                          RBI CONSENT PROTOCOL V1.1
                        </span>
                      </div>
                    </motion.div>
                  </div>
                )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
