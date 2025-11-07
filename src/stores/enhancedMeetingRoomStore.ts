import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { MeetingRoom, Persona, Statement, DebateStatus, ConsensusData, SearchResult, UserPreferences } from '@/types';
import { PersonaEngine } from '@/services/personaEngine';
import { calculateConsensus, generateId, extractTopicFromContent } from '@/utils';

interface MeetingRoomState {
  // 當前會議室狀態
  currentRoom: MeetingRoom | null;
  
  // 所有會議室
  rooms: MeetingRoom[];
  
  // 可用替身
  availablePersonas: Persona[];
  
  // 辯論狀態
  debateStatus: DebateStatus;
  currentRound: number;
  currentSpeaker: string | null;
  
  // 控制狀態
  isLoading: boolean;
  error: string | null;
  
  // 用戶偏好設定
  userPreferences: UserPreferences;
  
  // Actions
  createRoom: (name: string, topic?: string) => string;
  selectRoom: (roomId: string) => void;
  updateRoom: (roomId: string, updates: Partial<MeetingRoom>) => void;
  deleteRoom: (roomId: string) => void;
  
  // 替身管理
  addPersona: (persona: Omit<Persona, 'id'>) => void;
  updatePersona: (personaId: string, updates: Partial<Persona>) => void;
  deletePersona: (personaId: string) => void;
  togglePersonaActive: (personaId: string) => void;
  duplicatePersona: (personaId: string) => void;
  resetPersonasToDefault: () => void;
  
  // 辯論控制
  startDebate: () => void;
  pauseDebate: () => void;
  resumeDebate: () => void;
  stopDebate: () => void;
  nextRound: () => void;
  resetDebate: () => void;
  generateTopicFromStatement: (statement: string) => Promise<void>;
  
  // 發言管理
  addStatement: (statement: Omit<Statement, 'id' | 'timestamp'>) => void;
  updateStatement: (statementId: string, updates: Partial<Statement>) => void;
  deleteStatement: (statementId: string) => void;
  updateConsensus: (consensus: ConsensusData) => void;
  addSearchResults: (results: SearchResult) => void;
  
  // 狀態管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDebateStatus: (status: DebateStatus) => void;
  setCurrentSpeaker: (speakerId: string | null) => void;
  
  // 用戶偏好
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // 自動保存
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  
  // 重置
  reset: () => void;
  resetAll: () => void;
}

const defaultPersonas: Persona[] = [
  {
    id: 'ceo-001',
    name: 'CEO',
    role: '執行長',
    identity: '公司執行長，擁有 15 年企業管理經驗',
    primeDirective: '追求公司整體利益最大化，平衡各方利益相關者需求',
    toneStyle: '權威、決斷、具有遠見，習慣從戰略高度分析問題',
    defaultBias: '傾向於支持能帶來長期價值的創新方案',
    ragFocus: ['企業戰略', '市場趨勢', '競爭分析', '投資回報'],
    temperature: 0.7,
    systemPrompt: '你是一位經驗豐富的執行長，專注於商業價值和長期發展。',
    color: '#1f2937',
    isActive: false,
  },
  {
    id: 'cto-001',
    name: 'CTO',
    role: '技術長',
    identity: '技術長，專精於技術架構和創新',
    primeDirective: '推動技術創新，確保技術方案的可行性和先進性',
    toneStyle: '理性、技術導向、注重實現細節和技術風險',
    defaultBias: '支持技術先進且可擴展的解決方案',
    ragFocus: ['技術趨勢', '架構設計', '開發成本', '技術風險'],
    temperature: 0.6,
    systemPrompt: '你是一位技術專家，專注於技術創新和系統穩定性。',
    color: '#059669',
    isActive: false,
  },
  {
    id: 'cfo-001',
    name: 'CFO',
    role: '財務長',
    identity: '財務長，擁有 20 年金融和風險管理經驗',
    primeDirective: '保護股東價值，最大化投資回報率並嚴格控制預算',
    toneStyle: '謹慎、數據驅動、習慣引用財務數據和成本效益分析',
    defaultBias: '對高資本支出持懷疑態度，要求明確的財務模型',
    ragFocus: ['財務報告', '成本分析', '投資回報', '風險評估'],
    temperature: 0.4,
    systemPrompt: '你是一位財務專家，專注於成本控制和投資回報。',
    color: '#dc2626',
    isActive: false,
  },
  {
    id: 'env-001',
    name: '環保倡議者',
    role: '環境保護專家',
    identity: '環境保護專家，致力於可持續發展',
    primeDirective: '推動環境友善的解決方案，確保企業責任',
    toneStyle: '熱情、理想主義、引用環境數據和可持續發展研究',
    defaultBias: '強烈支持綠色環保的方案',
    ragFocus: ['環境影響', '可持續發展', '綠色技術', '環保法規'],
    temperature: 0.8,
    systemPrompt: '你是一位環保專家，專注於可持續發展和環境保護。',
    color: '#16a34a',
    isActive: false,
  },
  {
    id: 'legal-001',
    name: '法律顧問',
    role: '法律顧問',
    identity: '資深律師，專精企業法務和合規',
    primeDirective: '確保所有決策符合法律規範，降低法律風險',
    toneStyle: '嚴謹、保守、引用法律條文和判例',
    defaultBias: '傾向於選擇法律風險較低的方案',
    ragFocus: ['法律法規', '合規要求', '判例分析', '風險評估'],
    temperature: 0.3,
    systemPrompt: '你是一位法律專家，專注於合規和風險控制。',
    color: '#7c3aed',
    isActive: false,
  },
  {
    id: 'market-001',
    name: '市場分析師',
    role: '市場分析師',
    identity: '市場研究專家，專精消費者行為分析',
    primeDirective: '深入了解市場需求，預測消費者反應',
    toneStyle: '分析性、數據導向、引用市場調研和消費者數據',
    defaultBias: '支持符合市場需求和消費者期待的方案',
    ragFocus: ['市場調研', '消費者行為', '競爭分析', '趨勢預測'],
    temperature: 0.6,
    systemPrompt: '你是一位市場分析專家，專注於市場趨勢和消費者行為。',
    color: '#ea580c',
    isActive: false,
  },
];

