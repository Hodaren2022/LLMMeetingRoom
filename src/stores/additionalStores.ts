import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 辯論歷史和分析存儲
 */
interface DebateHistoryState {
  // 歷史記錄
  debateHistory: Array<{
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
  }>;
  
  // 分析數據
  analytics: {
    totalDebates: number;
    averageRounds: number;
    consensusRate: number;
    mostActivePersonas: Array<{ personaId: string; participationCount: number }>;
    topTopics: Array<{ topic: string; debateCount: number }>;
  };
  
  // Actions
  addDebateRecord: (record: any) => void;
  getDebatesByTopic: (topic: string) => any[];
  getDebatesByPersona: (personaId: string) => any[];
  getAnalytics: () => any;
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
        topTopics: [],
      },
      
      addDebateRecord: (record) => {
        set((state) => {
          const newHistory = [...state.debateHistory, record];
          const analytics = calculateAnalytics(newHistory);
          
          return {
            debateHistory: newHistory,
            analytics,
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
      
      getAnalytics: () => get().analytics,
      
      clearHistory: () => {
        set({
          debateHistory: [],
          analytics: {
            totalDebates: 0,
            averageRounds: 0,
            consensusRate: 0,
            mostActivePersonas: [],
            topTopics: [],
          },
        });
      },
      
      exportHistory: () => {
        const data = {
          debateHistory: get().debateHistory,
          exportTime: Date.now(),
          version: '1.0',
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
              analytics,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    { name: 'debate-history-store' }
  )
);

/**
 * 計算分析數據
 */
function calculateAnalytics(history: any[]) {
  const totalDebates = history.length;
  
  if (totalDebates === 0) {
    return {
      totalDebates: 0,
      averageRounds: 0,
      consensusRate: 0,
      mostActivePersonas: [],
      topTopics: [],
    };
  }
  
  const averageRounds = history.reduce((sum, debate) => sum + debate.totalRounds, 0) / totalDebates;
  
  const consensusCount = history.filter(debate => debate.finalConsensus?.consensusReached).length;
  const consensusRate = consensusCount / totalDebates;
  
  // 統計最活躍的替身
  const personaParticipation: Record<string, number> = {};
  history.forEach(debate => {
    debate.participants.forEach((personaId: string) => {
      personaParticipation[personaId] = (personaParticipation[personaId] || 0) + 1;
    });
  });
  
  const mostActivePersonas = Object.entries(personaParticipation)
    .map(([personaId, count]) => ({ personaId, participationCount: count }))
    .sort((a, b) => b.participationCount - a.participationCount)
    .slice(0, 5);
  
  // 統計熱門議題
  const topicCount: Record<string, number> = {};
  history.forEach(debate => {
    const topic = debate.topic;
    topicCount[topic] = (topicCount[topic] || 0) + 1;
  });
  
  const topTopics = Object.entries(topicCount)
    .map(([topic, count]) => ({ topic, debateCount: count }))
    .sort((a, b) => b.debateCount - a.debateCount)
    .slice(0, 10);
  
  return {
    totalDebates,
    averageRounds,
    consensusRate,
    mostActivePersonas,
    topTopics,
  };
}

/**
 * 通知系統存儲
 */
interface NotificationState {
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    autoClose?: boolean;
    duration?: number;
  }>;
  
  // Actions
  addNotification: (notification: any) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = {
          id,
          timestamp: Date.now(),
          read: false,
          autoClose: true,
          duration: 5000,
          ...notification,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
        
        // 自動關閉通知
        if (newNotification.autoClose) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
      },
      
      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
        }));
      },
      
      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(notification => notification.id !== id),
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter(notification => !notification.read).length;
      },
    }),
    { name: 'notification-store' }
  )
);

export default { useDebateHistoryStore, useNotificationStore };