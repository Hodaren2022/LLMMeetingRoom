import { useState, useEffect, useCallback, useRef } from 'react';
import { DebateOrchestrator, DebateState } from '@/services/debateOrchestrator';
import { MeetingRoom, Statement, ConsensusData, DebateStatus } from '@/types';
import { useMeetingRoomStore } from '@/stores';

/**
 * 辯論協調器 Hook - 管理辯論流程和狀態
 */
export const useDebateOrchestrator = () => {
  const orchestratorRef = useRef<DebateOrchestrator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    currentRoom,
    setDebateStatus,
    setCurrentSpeaker,
    addStatement,
    updateConsensus,
    setError,
    setLoading,
    nextRound,
  } = useMeetingRoomStore();

  // 初始化協調器
  const initializeOrchestrator = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.reset();
    }

    orchestratorRef.current = new DebateOrchestrator({
      onStateChange: (state, data) => {
        console.log('Debate state changed:', state, data);
        
        switch (state) {
          case DebateState.READY:
            setDebateStatus('preparing');
            setLoading(false);
            break;
          case DebateState.RUNNING:
            setDebateStatus('debating');
            break;
          case DebateState.SEARCHING:
            setDebateStatus('searching');
            setLoading(true);
            break;
          case DebateState.PAUSED:
            setDebateStatus('paused');
            break;
          case DebateState.COMPLETED:
            setDebateStatus('completed');
            setCurrentSpeaker(null);
            setLoading(false);
            break;
          case DebateState.ERROR:
            setDebateStatus('error');
            setLoading(false);
            setError(data?.error || '未知錯誤');
            break;
          case DebateState.INITIALIZING:
            setLoading(true);
            break;
          default:
            break;
        }
      },
      
      onStatementAdded: (statement: Statement) => {
        addStatement(statement);
        
        // 如果這是第一個發言且主題未設定或為默認值，自動生成主題
        const store = useMeetingRoomStore.getState();
        const currentRoom = store.currentRoom;
        if (currentRoom && 
            (currentRoom.topic === '討論議題' || currentRoom.topic === '' || !currentRoom.topic) &&
            currentRoom.statements.length === 0) {
          // 使用新添加的發言生成主題
          store.generateTopicFromStatement(statement.content);
        }
      },
      
      onConsensusUpdate: (consensus: ConsensusData) => {
        updateConsensus(consensus);
      },
      
      onError: (error: string) => {
        setError(error);
        setLoading(false);
      },
      
      onRoundComplete: (round: number, roundData: any) => {
        nextRound();
        console.log(`Round ${round} completed`, roundData);
      },
      
      onDebateComplete: (result: any) => {
        console.log('Debate completed:', result);
        setCurrentSpeaker(null);
      },
    });

    setIsInitialized(true);
  }, [
    setDebateStatus,
    setCurrentSpeaker,
    addStatement,
    updateConsensus,
    setError,
    setLoading,
    nextRound,
  ]);

  // 初始化辯論
  const initializeDebate = useCallback(async (room: MeetingRoom) => {
    if (!orchestratorRef.current) {
      initializeOrchestrator();
    }

    try {
      setLoading(true);
      setError(null);
      await orchestratorRef.current!.initializeDebate(room);
    } catch (error) {
      setError(error instanceof Error ? error.message : '初始化失敗');
      setLoading(false);
    }
  }, [initializeOrchestrator, setLoading, setError]);

  // 開始辯論
  const startDebate = useCallback(async (initialTopic?: string) => {
    if (!orchestratorRef.current) {
      setError('協調器未初始化');
      return;
    }

    try {
      setError(null);
      
      // 如果提供了初始議題，先更新會議室主題
      if (initialTopic && currentRoom) {
        const { updateRoom } = useMeetingRoomStore.getState();
        updateRoom(currentRoom.id, {
          topic: initialTopic,
          isTopicGenerated: false
        });
      }
      
      await orchestratorRef.current.startDebate();
    } catch (error) {
      setError(error instanceof Error ? error.message : '開始辯論失敗');
    }
  }, [setError, currentRoom]);

  // 暫停辯論
  const pauseDebate = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.pauseDebate();
    }
  }, []);

  // 恢復辯論
  const resumeDebate = useCallback(async () => {
    if (!orchestratorRef.current) {
      setError('協調器未初始化');
      return;
    }

    try {
      setError(null);
      await orchestratorRef.current.resumeDebate();
    } catch (error) {
      setError(error instanceof Error ? error.message : '恢復辯論失敗');
    }
  }, [setError]);

  // 停止辯論
  const stopDebate = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stopDebate();
    }
  }, []);

  // 獲取當前狀態
  const getOrchestratorState = useCallback(() => {
    return orchestratorRef.current?.getState() || null;
  }, []);

  // 重置協調器
  const resetOrchestrator = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.reset();
    }
    setIsInitialized(false);
  }, []);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.reset();
      }
    };
  }, []);

  // 當前會議室變化時重新初始化
  useEffect(() => {
    if (currentRoom && isInitialized) {
      initializeDebate(currentRoom);
    }
  }, [currentRoom, isInitialized, initializeDebate]);

  return {
    // 狀態
    isInitialized,
    orchestratorState: getOrchestratorState(),
    
    // 方法
    initializeOrchestrator,
    initializeDebate,
    startDebate,
    pauseDebate,
    resumeDebate,
    stopDebate,
    resetOrchestrator,
    getOrchestratorState,
  };
};

/**
 * 辯論控制 Hook - 提供簡化的辯論控制介面
 */
export const useDebateControl = () => {
  const {
    initializeDebate,
    startDebate,
    pauseDebate,
    resumeDebate,
    stopDebate,
    isInitialized,
  } = useDebateOrchestrator();
  
  const {
    currentRoom,
    debateStatus,
    isLoading,
    error,
    availablePersonas,
  } = useMeetingRoomStore();

  // 檢查是否可以開始辯論
  const canStartDebate = useCallback(() => {
    if (!currentRoom) return false;
    if (!isInitialized) return false;
    if (debateStatus !== 'idle' && debateStatus !== 'preparing') return false;
    
    const activePersonas = availablePersonas.filter(p => p.isActive);
    return activePersonas.length >= 2;
  }, [currentRoom, isInitialized, debateStatus, availablePersonas]);

  // 檢查是否可以暫停辯論
  const canPauseDebate = useCallback(() => {
    return debateStatus === 'debating' && !isLoading;
  }, [debateStatus, isLoading]);

  // 檢查是否可以恢復辯論
  const canResumeDebate = useCallback(() => {
    return debateStatus === 'paused';
  }, [debateStatus]);

  // 檢查是否可以停止辯論
  const canStopDebate = useCallback(() => {
    return ['preparing', 'searching', 'debating', 'paused'].includes(debateStatus);
  }, [debateStatus]);

  // 自動初始化
  useEffect(() => {
    if (currentRoom && !isInitialized) {
      initializeDebate(currentRoom);
    }
  }, [currentRoom, isInitialized, initializeDebate]);

  return {
    // 狀態
    currentRoom,
    debateStatus,
    isLoading,
    error,
    isInitialized,
    
    // 檢查方法
    canStartDebate: canStartDebate(),
    canPauseDebate: canPauseDebate(),
    canResumeDebate: canResumeDebate(),
    canStopDebate: canStopDebate(),
    
    // 控制方法
    startDebate: (initialTopic?: string) => startDebate(initialTopic),
    pauseDebate,
    resumeDebate,
    stopDebate,
  };
};

export default { useDebateOrchestrator, useDebateControl };