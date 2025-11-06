import React, { useState } from 'react';
import { Persona } from '@/types';
import { Crown, Users, Sparkles, Check } from 'lucide-react';

interface ModeratorCardProps {
  persona: Persona;
  isSelected: boolean;
  onClick: () => void;
}

const ModeratorCard: React.FC<ModeratorCardProps> = ({
  persona,
  isSelected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all duration-300 ease-out
        min-h-[160px] flex flex-col items-center text-center
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-amber-500/20
        ${isSelected 
          ? 'border-amber-500 bg-amber-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`選擇 ${persona.name} 作為主持人`}
    >
      {/* 選中狀態指示器 */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* 主持人皇冠圖標 */}
      <div className="absolute top-3 left-3">
        <Crown className="w-5 h-5 text-amber-500" />
      </div>

      {/* 頭像 */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 shadow-md"
        style={{ backgroundColor: persona.color || '#f59e0b' }}
      >
        {persona.name.charAt(0)}
      </div>

      {/* 姓名和角色 */}
      <h3 className="font-semibold text-base text-gray-900 mb-2">
        {persona.name}
      </h3>
      
      <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-3">
        主持人
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-600 line-clamp-2 flex-1">
        {persona.identity || '專業的會議主持人'}
      </p>
    </button>
  );
};

interface ModeratorSelectionPanelProps {
  availablePersonas: Persona[];
  selectedModerator?: Persona;
  onModeratorSelect: (persona: Persona | undefined) => void;
  className?: string;
}

export const ModeratorSelectionPanel: React.FC<ModeratorSelectionPanelProps> = ({
  availablePersonas,
  selectedModerator,
  onModeratorSelect,
  className = '',
}) => {
  const [showSelection, setShowSelection] = useState(false);

  // 過濾出適合做主持人的人格（可以根據需要調整條件）
  const moderatorCandidates = availablePersonas.filter(persona => 
    persona.role.includes('主持') || 
    persona.role.includes('協調') || 
    persona.role.includes('管理') ||
    persona.name.includes('主持')
  );

  // 如果沒有專門的主持人，使用所有可用人格
  const candidates = moderatorCandidates.length > 0 ? moderatorCandidates : availablePersonas;

  const handleModeratorClick = (persona: Persona) => {
    if (selectedModerator?.id === persona.id) {
      // 如果點擊已選中的主持人，則取消選擇
      onModeratorSelect(undefined);
    } else {
      // 選擇新的主持人
      onModeratorSelect(persona);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 主持人選擇區域 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">會議主持人</h3>
              <p className="text-sm text-gray-600">選擇一位AI主持人來引導討論（可選）</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSelection(!showSelection)}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
          >
            {showSelection ? '收起選擇' : '選擇主持人'}
          </button>
        </div>

        {/* 當前選中的主持人 */}
        {selectedModerator && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedModerator.color || '#f59e0b' }}
              >
                {selectedModerator.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-gray-900">{selectedModerator.name}</span>
                  <span className="text-sm text-amber-600">（主持人）</span>
                </div>
                <p className="text-sm text-gray-600">{selectedModerator.identity}</p>
              </div>
              <button
                onClick={() => onModeratorSelect(undefined)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="移除主持人"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 主持人選擇網格 */}
        {showSelection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {candidates.length > 0 ? (
              candidates.map((persona) => (
                <ModeratorCard
                  key={persona.id}
                  persona={persona}
                  isSelected={selectedModerator?.id === persona.id}
                  onClick={() => handleModeratorClick(persona)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Crown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">沒有可用的主持人候選</p>
              </div>
            )}
          </div>
        )}

        {/* 無主持人選項 */}
        {!selectedModerator && !showSelection && (
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">未選擇主持人</p>
              <p className="text-gray-500 text-xs">辯論將由參與者自由進行</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorSelectionPanel;