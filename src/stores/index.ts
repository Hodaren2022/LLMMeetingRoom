import { useMeetingRoomStore } from './enhancedMeetingRoomStore';
import { useDebateHistoryStore, useNotificationStore } from './additionalStores';

// 重新導出所有 stores
export { useMeetingRoomStore, useDebateHistoryStore, useNotificationStore };

// 導出原始的 store（向後兼容）
export { useMeetingRoomStore as useMeetingRoomStoreOriginal } from './meetingRoomStore';

// Store 組合 hooks
export const useStores = () => ({
  meetingRoom: useMeetingRoomStore(),
  debateHistory: useDebateHistoryStore(),
  notification: useNotificationStore(),
});

// 選擇器 hooks
export const useMeetingRoomSelectors = () => {
  const store = useMeetingRoomStore();
  
  return {
    // 基本選擇器
    currentRoom: store.currentRoom,
    rooms: store.rooms,
    availablePersonas: store.availablePersonas,
    debateStatus: store.debateStatus,
    isLoading: store.isLoading,
    error: store.error,
    
    // 計算選擇器
    activePersonas: store.availablePersonas.filter(p => p.isActive),
    inactivePersonas: store.availablePersonas.filter(p => !p.isActive),
    currentStatements: store.currentRoom?.statements || [],
    latestStatement: store.currentRoom?.statements[store.currentRoom.statements.length - 1],
    consensusData: store.currentRoom?.consensus,
    isDebateActive: ['preparing', 'searching', 'debating'].includes(store.debateStatus),
    canStartDebate: store.availablePersonas.filter(p => p.isActive).length >= 2 && store.currentRoom !== null,
    
    // 統計選擇器
    totalRooms: store.rooms.length,
    totalPersonas: store.availablePersonas.length,
    activePersonaCount: store.availablePersonas.filter(p => p.isActive).length,
    completedRooms: store.rooms.filter(r => r.status === 'completed').length,
  };
};

export const useDebateHistorySelectors = () => {
  const store = useDebateHistoryStore();
  
  return {
    // 基本選擇器
    debateHistory: store.debateHistory,
    analytics: store.analytics,
    
    // 計算選擇器
    recentDebates: store.debateHistory.slice(0, 10),
    totalDebates: store.analytics.totalDebates,
    averageRounds: store.analytics.averageRounds,
    consensusRate: store.analytics.consensusRate,
    
    // 功能選擇器
    getDebatesByTopic: store.getDebatesByTopic,
    getDebatesByPersona: store.getDebatesByPersona,
  };
};

export const useNotificationSelectors = () => {
  const store = useNotificationStore();
  
  return {
    // 基本選擇器
    notifications: store.notifications,
    unreadCount: store.getUnreadCount(),
    
    // 計算選擇器
    recentNotifications: store.notifications.slice(0, 5),
    unreadNotifications: store.notifications.filter(n => !n.read),
    errorNotifications: store.notifications.filter(n => n.type === 'error'),
    
    // 功能選擇器
    hasUnread: store.getUnreadCount() > 0,
    hasErrors: store.notifications.some(n => n.type === 'error' && !n.read),
  };
};

// 組合 actions
export const useActions = () => {
  const meetingRoom = useMeetingRoomStore();
  const debateHistory = useDebateHistoryStore();
  const notification = useNotificationStore();
  
  return {
    // 會議室 actions
    createRoom: meetingRoom.createRoom,
    selectRoom: meetingRoom.selectRoom,
    updateRoom: meetingRoom.updateRoom,
    deleteRoom: meetingRoom.deleteRoom,
    
    // 替身 actions
    addPersona: meetingRoom.addPersona,
    updatePersona: meetingRoom.updatePersona,
    deletePersona: meetingRoom.deletePersona,
    togglePersonaActive: meetingRoom.togglePersonaActive,
    duplicatePersona: meetingRoom.duplicatePersona,
    
    // 辯論 actions
    startDebate: meetingRoom.startDebate,
    pauseDebate: meetingRoom.pauseDebate,
    resumeDebate: meetingRoom.resumeDebate,
    stopDebate: meetingRoom.stopDebate,
    resetDebate: meetingRoom.resetDebate,
    
    // 發言 actions
    addStatement: meetingRoom.addStatement,
    updateStatement: meetingRoom.updateStatement,
    deleteStatement: meetingRoom.deleteStatement,
    
    // 歷史 actions
    addDebateRecord: debateHistory.addDebateRecord,
    clearHistory: debateHistory.clearHistory,
    exportHistory: debateHistory.exportHistory,
    importHistory: debateHistory.importHistory,
    
    // 通知 actions
    addNotification: notification.addNotification,
    markAsRead: notification.markAsRead,
    removeNotification: notification.removeNotification,
    clearAllNotifications: notification.clearAll,
    
    // 狀態 actions
    setLoading: meetingRoom.setLoading,
    setError: meetingRoom.setError,
    setDebateStatus: meetingRoom.setDebateStatus,
    setCurrentSpeaker: meetingRoom.setCurrentSpeaker,
    
    // 偏好 actions
    updateUserPreferences: meetingRoom.updateUserPreferences,
    enableAutoSave: meetingRoom.enableAutoSave,
    disableAutoSave: meetingRoom.disableAutoSave,
    
    // 重置 actions
    reset: meetingRoom.reset,
    resetAll: meetingRoom.resetAll,
  };
};

// 便利 hooks
export const useCurrentRoom = () => {
  return useMeetingRoomStore((state) => state.currentRoom);
};

export const useActivePersonas = () => {
  return useMeetingRoomStore((state) => state.availablePersonas.filter(p => p.isActive));
};

export const useDebateStatus = () => {
  return useMeetingRoomStore((state) => state.debateStatus);
};

export const useIsLoading = () => {
  return useMeetingRoomStore((state) => state.isLoading);
};

export const useError = () => {
  return useMeetingRoomStore((state) => state.error);
};

export const useUnreadNotifications = () => {
  return useNotificationStore((state) => state.notifications.filter(n => !n.read));
};

const storeExports = {
  useMeetingRoomStore,
  useDebateHistoryStore,
  useNotificationStore,
  useStores,
  useMeetingRoomSelectors,
  useDebateHistorySelectors,
  useNotificationSelectors,
  useActions,
  useCurrentRoom,
  useActivePersonas,
  useDebateStatus,
  useIsLoading,
  useError,
  useUnreadNotifications,
};

export default storeExports;