import React, { useState, useEffect } from 'react';
import { Persona } from '@/types';
import { Check, Users, Sparkles } from 'lucide-react';

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  isSelected,
  isDisabled,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative w-full p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 ease-out
        min-h-[180px] sm:min-h-[200px] flex flex-col items-center text-center
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-blue-500/20
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
      style={{
        borderColor: isSelected ? persona.color : undefined,
        backgroundColor: isSelected ? `${persona.color}10` : undefined,
      }}
      aria-pressed={isSelected}
      aria-label={`選擇 ${persona.name} (${persona.role})`}
    >
      {/* 選中狀態指示器 */}
      {isSelected && (
        <div 
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: persona.color }}
        >
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* 頭像 */}
      <div 
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-3 sm:mb-4 shadow-md"
        style={{ backgroundColor: persona.color }}
      >
        {persona.name.charAt(0)}
      </div>

      {/* 姓名和角色 */}
      <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
        {persona.name}
      </h3>
      
      <div 
        className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white mb-3"
        style={{ backgroundColor: persona.color }}
      >
        {persona.role}
      </div>

      {/* 描述 */}
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-4 flex-1 px-1">
        {persona.identity || '專業的辯論參與者'}
      </p>

      {/* 專業領域標籤 */}
      <div className="flex flex-wrap gap-1 justify-center">
        {persona.ragFocus.slice(0, 2).map((focus, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
          >
            {focus}
          </span>
        ))}
        {persona.ragFocus.length > 2 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
            +{persona.ragFocus.length - 2}
          </span>
        )}
      </div>
    </button>
  );
};

interface PersonaSelectionPanelProps {
  availablePersonas: Persona[];
  selectedPersonas: Persona[];
  onPersonaToggle: (persona: Persona) => void;
  maxPersonas?: number;
  className?: string;
}

export const PersonaSelectionPanel: React.FC<PersonaSelectionPanelProps> = ({
  availablePersonas,
  selectedPersonas,
  onPersonaToggle,
  maxPersonas = 6,
  className = '',
}) => {
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());

  const handlePersonaClick = (persona: Persona) => {
    // 添加動畫效果
    setAnimatingCards(prev => new Set(prev).add(persona.id));
    
    // 執行選擇邏輯
    onPersonaToggle(persona);
    
    // 移除動畫狀態
    setTimeout(() => {
      setAnimatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(persona.id);
        return newSet;
      });
    }, 300);
  };

  const isPersonaSelected = (persona: Persona) => {
    return selectedPersonas.some(p => p.id === persona.id);
  };

  const isPersonaDisabled = (persona: Persona) => {
    return !isPersonaSelected(persona) && selectedPersonas.length >= maxPersonas;
  };

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${className}`}>
      {/* 標題區域 - 固定在頂部 */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">選擇辯論參與者</h2>
            <p className="text-gray-600">點擊卡片來選擇或取消選擇AI人格</p>
          </div>
        </div>

        {/* 選擇狀態指示器 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900">
              已選擇 {selectedPersonas.length} / {maxPersonas} 個參與者
            </span>
          </div>
          
          {selectedPersonas.length >= maxPersonas && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              已達到最大參與者數量
            </div>
          )}
        </div>
      </div>

      {/* 可滾動的內容區域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 人格卡片網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {availablePersonas.map((persona) => (
            <div
              key={persona.id}
              className={`
                transition-transform duration-300
                ${animatingCards.has(persona.id) ? 'scale-105' : ''}
              `}
            >
              <PersonaCard
                persona={persona}
                isSelected={isPersonaSelected(persona)}
                isDisabled={isPersonaDisabled(persona)}
                onClick={() => handlePersonaClick(persona)}
              />
            </div>
          ))}
        </div>

        {/* 已選擇的參與者預覽 */}
        {selectedPersonas.length > 0 && (
          <div className="mb-6 p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4">已選擇的參與者</h3>
            <div className="flex flex-wrap gap-3">
              {selectedPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: persona.color }}
                  >
                    {persona.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {persona.name}
                  </span>
                  <button
                    onClick={() => handlePersonaClick(persona)}
                    className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`移除 ${persona.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空狀態 */}
        {availablePersonas.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              沒有可用的人格
            </h3>
            <p className="text-gray-600">
              請聯繫管理員添加AI人格
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelectionPanel;