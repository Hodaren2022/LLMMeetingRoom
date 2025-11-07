import React from 'react';
import { Persona } from '@/types';
import { User, Settings, Trash2, Edit3 } from 'lucide-react';
import { colorUtils } from '@/utils';
import { ContainerQueryWrapper } from '@/hooks';
import { AvatarImage } from './ResponsiveImage';
import { TouchCard, TouchIconButton } from './TouchComponents';

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
    <div className="persona-card-container" style={{ containerType: 'inline-size' }}>
      <ContainerQueryWrapper
        containerName="card"
        containerType="inline-size"
        className="w-full"
      >
        <TouchCard
          className={`
            card-mobile cq-flex-col persona-card-narrow persona-card-wide
            ${isSelected ? 'shadow-lg scale-105 ring-2 ring-blue-500' : 'shadow-sm'}
            prevent-overflow
            w-full
          `}
          style={cardStyle}
          onClick={onToggle}
        >
        {/* 頭像和基本資訊 - 響應式優化 */}
        <div className="flex items-start gap-3 mb-3">
          {persona.avatar ? (
            <AvatarImage
              src={persona.avatar}
              alt={persona.name}
              size="lg"
              className="w-12 h-12 tablet:w-14 tablet:h-14"
              fallbackText={persona.name.charAt(0)}
            />
          ) : (
            <div
              className="w-10 h-10 tablet:w-12 tablet:h-12 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={avatarStyle}
            >
              <User className="w-5 h-5 tablet:w-6 tablet:h-6" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm tablet:text-base prevent-overflow">
              {persona.name}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 prevent-overflow">
              {persona.identity}
            </p>
          </div>

          {/* 控制按鈕 - 觸摸優化 */}
          {showControls && (
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <TouchIconButton
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => onEdit()}
                  size="sm"
                  variant="ghost"
                  ariaLabel="編輯替身"
                  className="text-gray-400 hover:text-blue-600"
                />
              )}
              {onDelete && (
                <TouchIconButton
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => onDelete()}
                  size="sm"
                  variant="ghost"
                  ariaLabel="刪除替身"
                  className="text-gray-400 hover:text-red-600"
                />
              )}
            </div>
          )}
        </div>

        {/* 核心原則 - 移動端優化 */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">核心原則</p>
          <p className="text-xs tablet:text-sm text-gray-700 line-clamp-2 prevent-overflow">
            {persona.primeDirective}
          </p>
        </div>

        {/* 溫度設定 - 觸摸友好 */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">創造性</span>
            <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {persona.temperature.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 tablet:h-2">
            <div
              className="h-3 tablet:h-2 rounded-full transition-all duration-300"
              style={{
                width: `${persona.temperature * 100}%`,
                backgroundColor: persona.color || '#6b7280',
              }}
            />
          </div>
        </div>

        {/* 專業領域標籤 - 響應式網格 */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">專業領域</p>
          <div className="flex flex-wrap gap-1">
            {persona.ragFocus.slice(0, 2).map((focus, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 prevent-overflow"
              >
                {focus}
              </span>
            ))}
            {persona.ragFocus.length > 2 && (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                +{persona.ragFocus.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* 狀態指示器 - 移動端優化 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 tablet:w-2 tablet:h-2 rounded-full ${
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
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse" />
          )}
        </TouchCard>
      </ContainerQueryWrapper>
    </div>
  );
};