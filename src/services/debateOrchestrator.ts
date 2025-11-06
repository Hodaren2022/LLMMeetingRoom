import { Persona, DebateContext, Statement, SourceReference, ConsensusData, MeetingRoom } from '@/types';
import { ApiService } from './apiService';
import { PersonaEngine } from './personaEngine';
import { calculateConsensus } from '@/utils';

/**
 * 辯論狀態枚舉
 */
export enum DebateState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  SEARCHING = 'searching',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * 辯論事件類型
 */
export interface DebateEvent {
  type: string;
  timestamp: number;
  data?: any;
}

/**
 * 辯論協調器 - 負責管理辯論流程、替身輪替和狀態同步
 */
export class DebateOrchestrator {
  private currentRoom: MeetingRoom | null = null;
  private state: DebateState = DebateState.IDLE;
  private currentRound: number = 0;
  private currentSpeakerIndex: number = 0;
  private searchResults: SourceReference[] = [];
  private eventHistory: DebateEvent[] = [];
  private pausedAt: number | null = null;
  private totalPausedTime: number = 0;
  private startTime: number | null = null;
  
  // 事件回調
  private onStateChange?: (state: DebateState, data?: any) => void;
  private onStatementAdded?: (statement: Statement) => void;
  private onConsensusUpdate?: (consensus: ConsensusData) => void;
  private onError?: (error: string) => void;
  private onRoundComplete?: (round: number, roundData: any) => void;
  private onDebateComplete?: (result: any) => void;
  private onProgress?: (progress: { current: number; total: number; percentage: number }) => void;

  constructor(options?: {
    onStateChange?: (state: DebateState, data?: any) => void;
    onStatementAdded?: (statement: Statement) => void;
    onConsensusUpdate?: (consensus: ConsensusData) => void;
    onError?: (error: string) => void;
    onRoundComplete?: (round: number, roundData: any) => void;
    onDebateComplete?: (result: any) => void;
    onProgress?: (progress: { current: number; total: number; percentage: number }) => void;
  }) {
    if (options) {
      this.onStateChange = options.onStateChange;
      this.onStatementAdded = options.onStatementAdded;
      this.onConsensusUpdate = options.onConsensusUpdate;
      this.onError = options.onError;
      this.onRoundComplete = options.onRoundComplete;
      this.onDebateComplete = options.onDebateComplete;
      this.onProgress = options.onProgress;
    }
  }

  /**
   * 初始化辯論
   */
  async initializeDebate(room: MeetingRoom): Promise<void> {
    try {
      this.setState(DebateState.INITIALIZING);
      this.addEvent('debate_initialize_start', { roomId: room.id, topic: room.topic });
      
      this.currentRoom = room;
      this.currentRound = 0;
      this.currentSpeakerIndex = 0;
      this.eventHistory = [];
      this.pausedAt = null;
      this.totalPausedTime = 0;
      this.startTime = null;
      
      // 檢查參與者
      if (!room.participants || room.participants.length < 2) {
        throw new Error('至少需要 2 個替身參與辯論');
      }

      // 驗證會議室設定
      this.validateRoomSettings(room);

      // 執行議題搜尋
      await this.performTopicSearch();
      
      this.setState(DebateState.READY);
      this.addEvent('debate_initialize_complete');
    } catch (error) {
      this.handleError('初始化辯論失敗', error);
    }
  }

  /**
   * 驗證會議室設定
   */
  private validateRoomSettings(room: MeetingRoom): void {
    if (room.settings.maxRounds < 1 || room.settings.maxRounds > 20) {
      throw new Error('最大回合數必須在 1-20 之間');
    }
    
    if (room.settings.consensusThreshold < 0.5 || room.settings.consensusThreshold > 1) {
      throw new Error('共識門檻必須在 0.5-1 之間');
    }
    
    if (room.settings.timeoutPerRound && room.settings.timeoutPerRound < 30000) {
      throw new Error('每回合超時時間不能少於 30 秒');
    }
  }

