import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 辯論記錄接口
 */
export interface DebateRecord {
  id: string;
  roomId: string;
  roomName: string;
  topic: string;
  participants: string[];
  startTime: number;
  endTime?: number;
  totalRounds: number;
  finalConsensus?: {
    supportRate: number;
    opposeRate: number;
    consensusReached: boolean;
  };
  keyInsights: string[];
}

/**
 * 通知接口
 */
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  autoHide?: boolean;
  duration?: number;
}

/**
 * 辯論歷史和分析存儲
 */
interface DebateHistoryState {
  // 歷史記錄
  debateHistory: DebateRecord[];
  
  // 分析數據
  analytics: {
    totalDebates: number;
    averageRounds: number;
    consensusRate: number;
    mostActivePersonas: Array<{ personaId: string; participationCount: number }>;
    topTopics: Array<{ topic: string; debateCount: number }>;
  };
  
  // Actions
  addDebateRecord: (record: DebateRecord) => void;
  getDebatesByTopic: (topic: string) => DebateRecord[];
  getDebatesByPersona: (personaId: string) => DebateRecord[];
  getAnalytics: () => Record<string, unknown>;
  clearHistory: () => void;
  exportHistory: () => string;
  importHistory: (data: string) => boolean;
}

export const useDebateHistoryStore = create<DebateHistoryState>()(
  devtools(
    (set, get) => ({
      debateHistory: [],
      analytics: {
        totalDebates: 0,
        averageRounds: 0,
        consensusRate: 0,
        mostActivePersonas: [],
        topTopics: []
      },
      
      addDebateRecord: (record: DebateRecord) => {
        set((state) => {
          const newHistory = [...state.debateHistory, record];
          return {
            debateHistory: newHistory,
            analytics: calculateAnalytics(newHistory)
          };
        });
      },
      
      getDebatesByTopic: (topic: string) => {
        return get().debateHistory.filter(debate => 
          debate.topic.toLowerCase().includes(topic.toLowerCase())
        );
      },
      
      getDebatesByPersona: (personaId: string) => {
        return get().debateHistory.filter(debate => 
          debate.participants.includes(personaId)
        );
      },
      
      getAnalytics: () => {
        return get().analytics;
      },
      
      clearHistory: () => {
        set({
          debateHistory: [],
          analytics: {
            totalDebates: 0,
            averageRounds: 0,
            consensusRate: 0,
            mostActivePersonas: [],
            topTopics: []
          }
        });
      },
      
      exportHistory: () => {
        const data = {
          debateHistory: get().debateHistory,
          exportTime: Date.now(),
          version: '1.0'
        };
        return JSON.stringify(data, null, 2);
      },
      
      importHistory: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.debateHistory && Array.isArray(parsed.debateHistory)) {
            const analytics = calculateAnalytics(parsed.debateHistory);
            set({
              debateHistory: parsed.debateHistory,
              analytics
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }
    }),
    {
      name: 'debate-history-store'
    }
  )
);

/**
 * 計算分析數據
 */
function calculateAnalytics(history: DebateRecord[]) {
  const totalDebates = history.length;
  
  if (totalDebates === 0) {
    return {
      totalDebates: 0,
      averageRounds: 0,
      consensusRate: 0,
      mostActivePersonas: [],
      topTopics: []
    };
  }
  
  const totalRounds = history.reduce((sum, debate) => sum + debate.totalRounds, 0);
  const averageRounds = totalRounds / totalDebates;
  
  const consensusCount = history.filter(debate => 
    debate.finalConsensus?.consensusReached
  ).length;
  const consensusRate = consensusCount / totalDebates;
  
  // 統計最活躍的替身
  const personaStats: Record<string, number> = {};
  history.forEach(debate => {    debate.participants.forEach(personaId => {
      personaStats[personaId] = (personaStats[personaId] || 0) + 1;
    });
  });
  
  const mostActivePersonas = Object.entries(personaStats)
    .map(([personaId, count]) => ({ personaId, participationCount: count }))
    .sort((a, b) => b.participationCount - a.participationCount)
    .slice(0, 5);
  
  // 統計熱門話題
  const topicStats: Record<string, number> = {};
  history.forEach(debate => {
    topicStats[debate.topic] = (topicStats[debate.topic] || 0) + 1;
  });
  
  const topTopics = Object.entries(topicStats)
    .map(([topic, count]) => ({ topic, debateCount: count }))
    .sort((a, b) => b.debateCount - a.debateCount)
    .slice(0, 10);
  
  return {
    totalDebates,
    averageRounds,
    consensusRate,
    mostActivePersonas,
    topTopics
  };
}

/**
 * 通知系統存儲
 */
interface NotificationState {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications]
        }));
        
        // 自動隱藏通知
        if (notification.autoHide !== false) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, duration);
        }
      },
      
      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id 
              ? { ...notification, read: true }
              : notification
          )
        }));
      },
      
      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(notification => 
            notification.id !== id
          )
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter(notification => !notification.read).length;
      }
    }),
    {
      name: 'notification-store'
    }
  )
);

/**
 * 用戶偏好設定存儲
 */
interface UserPreferencesState {
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-TW' | 'zh-CN' | 'en';
    autoSave: boolean;
    notificationSettings: {
      debateStart: boolean;
      debateEnd: boolean;
      consensusReached: boolean;
      newStatement: boolean;
    };
    displaySettings: {
      showTimestamps: boolean;
      showSourceLinks: boolean;
      compactMode: boolean;
    };
  };
  
  // Actions
  updatePreference: <K extends keyof UserPreferencesState['preferences']>(
    key: K, 
    value: UserPreferencesState['preferences'][K]
  ) => void;
  resetToDefaults: () => void;
}

const defaultPreferences: UserPreferencesState['preferences'] = {
  theme: 'auto',
  language: 'zh-TW',
  autoSave: true,
  notificationSettings: {
    debateStart: true,
    debateEnd: true,
    consensusReached: true,
    newStatement: false
  },
  displaySettings: {
    showTimestamps: true,
    showSourceLinks: true,
    compactMode: false
  }
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  devtools(
    (set) => ({
      preferences: defaultPreferences,
      
      updatePreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value
          }
        }));
      },
      
      resetToDefaults: () => {
        set({ preferences: defaultPreferences });
      }
    }),
    {
      name: 'user-preferences-store'
    }
  )
);