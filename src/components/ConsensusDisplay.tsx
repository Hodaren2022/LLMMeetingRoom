import React, { useState } from 'react';
import { ConsensusData, Statement } from '@/types';
import { VotingSession } from '@/services/consensusManager';

interface ConsensusDisplayProps {
  consensusData?: ConsensusData;
  statements: Statement[];
  onVotingComplete?: (session: VotingSession) => void;
  className?: string;
}

export const ConsensusDisplay: React.FC<ConsensusDisplayProps> = ({
  consensusData,
  statements,
  
  className = '',
}) => {
  
  
  
  const [showDetails, setShowDetails] = useState(false);

  // 計算實時共識數據
  const calculateRealTimeConsensus = (): ConsensusData | null => {
    if (statements.length === 0) return null;

    const scores = statements.map(s => s.tendencyScore);
    const totalScores = scores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = scores.length * 10;
    const minPossibleScore = scores.length * 1;

    const supportRate = totalScores / maxPossibleScore;
    const opposeRate = (maxPossibleScore - totalScores) / (maxPossibleScore - minPossibleScore);
    const threshold = 0.7;
    const consensusReached = supportRate > threshold || opposeRate > threshold;

    const finalScores: Record<string, number> = {};
    statements.forEach((statement) => {
      finalScores[statement.personaId] = statement.tendencyScore;
    });

    return {
      supportRate,
      opposeRate,
      consensusReached,
      threshold,
      finalScores,
      confidence: Math.max(supportRate, opposeRate),
    };
  };

  const currentConsensus = consensusData || calculateRealTimeConsensus();

  const getConsensusLevel = (data: ConsensusData) => {
    const maxRate = Math.max(data.supportRate, data.opposeRate);
    if (maxRate >= 0.8) return { level: 'strong', color: 'green', text: '強烈共識' };
    if (maxRate >= 0.6) return { level: 'moderate', color: 'yellow', text: '中等共識' };
    if (maxRate >= 0.4) return { level: 'weak', color: 'orange', text: '微弱共識' };
    return { level: 'none', color: 'red', text: '無共識' };
  };

  const getProgressBarColor = (rate: number, type: 'support' | 'oppose') => {
    if (type === 'support') {
      return rate > 0.7 ? 'bg-green-500' : rate > 0.5 ? 'bg-green-400' : 'bg-green-300';
    } else {
      return rate > 0.7 ? 'bg-red-500' : rate > 0.5 ? 'bg-red-400' : 'bg-red-300';
    }
  };

  if (!currentConsensus) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>尚無數據，等待辯論開始...</p>
        </div>
      </div>
    );
  }

  const consensusLevel = getConsensusLevel(currentConsensus);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* 標題和狀態 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">共識分析</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            consensusLevel.color === 'green' ? 'bg-green-100 text-green-800' :
            consensusLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            consensusLevel.color === 'orange' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {consensusLevel.text}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showDetails ? '📊' : '📈'}
          </button>
        </div>
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 支持度 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">支持度</span>
            <span className="text-sm text-gray-600">
              {(currentConsensus.supportRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(currentConsensus.supportRate, 'support')}`}
              style={{ width: `${currentConsensus.supportRate * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 反對度 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">反對度</span>
            <span className="text-sm text-gray-600">
              {(currentConsensus.opposeRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(currentConsensus.opposeRate, 'oppose')}`}
              style={{ width: `${currentConsensus.opposeRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 共識狀態 */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border-2 ${
          currentConsensus.consensusReached
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {currentConsensus.consensusReached ? '✅' : '⏳'}
              </span>
              <span className="font-medium">
                {currentConsensus.consensusReached ? '已達成共識' : '尚未達成共識'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              門檻: {(currentConsensus.threshold * 100).toFixed(0)}%
            </span>
          </div>
          
          {currentConsensus.confidence !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">信心水準</span>
                <span className="font-medium">
                  {(currentConsensus.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 詳細信息 */}
      {showDetails && (
        <div className="space-y-4">
          {/* 參與者分數 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">參與者分數分布</h4>
            <div className="space-y-2">
              {Object.entries(currentConsensus.finalScores).map(([personaId, score]) => {
                const statement = statements.find(s => s.personaId === personaId);
                return (
                  <div key={personaId} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {statement?.personaName || personaId}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 建議和下一步 */}
          {(currentConsensus.recommendation || currentConsensus.nextSteps) && (
            <div className="p-3 bg-blue-50 rounded-lg">
              {currentConsensus.recommendation && (
                <p className="text-sm text-blue-800 mb-2">
                  <strong>建議:</strong> {currentConsensus.recommendation}
                </p>
              )}
              {currentConsensus.nextSteps && currentConsensus.nextSteps.length > 0 && (
                <div className="text-sm text-blue-700">
                  <strong>下一步:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {currentConsensus.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 統計摘要 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {statements.length}
            </div>
            <div className="text-xs text-gray-600">總發言數</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {statements.length > 0 ? (statements.reduce((sum, s) => sum + s.tendencyScore, 0) / statements.length).toFixed(1) : '0'}
            </div>
            <div className="text-xs text-gray-600">平均分數</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {new Set(statements.map(s => s.personaId)).size}
            </div>
            <div className="text-xs text-gray-600">參與者數</div>
          </div>
        </div>
      </div>
    </div>
  );
};