import React, { useState, useEffect } from 'react';
import { MeetingRoom, Persona, DebateStatus, Statement, ConsensusData } from '@/types';
import { useDebateControl } from '@/hooks/useDebateOrchestrator';
import { useMeetingRoomStore } from '@/stores';
import { DebateViewer } from './DebateViewer';
import { DebateControlPanel } from './DebateControlPanel';
import { ConsensusDisplay } from './ConsensusDisplay';
import { PersonaManager } from './PersonaManager';
import { PersonaSelectionPanel } from './PersonaSelectionPanel';
import { ModeratorSelectionPanel } from './ModeratorSelectionPanel';
import { EditableTopicHeader } from './EditableTopicHeader';

interface DebateRoomProps {
  room: MeetingRoom;
  onRoomUpdate?: (room: MeetingRoom) => void;
  onDebateComplete?: (result: any) => void;
}

export const DebateRoom: React.FC<DebateRoomProps> = ({
  room,
  onRoomUpdate,
  onDebateComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'debate' | 'consensus' | 'participants' | 'selection'>('debate');
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);

  const {
    debateStatus,
    isLoading,
    error,
    startDebate,
    pauseDebate,
    resumeDebate,
    stopDebate,
  } = useDebateControl();

  const {
    currentRoom,
    currentSpeaker,
    currentRound,
    nextRound,
    reset,
  } = useMeetingRoomStore();

  // 從當前房間獲取數據
  const statements = currentRoom?.statements || [];
  const consensusData = currentRoom?.consensus;

  // 找到當前發言者的 Persona 對象
  const currentSpeakerPersona = currentSpeaker && typeof currentSpeaker === 'string' 
    ? room.participants.find(p => p.id === currentSpeaker) || null
    : (currentSpeaker as Persona | null);

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // 忽略輸入框中的按鍵
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (debateStatus === 'debating') {
            pauseDebate();
          } else if (debateStatus === 'paused') {
            resumeDebate();
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (debateStatus === 'debating' && !isLoading) {
            nextRound();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (debateStatus === 'debating' || debateStatus === 'paused') {
            stopDebate();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [debateStatus, isLoading, pauseDebate, resumeDebate, nextRound, stopDebate]);

  const handleStatementClick = (statement: Statement) => {
    setSelectedStatement(statement);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'selection': return '🎭';
      case 'debate': return '💬';
      case 'consensus': return '📊';
      case 'participants': return '👥';
      default: return '📄';
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'selection': return room.participants.length;
      case 'debate': return statements.length;
      case 'participants': return room.participants.length;
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 頂部標題欄 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{room.name}</h1>
            <EditableTopicHeader
              topic={room.topic}
              isGenerated={room.isTopicGenerated}
              onTopicChange={(newTopic) => {
                const updatedRoom = { 
                  ...room, 
                  topic: newTopic,
                  isTopicGenerated: false // 手動編輯後移除AI生成標記
                };
                onRoomUpdate?.(updatedRoom);
              }}
            />
          </div>
          
          <div className="flex items-center space-x-4 flex-shrink-0">
            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              創建時間: <span className="font-medium">{new Date(room.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 標籤導航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {(['selection', 'debate', 'consensus', 'participants'] as const).map((tab) => {
              const count = getTabCount(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{getTabIcon(tab)}</span>
                    <span>
                      {tab === 'selection' && '人格選擇'}
                      {tab === 'debate' && '辯論過程'}
                      {tab === 'consensus' && '共識分析'}
                      {tab === 'participants' && '參與者'}
                    </span>
                    {count !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側主要內容 */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'selection' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 sm:p-6 overflow-hidden">
                <div className="h-full flex flex-col space-y-6">
                {/* 主持人選擇區域 */}
                <ModeratorSelectionPanel
                  availablePersonas={useMeetingRoomStore.getState().availablePersonas}
                  selectedModerator={room.moderator}
                  onModeratorSelect={(moderator) => {
                    const updatedRoom = { ...room, moderator };
                    onRoomUpdate?.(updatedRoom);
                  }}
                />

                {/* 參與者選擇區域 */}
                <PersonaSelectionPanel
                  availablePersonas={useMeetingRoomStore.getState().availablePersonas}
                  selectedPersonas={room.participants}
                  onPersonaToggle={(persona) => {
                    const isSelected = room.participants.some(p => p.id === persona.id);
                    let updatedParticipants;
                    
                    if (isSelected) {
                      // 移除人格
                      updatedParticipants = room.participants.filter(p => p.id !== persona.id);
                    } else {
                      // 添加人格
                      updatedParticipants = [...room.participants, persona];
                    }
                    
                    const updatedRoom = { ...room, participants: updatedParticipants };
                    onRoomUpdate?.(updatedRoom);
                  }}
                  maxPersonas={6}
                  className="flex-1"
                />
              </div>
              </div>
            </div>
          )}

          {activeTab === 'debate' && (
            <div className="flex-1 p-6">
              <DebateViewer
              statements={statements}
              currentSpeaker={currentSpeakerPersona}
              debateStatus={debateStatus}
              currentRound={currentRound}
              loading={isLoading}
              onStatementClick={handleStatementClick}
            />
            </div>
          )}

          {activeTab === 'consensus' && (
            <div className="flex-1 p-6">
              <ConsensusDisplay
                consensusData={consensusData}
                statements={statements}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="flex-1 p-6">
              <PersonaManager
                personas={room.participants}
                onPersonasChange={(personas) => {
                  const updatedRoom = { ...room, participants: personas };
                  onRoomUpdate?.(updatedRoom);
                }}
                disabled={debateStatus === 'debating'}
              />
            </div>
          )}
        </div>

        {/* 右側控制面板 */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
          <DebateControlPanel
            debateStatus={debateStatus}
            currentRound={currentRound}
            totalStatements={statements.length}
            loading={isLoading}
            onStart={(initialTopic) => {
              // 如果提供了初始議題，先更新房間主題
              if (initialTopic && initialTopic.trim()) {
                const updatedRoom = { 
                  ...room, 
                  topic: initialTopic.trim(),
                  isTopicGenerated: false // 用戶提供的主題不標記為AI生成
                };
                onRoomUpdate?.(updatedRoom);
              }
              startDebate(initialTopic);
            }}
            onPause={pauseDebate}
            onResume={resumeDebate}
            onStop={stopDebate}
            onNextRound={nextRound}
            onReset={() => reset()}
            disabled={room.participants.length < 2}
          />

          {/* 快速統計 */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h4 className="font-medium text-gray-900 mb-3">快速統計</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">參與者數量</span>
                <span className="font-medium">{room.participants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">當前輪次</span>
                <span className="font-medium">{currentRound}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">總發言數</span>
                <span className="font-medium">{statements.length}</span>
              </div>
              {statements.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">平均傾向度</span>
                  <span className="font-medium">
                    {(statements.reduce((sum, s) => sum + s.tendencyScore, 0) / statements.length).toFixed(1)}/10
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 當前發言者信息 */}
          {currentSpeakerPersona && (
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h4 className="font-medium text-gray-900 mb-3">當前發言者</h4>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {currentSpeakerPersona.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{currentSpeakerPersona.name}</p>
                  <p className="text-xs text-gray-500">{currentSpeakerPersona.role}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <p>專業領域: {currentSpeakerPersona.ragFocus.join(', ')}</p>
                <p>創造性: {(currentSpeakerPersona.temperature * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};