// Store related types

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

export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export interface PersistedRoomState {
  rooms?: Record<string, unknown>[];
  availablePersonas?: Record<string, unknown>[];
  userPreferences?: Record<string, unknown>;
  [key: string]: unknown;
}