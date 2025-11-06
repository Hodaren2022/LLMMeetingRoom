import { Statement, ConsensusData, Persona } from '@/types';
import { consensusUtils } from '@/utils';

/**
 * 投票機制類型
 */
export type VotingMethod = 'simple' | 'weighted' | 'ranked' | 'consensus';

/**
 * 投票選項
 */
export interface VotingOption {
  id: string;
  label: string;
  description?: string;
  value: number; // 1-10 的支持度
}

/**
 * 投票結果
 */
export interface VotingResult {
  optionId: string;
  votes: {
    personaId: string;
    personaName: string;
    score: number;
    reasoning?: string;
    weight?: number;
  }[];
  totalScore: number;
  averageScore: number;
  weightedScore?: number;
  supportRate: number;
}

/**
 * 投票會話
 */
export interface VotingSession {
  id: string;
  topic: string;
  method: VotingMethod;
  options: VotingOption[];
  participants: Persona[];
  results: VotingResult[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  consensusData?: ConsensusData;
}

/**
 * 共識計算和投票機制管理器
 */
export class ConsensusManager {
  private votingSessions: Map<string, VotingSession> = new Map();
  private onSessionUpdate?: (session: VotingSession) => void;
  private onConsensusReached?: (session: VotingSession, consensus: ConsensusData) => void;

  constructor(options?: {
    onSessionUpdate?: (session: VotingSession) => void;
    onConsensusReached?: (session: VotingSession, consensus: ConsensusData) => void;
  }) {
    if (options) {
      this.onSessionUpdate = options.onSessionUpdate;
      this.onConsensusReached = options.onConsensusReached;
    }
  }

  /**
   * 創建投票會話
   */
  createVotingSession(
    topic: string,
    method: VotingMethod,
    participants: Persona[],
    options: Omit<VotingOption, 'id'>[] = []
  ): VotingSession {
    const sessionId = this.generateSessionId();
    
    // 如果沒有提供選項，創建默認的支持/反對選項
    const votingOptions: VotingOption[] = options.length > 0 
      ? options.map((opt, index) => ({ ...opt, id: `option_${index}` }))
      : [
          { id: 'support', label: '支持', description: '支持此議題', value: 8 },
          { id: 'oppose', label: '反對', description: '反對此議題', value: 3 },
          { id: 'neutral', label: '中立', description: '保持中立立場', value: 5 },
        ];

    const session: VotingSession = {
      id: sessionId,
      topic,
      method,
      options: votingOptions,
      participants,
      results: votingOptions.map(option => ({
        optionId: option.id,
        votes: [],
        totalScore: 0,
        averageScore: 0,
        supportRate: 0,
      })),
      status: 'pending',
      startTime: Date.now(),
    };

    this.votingSessions.set(sessionId, session);
    this.onSessionUpdate?.(session);
    
    return session;
  }

  /**
   * 開始投票會話
   */
  startVotingSession(sessionId: string): boolean {
    const session = this.votingSessions.get(sessionId);
    if (!session || session.status !== 'pending') {
      return false;
    }

    session.status = 'active';
    this.onSessionUpdate?.(session);
    return true;
  }

  /**
   * 提交投票
   */
  submitVote(
    sessionId: string,
    personaId: string,
    optionId: string,
    score: number,
    reasoning?: string
  ): boolean {
    const session = this.votingSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    // 驗證分數範圍
    if (score < 1 || score > 10) {
      throw new Error('投票分數必須在 1-10 之間');
    }

    // 找到對應的結果記錄
    const result = session.results.find(r => r.optionId === optionId);
    if (!result) {
      return false;
    }

    // 找到參與者
    const persona = session.participants.find(p => p.id === personaId);
    if (!persona) {
      return false;
    }

    // 移除該參與者之前的投票（如果有）
    result.votes = result.votes.filter(v => v.personaId !== personaId);

    // 添加新投票
    const weight = this.calculatePersonaWeight(persona, session.method);
    result.votes.push({
      personaId,
      personaName: persona.name,
      score,
      reasoning,
      weight,
    });

    // 重新計算結果
    this.recalculateResults(session);
    this.onSessionUpdate?.(session);

    // 檢查是否所有人都已投票
    if (this.isVotingComplete(session)) {
      this.completeVotingSession(sessionId);
    }

    return true;
  }

  /**
   * 批量提交投票（基於辯論陳述）
   */
  submitVotesFromStatements(
    sessionId: string,
    statements: Statement[]
  ): boolean {
    const session = this.votingSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    // 根據陳述的傾向度分數自動分配投票
    statements.forEach(statement => {
      const score = statement.tendencyScore;
      let optionId: string;

      // 根據傾向度分數決定投票選項
      if (score >= 7) {
        optionId = 'support';
      } else if (score <= 4) {
        optionId = 'oppose';
      } else {
        optionId = 'neutral';
      }

      this.submitVote(
        sessionId,
        statement.personaId,
        optionId,
        score,
        statement.content.substring(0, 100) + '...'
      );
    });

    return true;
  }

  /**
   * 完成投票會話
   */
  completeVotingSession(sessionId: string): boolean {
    const session = this.votingSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    session.status = 'completed';
    session.endTime = Date.now();

    // 計算最終共識
    const consensusData = this.calculateFinalConsensus(session);
    session.consensusData = consensusData;

    this.onSessionUpdate?.(session);
    this.onConsensusReached?.(session, consensusData);

    return true;
  }

