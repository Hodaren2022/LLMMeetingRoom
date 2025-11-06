import React, { useState } from 'react';
import { DebateStatus } from '@/types';

interface DebateControlPanelProps {
  debateStatus: DebateStatus;
  currentRound: number;
  totalStatements: number;
  loading: boolean;
  onStart: (initialTopic?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNextRound: () => void;
  onReset: () => void;
  onTopicGenerated?: (topic: string) => void;
  disabled?: boolean;
}

export const DebateControlPanel: React.FC<DebateControlPanelProps> = ({
  debateStatus,
  currentRound,
  totalStatements,
  loading,
  onStart,
  onPause,
  onResume,
  onStop,
  onNextRound,
  onReset,
  onTopicGenerated,
  disabled = false,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [initialTopic, setInitialTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);

  const isDebating = debateStatus === 'debating';
  const isPaused = debateStatus === 'paused';
  const isCompleted = debateStatus === 'completed';
  const isError = debateStatus === 'error';
  const canStart = debateStatus === 'preparing' || isCompleted || isError;
  const canPause = isDebating && !loading;
  const canResume = isPaused;
  const canStop = isDebating || isPaused;
  const canNextRound = isDebating && !loading;

  const handleReset = () => {
    if (showConfirmReset) {
      onReset();
      setShowConfirmReset(false);
    } else {
      setShowConfirmReset(true);
      setTimeout(() => setShowConfirmReset(false), 3000);
    }
  };

  const handleStartWithTopic = () => {
    if (initialTopic.trim()) {
      onStart(initialTopic.trim());
      setInitialTopic('');
      setShowTopicInput(false);
    } else {
      onStart();
    }
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStartWithTopic();
    } else if (e.key === 'Escape') {
      setShowTopicInput(false);
      setInitialTopic('');
    }
  };

  const getStatusIcon = () => {
    switch (debateStatus) {
      case 'preparing': return '⚙️';
      case 'debating': return '🗣️';
      case 'paused': return '⏸️';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'searching': return '🔍';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">{getStatusIcon()}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">辯論控制台</h3>
            <p className="text-sm text-gray-600">
              第 {currentRound} 輪 • {totalStatements} 個發言
            </p>
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            處理中...
          </div>
        )}
      </div>

      {/* 初始議題輸入 */}
      {showTopicInput && canStart && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            輸入第一個討論議題（可選）
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={initialTopic}
              onChange={(e) => setInitialTopic(e.target.value)}
              onKeyDown={handleTopicKeyDown}
              placeholder="例如：我們應該如何應對氣候變化？"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleStartWithTopic}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              開始
            </button>
            <button
              onClick={() => {
                setShowTopicInput(false);
                setInitialTopic('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              取消
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            如果不輸入議題，AI將根據第一個發言自動生成會議主題
          </p>
        </div>
      )}

      {/* 主要控制按鈕 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {canStart && (
          <>
            <button
              onClick={() => setShowTopicInput(true)}
              disabled={disabled || loading}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-2">▶️</span>
              設定議題開始
            </button>
            <button
              onClick={() => onStart()}
              disabled={disabled || loading}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-2">🚀</span>
              直接開始
            </button>
          </>
        )}

        {canPause && (
          <button
            onClick={onPause}
            disabled={disabled}
            className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">⏸️</span>
            暫停
          </button>
        )}

        {canResume && (
          <button
            onClick={onResume}
            disabled={disabled || loading}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">▶️</span>
            繼續
          </button>
        )}

        {canStop && (
          <button
            onClick={onStop}
            disabled={disabled}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">⏹️</span>
            停止
          </button>
        )}
      </div>

      {/* 次要控制按鈕 */}
      <div className="grid grid-cols-2 gap-3">
        {canNextRound && (
          <button
            onClick={onNextRound}
            disabled={disabled}
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">⏭️</span>
            下一輪
          </button>
        )}

        <button
          onClick={handleReset}
          disabled={disabled || loading}
          className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            showConfirmReset
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <span className="mr-2">{showConfirmReset ? '⚠️' : '🔄'}</span>
          {showConfirmReset ? '確認重置' : '重置'}
        </button>
      </div>

      {/* 狀態說明 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          {debateStatus === 'preparing' && '準備開始辯論，請確認所有設定後點擊開始。'}
          {debateStatus === 'debating' && '辯論進行中，AI 替身正在生成發言內容。'}
          {debateStatus === 'paused' && '辯論已暫停，可以繼續或停止辯論。'}
          {debateStatus === 'completed' && '辯論已完成，可以查看結果或重新開始。'}
          {debateStatus === 'error' && '辯論過程中發生錯誤，請檢查設定後重新開始。'}
          {debateStatus === 'searching' && 'AI 正在搜尋相關資料以支持論點。'}
          {debateStatus === 'idle' && '可以設定初始議題開始辯論，或直接開始讓AI自動生成主題。'}
        </div>
      </div>

      {/* 快捷鍵提示 */}
      <div className="mt-4 text-xs text-gray-500">
        <p>快捷鍵: Space (暫停/繼續) • Enter (下一輪) • Esc (停止)</p>
      </div>
    </div>
  );
};