  /**
   * 開始辯論
   */
  async startDebate(): Promise<void> {
    try {
      if (!this.currentRoom) {
        throw new Error('未初始化會議室');
      }

      if (this.state === DebateState.RUNNING) {
        throw new Error('辯論已在進行中');
      }

      if (this.state !== DebateState.READY) {
        throw new Error('辯論尚未準備就緒');
      }

      this.setState(DebateState.RUNNING);
      this.currentRound = 1;
      this.currentSpeakerIndex = 0;
      this.startTime = Date.now();
      
      this.addEvent('debate_start', { 
        participants: this.currentRoom.participants.map(p => p.name),
        maxRounds: this.currentRoom.settings.maxRounds 
      });
      
      // 開始第一輪辯論
      await this.runDebateRounds();
    } catch (error) {
      this.handleError('開始辯論失敗', error);
    }
  }

  /**
   * 暫停辯論
   */
  pauseDebate(): void {
    if (this.state !== DebateState.RUNNING) {
      throw new Error('只能暫停正在進行的辯論');
    }

    this.setState(DebateState.PAUSED);
    this.pausedAt = Date.now();
    this.addEvent('debate_pause', { 
      round: this.currentRound,
      speaker: this.getCurrentSpeaker()?.name 
    });
  }

  /**
   * 恢復辯論
   */
  async resumeDebate(): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('未初始化會議室');
    }

    if (this.state !== DebateState.PAUSED) {
      throw new Error('只能恢復已暫停的辯論');
    }

    // 計算暫停時間
    if (this.pausedAt) {
      this.totalPausedTime += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }

    this.setState(DebateState.RUNNING);
    this.addEvent('debate_resume', { 
      round: this.currentRound,
      totalPausedTime: this.totalPausedTime 
    });
    
    // 繼續辯論流程
    await this.runDebateRounds();
  }

  /**
   * 停止辯論
   */
  stopDebate(): void {
    if (this.state === DebateState.IDLE || this.state === DebateState.COMPLETED) {
      return;
    }

    this.setState(DebateState.COMPLETED);
    this.addEvent('debate_stop', { 
      reason: 'manual_stop',
      round: this.currentRound 
    });
    
    // 計算最終結果
    this.calculateFinalResult();
  }

  /**
   * 執行議題搜尋
   */
  private async performTopicSearch(): Promise<void> {
    try {
      if (!this.currentRoom) return;

      this.setState(DebateState.SEARCHING);
      this.addEvent('search_start', { topic: this.currentRoom.topic });
      
      const { searchResults } = await ApiService.searchTopicInformationWithRetry(
        this.currentRoom.topic,
        this.currentRoom.participants
      );
      
      this.searchResults = searchResults;
      this.addEvent('search_complete', { 
        resultsCount: searchResults.length,
        sources: searchResults.map(r => r.url) 
      });
    } catch (error) {
      this.handleError('搜尋議題資訊失敗', error);
    }
  }

  /**
   * 執行辯論回合
   */
  private async runDebateRounds(): Promise<void> {
    try {
      while (this.state === DebateState.RUNNING && this.currentRoom && this.currentRound <= this.currentRoom.settings.maxRounds) {
        // 更新進度
        this.updateProgress();
        
        await this.runSingleRound();
        
        // 檢查是否達成共識
        const consensus = this.calculateCurrentConsensus();
        this.onConsensusUpdate?.(consensus);
        
        if (consensus.consensusReached) {
          this.setState(DebateState.COMPLETED);
          this.addEvent('consensus_reached', { 
            round: this.currentRound,
            consensus 
          });
          
          this.onDebateComplete?.({
            reason: 'consensus',
            consensus,
            rounds: this.currentRound,
            duration: this.getDebateDuration(),
            eventHistory: this.eventHistory,
          });
          return;
        }
        
        // 完成當前回合
        const roundData = {
          round: this.currentRound,
          statements: this.currentRoom.statements.filter(s => s.round === this.currentRound),
          consensus: consensus,
        };
        
        this.onRoundComplete?.(this.currentRound, roundData);
        this.addEvent('round_complete', roundData);
        
        this.currentRound++;
        this.currentSpeakerIndex = 0;
      }
      
      // 達到最大回合數
      if (this.currentRound > (this.currentRoom?.settings.maxRounds || 0)) {
        this.setState(DebateState.COMPLETED);
        this.addEvent('max_rounds_reached', { 
          maxRounds: this.currentRoom?.settings.maxRounds 
        });
        this.calculateFinalResult();
      }
    } catch (error) {
      this.handleError('執行辯論回合失敗', error);
    }
  }

  /**
   * 執行單一回合
   */
  private async runSingleRound(): Promise<void> {
    if (!this.currentRoom || this.state !== DebateState.RUNNING) return;

    const participants = this.currentRoom.participants;
    this.addEvent('round_start', { 
      round: this.currentRound,
      participants: participants.map(p => p.name) 
    });
    
    for (let i = 0; i < participants.length && this.state === DebateState.RUNNING; i++) {
      this.currentSpeakerIndex = i;
      const persona = participants[i];
      
      // 檢查超時設定
      const timeout = this.currentRoom.settings.timeoutPerRound;
      if (timeout) {
        await Promise.race([
          this.generatePersonaStatement(persona),
          this.createTimeoutPromise(timeout, persona.name)
        ]);
      } else {
        await this.generatePersonaStatement(persona);
      }
      
      // 短暫延遲，模擬思考時間
      await this.delay(1000);
    }
  }

  /**
   * 創建超時 Promise
   */
  private createTimeoutPromise(timeout: number, personaName: string): Promise<void> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${personaName} 發言超時 (${timeout}ms)`));
      }, timeout);
    });
  }

  /**
   * 生成替身發言
   */
  private async generatePersonaStatement(persona: Persona): Promise<void> {
    try {
      if (!this.currentRoom) return;

      this.addEvent('generating_statement', { persona: persona.name });
      
      const context: DebateContext = {
        topic: this.currentRoom.topic,
        currentRound: this.currentRound,
        maxRounds: this.currentRoom.settings.maxRounds,
        previousStatements: this.currentRoom.statements,
        searchResults: [{ 
          query: this.currentRoom.topic,
          results: this.searchResults,
          timestamp: Date.now(),
          personaFocus: persona.ragFocus,
        }],
        activePersonas: this.currentRoom.participants,
        currentSpeaker: persona.id,
      };

      const response = await ApiService.generatePersonaResponseWithRetry(
        persona,
        context,
        this.searchResults
      );

      const statement: Statement = {
        id: this.generateId(),
        personaId: persona.id,
        personaName: persona.name,
        content: response.content,
        timestamp: Date.now(),
        round: this.currentRound,
        tendencyScore: response.tendencyScore,
        sources: response.sources,
        references: response.sources || [],
        tags: [],
        reasoning: response.reasoning,
      };

      // 添加發言到會議室
      this.currentRoom.statements.push(statement);
      this.onStatementAdded?.(statement);
      
      this.addEvent('statement_added', { statement });
    } catch (error) {
      this.handleError(`生成 ${persona.name} 的發言失敗`, error);
    }
  }

  /**
   * 計算當前共識
   */
  private calculateCurrentConsensus(): ConsensusData {
    if (!this.currentRoom) {
      return {
        supportRate: 0,
        opposeRate: 0,
        consensusReached: false,
        threshold: 0.7,
        finalScores: {},
      };
    }

    const scores = this.currentRoom.statements.map(s => s.tendencyScore);
    const consensus = calculateConsensus(scores);
    
    // 計算各替身的最終分數
    const finalScores: Record<string, number> = {};
    this.currentRoom.participants.forEach(persona => {
      const personaStatements = this.currentRoom!.statements.filter(s => s.personaId === persona.id);
      if (personaStatements.length > 0) {
        const latestStatement = personaStatements[personaStatements.length - 1];
        finalScores[persona.id] = latestStatement.tendencyScore;
      }
    });

    return {
      ...consensus,
      finalScores,
    };
  }

  /**
   * 完成辯論
   */
  private completeDebate(reason: string): void {
    this.setState(DebateState.COMPLETED);
    this.addEvent('debate_complete', { reason });
    
    const finalResult = this.calculateFinalResult();
    this.onDebateComplete?.({
      reason,
      result: finalResult,
      rounds: this.currentRound,
      duration: this.getDebateDuration(),
      eventHistory: this.eventHistory,
    });
  }

  /**
   * 計算最終結果
   */
  private calculateFinalResult(): any {
    const consensus = this.calculateCurrentConsensus();
    this.onConsensusUpdate?.(consensus);
    
    return {
      consensus,
      totalRounds: this.currentRound,
      duration: this.getDebateDuration(),
      participants: this.currentRoom?.participants.map(p => ({
        name: p.name,
        statements: this.currentRoom?.statements.filter(s => s.personaId === p.id).length || 0,
        averageTendency: this.calculateAverageTendency(p.id),
      })) || [],
      eventHistory: this.eventHistory,
    };
  }

  /**
   * 計算替身的平均傾向度
   */
  private calculateAverageTendency(personaId: string): number {
    if (!this.currentRoom) return 5;
    
    const statements = this.currentRoom.statements.filter(s => s.personaId === personaId);
    if (statements.length === 0) return 5;
    
    const totalTendency = statements.reduce((sum, s) => sum + s.tendencyScore, 0);
    return Math.round((totalTendency / statements.length) * 10) / 10;
  }

  /**
   * 設定狀態
   */
  private setState(newState: DebateState): void {
    const oldState = this.state;
    this.state = newState;
    this.onStateChange?.(newState, { 
      oldState, 
      newState, 
      room: this.currentRoom,
      timestamp: Date.now() 
    });
  }

  /**
   * 添加事件到歷史記錄
   */
  private addEvent(type: string, data?: any): void {
    const event: DebateEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    this.eventHistory.push(event);
    
    // 限制事件歷史記錄數量
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500);
    }
  }

  /**
   * 更新進度
   */
  private updateProgress(): void {
    if (!this.currentRoom) return;
    
    const current = this.currentRound;
    const total = this.currentRoom.settings.maxRounds;
    const percentage = Math.round((current / total) * 100);
    
    this.onProgress?.({ current, total, percentage });
  }

  /**
   * 獲取當前發言者
   */
  private getCurrentSpeaker(): Persona | undefined {
    if (!this.currentRoom) return undefined;
    return this.currentRoom.participants[this.currentSpeakerIndex];
  }

  /**
   * 獲取辯論持續時間
   */
  private getDebateDuration(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime - this.totalPausedTime;
  }

  /**
   * 處理錯誤
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.setState(DebateState.ERROR);
    this.addEvent('error', { 
      message, 
      error: error instanceof Error ? error.message : String(error),
      round: this.currentRound,
      speaker: this.getCurrentSpeaker()?.name 
    });
    this.onError?.(error instanceof Error ? error.message : message);
  }

  

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  

  /**
   * 重置協調器
   */
  reset(): void {
    this.setState(DebateState.IDLE);
    this.currentRoom = null;
    this.currentRound = 0;
    this.currentSpeakerIndex = 0;
    this.searchResults = [];
    this.eventHistory = [];
    this.pausedAt = null;
    this.totalPausedTime = 0;
    this.startTime = null;
    this.addEvent('orchestrator_reset');
  }

  /**
   * 獲取當前狀態
   */
  getState(): {
    state: DebateState;
    currentRound: number;
    currentSpeaker: Persona | undefined;
    room: MeetingRoom | null;
    searchResults: SourceReference[];
    progress: { current: number; total: number; percentage: number } | null;
    duration: number;
    eventHistory: DebateEvent[];
  } {
    const progress = this.currentRoom ? {
      current: this.currentRound,
      total: this.currentRoom.settings.maxRounds,
      percentage: Math.round((this.currentRound / this.currentRoom.settings.maxRounds) * 100)
    } : null;

    return {
      state: this.state,
      currentRound: this.currentRound,
      currentSpeaker: this.getCurrentSpeaker(),
      room: this.currentRoom,
      searchResults: this.searchResults,
      progress,
      duration: this.getDebateDuration(),
      eventHistory: this.eventHistory,
    };
  }

  /**
   * 獲取事件歷史
   */
  getEventHistory(): DebateEvent[] {
    return [...this.eventHistory];
  }

  /**
   * 獲取統計資訊
   */
  getStatistics(): {
    totalEvents: number;
    totalDuration: number;
    averageRoundDuration: number;
    pauseCount: number;
    errorCount: number;
  } {
    const pauseEvents = this.eventHistory.filter(e => e.type === 'debate_pause');
    const errorEvents = this.eventHistory.filter(e => e.type === 'error');
    const roundEvents = this.eventHistory.filter(e => e.type === 'round_complete');
    
    const totalDuration = this.getDebateDuration();
    const averageRoundDuration = roundEvents.length > 0 ? totalDuration / roundEvents.length : 0;

    return {
      totalEvents: this.eventHistory.length,
      totalDuration,
      averageRoundDuration,
      pauseCount: pauseEvents.length,
      errorCount: errorEvents.length,
    };
  }
}

export default DebateOrchestrator;