  /**
   * 取消投票會話
   */
  cancelVotingSession(sessionId: string): boolean {
    const session = this.votingSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'cancelled';
    session.endTime = Date.now();
    this.onSessionUpdate?.(session);

    return true;
  }

  /**
   * 獲取投票會話
   */
  getVotingSession(sessionId: string): VotingSession | undefined {
    return this.votingSessions.get(sessionId);
  }

  /**
   * 獲取所有投票會話
   */
  getAllVotingSessions(): VotingSession[] {
    return Array.from(this.votingSessions.values());
  }

  /**
   * 計算參與者權重
   */
  private calculatePersonaWeight(persona: Persona, method: VotingMethod): number {
    switch (method) {
      case 'simple':
        return 1;
      case 'weighted':
        // 基於專業度和經驗計算權重
        const expertiseWeight = persona.ragFocus.length * 0.2;
        const temperatureWeight = (1 - persona.temperature) * 0.3; // 較低溫度表示更理性
        return Math.max(0.5, Math.min(2, 1 + expertiseWeight + temperatureWeight));
      case 'ranked':
        return 1; // 排序投票中每票權重相等
      case 'consensus':
        return 1; // 共識機制中每票權重相等
      default:
        return 1;
    }
  }

  /**
   * 重新計算投票結果
   */
  private recalculateResults(session: VotingSession): void {
    session.results.forEach(result => {
      if (result.votes.length === 0) {
        result.totalScore = 0;
        result.averageScore = 0;
        result.weightedScore = 0;
        result.supportRate = 0;
        return;
      }

      // 計算總分和平均分
      result.totalScore = result.votes.reduce((sum, vote) => sum + vote.score, 0);
      result.averageScore = result.totalScore / result.votes.length;

      // 計算加權分數
      const totalWeight = result.votes.reduce((sum, vote) => sum + (vote.weight || 1), 0);
      result.weightedScore = result.votes.reduce(
        (sum, vote) => sum + (vote.score * (vote.weight || 1)), 0
      ) / totalWeight;

      // 計算支持率
      result.supportRate = result.averageScore / 10;
    });
  }

  /**
   * 檢查投票是否完成
   */
  private isVotingComplete(session: VotingSession): boolean {
    const totalVotes = session.results.reduce((sum, result) => sum + result.votes.length, 0);
    return totalVotes >= session.participants.length;
  }

  /**
   * 計算最終共識
   */
  private calculateFinalConsensus(session: VotingSession): ConsensusData {
    // 收集所有投票分數
    const allScores: number[] = [];
    const allWeights: number[] = [];

    session.results.forEach(result => {
      result.votes.forEach(vote => {
        allScores.push(vote.score);
        allWeights.push(vote.weight || 1);
      });
    });

    // 使用進階共識計算
    const consensusReport = consensusUtils.generateConsensusReport(
      allScores,
      allWeights,
      [] // 暫時不提供歷史數據
    );

    return {
      supportRate: consensusReport.basic.supportRate,
      opposeRate: consensusReport.basic.opposeRate,
      consensusReached: consensusReport.basic.consensusReached,
      threshold: consensusReport.basic.threshold,
      finalScores: consensusReport.basic.finalScores,
      confidence: consensusReport.weighted.confidenceLevel,
      recommendation: consensusReport.summary.recommendation,
      nextSteps: consensusReport.summary.nextSteps,
    };
  }

  /**
   * 生成會話 ID
   */
  private generateSessionId(): string {
    return `voting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取投票統計
   */
  getVotingStatistics(sessionId: string): {
    totalParticipants: number;
    votedParticipants: number;
    participationRate: number;
    averageScore: number;
    scoreDistribution: Record<string, number>;
    topOption: { optionId: string; label: string; score: number } | null;
  } | null {
    const session = this.votingSessions.get(sessionId);
    if (!session) return null;

    const totalParticipants = session.participants.length;
    const votedParticipants = new Set(
      session.results.flatMap(r => r.votes.map(v => v.personaId))
    ).size;

    const participationRate = totalParticipants > 0 ? votedParticipants / totalParticipants : 0;

    const allScores = session.results.flatMap(r => r.votes.map(v => v.score));
    const averageScore = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;

    // 分數分布
    const scoreDistribution: Record<string, number> = {};
    for (let i = 1; i <= 10; i++) {
      scoreDistribution[i.toString()] = allScores.filter(score => score === i).length;
    }

    // 最高分選項
    const topResult = session.results.reduce((top, current) => 
      current.averageScore > (top?.averageScore || 0) ? current : top
    , session.results[0]);

    const topOption = topResult ? {
      optionId: topResult.optionId,
      label: session.options.find(opt => opt.id === topResult.optionId)?.label || '',
      score: topResult.averageScore,
    } : null;

    return {
      totalParticipants,
      votedParticipants,
      participationRate,
      averageScore,
      scoreDistribution,
      topOption,
    };
  }

  /**
   * 清理已完成的會話
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): number { // 默認 24 小時
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.votingSessions.entries()) {
      if (session.status === 'completed' || session.status === 'cancelled') {
        const sessionAge = now - (session.endTime || session.startTime);
        if (sessionAge > maxAge) {
          this.votingSessions.delete(sessionId);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }
}