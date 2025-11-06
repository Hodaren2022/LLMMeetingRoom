// Core Types for Virtual Meeting Room System

export interface Persona {
  id: string;
  name: string;
  role: string;               // 角色
  identity?: string;          // 核心身份
  primeDirective?: string;    // 最高目標
  toneStyle?: string;         // 辯論風格
  defaultBias?: string;       // 預設傾向
  ragFocus: string[];         // 搜尋重點
  temperature: number;        // 創造性參數 (0.1-1.0)
  systemPrompt: string;       // 系統提示詞
  avatar?: string;            // 頭像 URL
  color?: string;             // 主題顏色
  isActive?: boolean;         // 是否參與當前辯論
}

export interface Statement {
  id: string;
  personaId: string;
  personaName: string;        // 發言者姓名
  content: string;
  timestamp: number;
  round: number;
  tendencyScore: number;      // 傾向度分數 (1-10)
  sources?: SourceReference[];
  references: SourceReference[]; // 引用資料
  tags: string[];             // 標籤
  reasoning?: {
    analyze: string;          // 解析階段
    critique: string;         // 批判階段
    strategy: string;         // 策略階段
  };
}

export interface SourceReference {
  url: string;
  title: string;
  snippet: string;
  relevanceScore?: number;
}

export interface SearchResult {
  query: string;
  results: SourceReference[];
  timestamp: number;
  personaFocus: string[];
}

export interface ConsensusData {
  supportRate: number;        // 支持度 (0-1)
  opposeRate: number;         // 反對度 (0-1)
  consensusReached: boolean;  // 是否達成共識
  threshold: number;          // 共識門檻 (預設 0.7)
  finalScores: Record<string, number>; // 各替身最終分數
  confidence?: number;        // 信心水準 (0-1)
  recommendation?: string;    // 建議
  nextSteps?: string[];       // 下一步行動
}

export interface MeetingRoom {
  id: string;
  name: string;
  topic: string;
  createdAt: number;
  updatedAt: number;
  status: DebateStatus;
  participants: Persona[];
  moderator?: Persona;          // 主持人
  statements: Statement[];
  searchResults: SearchResult[];
  consensus?: ConsensusData;
  settings: MeetingSettings;
  isTopicGenerated?: boolean;   // 主題是否由AI生成
}

export interface MeetingSettings {
  maxRounds: number;          // 最大回合數 (3-10)
  consensusThreshold: number; // 共識門檻 (0.5-0.9)
  timeoutPerRound: number;    // 每回合超時時間 (秒)
  allowUserIntervention: boolean; // 允許用戶干預
  autoSaveInterval: number;   // 自動保存間隔 (秒)
}

export type DebateStatus = 
  | 'idle'          // 閒置
  | 'preparing'     // 準備中
  | 'searching'     // 搜尋資料
  | 'debating'      // 辯論中
  | 'voting'        // 投票階段
  | 'completed'     // 已完成
  | 'paused'        // 暫停
  | 'error';        // 錯誤

export interface DebateContext {
  topic: string;
  currentRound: number;
  maxRounds: number;
  previousStatements: Statement[];
  searchResults: SearchResult[];
  activePersonas: Persona[];
  currentSpeaker?: string;
}

export interface GeminiResponse {
  content: string;
  tendencyScore: number;
  reasoning?: {
    analyze: string;
    critique: string;
    strategy: string;
  };
  sources?: SourceReference[];
  searchQueries?: string[];
  error?: string;
}

export interface StorageData {
  personas: Persona[];
  meetingRooms: MeetingRoom[];
  userPreferences: UserPreferences;
  version: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-TW' | 'zh-CN' | 'en';
  autoSave: boolean;
  notificationsEnabled: boolean;
  defaultMeetingSettings: MeetingSettings;
}