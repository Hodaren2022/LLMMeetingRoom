import React from 'react';
import { Persona } from '@/types';
import { User, Settings, Trash2, Edit3 } from 'lucide-react';
import { colorUtils } from '@/utils';

interface PersonaCardProps {
  persona: Persona;
  isSelected?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showControls?: boolean;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  isSelected = false,
  onToggle,
  onEdit,
  onDelete,
  showControls = true,
}) => {
  const cardStyle = {
    borderColor: persona.color || '#6b7280',
    backgroundColor: isSelected ? `${persona.color}10` : 'white',
  };

  const avatarStyle = {
    backgroundColor: persona.color || '#6b7280',
    color: colorUtils.isDark(persona.color || '#6b7280') ? 'white' : 'black',
  };

  return (
    <div
      className={`
        relative border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer
        ${isSelected ? 'shadow-lg scale-105' : 'shadow-md hover:shadow-lg'}
        ${onToggle ? 'hover:scale-102' : ''}
      `}
      style={cardStyle}
      onClick={onToggle}
    >
      {/* 頭像和基本資訊 */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
          style={avatarStyle}
        >
          {persona.avatar ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {persona.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {persona.identity}
          </p>
        </div>

        {/* 控制按鈕 */}
        {showControls && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="編輯替身"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="刪除替身"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 核心原則 */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">核心原則</p>
        <p className="text-sm text-gray-700 line-clamp-2">
          {persona.primeDirective}
        </p>
      </div>

      {/* 溫度設定 */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">創造性</span>
          <span className="text-xs font-mono text-gray-600">
            {persona.temperature.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${persona.temperature * 100}%`,
              backgroundColor: persona.color || '#6b7280',
            }}
          />
        </div>
      </div>

      {/* 搜尋重點標籤 */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">專業領域</p>
        <div className="flex flex-wrap gap-1">
          {persona.ragFocus.slice(0, 3).map((focus, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
            >
              {focus}
            </span>
          ))}
          {persona.ragFocus.length > 3 && (
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
            +{persona.ragFocus.length - 3}
          </span>
          )}
        </div>
      </div>

      {/* 狀態指示器 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              persona.isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span className="text-xs text-gray-500">
            {persona.isActive ? '已選中' : '未選中'}
          </span>
        </div>
        
        <Settings className="w-4 h-4 text-gray-400" />
      </div>

      {/* 選中狀態覆蓋層 */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};