import React, { useState, useEffect } from 'react';
import { Statement, Persona, DebateStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DebateViewerProps {
  statements: Statement[];
  currentSpeaker: Persona | null;
  debateStatus: DebateStatus;
  currentRound: number;
  loading: boolean;
  onStatementClick?: (statement: Statement) => void;
}

export const DebateViewer: React.FC<DebateViewerProps> = ({
  statements,
  currentSpeaker,
  debateStatus,
  currentRound,
  loading,
  onStatementClick,
}) => {
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // 自動滾動到最新發言
  useEffect(() => {
    if (autoScroll && statements.length > 0) {
      const latestElement = document.getElementById(`statement-${statements.length - 1}`);
      latestElement?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [statements, autoScroll]);

  const getStatusColor = (status: DebateStatus) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'debating': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'searching': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: DebateStatus) => {
    switch (status) {
      case 'preparing': return '準備中';
      case 'debating': return '辯論中';
      case 'paused': return '已暫停';
      case 'completed': return '已完成';
      case 'error': return '錯誤';
      case 'searching': return '搜尋中';
      default: return '未知狀態';
    }
  };

  const getTendencyColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-50';
    if (score <= 4) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getTendencyText = (score: number) => {
    if (score >= 7) return '支持';
    if (score <= 4) return '反對';
    return '中立';
  };

  const handleStatementClick = (statement: Statement) => {
    setSelectedStatement(statement);
    onStatementClick?.(statement);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* 辯論狀態欄 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(debateStatus)}`}>
            {getStatusText(debateStatus)}
          </span>
          <span className="text-sm text-gray-600">
            第 {currentRound} 輪
          </span>
          {currentSpeaker && (
            <span className="text-sm text-blue-600">
              當前發言者: {currentSpeaker.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="mr-2"
            />
            自動滾動
          </label>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              處理中...
            </div>
          )}
        </div>
      </div>

      {/* 發言列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {statements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>尚無發言，辯論即將開始...</p>
          </div>
        ) : (
          statements.map((statement, index) => (
            <div
              key={statement.id}
              id={`statement-${index}`}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedStatement?.id === statement.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleStatementClick(statement)}
            >
              {/* 發言者信息 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {statement.personaName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{statement.personaName}</h4>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(statement.timestamp, { 
                        addSuffix: true, 
                        locale: zhCN 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTendencyColor(statement.tendencyScore)}`}>
                    {getTendencyText(statement.tendencyScore)} ({statement.tendencyScore}/10)
                  </span>
                  <span className="text-xs text-gray-400">#{statement.round}</span>
                </div>
              </div>

              {/* 發言內容 */}
              <div className="text-gray-800 leading-relaxed mb-3">
                {statement.content}
              </div>

              {/* 引用和標籤 */}
              {(statement.references.length > 0 || statement.tags.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  {statement.references.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="mr-1">📎</span>
                      {statement.references.length} 個引用
                    </div>
                  )}
                  {statement.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 發言詳情側邊欄 */}
      {selectedStatement && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900">發言詳情</h5>
            <button
              onClick={() => setSelectedStatement(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">發言者:</span>
              <span className="ml-2 font-medium">{selectedStatement.personaName}</span>
            </div>
            <div>
              <span className="text-gray-600">輪次:</span>
              <span className="ml-2">{selectedStatement.round}</span>
            </div>
            <div>
              <span className="text-gray-600">傾向度:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getTendencyColor(selectedStatement.tendencyScore)}`}>
                {selectedStatement.tendencyScore}/10
              </span>
            </div>
            {selectedStatement.references.length > 0 && (
              <div>
                <span className="text-gray-600">引用資料:</span>
                <ul className="ml-2 mt-1 space-y-1">
                  {selectedStatement.references.map((ref, index) => (
                    <li key={index} className="text-xs text-blue-600 hover:underline cursor-pointer">
                      {ref.title || ref.url}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};