const defaultUserPreferences: UserPreferences = {
  theme: 'auto',
  language: 'zh-TW',
  autoSave: true,
  notificationsEnabled: true,
  defaultMeetingSettings: {
    maxRounds: 5,
    consensusThreshold: 0.7,
    timeoutPerRound: 300,
    allowUserIntervention: true,
    autoSaveInterval: 30,
  },
};

let autoSaveInterval: NodeJS.Timeout | null = null;

export const useMeetingRoomStore = create<MeetingRoomState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 初始狀態
        currentRoom: null,
        rooms: [],
        availablePersonas: defaultPersonas,
        debateStatus: 'idle',
        currentRound: 0,
        currentSpeaker: null,
        isLoading: false,
        error: null,
        userPreferences: defaultUserPreferences,

        // 會議室管理
        createRoom: (name: string, topic?: string) => {
          const roomId = generateId();
          const newRoom: MeetingRoom = {
            id: roomId,
            name,
            topic: topic || '', // 允許空主題，將在第一個發言後自動生成
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'idle',
            participants: [],
            statements: [],
            searchResults: [],
            settings: { ...get().userPreferences.defaultMeetingSettings },
            isTopicGenerated: false, // 初始為 false，當 AI 生成主題時設為 true
          };
          
          set((currentState) => ({
            rooms: [...currentState.rooms, newRoom],
            currentRoom: newRoom,
          }));
          
          return roomId;
        },

        selectRoom: (roomId: string) => {
          const room = get().rooms.find(r => r.id === roomId);
          if (room) {
            set({ 
              currentRoom: room, 
              debateStatus: room.status,
              currentRound: room.statements.length > 0 ? 
                Math.max(...room.statements.map(s => s.round)) : 0,
            });
          }
        },

        updateRoom: (roomId: string, updates: Partial<MeetingRoom>) => {
          set((currentState) => ({
            rooms: currentState.rooms.map(room =>
              room.id === roomId
                ? { ...room, ...updates, updatedAt: Date.now() }
                : room
            ),
            currentRoom: currentState.currentRoom?.id === roomId
              ? { ...currentState.currentRoom, ...updates, updatedAt: Date.now() }
              : currentState.currentRoom,
          }));
        },

        deleteRoom: (roomId: string) => {
          set((currentState) => ({
            rooms: currentState.rooms.filter(room => room.id !== roomId),
            currentRoom: currentState.currentRoom?.id === roomId ? null : currentState.currentRoom,
          }));
        },

        // 替身管理
        addPersona: (persona: Omit<Persona, 'id'>) => {
          const newPersona: Persona = {
            ...persona,
            id: generateId(),
            color: persona.color || PersonaEngine.suggestPersonaColor(persona as Persona),
          };
          
          set(() => ({
            availablePersonas: [...state.availablePersonas, newPersona],
          }));
        },

        updatePersona: (personaId: string, updates: Partial<Persona>) => {
          set((state) => ({
            availablePersonas: state.availablePersonas.map(persona =>
              persona.id === personaId ? { ...persona, ...updates } : persona
            ),
          }));
        },

        deletePersona: (personaId: string) => {
          set((state) => ({
            availablePersonas: state.availablePersonas.filter(p => p.id !== personaId),
          }));
        },

        togglePersonaActive: (personaId: string) => {
          set((state) => {
            const updatedPersonas = state.availablePersonas.map(persona =>
              persona.id === personaId ? { ...persona, isActive: !persona.isActive } : persona
            );
            
            const activePersonas = updatedPersonas.filter(p => p.isActive);
            
            return {
              availablePersonas: updatedPersonas,
              currentRoom: state.currentRoom ? {
                ...state.currentRoom,
                participants: activePersonas,
                updatedAt: Date.now(),
              } : null,
            };
          });
        },

        duplicatePersona: (personaId: string) => {
          const persona = get().availablePersonas.find(p => p.id === personaId);
          if (persona) {
            const duplicatedPersona: Persona = {
              ...persona,
              id: generateId(),
              name: `${persona.name} (副本)`,
              isActive: false,
            };
            
            set((state) => ({
              availablePersonas: [...state.availablePersonas, duplicatedPersona],
            }));
          }
        },

        resetPersonasToDefault: () => {
          set({ availablePersonas: defaultPersonas });
        },

        // 辯論控制
        startDebate: () => {
          set(() => ({
            debateStatus: 'preparing',
            currentRound: 1,
            error: null,
          }));
          
          if (get().currentRoom) {
            get().updateRoom(get().currentRoom!.id, { status: 'preparing' });
          }
        },

        pauseDebate: () => {
          set({ debateStatus: 'paused' });
          if (get().currentRoom) {
            get().updateRoom(get().currentRoom!.id, { status: 'paused' });
          }
        },

        resumeDebate: () => {
          set({ debateStatus: 'debating' });
          if (get().currentRoom) {
            get().updateRoom(get().currentRoom!.id, { status: 'debating' });
          }
        },

        stopDebate: () => {
          set({
            debateStatus: 'completed',
            currentSpeaker: null,
          });
          if (get().currentRoom) {
            get().updateRoom(get().currentRoom!.id, { status: 'completed' });
          }
        },

        nextRound: () => {
          set((state) => ({
            currentRound: state.currentRound + 1,
          }));
        },

        resetDebate: () => {
          set({
            debateStatus: 'idle',
            currentRound: 0,
            currentSpeaker: null,
            error: null,
          });
          
          if (get().currentRoom) {
            get().updateRoom(get().currentRoom!.id, { 
              status: 'idle',
              statements: [],
              searchResults: [],
              consensus: undefined,
            });
          }
        },

        // 發言管理
        addStatement: (statement: Omit<Statement, 'id' | 'timestamp'>) => {
          const newStatement: Statement = {
            ...statement,
            id: generateId(),
            timestamp: Date.now(),
          };
          
          set((state) => {
            if (!state.currentRoom) return state;
            
            const updatedRoom = {
              ...state.currentRoom,
              statements: [...state.currentRoom.statements, newStatement],
              updatedAt: Date.now(),
            };
            
            // 如果是第一個發言且沒有主題，嘗試從發言內容生成主題
            if (updatedRoom.statements.length === 1 && !updatedRoom.topic.trim()) {
              // 從發言內容提取關鍵詞作為主題
              const content = newStatement.content;
              const generatedTopic = extractTopicFromContent(content);
              if (generatedTopic) {
                updatedRoom.topic = generatedTopic;
                updatedRoom.isTopicGenerated = true;
              }
            }
            
            // 自動計算共識
            const scores = updatedRoom.statements.map(s => s.tendencyScore);
            const consensus = calculateConsensus(scores);
            updatedRoom.consensus = consensus;
            
            return {
              currentRoom: updatedRoom,
              rooms: state.rooms.map(room =>
                room.id === updatedRoom.id ? updatedRoom : room
              ),
            };
          });
        },

        updateStatement: (statementId: string, updates: Partial<Statement>) => {
          set((state) => {
            if (!state.currentRoom) return state;
            
            const updatedRoom = {
              ...state.currentRoom,
              statements: state.currentRoom.statements.map(stmt =>
                stmt.id === statementId ? { ...stmt, ...updates } : stmt
              ),
              updatedAt: Date.now(),
            };
            
            return {
              currentRoom: updatedRoom,
              rooms: state.rooms.map(room =>
                room.id === updatedRoom.id ? updatedRoom : room
              ),
            };
          });
        },

        deleteStatement: (statementId: string) => {
          set((state) => {
            if (!state.currentRoom) return state;
            
            const updatedRoom = {
              ...state.currentRoom,
              statements: state.currentRoom.statements.filter(stmt => stmt.id !== statementId),
              updatedAt: Date.now(),
            };
            
            return {
              currentRoom: updatedRoom,
              rooms: state.rooms.map(room =>
                room.id === updatedRoom.id ? updatedRoom : room
              ),
            };
          });
        },

        updateConsensus: (consensus: ConsensusData) => {
          const currentRoom = get().currentRoom;
          if (currentRoom) {
            get().updateRoom(currentRoom.id, { consensus });
          }
        },

        addSearchResults: (results: SearchResult) => {
          set((state) => {
            if (!state.currentRoom) return state;
            
            const updatedRoom = {
              ...state.currentRoom,
              searchResults: [...state.currentRoom.searchResults, results],
              updatedAt: Date.now(),
            };
            
            return {
              currentRoom: updatedRoom,
              rooms: state.rooms.map(room =>
                room.id === updatedRoom.id ? updatedRoom : room
              ),
            };
          });
        },

        // 狀態管理
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
        setDebateStatus: (status: DebateStatus) => set({ debateStatus: status }),
        setCurrentSpeaker: (speakerId: string | null) => set({ currentSpeaker: speakerId }),

        // 用戶偏好
        updateUserPreferences: (preferences: Partial<UserPreferences>) => {
          set((state) => ({
            userPreferences: { ...state.userPreferences, ...preferences },
          }));
        },

        // 自動保存
        enableAutoSave: () => {
          const state = get();
          if (autoSaveInterval) clearInterval(autoSaveInterval);
          
          autoSaveInterval = setInterval(() => {
            const currentState = get();
            if (currentState.currentRoom && currentState.debateStatus === 'debating') {
              // 自動保存邏輯已經在 persist 中間件中處理
              console.log('Auto-saving meeting room state...');
            }
          }, state.userPreferences.defaultMeetingSettings.autoSaveInterval * 1000);
        },

        disableAutoSave: () => {
          if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
          }
        },

        // 重置
        reset: () => set({
          currentRoom: null,
          debateStatus: 'idle',
          currentRound: 0,
          currentSpeaker: null,
          isLoading: false,
          error: null,
        }),

        resetAll: () => set({
          currentRoom: null,
          rooms: [],
          availablePersonas: defaultPersonas,
          debateStatus: 'idle',
          currentRound: 0,
          currentSpeaker: null,
          isLoading: false,
          error: null,
          userPreferences: defaultUserPreferences,
        }),

        // 主題生成
        generateTopicFromStatement: async (statement: string) => {
          try {
            const response = await fetch('/api/generate-topic', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firstStatement: statement,
                context: get().currentRoom?.name,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const generatedTopic = data.topic;
              
              const currentRoom = get().currentRoom;
              if (currentRoom && generatedTopic) {
                get().updateRoom(currentRoom.id, {
                  topic: generatedTopic,
                  isTopicGenerated: true,
                });
              }
            }
          } catch (error) {
            console.error('生成主題失敗:', error);
            // 靜默失敗，不影響辯論流程
          }
        },
      }),
      {
        name: 'meeting-room-storage',
        partialize: (state) => ({
          rooms: state.rooms,
          availablePersonas: state.availablePersonas,
          userPreferences: state.userPreferences,
        }),
        version: 1,
        migrate: (persistedState: unknown, version: number) => {
          // 確保 persistedState 存在
          if (!persistedState) {
            return {
              rooms: [],
              availablePersonas: defaultPersonas,
              userPreferences: defaultUserPreferences,
            };
          }

          // 版本遷移邏輯
          if (version === 0 || !version) {
            // 從版本 0 或無版本升級到版本 1
            return {
              rooms: persistedState.rooms || [],
              availablePersonas: persistedState.availablePersonas || defaultPersonas,
              userPreferences: persistedState.userPreferences || defaultUserPreferences,
            };
          }

          // 確保所有必要字段存在
          return {
            rooms: persistedState.rooms || [],
            availablePersonas: persistedState.availablePersonas || defaultPersonas,
            userPreferences: persistedState.userPreferences || defaultUserPreferences,
          };
        },
      }
    )
  )
);

// 訂閱狀態變化以實現自動保存
useMeetingRoomStore.subscribe(
  (state) => state.userPreferences.autoSave,
  (autoSave) => {
    if (autoSave) {
      useMeetingRoomStore.getState().enableAutoSave();
    } else {
      useMeetingRoomStore.getState().disableAutoSave();
    }
  }
);

// 初始化自動保存
if (typeof window !== 'undefined') {
  const initialState = useMeetingRoomStore.getState();
  if (initialState.userPreferences.autoSave) {
    initialState.enableAutoSave();
  }
}

export default useMeetingRoomStore;